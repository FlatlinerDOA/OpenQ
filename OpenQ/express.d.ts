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
        listen(port?: number): void;

        param(routeParam: string, callback: () => void ): void;
        param(callbackSelector: (name:string, fn:any) => () => void ): void;

        configure(name: string, callback: () => void ): void;
        configure(callback: () => void ): void;

        use(callback: (request: IRequest, response: IResponse, next: () => void ) => void ): void;
        use(path: string, callback: (request: IRequest, response: IResponse, next: () => void) => void ): void;


        /* HTTP VERBS */
        get(path: string, handler: (request: IRequest, response: IResponse) => void ): void;
        get(path: RegExp, handler: (request: IRequest, response: IResponse) => void): void;
        put(path: string, handler: (request: IRequest, response: IResponse) => void): void;
        put(path: RegExp, handler: (request: IRequest, response: IResponse) => void): void;
        post(path: string, handler: (request: IRequest, response: IResponse) => void): void;
        post(path: RegExp, handler: (request: IRequest, response: IResponse) => void): void;
        delete(path: string, handler: (request: IRequest, response: IResponse) => void): void;
        delete(path: RegExp, handler: (request: IRequest, response: IResponse) => void): void;
        head(path: string, handler: (request: IRequest, response: IResponse) => void ): void;
        head(path: RegExp, handler: (request: IRequest, response: IResponse) => void ): void;

        all(path: string, handler: (request: IRequest, response: IResponse) => void ): void;
        all(path: RegExp, handler: (request: IRequest, response: IResponse) => void ): void;

        locals: any;

        render(view: string, options: any, callback: (err, html) => void ): void;
        render(view: string, callback: (err, html) => void ): void;

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
        params: any;
        query: any;
        body: any;
        files: IFile[];
        param: (name: string) => string;
        route: IRoute;
        cookies: any;
        signedCookies: any;

        get: (header: string) => string;
        header: (header: string) => string;

        accepts: (contentTypes: any) => string;
        accepted: (contentTypes: any) => IAccepted[];
        is(type: string): bool;
        ip: string;
        ips: string;
        path: string;
        host: string;
        fresh: bool;
        stale: bool;
        xhr: bool;
        protocol: string;
        secure: bool;
        subdomains: string[];
        originalUrl: string;
        acceptedLanguages: IAccepted[];
        acceptedCharsets: IAccepted[];

        acceptsLanguage(language: string): bool;
    }

    interface IResponse {
        status(statusCode: number): IResponse;
        set (header: string, value?: any): void;
        header(header: string, value?: any): void;
        get (header: string): void;
        cookie(name: string, value: any, options?: any): void;
        clearCookie(name: string, options?: any): void;
        redirect(statusCode: number, url: string): void;
        location(path: string): void;
        charset: string;
        send(body: any): void;
        send(statusCode: number, body?: any): void;
        json(body: any): void;
        json(statusCode: number, body?: any): void;
        jsonp(body: any): void;
        jsonp(statusCode: number, body?: any): void;

        type(contentType: string): void;
        format(object: any);
        attachment(): void;
        attachment(fileName: string): void;
        sendfile(path: string, options?: any, callback?: () => void): void;
        download(path: string, options?: any, callback?: () => void ): void;
        links(links: any);
        locals: any;
        render(view: string, callback: () => void ): void;
        render(view: string, locals: any, callback: () => void ): void;
    }

    interface IAccepted {
        value: string;
        quality: number;
        type: string;
        subtype: string;
    }

    interface IFile {
        size: number;
        path: string;
        name: string;
        type: string;
        hash: bool;
        lastModifiedDate: Date;
        _writeStream:
        {
            path: string;
            fd: number;
            writable: bool;
            flags: string;
            encoding: string;
            mode: number;
            bytesWritten: number;
            busy: bool;
            _queue: any[];
            _open: () => any;
            drainable: bool;
        };
        length: () => number;
        filename: () => string;
        mime: () => string;
    }
}

