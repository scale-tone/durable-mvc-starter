
import { assert } from 'node:console';
import { DurableEntitySet } from '../../../../ui/src/common/DurableEntitySet';
import { BackendBaseUri } from '../../../../ui/src/common/DurableHttpClient';
import { DurableEntityClientStateContainer } from '../../../../ui/src/shared/common/DurableEntityClientStateContainer';

// Need to set it to an absolute URL to calm down SignalR's HttpConnection
(BackendBaseUri as any) = 'http://localhost:7071/a/p/i';

test('attaches an entity and fetches its state from server', async () => {

    // arrange

    const initialFieldValue = 'value1';
    const fetchedFieldValue = 'value2';

    (DurableEntitySet as any).SignalRConn = undefined;

    const getUrls = [];

    const fakeHttpClient = {

        send: (url) => {
            throw new Error('Should not be used');
        },

        get: (url) => {
            getUrls.push(url);
            return Promise.resolve({
                content: JSON.stringify({
                    version: 1,
                    state: {
                        someField: fetchedFieldValue
                    }
                })
            });
        }
    };

    (DurableEntitySet as any).HttpClient = fakeHttpClient;

    // act

    const observableState = DurableEntitySet.attachEntity('myentity1', 'mykey1', { someField: initialFieldValue });

    // Assert

    expect(observableState.someField).toBe(initialFieldValue);

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(observableState.someField).toBe(fetchedFieldValue);

    expect(getUrls.length).toBe(1);
    expect(getUrls[0]).toBe('http://localhost:7071/a/p/i/entities/myentity1/mykey1');

    // Also checking that SignalR connection was initialized
    expect((DurableEntitySet as any).SignalRConn.connection.httpClient).toBe(fakeHttpClient);
});

test('creates an entity by initializing its metadata', async () => {

    // arrange

    const initialFieldValue = 'value1';
    const fetchedFieldValue = 'value2';


    (DurableEntitySet as any).SignalRConn = undefined;

    const postUrls = [], getUrls = [];

    const fakeHttpClient = {

        send: (url) => {
            throw new Error('Should not be used');
        },

        post: (url) => {
            postUrls.push(url);
            return Promise.resolve();
        },

        get: (url) => {
            getUrls.push(url);
            return Promise.resolve({
                content: JSON.stringify({
                    version: 1,
                    state: {
                        someField: fetchedFieldValue
                    }
                })
            });
        }
    };

    (DurableEntitySet as any).HttpClient = fakeHttpClient;

    // act

    const observableState = DurableEntitySet.createEntity('myentity2', 'mykey2', { someField: initialFieldValue });

    // Assert

    expect(observableState.someField).toBe(initialFieldValue);

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(observableState.someField).toBe(fetchedFieldValue);

    expect(postUrls.length).toBe(2);
    expect(postUrls[0]).toBe('http://localhost:7071/a/p/i/entities/myentity2/mykey2/$update-entity-internal-metadata');
    expect(postUrls[1]).toBe('http://localhost:7071/a/p/i/negotiate');

    expect(getUrls.length).toBe(1);
    expect(getUrls[0]).toBe('http://localhost:7071/a/p/i/entities/myentity2/mykey2');

    // Also checking that SignalR connection was initialized
    expect((DurableEntitySet as any).SignalRConn.connection.httpClient).toBe(fakeHttpClient);
});

test('reconnects to SignalR and attaches entities', async () => {

    // arrange

    (DurableEntitySet as any).SignalRConn = undefined;

    const postUrls = [], getUrls = [];

    const entityKey = 'mykey';
    const fetchedFieldValue = 'some value';

    const fakeHttpClient = {

        send: (url) => {
            throw new Error('Should not be used');
        },

        post: (url) => {
            postUrls.push(url);
            return Promise.resolve();
        },

        get: (url) => {
            getUrls.push(url);
            return Promise.resolve({
                content: JSON.stringify([{
                    version: 1,
                    entityKey,
                    state: {
                        someField: fetchedFieldValue
                    }
                }])
            });
        }
    };

    (DurableEntitySet as any).HttpClient = fakeHttpClient;

    // act

    const entitySet = new DurableEntitySet('myentity', true);

    // Assert

    await new Promise(resolve => setTimeout(resolve, 10));

    const signalRConn = (DurableEntitySet as any).SignalRConn;
    const onCloseCallback = signalRConn.closedCallbacks[0];

    expect(onCloseCallback.toString()).toBe('() => this.reconnectToSignalR()');

    expect(postUrls.length).toBe(1);
    expect(postUrls[0]).toBe('http://localhost:7071/a/p/i/negotiate');

    expect(getUrls.length).toBe(1);
    expect(getUrls[0]).toBe('http://localhost:7071/a/p/i/entities/myentity');

    expect(entitySet.items.length).toBe(1);
    const entityState = entitySet.items[0];
    expect(entityState.entityKey).toBe(entityKey);
    expect((entityState as any).someField).toBe(fetchedFieldValue);
});

test('applies entity state change', async () => {

    // arrange

    (DurableEntitySet as any).SignalRConn = undefined;

    const postUrls = [], getUrls = [];

    const entityName = 'myentity3';
    const entityKey = 'mykey3';
    const fetchedFieldValue = 'value3';
    const deliveredFieldValue = 'value4';
    var fetchedVersion = 1;

    const fakeHttpClient = {

        send: (url) => {
            throw new Error('Should not be used');
        },

        post: (url) => {
            postUrls.push(url);
            return Promise.resolve();
        },

        get: (url) => {
            getUrls.push(url);
            return Promise.resolve({
                content: JSON.stringify({
                    version: fetchedVersion,
                    state: {
                        someField: fetchedFieldValue
                    }
                })
            });
        }
    };

    (DurableEntitySet as any).HttpClient = fakeHttpClient;

    const stateChangedMessage1 = {
        entityName,
        entityKey,
        version: 2,
        stateDiff: [
            { op: 'replace', path: '/someField', value: deliveredFieldValue }
        ]
    };

    const stateChangedMessage2 = {
        entityName,
        entityKey,
        version: 123
    };

    // act

    const observableState = DurableEntitySet.attachEntity(entityName, entityKey, { someField: 'initial value' });
    await new Promise(resolve => setTimeout(resolve, 10));
    (DurableEntitySet as any).entityStateChangedMessageHandler(stateChangedMessage1);

    // Assert

    expect(observableState.someField).toBe(deliveredFieldValue);

    // act

    fetchedVersion = 123;
    (DurableEntitySet as any).entityStateChangedMessageHandler(stateChangedMessage2);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Assert

    expect(observableState.someField).toBe(fetchedFieldValue);
});
