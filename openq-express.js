var openq = require("./openq");
var memoryRepo = require("./repository-memory");
var express = require("express");

function listen(port) {
    if (typeof port === "undefined") { port = null; }
    port = port || 8000;
    var s = new OpenQExpressServer();
    s.listen('localhost', port);
    return s;
}
exports.listen = listen;

var OpenQExpressServer = (function () {
    function OpenQExpressServer() {
        this.instanceId = process.env.COMPUTERNAME + ':' + process.pid;
        this.service = openq.createService(memoryRepo.createRepository);
        this.intializeWebServer();
        this.initializePublishers();
    }
    OpenQExpressServer.prototype.listen = function (hostName, port) {
        console.log('OpenQ server listening on http://' + hostName + ':' + port + '/');
        this.app.listen(port);
    };

    OpenQExpressServer.prototype.intializeWebServer = function () {
        this.app = express();
        this.app.use(express.bodyParser());
        this.app.use('/', express.static(__dirname + '/content'));
        this.app.post('/signup', this.signup);

        this.app.get('/:username/:queue', this.getMessages);
        this.app.post('/:username/:queue', this.sendMessage);
    };

    OpenQExpressServer.prototype.initializePublishers = function () {
    };

    OpenQExpressServer.prototype.signupForm = function (req, res) {
        res.send('<html><body><h1>Signup to OpenQ</h1><form action="/signup" method="post"><div><label>Username</label><input type="text" name="username"></div><div><label>Password</label><input type="password" name="password"></div><input type="submit"></form></h1></body></html>');
    };

    OpenQExpressServer.prototype.signup = function (req, res) {
        var _this = this;
        this.service.createUser(req.body.username, req.body.password, function (err, user) {
            _this.end(err, res);
        });
    };

    OpenQExpressServer.prototype.end = function (error, res) {
        if (error) {
            this.failed(error, res);
            return;
        }

        this.success(res);
    };

    OpenQExpressServer.prototype.failed = function (error, res) {
        error.type = "urn:openq/failed";
        res.format({
            html: '<html><body><h1>Uh oh!</h1><pre>' + error + '</pre></body></html>',
            json: error
        });
    };

    OpenQExpressServer.prototype.success = function (res) {
        res.format({
            html: '<html><body><h1>Well done!</h1></body></html>',
            json: { "type": "urn:openq/success" }
        });
    };

    OpenQExpressServer.prototype.sendMessage = function (req, res) {
        var _this = this;
        var username = req.param('username');
        var queue = req.param('queue');
        var token = req.header('auth-token');
        this.service.getUser(username, '', function (err, user) {
            if (err) {
                res.send(400, err);
                return;
            }

            user.queues[queue].write(req.body, function (err) {
                _this.end(err, res);
            });
        });
    };

    OpenQExpressServer.prototype.getMessages = function (req, res) {
        var username = req.param('username');
        var queue = req.param('queue');
        var token = req.header('auth-token');
    };
    return OpenQExpressServer;
})();
exports.OpenQExpressServer = OpenQExpressServer;

