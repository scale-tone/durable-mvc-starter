import * as DurableFunctions from 'durable-functions';
import * as fs from 'fs';
import { Context, HttpRequest } from '@azure/functions';

import { DurableEntityStateContainer } from '../../common/DurableEntityStateContainer';
import { ClientPrincipalHeaderName } from '../../ui/src/shared/common/Constants';

import manage_entities from '../../manage-entities/index';

const context: Context = {
    invocationId: '',
    executionContext: null,
    bindings: null,
    traceContext: null,
    bindingDefinitions: [],
    log: null,
    done: () => { },

    bindingData: {
        entityName: 'my-entity-name',
        entityKey: 'my-entity-key'
    }
};

const request: HttpRequest = {
    method: "GET",
    url: null,
    headers: {},
    query: null,
    params: null
};

request.headers[ClientPrincipalHeaderName] = 'some-user';


test('returns 404 if entity does not exist', async () => {

    (DurableFunctions as any).getClient = () => {
        return {
            readEntityState: () => null
        };
    };

    await manage_entities(context, request);

    expect(context.res.status).toBe(404);
});

test('returns 404 if entity does not exist 2', async () => {

    (DurableFunctions as any).getClient = () => {
        return {
            readEntityState: () => {
                return {
                    entityExists: false
                }
            }
        };
    };

    await manage_entities(context, request);

    expect(context.res.status).toBe(404);
});

test('returns 403 if access is not allowed', async () => {

    (DurableFunctions as any).getClient = () => {
        return {
            readEntityState: () => {
                return {
                    entityExists: true
                }
            }
        };
    };

    (DurableEntityStateContainer as any).isAccessAllowed = () => false;

    await manage_entities(context, request);

    expect(context.res.status).toBe(403);
});

test('returns single entity state', async () => {

    const state = new Date();
    const version = state.valueOf();

    (DurableFunctions as any).getClient = () => {
        return {
            readEntityState: () => {
                return {
                    entityExists: true,

                    entityState: {
                        __metadata: {
                            version
                        },
                        state
                    }
                }
            }
        };
    };

    (DurableEntityStateContainer as any).isAccessAllowed = () => true;

    await manage_entities(context, request);

    expect(context.res.body.version).toBe(version);
    expect(context.res.body.state).toBe(state);
});

test('returns zero entities', async () => {

    (DurableFunctions as any).getClient = () => {
        return {
            getStatusAll: () => {
                return [];
            }
        };
    };

    context.bindingData.entityKey = undefined;

    (DurableEntityStateContainer as any).isAccessAllowed = () => false;

    await manage_entities(context, request);

    expect(context.res.body.length).toBe(0);
});
