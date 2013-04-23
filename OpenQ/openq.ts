/// <reference path="types/common.d.ts" />

export function startServer(repositoryFactory: (userName:string) => OpenQ.IRepository) {
    return new Server(repositoryFactory);
}

export class Server implements OpenQ.IServer {
    private users: User[];
    constructor(private repositoryFactory: (userName: string) => OpenQ.IRepository) {

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

    }
}

class Inbox implements OpenQ.IInbox {
    send(message: OpenQ.IMessage[], callback?: (err: any) => void ): void {
    }

    poll(token: string, afterQid?: number, take?: number, callback?: (err: any, messages: OpenQ.IMessage[]) => void ): void { }

    processedTo(qid: number, callback?: (err: any) => void ) { }
}

class Outbox implements OpenQ.IOutbox {
    subscribe(message: OpenQ.ISubscribeMessage, callback?: (err: any) => void ): void { }
    unsubscribe(message: OpenQ.IUnsubscribeMessage, callback?: (err: any) => void ) { }
    broadcast(message: OpenQ.IMessage[], callback?: (err: any) => void ): void { }
    poll(afterQid?: number, take?: number, callback?: (err: any, messages: OpenQ.IMessage[]) => void ): void { }
    processedTo(subscriber: string, token: string, qid: number, callback?: (err: any) => void ) { }
}