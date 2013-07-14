/// <reference path="types/common.d.ts" />
var openq = require("./openq");
var memoryRepo = require("./repository-memory");
var express = require("express");

export function listen(port: number = null) {
    port = port || 8000;
    var s = new OpenQExpressServer();
    s.listen('localhost', port);
    return s;
}

export class OpenQExpressServer {
    private app: ExpressApplication;
    private service: OpenQ.IService;
    public instanceId: string;

    constructor() {
        this.instanceId = process.env.COMPUTERNAME + ':' + process.pid;
        this.service = openq.createService(memoryRepo.createRepository);
        this.intializeWebServer();
        this.initializePublishers();
    }

    public listen(hostName: string, port: number) {
        console.log('OpenQ server listening on http://' + hostName + ':' + port + '/')
        this.app.listen(port);
    }
    
    private intializeWebServer() {
        this.app = express();
        this.app.use(express.bodyParser());
        this.app.use('/', express.static(__dirname + '/content'));
        this.app.post('/signup', this.signup);

        this.app.get('/:username/:queue', this.getMessages);
        this.app.post('/:username/:queue', this.sendMessage);
    }

    private initializePublishers() {
    }

    private signupForm(req: ExpressServerRequest, res: ExpressServerResponse) {
        res.send('<html><body><h1>Signup to OpenQ</h1><form action="/signup" method="post"><div><label>Username</label><input type="text" name="username"></div><div><label>Password</label><input type="password" name="password"></div><input type="submit"></form></h1></body></html>');
    }

    private signup(req: ExpressServerRequest, res: ExpressServerResponse) {
        this.service.createUser(req.body.username, req.body.password, (err, user) => {
            this.end(err, res);
        });
    }

    private end(error: any, res: ExpressServerResponse) {
        if (error) {
            this.failed(error, res);
            return;
        }

        this.success(res);
    }

    private failed(error: any, res: ExpressServerResponse) {
        error.type = "urn:openq/failed";
        res.format({
            html: '<html><body><h1>Uh oh!</h1><pre>' + error + '</pre></body></html>',
            json: error
        });
    }

    private success(res: ExpressServerResponse) {
        res.format({
            html: '<html><body><h1>Well done!</h1></body></html>',
            json: { "type":"urn:openq/success" }
        });
    }

    private sendMessage(req: ExpressServerRequest, res: ExpressServerResponse) {
        var username = req.param('username');
        var queue = req.param('queue');
        var token = req.header('auth-token');
        this.service.getUser(username, '', (err, user) => {
            if (err) {
                res.send(400, err);
                return;
            }

            user.queues[queue].write(req.body, (err:any) => {
                this.end(err, res);
            });
        })
    }

    private getMessages(req: ExpressServerRequest, res: ExpressServerResponse) {
        var username = req.param('username');
        var queue = req.param('queue');
        var token = req.header('auth-token');
    }
}