import { Context, HttpRequest } from "@azure/functions"
import * as DurableFunctions from 'durable-functions'

import { SignalArgumentContainer } from '../common/SignalArgumentContainer';
import { StateContainer } from '../common/StateContainer';
import { ClientStateContainer } from '../ui/src/shared/common/ClientStateContainer';
import { ClientPrincipalHeaderName } from '../ui/src/shared/common/Constants';

// Handles basic operations 
export default async function (context: Context, req: HttpRequest): Promise<void> {

    const entityName = context.bindingData.entityName.toString();
    const entityKey = context.bindingData.entityKey?.toString();
    const signalName = context.bindingData.signalName?.toString();
    const callingUser = req.headers[ClientPrincipalHeaderName];

    const durableClient = DurableFunctions.getClient(context);

    if (req.method === "POST") {
        
        await durableClient.signalEntity(new DurableFunctions.EntityId(entityName, entityKey),
            signalName,
            <SignalArgumentContainer> { argument: req.body, callingUser }
        );

    } else if (!entityKey) {

        const entityNameString = `@${entityName}@`;
        const statuses = (await durableClient.getStatusAll())
            // Filtering out entities
            .filter(s => (s.input as any)?.exists === true && s.instanceId.startsWith(entityNameString))
            .map(s => {

                var stateContainer = (s.input as any)?.state;

                // For some reason, state comes in form of a string here - so need to convert
                if (typeof (stateContainer) === 'string') {
                    stateContainer = JSON.parse(stateContainer);
                }

                return { instanceId: s.instanceId, stateContainer: stateContainer as StateContainer<any> };
            })

            // Checking access rights
            .filter(s => StateContainer.isAccessAllowed(s.stateContainer, callingUser))

            // Converting to ClientStateContainer
            .map(s => <ClientStateContainer> {
                entityKey: s.instanceId.substr(entityNameString.length),
                version: s.stateContainer.version,
                state: s.stateContainer.state
            });

        context.res = { body: statuses };

    } else {

        const stateResponse = await durableClient.readEntityState(new DurableFunctions.EntityId(entityName, entityKey));

        if (!stateResponse || !stateResponse.entityExists) {
            
            context.res = { status: 404 };

        } else {

            const stateContainer = stateResponse.entityState as StateContainer<any>;

            if (StateContainer.isAccessAllowed(stateContainer, callingUser)) {
                
                context.res = {
                    body: <ClientStateContainer>{
                        version: stateContainer.version,
                        state: stateContainer.state
                    }
                };

            } else {

                context.res = { status: 403 };
            }
        }
    }
};
