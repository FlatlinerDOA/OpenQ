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
    }

    return new RedisRepository(tableName, redisClient);
}
exports.createRepository = createRepository;

var RedisRepository = (function () {
    function RedisRepository(tableName, client) {
        this.tableName = tableName;
        this.client = client;
        this.typeQueues = {};
    }
    RedisRepository.prototype.read = function (rangeKey, afterQid, take, callback) {
        console.log('RedisRepository.read', rangeKey, afterQid, take);

        this.getOrCreateQueue(rangeKey, false, function (err, queue) {
            console.log('RedisRepository.getOrCreateQueue', rangeKey, err, !!queue);
            if (err) {
                callback(err, null);
                return;
            }

            queue.read(afterQid + 1, afterQid + take, callback);
        });
    };

    RedisRepository.prototype.readLast = function (rangeKey, callback) {
        this.read(rangeKey, -1, -1, function (err, results) {
            return callback(err, results[0]);
        });
    };

    RedisRepository.prototype.readAll = function (rangeKey, callback) {
        this.read(rangeKey, 0, 10000, callback);
    };

    RedisRepository.prototype.write = function (rangeKey, record, expectedQid, callback) {
        if (!record) {
            callback(null);
            return;
        }

        this.getOrCreateQueue(rangeKey, true, function (err, q) {
            if (err) {
                callback(err);
                return;
            }

            q.write(record, expectedQid, callback);
        });
    };

    RedisRepository.prototype.deleteTo = function (rangeKey, qid, callback) {
        var _this = this;
        this.getOrCreateQueue(rangeKey, false, function (err, q) {
            if (err || !q) {
                callback({ message: 'Repository not found', name: 'RepositoryNotFound' });
                return;
            }

            q.deleteTo(qid, function (err) {
                if (err) {
                    callback(err);
                    return;

                    if (qid === -1) {
                        delete _this.typeQueues[rangeKey];
                    }

                    callback(null);
                }
            });
        });
    };

    RedisRepository.prototype.getOrCreateQueue = function (rangeKey, save, callback) {
        var q = this.typeQueues[rangeKey];
        if (!q) {
            q = new RedisHashQueue(rangeKey, this.client);
            if (save) {
                this.typeQueues[rangeKey] = q;
            }
        }

        callback(null, q);
    };
    return RedisRepository;
})();

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
