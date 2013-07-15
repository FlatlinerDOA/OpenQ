// Uses Redis Lists for storage of the queues -> http://redis.io/commands#list (unsure if this is the best technique but will do for v1)
// See http://www.nodejs.net/a/20130128/105909.html for Redis samples

/// <reference path="types/common.d.ts" />
/// <reference path="types/node_redis.d.ts" />
var _redis = require("redis");
var redisClient: redis.RedisClient = null;

export function createRepository(tableName: string): OpenQ.IRepository {
    if (!redisClient) {
        redisClient = _redis.createClient();
    }

    return new RedisRepository(tableName, redisClient);
}

/** Implementation of the standard OpenQ repository using Redis */
class RedisRepository implements OpenQ.IRepository {
    typeQueues = {
    };

    constructor(public tableName: string, private client: redis.RedisClient) {
    }

    read(rangeKey: string, afterQid: number, take: number, callback: (err: Error, results: any[]) => void ) {
        var q = this.getOrCreateQueue(rangeKey, false);
        q.read(afterQid, afterQid + take, callback);
    }

    readLast(rangeKey: string, callback: (err: Error, results: any) => void ) {
        var q = this.getOrCreateQueue(rangeKey, false);
        this.read(rangeKey, -1, -1, (err, results) => callback(err, results[0]))
    }

    /** Note this is for Short queues only, as it is limited to 10000 rows max */
    readAll(rangeKey: string, callback: (err: Error, results: any[]) => void ) {
        this.read(rangeKey, 0, 10000, callback);
    }

    write(rangeKey: string, record: any, expectedQid: number, callback: (err: Error) => void ) {
        if (!record) {
            callback(null);
            return;
        }

        var q = this.getOrCreateQueue(rangeKey, true);
        q.write(record, expectedQid, callback);
    }
    
    deleteTo(rangeKey: string, qid: number, callback: (err: Error) => void ) {
        var q = this.getOrCreateQueue(rangeKey, false);
        if (!q) {
            callback({ message: 'Repository not found', name: 'RepositoryNotFound' });
            return;
        }

        q.deleteTo(qid, (err) => {
            if (err) {
                callback(err);
                return;

                if (qid === -1) {
                    delete this.typeQueues[rangeKey];
                } 

                callback(null);
            }
        });
    }

    getOrCreateQueue(rangeKey: string, save: bool): RedisQueue {
        var q: RedisQueue = this.typeQueues[rangeKey];
        if (!q) {
            q = new RedisQueue(rangeKey, this.client);
            if (save) {
                this.typeQueues[rangeKey] = q;
            }
        }

        return q;
    }
}

class RedisQueue {
    constructor(public rangeKey: string, private client: any) {
    }

    getQueueLength(callback: (err: Error, length: number) => void ) {
        this.client.llen(this.rangeKey, callback);
    } 

    write(message: OpenQ.IMessage, expectedQid: number, callback: (err: Error) => void ) {
        this.getQueueLength((err: Error, queueLength: number) => {
            if (err) {
                callback(err);
                return;
            }

            if (expectedQid !== -1) {
                if (queueLength !== expectedQid) {
                    var err = { message: 'Expected next qid to be ' + expectedQid + ' but was ' + queueLength, name: 'ExpectedQidViolation' };
                    callback(err);
                    return;
                }
            }

            message.qid = queueLength;
            
            this.client.rpush(this.rangeKey, JSON.stringify(message), (err:Error, newQueueLength:number) => {
                if (err) {
                    callback(err);
                    return;
                } 

                callback(null);
            });
        
        });
    }

    deleteTo(qid: number, callback: (err: Error) => void ) {
        this.client.ltrim(this.rangeKey, qid, -1, callback);
    }

    read(start: number, stop: number, callback: (err: Error, results: any[]) => void ) {
        this.client.lrange(this.rangeKey, start, stop, (err: Error, results: any) => {
            if (err) {
                callback(err, null);
                return;
            }

            var result;
            try {
                result = JSON.parse(results);
            } catch (parseError) {
                callback(parseError, null);
                return;
            }

            callback(null, result);
        });
        ////var fromQid = afterQid + 1;
        ////if (take === -1) {
        ////    take = q.messages.length;
        ////}

        ////var finalTake = Math.min(q.messages.length - fromQid, fromQid + take);
        ////var m = q.messages.slice(fromQid, finalTake);
        ////callback(null, m);
    }
}
