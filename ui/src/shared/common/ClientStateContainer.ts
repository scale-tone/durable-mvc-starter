
// A client-side wrapper around entity's state, with some extra metadata added
export class ClientStateContainer {
    version: number = 0;
    state: object = {};
}