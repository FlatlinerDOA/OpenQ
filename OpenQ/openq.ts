/// <reference path="types/common.d.ts" />

export function createServer(repositoryFactory: OpenQ.IRepositoryFactory) {
    return new Service(repositoryFactory);
}

export var MessageTypes = {
    "success": "urn:openq/success",
    "failed": "urn:openq/failed"
};

export var Qid = {
    ExpectAny: -1,
    FromFirst: -1,
    FromSecond: 0,
    FromLatest: 1024 * 1024 * 1024 * 1024,
    First: 0
}

export class Service implements OpenQ.IService {
    private users: User[];
    private usersTable: OpenQ.IRepository;

    constructor(private repositoryFactory: OpenQ.IRepositoryFactory) {
    }

    start(callback: (err: any) => void ): void {
        this.usersTable = this.repositoryFactory('table:openq');
        this.usersTable.read('urn:openq/users', Qid.FromLatest, 1, () => {
            // TODO: Load out user accounts from the users repository
            callback(null);
        });
    }

    createUser(username: string, token?: string, callback?: (err: any, user: OpenQ.IUser) => void ): void {
        if (this.users[username]) {
            if (callback) {
                callback({ message: 'User already exists', name: 'UserAlreadyExists' }, null);
            }

            return;
        }

        var u = new User(username, token, this.repositoryFactory);
        this.users[username] = u;
        if (callback) {
            callback(null, u);
        }
    }

    getUser(username: string, token: string, callback: (err: any, user: OpenQ.IUser) => void ): void {
        if (!this.users[username]) {
            callback({ message: 'User does not exist', name: 'UserDoesNotExist' }, null);
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
    inbox: OpenQ.IQueue;
    outbox: OpenQ.IQueue;

    constructor(public userName: string, public token: string, private repositoryFactory: OpenQ.IRepositoryFactory) {
        this.token = this.token || '';
        this.inbox = new Queue(this.userName, 'inbox', this.repositoryFactory);
        this.outbox = new Queue(this.userName, 'outbox', this.repositoryFactory);
    }
}

export class Queue implements OpenQ.IQueue {
    subscriptions: OpenQ.IRepository;
    messages: OpenQ.IRepository;

    constructor(public userName: string, public queueName: string, private repositoryFactory: OpenQ.IRepositoryFactory) {
        this.subscriptions = this.repositoryFactory('table:users/' + this.userName + '/' + this.queueName + '/subscriptions');
        this.messages = this.repositoryFactory('table:users/' + this.userName + '/' + this.queueName + '/messages');
    }

    requestSubscribe(message: OpenQ.IRequestSubscribeMessage, callback?: (err: Error) => void ): void {
    }

    subscribe(message: OpenQ.ISubscribeMessage, callback?: (err: Error) => void ): void {
        for (var m = 0; m < message.messagetypes.length; m++) {
            // TODO: Url encode message types??
            var messageType = message.messagetypes[m];
            var subscriberMessageTypeRangeKey = message.subscriber + '/' + messageType;
            this.subscriptions.read(subscriberMessageTypeRangeKey, Qid.FromLatest, 1, (err, s) => {
                if (err) {
                    callback(err);
                    return;
                }

                var subscription = { type: messageType, lastReadQid: Qid.FromFirst };
                if (!message.fromfirstmessage) {
                    var messageQueue = this.messages;
                    ////messageQueue.read(messageType, '', )
                }

                var expectedQid = Qid.First;
                if (s.length !== 0) {
                    // Subscription already exists for this message type, do nothing
                    callback(null);
                    return;
                }

                this.subscriptions.write(subscriberMessageTypeRangeKey, [subscription], expectedQid, callback);
            });
        }
    }

    unsubscribe(message: OpenQ.IUnsubscribeMessage, callback?: (err: Error) => void ): void {

    }

    write(messages: OpenQ.IMessage[], callback?: (err: Error) => void ): void {
        // TODO: Switch for known types to route to type specific handlers
        var r = this.repositoryFactory('table:users/' + this.userName + '/' + this.queueName);
        for (var m = 0; m < messages.length; m++) {
            r.write(messages[m].type, messages[m], Qid.ExpectAny, callback);
        }
    }

    read(type: string, afterQid?: number, take?: number, callback?: (err: Error, messages: OpenQ.IMessage[]) => void ): void {
        var r = this.repositoryFactory('table:users/' + this.userName + '/' + this.queueName);
        r.read(type, Qid.ExpectAny, take, (err, m) => {
            
        });
    }

    markRead(subscriber: string, token: string, lastReadQid: number, callback?: (err: Error) => void ) {
        this.subscriptions.write(subscriber, { type: '', lastReadQid: lastReadQid }, Qid.ExpectAny, callback);
    }
}


/*
Sends a message to a subscriber via a direct HTTP POST to their address
*/
class HttpPostPublisher implements OpenQ.IPublisher {
    publish(messages: OpenQ.IMessage[], recipientAddress: string) {
    }
}

/*
For web clients that start a long polling connection etc.
*/
class SocketPublisher implements OpenQ.IPublisher {
    constructor() {
        ////var s = require('socket.io');
    }

    addListener(recipient: string, callback:(err) => void ): void {
    }

    publish(messages: OpenQ.IMessage[], recipient: string) {
    }
}