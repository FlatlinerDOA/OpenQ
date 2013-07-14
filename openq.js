function createService(repositoryFactory) {
    return new Service(repositoryFactory);
}
exports.createService = createService;

exports.MessageTypes = {
    "success": "urn:openq/success",
    "failed": "urn:openq/failed",
    "subscribe": "urn:openq/subscribe",
    "unsubscribe": "urn:openq/unsubscribe",
    "requestSubscribe": "urn:openq/requestsubscribe"
};

exports.Errors = {
    "UserAlreadyExists": "User already exists",
    "SubscriptionNotFound": "Subscription not found",
    "UserDoesNotExist": "User does not exist",
    "InvalidSubscriberOrToken": "Invalid subscriber or token",
    raise: function (name) {
        return { type: exports.MessageTypes.failed, message: exports.Errors[name], name: name };
    }
};

exports.Qid = {
    ExpectAny: -1,
    FromFirst: -1,
    FromSecond: 0,
    FromLatest: 1024 * 1024 * 1024 * 1024,
    First: 0
};

var TableNames = {
    users: "table:users",
    create: function () {
        var parts = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            parts[_i] = arguments[_i + 0];
        }
        var name = "table:";
        for (var p = 0; p < parts.length; p++) {
            if (p > 0) {
                name += '/';
            }

            name += encodeURIComponent(parts[p]);
        }
        return name;
    }
};

var Service = (function () {
    function Service(repositoryFactory) {
        this.repositoryFactory = repositoryFactory;
    }
    Service.prototype.start = function (callback) {
        this.usersTable = this.repositoryFactory(TableNames.users);
        this.usersTable.readAll('range', function (err, results) {
            callback(null);
        });
    };

    Service.prototype.createUser = function (username, token, callback) {
        if (this.users[username]) {
            if (callback) {
                callback(exports.Errors.raise(exports.Errors.UserAlreadyExists), null);
            }

            return;
        }

        var u = new User(username, token, this.repositoryFactory, this.publishers);
        this.users[username] = u;
        if (callback) {
            callback(null, u);
        }
    };

    Service.prototype.getUser = function (username, token, callback) {
        if (!this.users[username]) {
            callback(exports.Errors.raise(exports.Errors.UserDoesNotExist), null);
            return;
        }

        callback(null, this.users[username]);
    };

    Service.prototype.deleteUser = function (username, token, callback) {
        delete this.users[username];

        if (callback) {
            callback(null);
        }
    };

    Service.prototype.addPublisher = function (publisher) {
        this.removePublisher(publisher);
        this.publishers.push(publisher);
    };

    Service.prototype.removePublisher = function (publisher) {
        this.publishers = this.publishers.filter(function (p) {
            return p !== publisher;
        });
    };
    return Service;
})();
exports.Service = Service;

var User = (function () {
    function User(userName, token, repositoryFactory, publishers) {
        this.userName = userName;
        this.token = token;
        this.repositoryFactory = repositoryFactory;
        this.publishers = publishers;
        this.queues = [];
        this.token = this.token || '';

        this.queues['inbox'] = new Queue(this.userName, 'inbox', this.repositoryFactory, this.publishers);
        this.queues['outbox'] = new Queue(this.userName, 'outbox', this.repositoryFactory, this.publishers);
    }
    return User;
})();
exports.User = User;

