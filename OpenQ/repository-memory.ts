/// <reference path="types/common.d.ts" />


export function createRepository(tableName: string): OpenQ.IRepository  {
    return new MemoryRepository(tableName);
}

interface IQueue {
    type: string;
    messages: OpenQ.IMessage[];
}

class MemoryRepository implements OpenQ.IRepository {
    typeQueues = {
    };

    constructor(public tableName: string) {
    }

    read(type: string, fromQid: number, take: number, callback: (results: OpenQ.IMessage[]) => void ) {
        var q: IQueue = this.getOrCreateQueue(type, false);
        var finalTake = Math.min(q.messages.length - fromQid, fromQid + take);

        var m = q.messages.slice(fromQid, finalTake);
        callback(m);
    }

    write(messages: OpenQ.IMessage[], expectedQid: number, callback: (err: any) => void ) {
        if (messages.length == 0) {
            callback(null);
            return;
        }

        var q = this.getOrCreateQueue(messages[0].type, true);
        for (var i = 0; i < messages.length; i++) {
            var m = messages[i];
            
            if (q.type != m.type) {
                q = this.getOrCreateQueue(q.type, true);
            }

            if (expectedQid != -1) {
                if (q.messages.length != expectedQid) {
                    callback(new Error('Expected next qid to be ' + expectedQid + ' but was ' + q.messages.length));
                    return;
                }
            }

            m.qid = q.messages.length;
            q.messages.push(m);
        }

        callback(null);
    }

   
    getOrCreateQueue(type: string, save: bool): IQueue {
        var q: IQueue = this.typeQueues[type];
        if (!q) {
            q = { type: type, messages: [] };
            if (save) {
                this.typeQueues[type] = q;
            }
        }

        return q;
    }
}