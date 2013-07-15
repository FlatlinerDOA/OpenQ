/// <reference path="types/common.d.ts" />
var openq = require("./openq");
var memoryRepo = require("./repository-memory");
var express = require("express");
var crypto = require("crypto");

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
        console.log('OpenQ web server listening on http://' + hostName + ':' + port + '/');
        this.app.listen(port);
    }
    
    private intializeWebServer() {
        this.app = express();
        this.app.use(express.bodyParser());
        this.app.use('/', express.static(__dirname + '/content'));
        this.app.post('/api/signup', this.signup.bind(this));
        this.app.get('/api/:username/:queue', this.getMessages);
        this.app.post('/api/:username/:queue', this.sendMessage);
    }

    private initializePublishers() {
    }

    private signup(req: ExpressServerRequest, res: ExpressServerResponse) {
        this.service.createUser(req.body.username, req.body.password, (err: OpenQ.IError, user) => {
            this.end(err, res);
        });
    }

    private end(error: OpenQ.IError, res: ExpressServerResponse) {
        if (error) {
            this.failed(error, res);
            return;
        }
        this.success(res);
    }

    private failed(error: OpenQ.IError, res: ExpressServerResponse) {
        error.type = "urn:openq/failed";
        res.status(error.status);
        res.format({
            text: () => res.send('error'),
            html: () => res.send('<html><body><h1>Uh oh!</h1><pre>' + error + '</pre></body></html>'),
            json: () => res.send(error)
        });
        
    }

    private success(res: ExpressServerResponse) {
        res.format({
            text: () => res.send('Well Done!'),
            html: () => res.send('<html><body><h1>Well done!</h1></body></html>'),
            json: () => res.send({ "type": "urn:openq/success" })
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