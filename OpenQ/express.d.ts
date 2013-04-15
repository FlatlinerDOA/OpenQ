declare module Express {
    export function (): IApplication;

    interface IApplication {
        set (name: string, value:any): void;
        get (name: string): any;
        enable(name: string): void;
        disable(name: string): void;
        enabled(name: string): bool;
        disabled(name: string): bool;
        render(view: string, callback: (err, html: string) => void ): void;
        render(view: string, data: any, callback: (err, html: string) => void ): void;
        engine(name: string, engine: any): void;
        listen(port: number): void;

        param(routeParam: string, callback: () => void ): void;
        param(callbackSelector: (name:string, fn:any) => () => void ): void;

        /* HTTP VERBS */
        get(path: string, handler: (request: IRequest, response: IResponse) => void): void;
        get (path: RegExp, handler: (request: IRequest, response: IResponse) => void): void;
        put (path: string, handler: (request: IRequest, response: IResponse) => void): void;
        put(path: RegExp, handler: (request: IRequest, response: IResponse) => void): void;
        post (path: string, handler: (request: IRequest, response: IResponse) => void): void;
        post(path: RegExp, handler: (request: IRequest, response: IResponse) => void): void;
        delete (path: string, handler: (request: IRequest, response: IResponse) => void): void;
        delete (path: RegExp, handler: (request: IRequest, response: IResponse) => void): void;


        routes: {
            get?: IRoute[];
            delete?: IRoute[];
            put?: IRoute[];
            post?: IRoute[];
        };
    }

    interface IRoute {
        path: string;
        method: string;
        callbacks: any;
        keys: any[];
        regexp: RegExp;
    }

    interface IRequest {
    }

    interface IResponse {
    }
}

