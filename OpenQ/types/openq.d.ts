/// <reference path="rx.d.ts" />
module OpenQ {
    export function createService(factory: (userName: string) => OpenQ.IRepository): IService;

    export interface IService {
        start(callback: (err: Error) => void ): void;
        createUser(userName: string, token: string, callback?: (err: Error, user: IUser) => void ): void;
        getUser(userName: string, token: string, callback: (err: Error, user: IUser) => void ): void;
        deleteUser(userName: string, token: string, callback?: (err: Error) => void ): void;
    }

    export interface IUser {
        userName: string;

        inbox: IQueue;
        outbox: IQueue;
    }

    export interface IQueue {
        requestSubscribe(message: OpenQ.IRequestSubscribeMessage, callback?: (err: Error) => void ): void;
        subscribe(message: ISubscribeMessage, callback?: (err: Error) => void ): void;
        unsubscribe(message: IUnsubscribeMessage, callback?: (err: Error) => void ): void;
        write(message: IMessage[], callback?: (err: Error) => void ): void;
        read(messageType: string, afterQid?: number, take?: number, callback?: (err: Error, messages: IMessage[]) => void ): void;
        markRead(subscriber: string, token: string, messageType:string, lastReadQid: number, callback?: (err: Error) => void ): void;
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
        exclusive: bool;
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

    export interface IRepositoryFactory {
        (tableName: string): OpenQ.IRepository;
    }

    export interface IRepository {
        tableName: string;
        write: (rangeKey:string, record: any, expectedSequence: number, callback: (err: Error) => void ) => void;
        ////writeAll: (rangeKey: string, records: any[], expectedSequence: number, callback: (err: Error) => void ) => void;
        read: (rangeKey: string, afterSequence: number, take: number, callback: (err: Error, results: any[]) => void) => void;
        readAll: (rangeKey: string, callback: (err: Error, results: any[]) => void ) => void;
        readLast: (rangeKey: string, callback: (err: Error, result: any) => void ) => void;
    }

    export interface IPublisher {
        publish(messages: OpenQ.IMessage[], recipient: string): void;
    }

    export interface ISubscription {
        subscriber: string;
        token: string;
        messageType: string;
        lastReadQid: number;
        exclusive: bool;
        qid: number;
    }
}