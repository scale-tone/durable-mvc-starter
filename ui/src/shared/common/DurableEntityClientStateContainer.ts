
// A client-side wrapper around entity's state, with some extra metadata added
export class DurableEntityClientStateContainer {

    version: number = 0;
    state: object = {};

    // Helper method for parsing entityIds
    public static GetEntityNameAndKey(entityId: string): { entityNameLowerCase: string, entityKey: string } {
        
        const match = /@([^@]+)@(.+)/.exec(entityId);
        return { entityNameLowerCase: !match ? '' : match[1], entityKey: !match ? '' : match[2] };
    }
}