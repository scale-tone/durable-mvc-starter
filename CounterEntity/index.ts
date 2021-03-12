import * as DurableFunctions from "durable-functions"

import { DurableEntity, VisibilityEnum } from '../Common/DurableEntity'
import { CounterState } from '../ui/src/shared/CounterState';

// Sample counter entity
class CounterEntity extends DurableEntity<CounterState>
{
    async add(value: number) {
        this.state.previousValues.push(this.state.countContainer.count);
        this.state.countContainer.count += value;
    }

    async substract(value: number) {
        this.state.previousValues.push(this.state.countContainer.count);
        this.state.countContainer.count -= value;
    }

    // Overriding visibility
    protected get visibility(): VisibilityEnum { return VisibilityEnum.ToEveryone; }

    // Custom state initialization for a newly created entity
    protected initializeState(): CounterState {

        var newState = new CounterState();

        newState.countContainer.count = 1;
        newState.title = `Counter-${new Date().toISOString()}`;

        return newState;
    }
}

// Boilerplate to expose CounterEntity as a Durable Entity
export default DurableFunctions.entity((ctx) => new CounterEntity(ctx).handleSignal());