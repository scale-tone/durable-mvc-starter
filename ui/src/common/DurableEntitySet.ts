import { makeAutoObservable, makeObservable, observable } from 'mobx';
import { HubConnectionBuilder, HubConnection, NullLogger, LogLevel } from '@aspnet/signalr';
import * as rfc6902 from 'rfc6902';

import { ISetEntityMetadataRequest } from '../shared/common/ISetEntityMetadataRequest';
import { EntityStateChangedMessage, EntitySignalResponseMessage } from '../shared/common/SignalRNotifications';
import { SignalRClientHandlerName, SignalRSignalResponseHandlerName, UpdateMetadataServiceMethodName } from '../shared/common/Constants';
import { DurableEntityClientStateContainer } from '../shared/common/DurableEntityClientStateContainer';
import { IDurableEntitySetConfig } from './IDurableEntitySetConfig';
import { DurableHttpClient, BackendBaseUri } from './DurableHttpClient';

export type EntityStateWithKey = { entityKey: string };

// Client-side container for Durable Entities
export class DurableEntitySet<TState extends object> {

    // All attached entities will appear in this observable array
    items: (TState & EntityStateWithKey)[] = [];
    
    constructor(private _entityNameLowerCase: string, attachToAll: boolean = true) {

        // Inside Durable Functions entity names are always lower-case, so we need to convert
        this._entityNameLowerCase = this._entityNameLowerCase.toLowerCase();

        makeObservable(this, { items: observable });
        
        if (attachToAll) {
            this.attachAllEntities();
        }
    }

    // Attach all entities of this type (that type you previously passed to ctor).
    // Preloads all existing entities of this type and then automatically captures all newly created entities.
    attachAllEntities(): Promise<void> {

        DurableEntitySet.initSignalR();

        // Registering ourselves as listeners for this type of entity
        DurableEntitySet.EntitySets[this._entityNameLowerCase] = this.items;

        // Loading all existing entities
        return DurableEntitySet.fetchAndApplyAllEntityStates(this._entityNameLowerCase);
    }

    // Manually attach a single entity with specific key
    attachEntity(entityKey: string): void {

        const entityId = EntityStateChangedMessage.FormatEntityId(this._entityNameLowerCase, entityKey);

        if (!!DurableEntitySet.getEntityState(entityId)) {
            return;
        }

        // Registering ourselves as listeners for this particular entity
        DurableEntitySet.EntitySets[entityId] = this.items;
        
        DurableEntitySet.attachEntity(this._entityNameLowerCase, entityKey, undefined as any);
    }

    // Creates (or fetches existing) an entity
    createEntity(entityKey: string): void {

        DurableEntitySet.createEntity(this._entityNameLowerCase, entityKey, undefined as any);
    }

    // Sends a signal to the given entity
    signalEntity(entityKey: string, signalName: string, argument?: any): Promise<void> {

        return DurableEntitySet.signalEntity(this._entityNameLowerCase, entityKey, signalName, argument);
    }

    // Sends a signal to the given entity and returns a promise with results
    callEntity(entityKey: string, signalName: string, argument?: any): Promise<any> {

        return DurableEntitySet.callEntity(this._entityNameLowerCase, entityKey, signalName, argument);
    }

    // Updates metadata of the given entity
    updateEntityMetadata(entityKey: string, metadata: ISetEntityMetadataRequest): Promise<void> {

        return DurableEntitySet.updateEntityMetadata(this._entityNameLowerCase, entityKey, metadata);
    }

    // Produces a single observable state instance for an existing entity
    static attachEntity<TState extends object>(entityName: string, entityKey: string, initialState: TState): TState {

        DurableEntitySet.initSignalR();

        // Inside Durable Functions entity names are always lower-case, so we need to convert
        const entityNameLowerCase = entityName.toLowerCase();

        const existingEntity = this.getEntityState(EntityStateChangedMessage.FormatEntityId(entityNameLowerCase, entityKey));
        if (!!existingEntity) {
            // If it is a known entity, then just returning it
            return existingEntity.state as TState;
        }

        if (!!initialState) {
            makeAutoObservable(initialState);
        }

        // Try to asynchronously retrieve the state from server
        this.fetchAndApplyEntityState(entityNameLowerCase, entityKey, 0, 0, initialState);

        return initialState;
    }

