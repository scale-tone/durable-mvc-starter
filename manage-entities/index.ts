import { Context, HttpRequest } from '@azure/functions';
import * as DurableFunctions from 'durable-functions';
import { DurableOrchestrationClient } from 'durable-functions/lib/src/durableorchestrationclient';

import { SignalArgumentContainer } from '../common/SignalArgumentContainer';
import { DurableEntityStateContainer } from '../common/DurableEntityStateContainer';
import { DurableEntityClientStateContainer } from '../ui/src/shared/common/DurableEntityClientStateContainer';
import { ClientPrincipalHeaderName } from '../ui/src/shared/common/Constants';

// Handles basic entity operations 
export default async function (context: Context, req: HttpRequest): Promise<{ [key: string]: any }> {

    const entityName = context.bindingData.entityName as string;
    const entityKey = context.bindingData.entityKey as string;
    const callingUser = req.headers[ClientPrincipalHeaderName];

    const durableClient = DurableFunctions.getClient(context);

    if (req.method === "POST") {

        const signalName = context.bindingData.signalName as string;
        if (!signalName) {
            // Loading and returning a bunch of entities

            if (!(req.body instanceof Array)) {
                
                context.res = { status: 404 };
                return;
            }

            const entityStatusPromises = (req.body as string[])
                .map(entityId => DurableEntityClientStateContainer.GetEntityNameAndKey(entityId))
                .map(entityId => getEntityStatus(durableClient, entityId.entityNameLowerCase, entityId.entityKey, callingUser));

            const entityStatuses = await Promise.all(entityStatusPromises);

            // If any of requests failed
            const failedStatus = entityStatuses.find(s => !!s.status);
            if (!!failedStatus) {

                // Returning that failed status
                context.res = { status: failedStatus.status };

            } else {

                // Returning the array of statuses
                context.res = {
                    body: entityStatuses.map(s => s.body)
                }
            }
            
        } else {
            // Sending a signal
            
            const correlationId = await sendSignal(durableClient, entityName, entityKey, signalName, req.body, callingUser);

            // Returning correlationId back to client, so that it can subscribe to results
            context.res = { body: { correlationId } };
        }

    } else if (!entityKey) {

        // Collecting and returning all entities visible to this user

        const statuses = await getAllEntityStatuses(durableClient, entityName, callingUser);
        context.res = { body: statuses };

    } else {

        // Returning a single entity status
        context.res = await getEntityStatus(durableClient, entityName, entityKey, callingUser);        
    }
};

// Returns entity status in form of DurableEntityClientStateContainer object
async function getEntityStatus(durableClient: DurableOrchestrationClient, entityName: string, entityKey: string, callingUser: string): Promise<{ status?: number, body?: DurableEntityClientStateContainer }> {
    
    const stateResponse = await durableClient.readEntityState(new DurableFunctions.EntityId(entityName, entityKey));

    if (!stateResponse || !stateResponse.entityExists) {
        
        return { status: 404 };

    } else {

        const stateContainer = stateResponse.entityState as DurableEntityStateContainer<any>;

        if (!DurableEntityStateContainer.isAccessAllowed(stateContainer, callingUser)) {

            return { status: 403 };
        }

        return {
            body: {
                version: stateContainer.__metadata.version,
                state: stateContainer.state
            }
        };
    }
}

// Sends a signal to (calls a method of) the given entity
async function sendSignal(durableClient: DurableOrchestrationClient, entityName: string, entityKey: string, signalName: string, argument: any, callingUser: string): Promise<string> {

    // Producing a simple random correlationId
    const correlationId = `@${entityName}@${entityKey}@${signalName}@` + Math.random().toString(36).slice(2) + (new Date()).getTime().toString(36);

    await durableClient.signalEntity(new DurableFunctions.EntityId(entityName, entityKey),
        signalName,
        <SignalArgumentContainer>{ argument, __client_metadata: { callingUser, correlationId } }
    );

    return correlationId;
}

// Retrieves statuses of all entities visible to this user
async function getAllEntityStatuses(durableClient: DurableOrchestrationClient, entityName: string, callingUser: string): Promise<DurableEntityClientStateContainer[]> {

    const entityNameString = `@${entityName}@`;

    return (await durableClient.getStatusAll())
        // We're only interested in entities
        .filter(s => (s.input as any)?.exists === true && s.instanceId.startsWith(entityNameString))
        .map(s => {

            var stateContainer = (s.input as any)?.state;

            // For some reason, state comes in form of a string here - so need to convert
            if (typeof (stateContainer) === 'string') {
                stateContainer = JSON.parse(stateContainer);
            }

            return { instanceId: s.instanceId, stateContainer: stateContainer as DurableEntityStateContainer<any> };
        })

        // Checking access rights
        .filter(s => DurableEntityStateContainer.isAccessAllowed(s.stateContainer, callingUser))

        // Converting to ClientStateContainer
        .map(s => <DurableEntityClientStateContainer> {
            entityKey: s.instanceId.substr(entityNameString.length),
            version: s.stateContainer.__metadata.version,
            state: s.stateContainer.state
        });
}