var Queue = (function () {
    function Queue(userName, queueName, repositoryFactory, publishers) {
        if (typeof publishers === "undefined") { publishers = null; }
        this.userName = userName;
        this.queueName = queueName;
        this.repositoryFactory = repositoryFactory;
        this.publishers = publishers;
        this.messageFilters = {};
        this.messageFilters[exports.MessageTypes.subscribe] = this.subscribe;
        this.messageFilters[exports.MessageTypes.unsubscribe] = this.unsubscribe;
        this.messageFilters[exports.MessageTypes.requestSubscribe] = this.requestSubscribe;

        this.subscriptions = this.repositoryFactory(TableNames.create('users', this.userName, this.queueName, 'subscriptions'));
        this.messages = this.repositoryFactory(TableNames.create('users', this.userName, this.queueName, 'messages'));
    }
    Queue.prototype.requestSubscribe = function (message, callback) {
    };

    Queue.prototype.subscribe = function (message, callback) {
        var _this = this;
        for (var m = 0; m < message.messagetypes.length; m++) {
            var messageType = message.messagetypes[m];
            this.getSubscription(message.subscriber, message.token, messageType, function (err, s) {
                if (err) {
                    callback(err);
                    return;
                }

                var expectedQid = exports.Qid.First;
                if (s) {
                    callback(null);
                    return;
                }

                var subscription = {
                    subscriber: message.subscriber,
                    token: message.token,
                    messageType: messageType,
                    lastReadQid: exports.Qid.FromFirst,
                    exclusive: message.exclusive,
                    qid: expectedQid,
                    messagesperminute: message.messagesperminute
                };

                if (!message.fromfirstmessage) {
                    var messageQueue = _this.messages;
                    var subscriberMessageTypeRangeKey = _this.subscriptionKey(message.subscriber, messageType);
                    _this.messages.readLast(messageType, function (err, latest) {
                        if (err) {
                            callback(err);
                            return;
                        }

                        subscription.lastReadQid = latest.qid;
                        _this.saveSubscription(subscription, callback);
                    });

                    return;
                }

                _this.saveSubscription(subscription, callback);
            });
        }
    };

    Queue.prototype.unsubscribe = function (message, callback) {
        var _this = this;
        for (var i = 0; i < message.messagetypes.length; i++) {
            this.getSubscription(message.subscriber, message.token, message.messagetypes[i], function (err, subscription) {
                if (err) {
                    callback(err);
                    return;
                }

                if (!subscription) {
                    callback(exports.Errors.raise(exports.Errors.UserAlreadyExists));
                    return;
                }

                subscription.lastReadQid = subscription.qid;
                _this.saveSubscription(subscription, callback);
            });
        }
    };

    Queue.prototype.write = function (messages, callback) {
        var completion = function (err) {
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
                this.messages.write(message.type, message, exports.Qid.ExpectAny, callback);
            }
        }
    };

    Queue.prototype.read = function (messageType, afterQid, take, callback) {
        this.messages.read(messageType, afterQid, take, callback);
    };

    Queue.prototype.markRead = function (subscriber, token, messageType, lastReadQid, callback) {
        var _this = this;
        this.getSubscription(subscriber, token, messageType, function (err, subscription) {
            if (err) {
                callback(err);
                return;
            }

            if (!subscription) {
                callback(exports.Errors.raise(exports.Errors.SubscriptionNotFound));
                return;
            }

            subscription.lastReadQid = lastReadQid;
            _this.saveSubscription(subscription, callback);
        });
    };

    Queue.prototype.getSubscription = function (subscriber, token, messageType, callback) {
        var rangeKey = this.subscriptionKey(subscriber, messageType);
        this.subscriptions.readLast(rangeKey, function (err, s) {
            if (err) {
                callback(err, null);
                return;
            }

            if (!s) {
                callback(null, null);
                return;
            }

            if (s.token !== token) {
                callback(exports.Errors.raise(exports.Errors.InvalidSubscriberOrToken), null);
            } else {
                callback(null, s);
            }
        });
    };

    Queue.prototype.saveSubscription = function (subscription, callback) {
        var rangeKey = this.subscriptionKey(subscription.subscriber, subscription.messageType);
        this.subscriptions.write(rangeKey, subscription, subscription.qid, callback);
    };

    Queue.prototype.subscriptionKey = function (subscriber, messageType) {
        return subscriber + '/' + messageType;
    };
    return Queue;
})();
exports.Queue = Queue;

var HttpPostPublisher = (function () {
    function HttpPostPublisher() {
    }
    HttpPostPublisher.prototype.publish = function (messages, subscriber) {
        return false;
    };
    return HttpPostPublisher;
})();
exports.HttpPostPublisher = HttpPostPublisher;

var DispatchPublisher = (function () {
    function DispatchPublisher() {
        this.messageHandlers = {};
    }
    DispatchPublisher.prototype.addHandler = function (type, handler) {
        var handlers = this.messageHandlers[type];
        if (!handlers) {
            handlers = [];
            this.messageHandlers[type] = handlers;
        }

        handlers.push(handler);
    };

    DispatchPublisher.prototype.publish = function (messages, subscriber) {
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
    };
    return DispatchPublisher;
})();
exports.DispatchPublisher = DispatchPublisher;

var SocketPublisher = (function () {
    function SocketPublisher(missedMessageRetriever) {
        if (typeof missedMessageRetriever === "undefined") { missedMessageRetriever = null; }
        this.missedMessageRetriever = missedMessageRetriever;
    }
    SocketPublisher.prototype.addListener = function (subscriber, callback) {
        if (this.missedMessageRetriever) {
            this.missedMessageRetriever(subscriber, function (err, messages) {
                if (err) {
                    callback(err);
                    return;
                }
            });
        }
    };

    SocketPublisher.prototype.publish = function (messages, subscriber) {
        return false;
    };
    return SocketPublisher;
})();
exports.SocketPublisher = SocketPublisher;