    // Creates (or fetches existing) and produces a single observable state instance for a newly created entity
    static createEntity<TState extends object>(entityName: string, entityKey: string, initialState: TState): TState {

        // This empty request will create the entity, if it doesn't exist yet.
        this.updateEntityMetadata(entityName, entityKey, {});

        return this.attachEntity(entityName, entityKey, initialState);
    }

    // Sends a signal to the given entity
    static signalEntity(entityName: string, entityKey: string, signalName: string, argument?: any): Promise<void> {

        // Inside Durable Functions entity names are always lower-case, so we need to convert
        const entityNameLowerCase = entityName.toLowerCase();

        const uri = `${BackendBaseUri}/entities/${entityNameLowerCase}/${entityKey}/${signalName}`;
        return this.HttpClient.post(uri, { content: JSON.stringify(argument) }).then();
    }

    // Sends a signal to the given entity and returns a promise with results
    static callEntity(entityName: string, entityKey: string, signalName: string, argument?: any): Promise<any> {

        // Inside Durable Functions entity names are always lower-case, so we need to convert
        const entityNameLowerCase = entityName.toLowerCase();

        const uri = `${BackendBaseUri}/entities/${entityNameLowerCase}/${entityKey}/${signalName}`;

        return new Promise<any>((resolve, reject) => {

            this.HttpClient.post(uri, { content: JSON.stringify(argument) }).then(response => {

                const correlationId: string = JSON.parse(response.content as string).correlationId;
                this.SignalResultPromises[correlationId] = { resolve, reject };

            }, reject);
        });
    }

    // Updates metadata of the given entity
    static updateEntityMetadata(entityName: string, entityKey: string, metadata: ISetEntityMetadataRequest): Promise<void> {

        return this.signalEntity(entityName, entityKey, UpdateMetadataServiceMethodName, metadata);
    }

    // Optionally setup with these optional settings
    static setup(config: IDurableEntitySetConfig): void {
        this.Config = config;
        if (!this.Config.logger) {
            this.Config.logger = NullLogger.instance;
        }
    }

    private static Config: IDurableEntitySetConfig = { logger: NullLogger.instance };
    private static HttpClient: DurableHttpClient = new DurableHttpClient(() => DurableEntitySet.Config);
    private static EntitySets: { [entityName: string]: EntityStateWithKey[] } = {};
    private static SignalResultPromises: { [correlationId: string]: { resolve: (res: any) => void, reject: (err: Error) => void } } = {};

    private static SignalRConn: HubConnection;

    private static readonly SignalRReconnectIntervalInMs = 5000;
    private static readonly MaxRetryCount = 6;
    private static readonly RetryBaseIntervalMs = 500;
    

    private static EntityStates: { [entityId: string]: DurableEntityClientStateContainer } = {};

    private static getEntityState(entityId: string): DurableEntityClientStateContainer {
        return this.EntityStates[entityId];
    }

    private static addOrUpdateEntityState(entityId: string, stateContainer: DurableEntityClientStateContainer): void {
        this.EntityStates[entityId] = stateContainer;
    }

    private static removeEntityState(entityId: string): void {
        delete this.EntityStates[entityId];
    }

    private static entityAdded(entityNameLowerCase: string, entityKey: string, entityState: EntityStateWithKey) {

        const entityId = EntityStateChangedMessage.FormatEntityId(entityNameLowerCase, entityKey);

        // Searching for entitySet either for this particular entity or for this type of entity
        var entitySet = this.EntitySets[entityId];
        if (!entitySet) {
            entitySet = this.EntitySets[entityNameLowerCase];
        } else {
            delete this.EntitySets[entityId];
        }

        if (!entitySet) {
            return;
        }

        // Adding the entityKey property to the state object, to allow binding commands
        entityState.entityKey = entityKey;
        entitySet.push(entityState);
    }

