/// <reference path="common.d.ts" />

var express: Express = require("express");
var app = express();

export function createServer(port: number = null): IOpenQServer {
    port = port || 8000;
    return new OpenQServer(process.env.COMPUTERNAME + ':' + process.pid, port);
}


class OpenQServer implements IOpenQServer {
    constructor(peerId: string, port: number) {
        app.listen(port);
    }

    send(inbox: string, message: string) : Rx.IObservable {
        console.log("Sending " + message + " to " + inbox);
        return null;
    }
}