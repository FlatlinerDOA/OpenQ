/// <reference path="node_modules/typescript-require/typings/node.d.ts" />
/// <reference path="express.d.ts" />
/// <reference path="rx.d.ts" />

interface IOpenQServer {
    send(inbox: string, message: string): void;
}