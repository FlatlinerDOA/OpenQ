function createServer(repositoryFactory) {
    return new Service(repositoryFactory);
}
exports.createServer = createServer;
exports.MessageTypes = {
    "success": "urn:openq/success",
    "failed": "urn:openq/failed"
};
exports.Qid = {
    ExpectAny: -1,
    FromFirst: -1,
    FromSecond: 0,
    FromLatest: 1024 * 1024 * 1024 * 1024,
    First: 0
};
var Service = (function () {
    function Service(repositoryFactory) {
        this.repositoryFactory = repositoryFactory;
    }
    Service.prototype.start = function (callback) {
        this.usersTable = this.repositoryFactory('table:openq');
        this.usersTable.read('urn:openq/users', exports.Qid.FromLatest, 1, function () {
            callback(null);
        });
    };
    Service.prototype.createUser = function (username, token, callback) {
        if(this.users[username]) {
            if(callback) {
                callback({
                    message: 'User already exists',
                    name: 'UserAlreadyExists'
                }, null);
            }
            return;
        }
        var u = new User(username, token, this.repositoryFactory);
        this.users[username] = u;
        if(callback) {
            callback(null, u);
        }
    };
    Service.prototype.getUser = function (username, token, callback) {
        if(!this.users[username]) {
            callback({
                message: 'User does not exist',
                name: 'UserDoesNotExist'
            }, null);
            return;
        }
        callback(null, this.users[username]);
    };
    Service.prototype.deleteUser = function (username, token, callback) {
        delete this.users[username];
        if(callback) {
            callback(null);
        }
    };
    return Service;
})();
exports.Service = Service;
var User = (function () {
    function User(userName, token, repositoryFactory) {
        this.userName = userName;
        this.token = token;
        this.repositoryFactory = repositoryFactory;
        this.token = this.token || '';
        this.inbox = new Queue(this.userName, 'inbox', this.repositoryFactory);
        this.outbox = new Queue(this.userName, 'outbox', this.repositoryFactory);
    }
    return User;
})();
var Queue = (function () {
    function Queue(userName, queueName, repositoryFactory) {
        this.userName = userName;
        this.queueName = queueName;
        this.repositoryFactory = repositoryFactory;
        this.subscriptions = this.repositoryFactory('table:users/' + this.userName + '/' + this.queueName + '/subscriptions');
        this.messages = this.repositoryFactory('table:users/' + this.userName + '/' + this.queueName + '/messages');
    }
    Queue.prototype.requestSubscribe = function (message, callback) {
    };
    Queue.prototype.subscribe = function (message, callback) {
        var _this = this;
        for(var m = 0; m < message.messagetypes.length; m++) {
            var messageType = message.messagetypes[m];
            var subscriberMessageTypeRangeKey = message.subscriber + '/' + messageType;
            this.subscriptions.read(subscriberMessageTypeRangeKey, exports.Qid.FromLatest, 1, function (err, s) {
                if(err) {
                    callback(err);
                    return;
                }
                var subscription = {
                    type: messageType,
                    lastReadQid: exports.Qid.FromFirst
                };
                if(!message.fromfirstmessage) {
                    var messageQueue = _this.messages;
                }
                var expectedQid = exports.Qid.First;
                if(s.length !== 0) {
                    callback(null);
                    return;
                }
                _this.subscriptions.write(subscriberMessageTypeRangeKey, [
                    subscription
                ], expectedQid, callback);
            });
        }
    };
    Queue.prototype.unsubscribe = function (message, callback) {
    };
    Queue.prototype.write = function (messages, callback) {
        var r = this.repositoryFactory('table:users/' + this.userName + '/' + this.queueName);
        for(var m = 0; m < messages.length; m++) {
            r.write(messages[m].type, messages[m], exports.Qid.ExpectAny, callback);
        }
    };
    Queue.prototype.read = function (type, afterQid, take, callback) {
        var r = this.repositoryFactory('table:users/' + this.userName + '/' + this.queueName);
        r.read(type, exports.Qid.ExpectAny, take, function (err, m) {
        });
    };
    Queue.prototype.markRead = function (subscriber, token, lastReadQid, callback) {
        this.subscriptions.write(subscriber, {
            type: '',
            lastReadQid: lastReadQid
        }, exports.Qid.ExpectAny, callback);
    };
    return Queue;
})();
exports.Queue = Queue;
var HttpPostPublisher = (function () {
    function HttpPostPublisher() { }
    HttpPostPublisher.prototype.publish = function (messages, recipientAddress) {
    };
    return HttpPostPublisher;
})();
var SocketPublisher = (function () {
    function SocketPublisher() {
    }
    SocketPublisher.prototype.addListener = function (recipient, callback) {
    };
    SocketPublisher.prototype.publish = function (messages, recipient) {
    };
    return SocketPublisher;
})();
