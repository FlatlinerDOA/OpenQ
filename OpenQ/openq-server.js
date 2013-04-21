exports.MessageTypes = {
    "success": "urn:simpleq/success",
    "failed": "urn:simpleq/failed"
};
var express = require("express");
function listen(port) {
    if (typeof port === "undefined") { port = null; }
    port = port || 8000;
    return new OpenQExpressServer(process.env.COMPUTERNAME + ':' + process.pid, port);
}
exports.listen = listen;
var OpenQExpressServer = (function () {
    function OpenQExpressServer(peerId, port) {
        this.server = new Server();
        this.app = express();
        this.app.get('/', this.signupForm);
        this.app.post('/signup', this.signup);
        this.app.post('/:username/inbox', this.sendMessage);
        this.app.get('/:username/inbox', this.getMessages);
        this.app.listen(port);
    }
    OpenQExpressServer.prototype.signupForm = function (req, res) {
        res.send('<html><body><h1>Signup to OpenQ</h1><form action="/signup" method="post"><div><label>Username</label><input type="text" name="username"></div><div><label>Password</label><input type="password" name="password"></div><input type="submit"></form></h1></body></html>');
    };
    OpenQExpressServer.prototype.signup = function (req, res) {
        var _this = this;
        this.server.createUser(req.body.username, req.body.password, function (err, user) {
            _this.end(err, res);
        });
    };
    OpenQExpressServer.prototype.end = function (error, res) {
        if(error) {
            this.failed(error, res);
            return;
        }
        this.success(res);
    };
    OpenQExpressServer.prototype.failed = function (error, res) {
        error.type = "urn:simpleq/failed";
        res.format({
            html: '<html><body><h1>Uh oh!</h1><pre>' + error + '</pre></body></html>',
            json: error
        });
    };
    OpenQExpressServer.prototype.success = function (res) {
        res.format({
            html: '<html><body><h1>Well done!</h1></body></html>',
            json: '{ "type":"urn:simpleq/success" }'
        });
    };
    OpenQExpressServer.prototype.sendMessage = function (req, res) {
        var _this = this;
        var username = req.param('username');
        var token = req.secure;
        this.server.getUser(username, '', function (err, user) {
            if(err) {
                res.send(400, err.message);
                return;
            }
            user.inbox.send(req.body, function (err) {
                _this.end(err, res);
            });
        });
    };
    OpenQExpressServer.prototype.getMessages = function (req, res) {
    };
    return OpenQExpressServer;
})();
exports.OpenQExpressServer = OpenQExpressServer;
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
