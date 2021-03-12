import * as rfc6902 from 'rfc6902';
import { IEntityFunctionContext } from 'durable-functions/lib/src/classes';

import { EntityStateChangedMessage } from '../ui/src/shared/common/SignalRNotifications';
import { ISetEntityMetadataRequest } from '../ui/src/shared/common/ISetEntityMetadataRequest';
import { SignalRClientHandlerName, UpdateMetadataServiceMethodName } from '../ui/src/shared/common/Constants';
import { StateContainer } from './StateContainer';
import { SignalArgumentContainer } from './SignalArgumentContainer';

// Levels of visibility currently supported
export enum VisibilityEnum {
    ToOwnerOnly = 0,
    ToListOfUsers,
    ToEveryone
}

// Base class for Durable Entities. Implements handling signals (by calling child's method with corresponding name)
export class DurableEntity<TState extends object,> {

    // Entity state
    protected get state(): TState { return this._stateContainer.state; }

    // To be called by entity, when it decides to kill itself
    protected destructOnExit(): void {
        this._destructOnExit = true;
    }

    constructor(protected _context: IEntityFunctionContext) {
    }

    // Override this to provide the state for a newly created entity
    protected initializeState(): TState {
        return {} as TState;
    }

    // Override this to set a different visibility level for your entity
    protected get visibility(): VisibilityEnum {
        return VisibilityEnum.ToOwnerOnly;
    }

    async handleSignal() {

        const argumentContainer = this._context.df.getInput() as SignalArgumentContainer;

        // Loading actor's state
        this._stateContainer = this._context.df.getState(() => new StateContainer(
            this.initializeState(),
            this.visibility,
            argumentContainer.callingUser
        )) as StateContainer<TState>;

        // Always notifying about newly created entities
        var metadataHasChanged = !this._stateContainer.version;

        // Checking access rights
        if (!StateContainer.isAccessAllowed(this._stateContainer, argumentContainer.callingUser)) {
            throw new Error(`Access to @${this._context.df.entityName}@${this._context.df.entityKey} not allowed`);
        }

        // Cloning the state
        const oldState = JSON.parse(JSON.stringify(this._stateContainer.state)) as TState;

        const operationName = this._context.df.operationName!;
        if (operationName === UpdateMetadataServiceMethodName) { // if this is a service method

            // Only the owner can update metadata
            if (this._stateContainer.owner !== argumentContainer.callingUser) {
                throw new Error(`Non-owner is not allowed to update metadata of @${this._context.df.entityName}@${this._context.df.entityKey}`);
            }

            // Currently only one metadata field can be updated
            const setMetadataRequest = argumentContainer.argument as ISetEntityMetadataRequest;
            if (!!setMetadataRequest?.allowedUsers) {
                this._stateContainer.allowedUsers = argumentContainer.argument.allowedUsers;
            }

            metadataHasChanged = true;
            
        } else if (typeof this[operationName] === 'function') { // if there is a method with that name in child class

            // Executing the handler
            var result = this[operationName](argumentContainer.argument);

            // Checking if it is a promise that needs to be awaited
            if (DurableEntity.isPromise(result)) {
                result = await result;
            }

            // Setting return value, if any
            this._context.df.return(result);
        }

        // Checking if the state has changed
        const stateDiff = rfc6902.createPatch(oldState, this._stateContainer.state);

        if (!!stateDiff.length) {
            this._stateContainer.version++;
        }

        // If the handler signalled the end of lifetime, then destroying ourselves
        if (this._destructOnExit) {
            this._context.df.destructOnExit();

            // Also notifying clients that the entity passed away
            this.sendUpdatedStateViaSignalR(this._stateContainer, stateDiff, true);
            return;
        }

        // Saving actor's state, but only if it has changed or the entity has just been created
        if (!!stateDiff.length || metadataHasChanged) {
            
            this._context.df.setState(this._stateContainer);

            // Sending the updated state to clients
            this.sendUpdatedStateViaSignalR(this._stateContainer, stateDiff, false);
        }
    }

    private _stateContainer: StateContainer<TState>;
    private _destructOnExit: boolean = false;

    private sendUpdatedStateViaSignalR(stateContainer: StateContainer<TState>, stateDiff: rfc6902.Operation[], isDestructed: boolean ) {

        const notification: EntityStateChangedMessage = {
            entityName: this._context.df.entityId.name,
            entityKey: this._context.df.entityId.key,
            stateDiff,
            version: stateContainer.version,
            isEntityDestructed: isDestructed
        };

        this._context.bindings.signalRMessages = [];

        switch (stateContainer.visibility) {
            case VisibilityEnum.ToOwnerOnly:

                // Sending to owner only
                this._context.bindings.signalRMessages.push({
                    userId: stateContainer.owner,
                    target: SignalRClientHandlerName,
                    arguments: [notification]
                });
                
                break;
            case VisibilityEnum.ToListOfUsers:

                // Sending to all allowed users
                stateContainer.allowedUsers.map(user => {

                    this._context.bindings.signalRMessages.push({
                        userId: user,
                        target: SignalRClientHandlerName,
                        arguments: [notification]
                    });
                });

                break;
            case VisibilityEnum.ToEveryone:

                // Sending to the public
                this._context.bindings.signalRMessages.push({
                    target: SignalRClientHandlerName,
                    arguments: [notification]
                });

                break;
        }
    }

    private static isPromise(returnValue: any): boolean {
        return (!!returnValue) && typeof returnValue.then === 'function';
    }
}
