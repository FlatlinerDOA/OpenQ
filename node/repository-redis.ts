// Uses Redis Lists for storage of the queues -> http://redis.io/commands#list (unsure if this is the best technique but will do for v1)
// See http://www.nodejs.net/a/20130128/105909.html for Redis samples

/// <reference path="types/common.d.ts" />
/// <reference path="types/node_redis.d.ts" />
var redis = require("redis");
var redisClient: redis.RedisClient = null;

export function createRepository(tableName: string): OpenQ.IRepository {
    if (!redisClient) {
        var port = 6379;
        var host = "localhost";
        var options: redis.RedisOptions = {
            enable_offline_queue: false
        };
        redisClient = redis.createClient(port, host, {});
        // TODO: redisClient.auth("password");
    }

    return new RedisRepository(tableName, redisClient);
}

/** Implementation of the standard OpenQ repository using Redis */
class RedisRepository implements OpenQ.IRepository {
    typeQueues = {
    };

    constructor(public tableName: string, private client: redis.RedisClient) {
    }

    read(topic: string, afterQid: number, take: number, callback: (err: Error, results: any[]) => void) {
        this.getOrCreateQueue(topic, false, (err, queue) => {
            if (err) {
                callback(err, null);
                return;
            }

            queue.read(afterQid + 1, afterQid + take, callback);
        });
    }

    readLast(topic: string, callback: (err: Error, results: any) => void ) {
        this.read(topic, -1, -1, (err, results) => callback(err, results[0]));
    }

    /** Note this is for short queues only, as it is limited to 1000 rows max */
    readAll(topic: string, callback: (err: Error, results: any[]) => void ) {
        this.getOrCreateQueue(topic, false, (err, queue) => {
            if (err) {
                callback(err, null);
                return;
            }

            queue.getQueueLength((err, length) => {
                if (err) {
                    callback(err, null);
                    return;
                }

                queue.read(0, length, callback);
            });
        });
    }

    write(topic: string, record: any, expectedQid: number, callback: (err: Error) => void ) {
        if (!record) {
            callback(null);
            return;
        }

        this.getOrCreateQueue(topic, true, (err, q) => {
            if (err) {
                callback(err);
                return;
            }

            q.write(record, expectedQid, callback);
        });
    }
    
    deleteTo(topic: string, qid: number, callback: (err: Error) => void ) {
        this.getOrCreateQueue(topic, false, (err, q) => {
            if (err || !q) {
                callback({ message: 'Repository not found', name: 'RepositoryNotFound' });
                return;
            }

            q.deleteTo(qid, (err) => {
                if (err) {
                    callback(err);
                    return;

                    if (qid === -1) {
                        var fullRangeKey = this.tableName + "/" + topic;
                        delete this.typeQueues[fullRangeKey];
                    }

                    callback(null);
                }
            });
        });
    }

    getOrCreateQueue(topic: string, save: boolean, callback: (err: Error, queue: RedisHashQueue ) => void):void {
        var fullRangeKey = this.tableName + "/" + topic;
        var q: RedisHashQueue = this.typeQueues[fullRangeKey];
        if (!q) {
            q = new RedisHashQueue(fullRangeKey, this.client);
            if (save) {
                this.typeQueues[fullRangeKey] = q;
            }
        }

        callback(null, q);
    }
}

/**
Iteration 2 - Using redis hashes [ hlen, hmget, hsetnx ] where the hash is a combination of range key and the field is the qid e.g. hsetnx "urn:myrangekey" "1" "{ content: 'blah' type: 'blah' }"
*/
class RedisHashQueue {
    constructor(public rangeKey: string, private client: redis.RedisClient) {
    }

    create(callback: (err: Error) => void) {
    }

    getQueueLength(callback: (err: Error, length: number) => void) {
        this.client.hlen(this.rangeKey, callback);
    }

    write(message: OpenQ.IMessage, expectedQid: number, callback: (err: Error) => void) {
        console.log('RedisHashQueue.write', message, expectedQid);
        this.getQueueLength((err: Error, queueLength: number) => {
            console.log('RedisHashQueue.write.getQueueLength', err, queueLength);
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

            var args = [this.rangeKey, message.qid, JSON.stringify(message)];
            this.client.hsetnx(args, (err: Error) => {
                console.log('RedisHashQueue.hsetnx', args, err);
                if (err) {
                    callback(err);
                    return;
                }

                callback(null);
            });
        });
    }

    deleteTo(qid: number, callback: (err: Error) => void) {
        this.client.ltrim([this.rangeKey, qid, -1], callback);
    }

    read(start: number, stop: number, callback: (err: Error, results: any[]) => void) {
        var args = [this.rangeKey];
        for (var i = start; i <= stop; i++) {
            args.push('' + i);
        }

        this.client.hmget(args, (err: Error, results: string[]) => {
            if (err) {
                callback(err, null);
                return;
            }

            var messages = null;
            if (results !== null) {
                try {
                    messages = results.filter(x => x !== null).map(x => JSON.parse(x));
                } catch (parseError) {
                    callback(parseError, null);
                    return;
                }
            }

            callback(null, messages || []);
        });
    }
}