    private static entityDeleted(entityNameLowerCase: string, entityKey: string) {

        const entitySet = this.EntitySets[entityNameLowerCase];
        if (!entitySet) {
            return;
        }

        for (var i = 0; i < entitySet.length; i++) {

            if (entitySet[i].entityKey === entityKey) {
                entitySet.splice(i, 1);
                break;
            }
        }
    }

    private static fetchAndApplyEntityState(entityNameLowerCase: string, entityKey: string, desiredVersion: number, retryCount: number, currentEntityState: any = null): void {

        const uri = `${BackendBaseUri}/entities/${entityNameLowerCase}/${entityKey}`;
        this.HttpClient.get(uri).then(response => {

            const stateContainer = JSON.parse(response.content as string) as DurableEntityClientStateContainer;
            const entityId = EntityStateChangedMessage.FormatEntityId(entityNameLowerCase, entityKey);

            if (!!desiredVersion && (stateContainer.version < desiredVersion)) {
                throw new Error(`Expected ${entityId} of version ${desiredVersion}, but got version ${stateContainer.version}`);
            }

            if (!currentEntityState) {

                // If there is no existing state, then using the newly arrived state object
                currentEntityState = stateContainer.state;
                makeAutoObservable(currentEntityState);
                
            } else {

                // Otherwise applying the change to the existing object, so that UI is re-rendered
                this.applyStateChangesFrom(currentEntityState, stateContainer.state);
            }

            if (!this.getEntityState(entityId)) {
                
                // Adding the newly-arrived state into collections, if any
                this.entityAdded(entityNameLowerCase, entityKey, currentEntityState);
            }

            // (Re)registering this entity
            this.addOrUpdateEntityState(entityId, { state: currentEntityState, version: stateContainer.version });

        }).catch(err => {

            if (retryCount < this.MaxRetryCount) {

                // Retrying
                retryCount++;
                setTimeout(() => {

                    this.fetchAndApplyEntityState(entityNameLowerCase, entityKey, desiredVersion, retryCount, currentEntityState);

                }, retryCount * this.RetryBaseIntervalMs);
                
            } else {

                this.Config.logger!.log(LogLevel.Error, `DurableEntitySet: failed to fetch entity state: ${err}`);
            }
        });
    }

    private static fetchAndApplyAllEntityStates(entityNameLowerCase: string): Promise<void> {

        const uri = `${BackendBaseUri}/entities/${entityNameLowerCase}`;
        return this.HttpClient.get(uri).then(response => {

            for (var item of JSON.parse(response.content as string)) {

                const entityKey = item.entityKey;
                const entityId = EntityStateChangedMessage.FormatEntityId(entityNameLowerCase, entityKey);
                const stateContainer = item as DurableEntityClientStateContainer;

                const existingStateContainer = this.getEntityState(entityId);
                if (!existingStateContainer) {

                    makeAutoObservable(stateContainer.state);
                    this.addOrUpdateEntityState(entityId, stateContainer);

                    // Adding the newly-arrived state into collections, if any
                    this.entityAdded(entityNameLowerCase, entityKey, stateContainer.state as any);
                    

                } else if (existingStateContainer.version < stateContainer.version) {

                    this.Config.logger!.log(LogLevel.Information, `DurableEntitySet: ${entityId}, local version ${existingStateContainer.version}, remote version ${stateContainer.version}. State was updated.`);

                    // Otherwise applying the change to the existing object, so that UI is re-rendered
                    this.applyStateChangesFrom(existingStateContainer.state, stateContainer.state);
                    existingStateContainer.version = stateContainer.version;

                } else {

                    this.Config.logger!.log(LogLevel.Information, `DurableEntitySet: ${entityId} is already known and is up to date. Skipping.`);
                }
            }

        }).catch(err => {
            this.Config.logger!.log(LogLevel.Error, `DurableEntitySet: failed to fetch entity states: ${err}`);
        });
    }

