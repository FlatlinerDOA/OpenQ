/// <reference path="types/common.d.ts" />

export function createService(repositoryFactory: OpenQ.IRepositoryFactory) {
    return new Service(repositoryFactory);
}

export var MessageTypes = {
    "success": "urn:openq/success",
    "failed": "urn:openq/failed",
    "subscribe": "urn:openq/subscribe",
    "unsubscribe": "urn:openq/unsubscribe",
    "requestSubscribe": "urn:openq/requestsubscribe",
};

export var Errors = {
    "UserAlreadyExists": "User already exists",
    "SubscriptionNotFound": "Subscription not found",
    "UserDoesNotExist": "User does not exist",
    "InvalidSubscriberOrToken": "Invalid subscriber or token",

    raise: (name: string) => {
        return { type: MessageTypes.failed, message: this[name], name: name };
    }
};

export var Qid = {
    ExpectAny: -1,
    FromFirst: -1,
    FromSecond: 0,
    FromLatest: 1024 * 1024 * 1024 * 1024,
    First: 0
}

var TableNames = {
    users: "table:users",

    /** creates a table name by safe-concatenating string arguments */
    create:(...parts: any[]) => {
        var name = "table:";
        for (var p = 0; p < parts.length; p++) {
            if (p > 0) {
                name += '/';
            }

            name += encodeURIComponent(parts[p]);
        }
        return name;
    }
}

/** OpenQ service that hosts user inboxes */
export class Service implements OpenQ.IService {
    private users: User[];
    private usersTable: OpenQ.IRepository;
    private publishers: OpenQ.IPublisher[];

    constructor(private repositoryFactory: OpenQ.IRepositoryFactory) {
    }

    start(callback: (err: any) => void ): void {
        this.usersTable = this.repositoryFactory(TableNames.users);
        this.usersTable.readAll('range', (err, results) => {
            // TODO: Load out user accounts from the users repository
            callback(null);
        });
    }

    createUser(username: string, token?: string, callback?: (err: any, user: OpenQ.IUser) => void ): void {
        if (this.users[username]) {
            if (callback) {
                callback(Errors.raise(Errors.UserAlreadyExists), null);
            }

            return;
        }

        var u = new User(username, token, this.repositoryFactory, this.publishers);
        this.users[username] = u;
        if (callback) {
            callback(null, u);
        }
    }

