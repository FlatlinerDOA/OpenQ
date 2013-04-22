define(["require", "exports"], function(require, exports) {
    /// <reference path="types/common.d.ts" />
    var Server = (function () {
        function Server() { }
        Server.prototype.createUser = function (username, token, callback) {
            if(this.users[username]) {
                if(callback) {
                    callback(new Error('User already exists'), null);
                }
                return;
            }
            var u = new User(username, token);
            this.users[username] = u;
            if(callback) {
                callback(null, u);
            }
        };
        Server.prototype.getUser = function (username, token, callback) {
            if(!this.users[username]) {
                callback(new Error('User does not exist'), null);
                return;
            }
            callback(null, this.users[username]);
        };
        Server.prototype.deleteUser = function (username, token, callback) {
            delete this.users[username];
            if(callback) {
                callback(null);
            }
        };
        return Server;
    })();
    exports.Server = Server;    
    exports = module.exports = Server;
    var User = (function () {
        function User(username, token) {
            this.username = username;
            this.token = token;
            this.inbox = new Inbox();
            this.outbox = new Outbox();
            this.token = this.token || '';
        }
        User.prototype.requestSubscribe = function (message, callback) {
        };
        return User;
    })();    
    var Inbox = (function () {
        function Inbox() { }
        Inbox.prototype.send = function (message, callback) {
        };
        Inbox.prototype.poll = function (token, afterQid, take, callback) {
        };
        Inbox.prototype.processedTo = function (qid, callback) {
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
})
//@ sourceMappingURL=openq.js.map