    private static entityStateChangedMessageHandler(msg: EntityStateChangedMessage): void {

        const entityId = EntityStateChangedMessage.GetEntityId(msg);

        this.Config.logger!.log(LogLevel.Trace, `DurableEntitySet: ${entityId} changed to version ${msg.version}`);

        const existingStateContainer = this.getEntityState(entityId);
        if (msg.isEntityDestructed) {

            this.removeEntityState(entityId);

            this.entityDeleted(msg.entityName, msg.entityKey);

        } else if (!existingStateContainer) {

            // If anybody is attached to this entity or this type of entity
            if (!!this.EntitySets[entityId] || !!this.EntitySets[msg.entityName]) {
                
                // This entity is not known to us yet, so just trying to fetch its state from server
                setTimeout(() => this.fetchAndApplyEntityState(msg.entityName, msg.entityKey, msg.version, 0), this.RetryBaseIntervalMs);
            }
           
        } else {

            const expectedVersion = existingStateContainer.version + 1;
            if (msg.version > expectedVersion) {
                
                // Missed some updates, so now need to reload the state from server
                this.fetchAndApplyEntityState(msg.entityName, msg.entityKey, msg.version, 0, existingStateContainer.state);

            } else if (msg.version === expectedVersion) {

                // Applying the change
                rfc6902.applyPatch(existingStateContainer.state, msg.stateDiff);
                existingStateContainer.version = msg.version;
            }            
        }
    }

    private static entitySignalResponseHandler(msg: EntitySignalResponseMessage): void {

        const responsePromise = this.SignalResultPromises[msg.correlationId];
        if (!responsePromise) {
            return;
        }

        if (!msg.errorMessage) {
            responsePromise.resolve(msg.result);
        } else {
            responsePromise.reject(new Error(msg.errorMessage));
        }

        delete this.SignalResultPromises[msg.correlationId];
    }

    private static initSignalR(): void {

        if (!!this.SignalRConn) {
            return;
        }

        // Configuring SignalR
        this.SignalRConn = new HubConnectionBuilder()
            .withUrl(`${BackendBaseUri}`, { httpClient: this.HttpClient, logger: this.Config.logger })
            .build();

        // Mounting event handlers
        this.SignalRConn.on(SignalRClientHandlerName, msg => this.entityStateChangedMessageHandler(msg));
        this.SignalRConn.on(SignalRSignalResponseHandlerName, msg => this.entitySignalResponseHandler(msg));

        // Background reconnects are essential here. That's because in 'Default' or 'Classic' service mode
        // clients get forcibly disconnected, when your backend restarts.
        this.SignalRConn.onclose(() => this.reconnectToSignalR());

        // Establishing SignalR connection
        this.SignalRConn.start().then(
            () => {
                this.Config.logger!.log(LogLevel.Information, `DurableEntitySet: successfully connected to SignalR`);
            }, err => {
                this.Config.logger!.log(LogLevel.Error, `DurableEntitySet: failed to connect to SignalR: ${err}`);
            });
    }

    private static reconnectToSignalR() {

        this.Config.logger!.log(LogLevel.Information, `DurableEntitySet: reconnecting to SignalR...`);
        this.SignalRConn.start().then(() => {
            this.Config.logger!.log(LogLevel.Information, `DurableEntitySet: reconnected to SignalR`);
        }, () => {
            setTimeout(() => this.reconnectToSignalR(), this.SignalRReconnectIntervalInMs);
        });
    }

    // Applies incoming changes to an existing observable object so, that UI is re-rendered
    private static applyStateChangesFrom(currentEntityState: any, incomingEntityState: any): void {

        // Need to preserve the entityKey field, if it is set
        incomingEntityState.entityKey = currentEntityState.entityKey;

        const diff = rfc6902.createPatch(currentEntityState, incomingEntityState);
        rfc6902.applyPatch(currentEntityState, diff);
    }
}