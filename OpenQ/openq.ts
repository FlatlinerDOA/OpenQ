/// <reference path="types/common.d.ts" />

export function createServer(repositoryFactory: OpenQ.IRepositoryFactory) {
    return new Server(repositoryFactory);
}

export var Qid = {
    ExpectAny: -1,
    FromFirst: -1,
    FromSecond: 0,
    Max: 1024 ^ 4,
    Min: 0
}

export class Server implements OpenQ.IServer {
    private users: User[];
    private usersTable: OpenQ.IRepository;

    constructor(private repositoryFactory: OpenQ.IRepositoryFactory) {
    }

    start(callback: (err: any) => void ): void {
        this.usersTable = this.repositoryFactory('urn:openq');
        this.usersTable.read('urn:openq/users', Qid.Last, 1, () => {
            // TODO: Load out user accounts from the users repository
            callback(null);
        });
    }

    createUser(username: string, token?: string, callback?: (err: any, user: OpenQ.IUser) => void ): void {
        if (this.users[username]) {
            if (callback) {
                callback(new Error('User already exists'), null);
            }

            return;
        }

        var u = new User(username, token);
        this.users[username] = u;
        if (callback) {
            callback(null, u);
        }
    }

    getUser(username: string, token: string, callback: (err: any, user: OpenQ.IUser) => void ): void {
        if (!this.users[username]) {
            callback(new Error('User does not exist'), null);
            return;
        }

        callback(null, this.users[username]);
    }

    deleteUser(username: string, token: string, callback?: (err: any) => void ): void {
        delete this.users[username];

        if (callback) {
            callback(null);
        }
    }
}

class User implements OpenQ.IUser {
    inbox = new Inbox();
    outbox = new Outbox();

    constructor(public username: string, public token: string) {
        this.token = this.token || '';
    }

    requestSubscribe(message: OpenQ.IRequestSubscribeMessage, callback?: (err: any) => void ): void {
        callback(Error('not implemented'));
    }
}

class Inbox implements OpenQ.IInbox {
    send(message: OpenQ.IMessage[], callback?: (err: any) => void ): void {
        callback(Error('not implemented'));
    }

    poll(token: string, afterQid?: number, take?: number, callback?: (err: any, messages: OpenQ.IMessage[]) => void ): void {
        callback(Error('not implemented'), null);
    }

    processedTo(qid: number, callback?: (err: any) => void ) {
        callback(Error('not implemented'));
    }
}

class Outbox implements OpenQ.IOutbox {
    subscribe(message: OpenQ.ISubscribeMessage, callback?: (err: any) => void ): void {
    }
    unsubscribe(message: OpenQ.IUnsubscribeMessage, callback?: (err: any) => void ) {
    }
    broadcast(message: OpenQ.IMessage[], callback?: (err: any) => void ): void {
    }
    poll(afterQid?: number, take?: number, callback?: (err: any, messages: OpenQ.IMessage[]) => void ): void {
    }
    processedTo(subscriber: string, token: string, qid: number, callback?: (err: any) => void ) {
    }
}
