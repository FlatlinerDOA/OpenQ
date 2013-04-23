/// <reference path="types/common.d.ts" />


export function createRepository(tableName: string): OpenQ.IRepository  {
    return new MemoryRepository(tableName);
}

class MemoryRepository implements OpenQ.IRepository {
    typeQueues = {
    };

    constructor(public tableName: string) {
    }

    read(type: string, version: number, take: number, callback: (results: OpenQ.IMessage[]) => void ) {
        var q = this.typeQueues[type] || { messages: [] };
        if (q) {
            callback(q.messages || []);
        }
    }

    write(messages: OpenQ.IMessage[], expectedVersion: number, callback: (err: any) => void ) {
        for (var i = 0; i < messages.length; i++) {
            var m = messages[i];
            var q = this.typeQueues[m.type];
            if (!q) {
                q = { messages: [] };
                this.typeQueues[m.type] = q;
            }

            if (expectedVersion != -1) {
                if (q.messages.length != expectedVersion) {
                    callback(new Error('Expected version to be ' + expectedVersion + ' but was ' + q.messages.length));
                    return;
                }
            }

            m.qid = q.messages.length;
            q.messages.push(m);
        }

        callback(null);
    }
}