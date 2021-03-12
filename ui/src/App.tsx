import React from 'react';
import { observer } from 'mobx-react';

import { DurableEntitySet } from './common/DurableEntitySet';
import { CounterState } from './shared/CounterState';

// Setup with some fake user name. This is for testing purposes only.
// When deployed to Azure with EasyAuth configured, this name will be replaced with your real user name.
DurableEntitySet.setup({
    fakeUserNameFabric: () => Promise.resolve('test-anonymous-user')
});

const entityName = 'CounterEntity';
const entityKey = 'my-counter';

// Creating a single CounterEntity and binding to its state
const counterState = DurableEntitySet.createEntity(entityName, entityKey, new CounterState());

// Rendering that entity state
export const App = observer(
    class App extends React.Component {
        render(): JSX.Element {
            return (<>
                <div className="counter-div">
                    <h3> Title: '{counterState.title}', count: {counterState.countContainer?.count}</h3>
                    <button onClick={() => DurableEntitySet.signalEntity(entityName, entityKey, 'add', 1)}>
                        Increment
                    </button>
                    <button onClick={() => DurableEntitySet.signalEntity(entityName, entityKey, 'substract', 1)}>
                        Decrement
                    </button>
                </div>
                <h4>{counterState.previousValues.length ? 'Previous values:' : ''}</h4>
                <ul>
                    {counterState.previousValues.map(n => (<li>{n}</li>))}
                </ul>
            </>);
        }
    }
);
