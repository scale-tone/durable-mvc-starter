"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DurableEntityClientStateContainer = void 0;
// A client-side wrapper around entity's state, with some extra metadata added
class DurableEntityClientStateContainer {
    constructor() {
        this.version = 0;
        this.state = {};
    }
    // Helper method for parsing entityIds
    static GetEntityNameAndKey(entityId) {
        const match = /@([^@]+)@(.+)/.exec(entityId);
        return { entityNameLowerCase: !match ? '' : match[1], entityKey: !match ? '' : match[2] };
    }
}
exports.DurableEntityClientStateContainer = DurableEntityClientStateContainer;
//# sourceMappingURL=DurableEntityClientStateContainer.js.map