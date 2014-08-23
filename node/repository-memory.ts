/// <reference path="types/common.d.ts" />

export function createRepository(tableName: string): OpenQ.IRepository  {
    return new MemoryRepository(tableName);
}

class MemoryRepository implements OpenQ.IRepository {
    typeQueues = {
    };

    constructor(public tableName: string) {
    }

    read(topic: string, afterQid: number, take: number, callback: (err: Error, results: any[]) => void ) {
        var q = this.getOrCreateQueue(topic, false);
        q.read(afterQid, take, callback);
    }

    readLast(topic: string, callback: (err: Error, results: any) => void ) {
        var q = this.getOrCreateQueue(topic, false);
        this.read(topic, q.messages.length - 2, 1, (err, results) => callback(err, results[0]))
    }

    readAll(topic: string, callback: (err: Error, results: any[]) => void ) {
        this.read(topic, -1, -1, callback);
    }

    write(topic: string, record: any, expectedQid: number, callback: (err: Error) => void ) {
        if (!record) {
            callback(null);
            return;
        }

        var q = this.getOrCreateQueue(topic, true);
        if (!q.write(record, expectedQid, callback)) {
            return;
        }

        callback(null);
    }
   
    deleteTo(topic: string, qid: number, callback: (err: Error) => void ) {
        var q = this.getOrCreateQueue(topic, false);
        if (!q) {
            callback({ message: 'Repository not found', name: 'RepositoryNotFound' });
            return;
        }

        if (qid === -1) {
            delete this.typeQueues[this.tableName + "/" + topic];
        } else {
            q.deleteTo(qid);
        }

        callback(null);
    }

    getOrCreateQueue(topic: string, save: boolean): MemoryQueue {
        var rangeKey = this.tableName + "/" + topic;
        var q: MemoryQueue = this.typeQueues[rangeKey];
        if (!q) {
            q = new MemoryQueue(rangeKey);
            if (save) {
                this.typeQueues[rangeKey] = q;
            }
        }

        return q;
    }
}

class MemoryQueue {
    messages: OpenQ.IMessage[] = [];
    constructor(public rangeKey: string) {
    }

    write(message: OpenQ.IMessage, expectedQid: number, callback: (err: Error) => void ):boolean {
        if (expectedQid !== -1) {
            if (this.messages.length !== expectedQid) {
                var err = { message: 'Expected next qid to be ' + expectedQid + ' but was ' + this.messages.length, name: 'ExpectedQidViolation' };
                callback(err);
                return false;
            }
        }

        message.qid = this.messages.length;
        this.messages.push(message);
        return true;
    }

    deleteTo(qid: number) {
        this.messages = this.messages.filter(m => m.qid >= qid);
    }

    read(afterQid: number, take: number, callback: (err: Error, results: any[]) => void) {
        var fromQid = afterQid + 1;
        if (take === -1) {
            take = this.messages.length;
        }

        var finalTake = Math.min(this.messages.length - fromQid, fromQid + take);
        var m = this.messages.slice(fromQid, finalTake);
        callback(null, m);
    }
}
