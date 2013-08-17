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

    read(rangeKey: string, afterQid: number, take: number, callback: (err: Error, results: any[]) => void) {
        console.log('RedisRepository.read', rangeKey, afterQid, take);

        this.getOrCreateQueue(rangeKey, false, (err, queue) => {
            console.log('RedisRepository.getOrCreateQueue', rangeKey, err, !!queue);
            if (err) {
                callback(err, null);
                return;
            }

            queue.read(afterQid + 1, afterQid + take, callback);
        });
    }

    readLast(rangeKey: string, callback: (err: Error, results: any) => void ) {
        this.read(rangeKey, -1, -1, (err, results) => callback(err, results[0]));
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

        this.getOrCreateQueue(rangeKey, true, (err, q) => {
            if (err) {
                callback(err);
                return;
            }

            q.write(record, expectedQid, callback);
        });
    }
    
    deleteTo(rangeKey: string, qid: number, callback: (err: Error) => void ) {
        this.getOrCreateQueue(rangeKey, false, (err, q) => {
            if (err || !q) {
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
        });
    }

    getOrCreateQueue(rangeKey: string, save: boolean, callback: (err: Error, queue: RedisHashQueue ) => void):void {
        var q: RedisHashQueue = this.typeQueues[rangeKey];
        if (!q) {
            q = new RedisHashQueue(rangeKey, this.client);
            if (save) {
                this.typeQueues[rangeKey] = q;
            }
        }

        callback(null, q);
    }
}


/*
Iteration 1 - Using redis sets [ llen, ltrim, lrange, rpush ]
*/
/*class RedisSetQueue {
    constructor(public rangeKey: string, private client: redis.RedisClient) {
    }

    create(callback:(err: Error) => void) {
    }

    getQueueLength(callback: (err: Error, length: number) => void ) {
        this.client.llen(this.rangeKey, callback);
    } 

    write(message: OpenQ.IMessage, expectedQid: number, callback: (err: Error, newQueueLength:number) => void ) {
        console.log('RedisSetQueue.write', message, expectedQid);
        this.getQueueLength((err: Error, queueLength: number) => {
            console.log('RedisSetQueue.write.getQueueLength', err, queueLength);
            if (err) {
                callback(err, null);
                return;
            }

            if (expectedQid !== -1) {
                if (queueLength !== expectedQid) {
                    var err = { message: 'Expected next qid to be ' + expectedQid + ' but was ' + queueLength, name: 'ExpectedQidViolation' };
                    callback(err, null);
                    return;
                }
            }

            message.qid = queueLength;
            
            this.client.rpush(this.rangeKey, [JSON.stringify(message)], (err:Error, newQueueLength:number) => {
                console.log('RedisSetQueue.write.rpush', err, this.rangeKey, newQueueLength, callback);
                if (err) {
                    callback(err, null);
                    return;
                } 

                callback(null, newQueueLength);
            });
        
        });
    }

    deleteTo(qid: number, callback: (err: Error) => void ) {
        this.client.ltrim(this.rangeKey, qid, -1, callback);
    }

    read(start: number, stop: number, callback: (err: Error, results: any[]) => void ) {
        //this.client.hgetall("xyzxxyz", (err: Error, results: any) => {
        console.log('RedisSetQueue.read', this.rangeKey, start, stop);
        this.client.lrange(this.rangeKey, start, stop, (err: Error, json: any) => {
            console.log('RedisSetQueue.read.lrange', err, '\'' + json + '\'');
            if (err) {
                callback(err, null);
                return;
            }

            var result = null;
            if (!!json) {
                try {
                    result = JSON.parse(json);
                } catch (parseError) {
                    callback(parseError, null);
                    return;
                }
            }

            callback(null, result || []);
        });
        ////var fromQid = afterQid + 1;
        ////if (take === -1) {
        ////    take = q.messages.length;
        ////}

        ////var finalTake = Math.min(q.messages.length - fromQid, fromQid + take);
        ////var m = q.messages.slice(fromQid, finalTake);
        ////callback(null, m);
    }
}*/

/**
Iteration 2 - Using redis hashes [ hlen, hmget, hsetnx ] where the hash is a combination of range key and qid e.g. urn:myrangekey/1 
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
        //this.client.hgetall("xyzxxyz", (err: Error, results: any) => {
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
        ////var fromQid = afterQid + 1;
        ////if (take === -1) {
        ////    take = q.messages.length;
        ////}

        ////var finalTake = Math.min(q.messages.length - fromQid, fromQid + take);
        ////var m = q.messages.slice(fromQid, finalTake);
        ////callback(null, m);
    }
}