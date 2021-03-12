import { Context } from '@azure/functions'
import * as DurableFunctions from 'durable-functions'
import { DurableOrchestrationClient } from 'durable-functions/lib/src/classes';

// Durable Entity's Proxy. Sends signals and reads your entity's state in a strongly-typed manner.
export class DurableEntityProxy<TEntity> {

    constructor(context: Context, entityName: string, entityKey: string) {
        this._client = DurableFunctions.getClient(context);
        this._entityId = new DurableFunctions.EntityId(entityName, entityKey);
    }

    async signalEntity(operationName: keyof TEntity, operationContent?: any): Promise<void> {
        return this._client.signalEntity(this._entityId, operationName as string, operationContent);
    }

    async readEntityState<TState>(): Promise<TState> {
        const stateResponse = await this._client.readEntityState<TState>(this._entityId);

        if (!stateResponse.entityExists) {
            throw new Error(this._entityId.toString() + ' doesn\'t exist');
        }

        return stateResponse.entityState;
    }

    private _entityId: DurableFunctions.EntityId;
    private _client: DurableOrchestrationClient;
}