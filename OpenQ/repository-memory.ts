/// <reference path="types/common.d.ts" />


export function createRepository(tableName: string): OpenQ.IRepository  {
    return new MemoryRepository(tableName);
}


class MemoryRepository implements OpenQ.IRepository {
    typeQueues = {
    };

    constructor(public tableName: string) {
    }

    read(type: string, afterQid: number, take: number, callback: (results: OpenQ.IMessage[]) => void ) {
        var q = this.getOrCreateQueue(type, false);
        var fromQid = afterQid + 1;
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

            if (!q.write(m, expectedQid, callback)) {
                return;
            }
        }

        callback(null);
    }
   
    getOrCreateQueue(type: string, save: bool): MemoryQueue {
        var q: MemoryQueue = this.typeQueues[type];
        if (!q) {
            q = new MemoryQueue(type);
            if (save) {
                this.typeQueues[type] = q;
            }
        }

        return q;
    }
}

class MemoryQueue {
    messages: OpenQ.IMessage[] = [];
    constructor(public type: string) {
    }

    write(message: OpenQ.IMessage, expectedQid: number, callback: (err: any) => void ):bool {
        if (expectedQid != -1) {
            if (this.messages.length != expectedQid) {
                var err = { message: 'Expected next qid to be ' + expectedQid + ' but was ' + this.messages.length, name: 'ExpectedQidViolation' };
                callback(err);
                return false;
            }
        }

        message.qid = this.messages.length;
        this.messages.push(message);
        return true;
    }
}
