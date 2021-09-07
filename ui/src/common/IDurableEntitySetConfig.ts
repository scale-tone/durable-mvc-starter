import { ILogger } from '@aspnet/signalr';

// Configuration settings for DurableEntitySet
export interface IDurableEntitySetConfig {

    // Method that produces access tokens to be used when communicating with backend.
    // Specify this, when using client-side authentication (e.g. msal)
    accessTokenFactory?: () => Promise<string>;

    // FOR TESTING PURPOSES ONLY a fake/test user name to login to SignalR and the backend.
    // Will only work when running locally (when deployed to Azure it will be overriden by EasyAuth).
    fakeUserNamePromise?: Promise<string | null>;

    // Custom logger implementation
    logger?: ILogger;

    // By default, DurableEntitySet will persist the list of known (loaded) EntityIds in localStorage,
    // for faster retrieval of those entities upon page reload. But only if the total number of those doesn't exceed
    // this value. Set it to 0 to completely disable this behavior (this might make the initial load of entities longer, 
    // because retrieving a _list_ of all entities is an expensive operation).
    maxKnownEntityIdsToPersist?: number;
}
