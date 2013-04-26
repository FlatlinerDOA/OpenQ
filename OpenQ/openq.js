function createServer(repositoryFactory) {
    return new Service(repositoryFactory);
}
exports.createServer = createServer;
exports.MessageTypes = {
    "success": "urn:simpleq/success",
    "failed": "urn:simpleq/failed"
};
exports.Qid = {
    ExpectAny: -1,
    FromFirst: -1,
    FromSecond: 0,
    FromLatest: 1024 ^ 4,
    Min: 0
};
var Service = (function () {
    function Service(repositoryFactory) {
        this.repositoryFactory = repositoryFactory;
    }
    Service.prototype.start = function (callback) {
        this.usersTable = this.repositoryFactory('urn:openq');
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
        var u = new User(username, token);
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
    function User(username, token) {
        this.username = username;
        this.token = token;
        this.inbox = new Inbox();
        this.outbox = new Outbox();
        this.token = this.token || '';
    }
    User.prototype.requestSubscribe = function (message, callback) {
        callback(Error('not implemented'));
    };
    return User;
})();
var Inbox = (function () {
    function Inbox() { }
    Inbox.prototype.send = function (message, callback) {
        callback(Error('not implemented'));
    };
    Inbox.prototype.poll = function (token, afterQid, take, callback) {
        callback(Error('not implemented'), null);
    };
    Inbox.prototype.processedTo = function (qid, callback) {
        callback(Error('not implemented'));
    };
    return Inbox;
})();
var Outbox = (function () {
    function Outbox() { }
    Outbox.prototype.subscribe = function (message, callback) {
    };
    Outbox.prototype.unsubscribe = function (message, callback) {
    };
    Outbox.prototype.broadcast = function (message, callback) {
    };
    Outbox.prototype.poll = function (afterQid, take, callback) {
    };
    Outbox.prototype.processedTo = function (subscriber, token, qid, callback) {
    };
    return Outbox;
})();
