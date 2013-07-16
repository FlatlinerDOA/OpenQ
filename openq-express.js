var openq = require("./openq");
var memoryRepo = require("./repository-memory");
var express = require("express");
var crypto = require("crypto");

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
        console.log('OpenQ web server listening on http://' + hostName + ':' + port + '/');
        this.app.listen(port);
    };

    OpenQExpressServer.prototype.intializeWebServer = function () {
        this.app = express();
        this.app.use(express.bodyParser());
        this.app.use('/', express.static(__dirname + '/content'));
        this.app.post('/api/signup', this.signup.bind(this));
        this.app.get('/api/:username/:queue', this.getMessages);
        this.app.post('/api/:username/:queue', this.sendMessage);
    };

    OpenQExpressServer.prototype.initializePublishers = function () {
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
        res.status(error.status);
        res.format({
            text: function () {
                return res.send(error.message);
            },
            html: function () {
                return res.send('<html><body><h1>Uh oh!</h1><pre>' + error.message + '</pre></body></html>');
            },
            json: function () {
                return res.send(error);
            }
        });
    };

    OpenQExpressServer.prototype.success = function (res) {
        res.format({
            text: function () {
                return res.send('Well Done!');
            },
            html: function () {
                return res.send('<html><body><h1>Well done!</h1></body></html>');
            },
            json: function () {
                return res.send({ "type": "urn:openq/success" });
            }
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

