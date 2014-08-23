// Uses Redis Lists for storage of the queues -> http://redis.io/commands#list (unsure if this is the best technique but will do for v1)
// See http://www.nodejs.net/a/20130128/105909.html for Redis samples
/// <reference path="types/common.d.ts" />
/// <reference path="types/node_redis.d.ts" />
var redis = require("redis");
var redisClient = null;

function createRepository(tableName) {
    if (!redisClient) {
        var port = 6379;
        var host = "localhost";
        var options = {
            enable_offline_queue: false
        };
        redisClient = redis.createClient(port, host, {});
        // TODO: redisClient.auth("password");
    }

    return new RedisRepository(tableName, redisClient);
}
exports.createRepository = createRepository;

/** Implementation of the standard OpenQ repository using Redis */
var RedisRepository = (function () {
    function RedisRepository(tableName, client) {
        this.tableName = tableName;
        this.client = client;
        this.typeQueues = {};
    }
    RedisRepository.prototype.read = function (topic, afterQid, take, callback) {
        this.getOrCreateQueue(topic, false, function (err, queue) {
            if (err) {
                callback(err, null);
                return;
            }

            queue.read(afterQid + 1, afterQid + take, callback);
        });
    };

    RedisRepository.prototype.readLast = function (topic, callback) {
        this.read(topic, -1, -1, function (err, results) {
            return callback(err, results[0]);
        });
    };

    /** Note this is for short queues only, as it is limited to 1000 rows max */
    RedisRepository.prototype.readAll = function (topic, callback) {
        this.getOrCreateQueue(topic, false, function (err, queue) {
            if (err) {
                callback(err, null);
                return;
            }

            queue.getQueueLength(function (err, length) {
                if (err) {
                    callback(err, null);
                    return;
                }

                queue.read(0, length, callback);
            });
        });
    };

    RedisRepository.prototype.write = function (topic, record, expectedQid, callback) {
        if (!record) {
            callback(null);
            return;
        }

        this.getOrCreateQueue(topic, true, function (err, q) {
            if (err) {
                callback(err);
                return;
            }

            q.write(record, expectedQid, callback);
        });
    };

    RedisRepository.prototype.deleteTo = function (topic, qid, callback) {
        var _this = this;
        this.getOrCreateQueue(topic, false, function (err, q) {
            if (err || !q) {
                callback({ message: 'Repository not found', name: 'RepositoryNotFound' });
                return;
            }

            q.deleteTo(qid, function (err) {
                if (err) {
                    callback(err);
                    return;

                    if (qid === -1) {
                        var fullRangeKey = _this.tableName + "/" + topic;
                        delete _this.typeQueues[fullRangeKey];
                    }

                    callback(null);
                }
            });
        });
    };

    RedisRepository.prototype.getOrCreateQueue = function (topic, save, callback) {
        var fullRangeKey = this.tableName + "/" + topic;
        var q = this.typeQueues[fullRangeKey];
        if (!q) {
            q = new RedisHashQueue(fullRangeKey, this.client);
            if (save) {
                this.typeQueues[fullRangeKey] = q;
            }
        }

        callback(null, q);
    };
    return RedisRepository;
})();

/**
Iteration 2 - Using redis hashes [ hlen, hmget, hsetnx ] where the hash is a combination of range key and the field is the qid e.g. hsetnx "urn:myrangekey" "1" "{ content: 'blah' type: 'blah' }"
*/
var RedisHashQueue = (function () {
    function RedisHashQueue(rangeKey, client) {
        this.rangeKey = rangeKey;
        this.client = client;
    }
    RedisHashQueue.prototype.create = function (callback) {
    };

    RedisHashQueue.prototype.getQueueLength = function (callback) {
        this.client.hlen(this.rangeKey, callback);
    };

    RedisHashQueue.prototype.write = function (message, expectedQid, callback) {
        var _this = this;
        console.log('RedisHashQueue.write', message, expectedQid);
        this.getQueueLength(function (err, queueLength) {
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

            var args = [_this.rangeKey, message.qid, JSON.stringify(message)];
            _this.client.hsetnx(args, function (err) {
                console.log('RedisHashQueue.hsetnx', args, err);
                if (err) {
                    callback(err);
                    return;
                }

                callback(null);
            });
        });
    };

    RedisHashQueue.prototype.deleteTo = function (qid, callback) {
        this.client.ltrim([this.rangeKey, qid, -1], callback);
    };

    RedisHashQueue.prototype.read = function (start, stop, callback) {
        var args = [this.rangeKey];
        for (var i = start; i <= stop; i++) {
            args.push('' + i);
        }

        this.client.hmget(args, function (err, results) {
            if (err) {
                callback(err, null);
                return;
            }

            var messages = null;
            if (results !== null) {
                try  {
                    messages = results.filter(function (x) {
                        return x !== null;
                    }).map(function (x) {
                        return JSON.parse(x);
                    });
                } catch (parseError) {
                    callback(parseError, null);
                    return;
                }
            }

            callback(null, messages || []);
        });
    };
    return RedisHashQueue;
})();
//# sourceMappingURL=repository-redis.js.map