    getUser(username: string, token: string, callback: (err: any, user: OpenQ.IUser) => void ): void {
        if (!this.users[username]) {
            callback(Errors.raise(Errors.UserDoesNotExist), null);
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

    addPublisher(publisher: OpenQ.IPublisher) {
        this.removePublisher(publisher);
        this.publishers.push(publisher);
    }

    removePublisher(publisher: OpenQ.IPublisher) {
        // IMPROVE: Inefficient removal.
        this.publishers = this.publishers.filter(p => p !== publisher);
    }
}

export class User implements OpenQ.IUser {
    queues:OpenQ.IQueue[] = [];

    constructor(public userName: string, public token: string, private repositoryFactory: OpenQ.IRepositoryFactory, private publishers: OpenQ.IPublisher[]) {
        this.token = this.token || '';

        this.queues['inbox'] = new Queue(this.userName, 'inbox', this.repositoryFactory, this.publishers);
        this.queues['outbox'] = new Queue(this.userName, 'outbox', this.repositoryFactory, this.publishers);
    }
}

export class Queue implements OpenQ.IQueue {
    subscriptions: OpenQ.IRepository;
    messages: OpenQ.IRepository;
    private messageFilters = {
    };

    constructor(public userName: string, public queueName: string, private repositoryFactory: OpenQ.IRepositoryFactory, private publishers:OpenQ.IPublisher[] = null) {
        this.messageFilters[MessageTypes.subscribe] = this.subscribe;
        this.messageFilters[MessageTypes.unsubscribe] = this.unsubscribe;
        this.messageFilters[MessageTypes.requestSubscribe] = this.requestSubscribe;
        
        this.subscriptions = this.repositoryFactory(TableNames.create('users', this.userName, this.queueName, 'subscriptions'));
        this.messages = this.repositoryFactory(TableNames.create('users', this.userName, this.queueName, 'messages'));
    }

    requestSubscribe(message: OpenQ.IRequestSubscribeMessage, callback: (err: Error) => void ): void {

    }
    
    subscribe(message: OpenQ.ISubscribeMessage, callback: (err: Error) => void ): void {
        for (var m = 0; m < message.messagetypes.length; m++) {
            var messageType = message.messagetypes[m];
            this.getSubscription(message.subscriber, message.token, messageType, (err, s) => {
                if (err) {
                    callback(err);
                    return;
                }

                var expectedQid = Qid.First;
                if (s) {
                    // Subscription already exists for this message type, so do nothing??
                    callback(null);
                    return;
                }

                var subscription: OpenQ.ISubscription = {
                    subscriber: message.subscriber,
                    token: message.token,
                    messageType: messageType,
                    lastReadQid: Qid.FromFirst,
                    exclusive: message.exclusive,
                    qid: expectedQid,
                    messagesperminute: message.messagesperminute
                };

                if (!message.fromfirstmessage) {
                    var messageQueue = this.messages;
                    var subscriberMessageTypeRangeKey = this.subscriptionKey(message.subscriber,  messageType);
                    this.messages.readLast(messageType, (err, latest) => {
                        if (err) {
                            callback(err);
                            return;
                        }

                        subscription.lastReadQid = latest.qid;
                        this.saveSubscription(subscription, callback);
                    });

                    return;
                }

                this.saveSubscription(subscription, callback);
            });
        }
    }

    unsubscribe(message: OpenQ.IUnsubscribeMessage, callback: (err: Error) => void ): void {
        for (var i = 0; i < message.messagetypes.length; i++) {
            this.getSubscription(message.subscriber, message.token, message.messagetypes[i], (err, subscription) => {
                if (err) {
                    callback(err);
                    return;
                }

                if (!subscription) {
                    callback(Errors.raise(Errors.UserAlreadyExists));
                    return;
                }

                subscription.lastReadQid = subscription.qid;
                this.saveSubscription(subscription, callback);
            });
        }
    }

    write(messages: OpenQ.IMessage[], callback?: (err: Error) => void ): void {
        // TODO: Switch for known types to route to type specific handlers
        var completion = (err: Error) => {
            if (err) {
                callback(err);
                return;
            }
        };

        for (var m = 0; m < messages.length; m++) {
            var message = messages[m];
            var filter = this.messageFilters[message.type];
            if (filter) {
                this.messageFilters[message.type](message, callback);
            } else {
                this.messages.write(message.type, message, Qid.ExpectAny, callback);
            }
        }
    }

    read(messageType: string, afterQid?: number, take?: number, callback?: (err: Error, messages: OpenQ.IMessage[]) => void ): void {
        this.messages.read(messageType, afterQid, take, callback);
    }

    markRead(subscriber: string, token: string, messageType:string, lastReadQid: number, callback?: (err: Error) => void ) {
        this.getSubscription(subscriber, token, messageType, (err, subscription) => {
            if (err) {
                callback(err);
                return;
            }

            if (!subscription) {
                callback(Errors.raise(Errors.SubscriptionNotFound));
                return;
            }

            subscription.lastReadQid = lastReadQid;
            this.saveSubscription(subscription, callback);
        });
    }

    private getSubscription(subscriber: string, token: string, messageType: string, callback: (err: Error, subscription: OpenQ.ISubscription) => void ) {
        // TODO: Url encode message types??
        var rangeKey = this.subscriptionKey(subscriber, messageType);
        this.subscriptions.readLast(rangeKey, (err, s: OpenQ.ISubscription) => {
            if (err) {
                callback(err, null);
                return;
            }

            if (!s) {
                callback(null, null);
                return;
            }

            if (s.token !== token) {
                callback(Errors.raise(Errors.InvalidSubscriberOrToken), null);
            } else {
                callback(null, s);
            }
        });
    }

    private saveSubscription(subscription: OpenQ.ISubscription, callback: (err: Error) => void ) {
        var rangeKey = this.subscriptionKey(subscription.subscriber, subscription.messageType);
        this.subscriptions.write(rangeKey, subscription, subscription.qid, callback);
    }

    private subscriptionKey(subscriber: string, messageType: string) {
        return subscriber + '/' + messageType;
    }
}

/** Sends a message to a subscriber via a direct HTTP POST to their configured address */
export class HttpPostPublisher implements OpenQ.IPublisher {
    publish(messages: OpenQ.IMessage[], subscriber: string) {
        return false;
    }
}

/** Invokes one or more functions to handle messages. If a handler returns true the message is longer processed. */
export class DispatchPublisher implements OpenQ.IPublisher {
    messageHandlers = {
    };

    addHandler(type: string, handler: (message: OpenQ.IMessage, subscriber: string) => bool): void
    {
        var handlers = this.messageHandlers[type]
        if (!handlers) {
            handlers = [];
            this.messageHandlers[type] = handlers;
        }

        handlers.push(handler);
    }

    publish(messages: OpenQ.IMessage[], subscriber: string): bool {
        for (var m = 0; m < messages.length; m++) {
            var message = messages[m];
            var handlers = this.messageHandlers[message.type];
            if (handlers) {
                for (var h = 0; h < handlers.length; h++) {
                    if (handlers[h](message, subscriber)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
}

/*
For web clients that have started a long polling connection etc.
*/
export class SocketPublisher implements OpenQ.IPublisher {
    constructor(private missedMessageRetriever: OpenQ.IMissedMessageRetriever = null) {
        ////var s = require('socket.io');
    }

    addListener(subscriber: string, callback:(err:Error) => void ): void {
        // When a subscriber starts listening, we immediately start pushing them messages they've missed since they were last connected (if any).
        if (this.missedMessageRetriever) {
            this.missedMessageRetriever(subscriber, (err, messages) => {
                if (err) {
                    callback(err);
                    return;
                }
            });
        }
    }

    publish(messages: OpenQ.IMessage[], subscriber: string) {
        return false;
    }
}