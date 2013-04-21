/// <reference path="common.d.ts" />

export var MessageTypes = {
    "success": "urn:simpleq/success",
    "failed": "urn:simpleq/failed"
};

var express: Express = require("express");

export function listen(port: number = null) {
    port = port || 8000;
    return new OpenQExpressServer(process.env.COMPUTERNAME + ':' + process.pid, port);
}


export class OpenQExpressServer {
    private app: Express.IApplication;
    private server = new Server();

    constructor(peerId: string, port: number) {
        this.app = express();
        this.app.get('/', this.signupForm);
        this.app.post('/signup', this.signup);
        this.app.post('/:username/inbox', this.sendMessage);
        this.app.get('/:username/inbox', this.getMessages);
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

export class Server implements OpenQ.IServer {
    private users: User[];

    createUser(username: string, token?: string, callback?: (err:any, user: OpenQ.IUser) => void ): void {
        if (this.users[username]) {
            if (callback) {
                callback(new Error('User already exists'), null);
            }

            return;
        }

        var u = new User(username, token);
        this.users[username] = u;
        if (callback) {
            callback(null, u);
        }
    }

    getUser(username: string, token: string, callback: (err:any, user: OpenQ.IUser) => void ): void {
        if (!this.users[username]) {
            callback(new Error('User does not exist'), null);
            return;
        }

        callback(null, this.users[username]);
    }

    deleteUser(username: string, token: string, callback?: (err: any) => void ): void {
        delete this.users[username];

        if (callback) {
            callback(null);
        }
    }
}

class User implements OpenQ.IUser {
    inbox = new Inbox();
    outbox = new Outbox();

    constructor(public username: string, public token: string) {
        this.token = this.token || '';
    }

    requestSubscribe(message: OpenQ.IRequestSubscribeMessage, callback?: (err: any) => void ): void {

    }
}

class Inbox implements OpenQ.IInbox {
    send(message: OpenQ.IMessage[], callback?: (err: any) => void ): void {
    }
    poll(token: string, afterQid?: number, take?: number, callback?: (err: any, messages: OpenQ.IMessage[]) => void ): void { }

    processedTo(qid: number, callback?: (err: any) => void ) { }
}

class Outbox implements OpenQ.IOutbox  {
    subscribe(message: OpenQ.ISubscribeMessage, callback?: (err: any) => void ): void { }
    unsubscribe(message: OpenQ.IUnsubscribeMessage, callback?: (err: any) => void ) { }
    broadcast(message: OpenQ.IMessage[], callback?: (err: any) => void ): void { }
    poll(afterQid?: number, take?: number, callback?: (err: any, messages: OpenQ.IMessage[]) => void ): void { }
    processedTo(subscriber: string, token: string, qid: number, callback?: (err: any) => void ) { }
}