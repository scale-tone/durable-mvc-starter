import { DurableEntityClientStateContainer } from '../shared/common/DurableEntityClientStateContainer';

// Map-like storage for all known entity states
export class EntityStateMap {

    constructor(private _maxKnownEntityIdsToPersist: () => number) {
    }

    public getState(entityId: string): DurableEntityClientStateContainer {
        return this.States[entityId];
    }

    public getStatesCopy(): { [entityId: string]: DurableEntityClientStateContainer } {
        return Object.assign({}, this.States);
    }

    public addOrUpdateState(entityId: string, stateContainer: DurableEntityClientStateContainer): void {
        this.States[entityId] = stateContainer;

        if (!!localStorage) {

            const entityIds = Object.keys(this.States).slice(0, this._maxKnownEntityIdsToPersist());
            localStorage.setItem(this.LocalStorageKnownIdsKey, JSON.stringify(entityIds));
        }
    }

    public removeState(entityId: string): void {
        delete this.States[entityId];

        if (!!localStorage) {

            const entityIds = Object.keys(this.States).slice(0, this._maxKnownEntityIdsToPersist());
            localStorage.setItem(this.LocalStorageKnownIdsKey, JSON.stringify(entityIds));
        }
    }

    public getStoredEntityIds(entityNameLowerCase: string): string[] {

        if (!localStorage) {
            return [];
        }

        const entityIdsJson = localStorage.getItem(this.LocalStorageKnownIdsKey);
        if (!entityIdsJson) {
            return [];
        }

        return (JSON.parse(entityIdsJson) as string[])
            .filter(id => DurableEntityClientStateContainer.GetEntityNameAndKey(id).entityNameLowerCase === entityNameLowerCase);
    }

    public removeStoredEntityIds(entityNameLowerCase: string): void {
        if (!!localStorage) {
            localStorage.removeItem(this.LocalStorageKnownIdsKey);
        }
    }

    private States: { [entityId: string]: DurableEntityClientStateContainer } = {};
    private readonly LocalStorageKnownIdsKey = 'DurableEntitySetKnownEntityIds';
}