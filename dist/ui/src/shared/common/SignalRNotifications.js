"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityStateChangedMessage = void 0;
class EntityStateChangedMessage {
    constructor() {
        this.entityName = '';
        this.entityKey = '';
        this.version = 0;
        this.stateDiff = [];
        this.isEntityDestructed = false;
    }
    static GetEntityId(msg) {
        return EntityStateChangedMessage.FormatEntityId(msg.entityName, msg.entityKey);
    }
    static FormatEntityId(entityName, entityKey) {
        return `@${entityName}@${entityKey}`;
    }
}
exports.EntityStateChangedMessage = EntityStateChangedMessage;
//# sourceMappingURL=SignalRNotifications.js.map