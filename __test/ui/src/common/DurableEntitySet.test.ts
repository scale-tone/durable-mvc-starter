
import { DurableEntitySet } from '../../../../ui/src/common/DurableEntitySet';
import { BackendBaseUri } from '../../../../ui/src/common/DurableHttpClient';

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

    // Attaching an entity, so that its state is fetched from server
    const observableState = DurableEntitySet.attachEntity(entityName, entityKey, { someField: 'initial value' });
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Simulating an EntityStateChangedMessage with some state changes in it
    (DurableEntitySet as any).entityStateChangedMessageHandler(stateChangedMessage1);

    const fieldValue1 = observableState.someField;

    // Now simulating another EntityStateChangedMessage, with unexpected version - this should trigger
    // another state fetch from server
    fetchedVersion = 123;
    (DurableEntitySet as any).entityStateChangedMessageHandler(stateChangedMessage2);
    await new Promise(resolve => setTimeout(resolve, 10));

    const fieldValue2 = observableState.someField;

    // Assert

    expect(fieldValue1).toBe(deliveredFieldValue);
    expect(fieldValue2).toBe(fetchedFieldValue);
});


test('drops destroyed entity from entity collection', async () => {

    // arrange

    (DurableEntitySet as any).SignalRConn = undefined;

    const postUrls = [], getUrls = [];

    const entityName = 'myentity4';
    const entityKey = 'mykey4';

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
                    state: {}
                }])
            });
        }
    };

    (DurableEntitySet as any).HttpClient = fakeHttpClient;

    const stateChangedMessage = {
        entityName,
        entityKey,
        version: 2,
        isEntityDestructed: true
    };

    // act

    const entitySet = new DurableEntitySet(entityName, true);
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(entitySet.items.length).toBe(1);
    expect(entitySet.items[0].entityKey).toBe(entityKey);

    (DurableEntitySet as any).entityStateChangedMessageHandler(stateChangedMessage);

    // Assert
    expect(entitySet.items.length).toBe(0);
});

test('retries fetching the state from server', async () => {

    // arrange

    (DurableEntitySet as any).SignalRConn = undefined;

    const getUrls = [];

    const fakeHttpClient = {

        send: (url) => {
            throw new Error('Should not be used');
        },

        get: (url) => {
            getUrls.push(url);
            return Promise.resolve({
                statusCode: 500
            });
        }
    };

    (DurableEntitySet as any).HttpClient = fakeHttpClient;

    (DurableEntitySet as any).RetryBaseIntervalMs = 0;

    // act

    DurableEntitySet.attachEntity('myentity5', 'mykey5', { someField: 'some value' });
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert

    expect(getUrls.length).toBe(7);
    expect(getUrls[0]).toBe('http://localhost:7071/a/p/i/entities/myentity5/mykey5');
    for (var i = 1; i < 7; i++){
        expect(getUrls[i]).toBe(getUrls[i-1]);
    }
});
