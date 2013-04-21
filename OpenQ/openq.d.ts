module OpenQ {
    export interface IServer {
        createUser(username: string, token: string, callback?: (err:any, user: IUser) => void ): void;
        getUser(username: string, token: string, callback: (err: any, user: IUser) => void ): void;
        deleteUser(username: string, token: string, callback?: (err: any) => void ): void;
    }

    export interface IUser {
        username: string;

        inbox: IInbox;
        outbox: IOutbox;

        requestSubscribe(message: IRequestSubscribeMessage, callback?: (err: any) => void ): void;
    }

    export interface IInbox {
        send(message: IMessage[], callback?: (err: any) => void ): void;
        poll(token: string, afterQid?: number, take?: number, callback?: (err: any, messages: IMessage[]) => void ): void;
        processedTo(qid: number, callback?: (err: any) => void );
    }

    export interface IOutbox {
        subscribe(message: ISubscribeMessage, callback?: (err: any) => void ): void;
        unsubscribe(message: IUnsubscribeMessage, callback?: (err: any) => void );
        broadcast(message: IMessage[], callback?: (err: any) => void ): void;
        poll(afterQid?: number, take?: number, callback?: (err: any, messages: IMessage[]) => void ): void;
        processedTo(subscriber: string, token: string, qid: number, callback?: (err: any) => void );
    }

    export interface IMessage {
        type: string;
        qid?: number;
    }

    export interface IResponse {
        success: bool;
        errorcode?: string;
        error?: string;
    }

    export interface ISubscribeMessage extends IMessage {
        subscriber: string;
        token: string;
        messagetypes: string[];
        messagesperminute: number;
        fromfirstmessage: bool;
    }

    export interface IUnsubscribeMessage extends IMessage {
        subscriber: string;
        token: string;
        messagetypes: string[];
    }

    export interface IRequestSubscribeMessage extends IMessage {
        subscribeto: string;
        withtoken: string;
        messagetypes: string[];
        fromfirstmessage: bool;
    }
}