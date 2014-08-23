declare module OpenQ {
    export function createService(factory: (userName: string) => OpenQ.IRepository): IService;

    export interface IService {
        start(callback: (err: Error) => void ): void;
        createUser(userName: string, token: string, callback: (err: Error, user: IUser) => void ): void;
        getUser(userName: string, token: string, callback: (err: Error, user: IUser) => void ): void;
        deleteUser(userName: string, token: string, callback: (err: Error) => void ): void;
        addPublisher(publisher: OpenQ.IPublisher): void;
        removePublisher(publisher: OpenQ.IPublisher): void;
    }

    export interface IError extends Error
    {
        status: number;
        type: string;
    }

    export interface IUser {
        userName: string;
        queues: IQueue[];
    }

    export interface IQueue {
        queueName: string;
        requestSubscribe(message: OpenQ.IRequestSubscribeMessage, callback: (err: Error) => void ): void;
        subscribe(message: ISubscribeMessage, callback: (err: Error) => void ): void;
        unsubscribe(message: IUnsubscribeMessage, callback: (err: Error) => void ): void;
        write(message: IMessage[], callback: (err: Error) => void ): void;
        read(messageType: string, afterQid?: number, take?: number, callback?: (err: Error, messages: IMessage[]) => void ): void;
        markRead(subscriber: string, token: string, messageType:string, lastReadQid: number, callback: (err: Error) => void ): void;
    }

    export interface IMessage {
        type: string;
        topic?: string;
        qid?: number;
    }

    export interface IResponseMessage {
        type: string;
        name?: string;
        message?: string;
    }

    export interface ISubscribeMessage extends IMessage {
        subscriber: string;
        token: string;
        messagetypes: string[];
        messagesperminute: number;
        fromfirstmessage: boolean;
        exclusive: boolean;
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
        fromfirstmessage: boolean;
    }

    export interface IRepositoryFactory {
        (tableName: string): OpenQ.IRepository;
    }

    export interface IRepository {
        tableName: string;
        write: (topic:string, record: any, expectedSequence: number, callback: (err: Error) => void ) => void;
        ////writeAll: (rangeKey: string, records: any[], expectedSequence: number, callback: (err: Error) => void ) => void;
        read: (topic: string, afterSequence: number, take: number, callback: (err: Error, results: any[]) => void) => void;
        readAll: (topic: string, callback: (err: Error, results: any[]) => void ) => void;
        readLast: (topic: string, callback: (err: Error, result: any) => void ) => void;
        deleteTo: (topic: string, qid: number, callback:(err: Error) => void) => void;
    }

    export interface IPublisher {
        publish(messages: OpenQ.IMessage[], recipient: string): boolean;
    }

    export interface ISubscription {
        subscriber: string;
        token: string;
        messageType: string;
        lastReadQid: number;
        exclusive: boolean;
        qid: number;
        messagesperminute: number;
    }

    interface IMissedMessageRetriever {
        (subscriber: string, callback: (err: Error, missedMessages: OpenQ.IMessage[]) => void ): void;
    }
}