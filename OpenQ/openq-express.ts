/// <reference path="types/common.d.ts" />
/// <reference path="./openq.ts" />

export var MessageTypes = {
    "success": "urn:simpleq/success",
    "failed": "urn:simpleq/failed"
};

var express: Express = require("express");
var openq = require("./openq.ts");

export function listen(port: number = null) {
    port = port || 8000;
    return new OpenQExpressServer(process.env.COMPUTERNAME + ':' + process.pid, port);
}

export class OpenQExpressServer {
    private app: Express.IApplication;
    private server: OpenQ.IServer = openq.Server();

    constructor(peerId: string, port: number) {
        this.app = express();
        this.app.use(express.bodyParser());

        this.app.get('/', this.signupForm);
        this.app.post('/signup', this.signup);

        this.app.get('/:username/inbox', this.getMessages);
        this.app.post('/:username/inbox', this.sendMessage);
        console.log('OpenQ server listening on http://localhost:' + port + '/')
        this.app.listen(port);
    }

    private signupForm(req: Express.IRequest, res: Express.IResponse) {
        res.send('<html><body><h1>Signup to OpenQ</h1><form action="/signup" method="post"><div><label>Username</label><input type="text" name="username"></div><div><label>Password</label><input type="password" name="password"></div><input type="submit"></form></h1></body></html>');
    }

    private signup(req: Express.IRequest, res: Express.IResponse) {
        this.server.createUser(req.body.username, req.body.password, (err, user) => {
            this.end(err, res);
        });
    }

    private end(error: any, res: Express.IResponse) {
        if (error) {
            this.failed(error, res);
            return;
        }

        this.success(res);
    }

    private failed(error: any, res: Express.IResponse) {
        error.type = "urn:simpleq/failed";
        res.format({
            html: '<html><body><h1>Uh oh!</h1><pre>' + error + '</pre></body></html>',
            json: error
        });
    }

    private success(res: Express.IResponse) {
        res.format({
            html: '<html><body><h1>Well done!</h1></body></html>',
            json: '{ "type":"urn:simpleq/success" }'
        });
    }

    private sendMessage(req: Express.IRequest, res: Express.IResponse) {
        var username = req.param('username');
        var token = req.secure;
        this.server.getUser(username, '', (err, user) => {
            if (err) {
                res.send(400, err.message);
                return;
            }

            user.inbox.send(req.body, (err:any) => {
                this.end(err, res);
            });
        })
    }

    private getMessages(req: Express.IRequest, res: Express.IResponse) {
    }
}