/// <reference path="common.d.ts" />

var app: express = require("express");
export function createServer(port: number = null): IOpenQServer {
    port = port || 8000;
    return new OpenQServer(process.env.COMPUTERNAME + ':' + process.pid, port);
}


class OpenQServer implements IOpenQServer {

    constructor(peerId: string, port: number) {
        
        app.createServer();
    }

    send(inbox: string, message: string) {
        console.log("Sending " + message + " to " + inbox);
    }
}