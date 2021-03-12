import { VisibilityEnum } from './DurableEntity';

// A wrapper around entity's state, with some extra metadata added
export class StateContainer<TState> {

    version: number = 0;
    
    constructor(public state: TState, public visibility: VisibilityEnum, public owner: string, public allowedUsers?: string[]) {

        // Adding owner to the list of allowed users
        if (this.visibility === VisibilityEnum.ToListOfUsers && !this.allowedUsers) {
            
            this.allowedUsers = [ this.owner ];
        }
    }

    // Checks if a given user has access to this entity
    static isAccessAllowed<TState>(container: StateContainer<TState>, user: string): boolean {

        switch (container.visibility) {
            case VisibilityEnum.ToOwnerOnly:
                if (!container.owner || container.owner !== user) {
                    return false;
                }
                return true;
            case VisibilityEnum.ToListOfUsers:
                if (!container.allowedUsers || !container.allowedUsers.includes(user)) {
                    return false;
                }
                return true;
            case VisibilityEnum.ToEveryone:
                return true;
            default:
                // Should always return false here, to prevent accidental exposure of external entities
                return false;
        }
    }
}