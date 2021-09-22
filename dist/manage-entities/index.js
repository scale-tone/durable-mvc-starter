"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const DurableFunctions = require("durable-functions");
const DurableEntityStateContainer_1 = require("../common/DurableEntityStateContainer");
const DurableEntityClientStateContainer_1 = require("../ui/src/shared/common/DurableEntityClientStateContainer");
const Constants_1 = require("../ui/src/shared/common/Constants");
// Handles basic entity operations 
function default_1(context, req) {
    return __awaiter(this, void 0, void 0, function* () {
        const entityName = context.bindingData.entityName;
        const entityKey = context.bindingData.entityKey;
        const callingUser = req.headers[Constants_1.ClientPrincipalHeaderName];
        const durableClient = DurableFunctions.getClient(context);
        if (req.method === "POST") {
            const signalName = context.bindingData.signalName;
            if (!signalName) {
                // Loading and returning a bunch of entities
                if (!(req.body instanceof Array)) {
                    context.res = { status: 404 };
                    return;
                }
                const entityStatusPromises = req.body
                    .map(entityId => DurableEntityClientStateContainer_1.DurableEntityClientStateContainer.GetEntityNameAndKey(entityId))
                    .map(entityId => getEntityStatus(durableClient, entityId.entityNameLowerCase, entityId.entityKey, callingUser));
                const entityStatuses = yield Promise.all(entityStatusPromises);
                // If any of requests failed
                const failedStatus = entityStatuses.find(s => !!s.status);
                if (!!failedStatus) {
                    // Returning that failed status
                    context.res = { status: failedStatus.status };
                }
                else {
                    // Returning the array of statuses
                    context.res = {
                        body: entityStatuses.map(s => s.body)
                    };
                }
            }
            else {
                // Sending a signal
                const correlationId = yield sendSignal(durableClient, entityName, entityKey, signalName, req.body, callingUser);
                // Returning correlationId back to client, so that it can subscribe to results
                context.res = { body: { correlationId } };
            }
        }
        else if (!entityKey) {
            // Collecting and returning all entities visible to this user
            const statuses = yield getAllEntityStatuses(durableClient, entityName, callingUser);
            context.res = { body: statuses };
        }
        else {
            // Returning a single entity status
            context.res = yield getEntityStatus(durableClient, entityName, entityKey, callingUser);
        }
    });
}
exports.default = default_1;
;
// Returns entity status in form of DurableEntityClientStateContainer object
function getEntityStatus(durableClient, entityName, entityKey, callingUser) {
    return __awaiter(this, void 0, void 0, function* () {
        const stateResponse = yield durableClient.readEntityState(new DurableFunctions.EntityId(entityName, entityKey));
        if (!stateResponse || !stateResponse.entityExists) {
            return { status: 404 };
        }
        else {
            const stateContainer = stateResponse.entityState;
            if (!DurableEntityStateContainer_1.DurableEntityStateContainer.isAccessAllowed(stateContainer, callingUser)) {
                return { status: 403 };
            }
            return {
                body: {
                    version: stateContainer.__metadata.version,
                    state: stateContainer.state
                }
            };
        }
    });
}
// Sends a signal to (calls a method of) the given entity
function sendSignal(durableClient, entityName, entityKey, signalName, argument, callingUser) {
    return __awaiter(this, void 0, void 0, function* () {
        // Producing a simple random correlationId
        const correlationId = `@${entityName}@${entityKey}@${signalName}@` + Math.random().toString(36).slice(2) + (new Date()).getTime().toString(36);
        yield durableClient.signalEntity(new DurableFunctions.EntityId(entityName, entityKey), signalName, { argument, __client_metadata: { callingUser, correlationId } });
        return correlationId;
    });
}
// Retrieves statuses of all entities visible to this user
function getAllEntityStatuses(durableClient, entityName, callingUser) {
    return __awaiter(this, void 0, void 0, function* () {
        const entityNameString = `@${entityName}@`;
        return (yield durableClient.getStatusAll())
            // We're only interested in entities
            .filter(s => { var _a; return ((_a = s.input) === null || _a === void 0 ? void 0 : _a.exists) === true && s.instanceId.startsWith(entityNameString); })
            .map(s => {
            var _a;
            var stateContainer = (_a = s.input) === null || _a === void 0 ? void 0 : _a.state;
            // For some reason, state comes in form of a string here - so need to convert
            if (typeof (stateContainer) === 'string') {
                stateContainer = JSON.parse(stateContainer);
            }
            return { instanceId: s.instanceId, stateContainer: stateContainer };
        })
            // Checking access rights
            .filter(s => DurableEntityStateContainer_1.DurableEntityStateContainer.isAccessAllowed(s.stateContainer, callingUser))
            // Converting to ClientStateContainer
            .map(s => ({
            entityKey: s.instanceId.substr(entityNameString.length),
            version: s.stateContainer.__metadata.version,
            state: s.stateContainer.state
        }));
    });
}
//# sourceMappingURL=index.js.map