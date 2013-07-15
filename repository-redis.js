var _redis = require("redis");
var redisClient = null;

function createRepository(tableName) {
    if (!redisClient) {
        redisClient = _redis.createClient();
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
        var q = this.getOrCreateQueue(rangeKey, false);
        q.read(afterQid, afterQid + take, callback);
    };

    RedisRepository.prototype.readLast = function (rangeKey, callback) {
        var q = this.getOrCreateQueue(rangeKey, false);
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

        var q = this.getOrCreateQueue(rangeKey, true);
        q.write(record, expectedQid, callback);
    };

    RedisRepository.prototype.deleteTo = function (rangeKey, qid, callback) {
        var _this = this;
        var q = this.getOrCreateQueue(rangeKey, false);
        if (!q) {
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
    };

    RedisRepository.prototype.getOrCreateQueue = function (rangeKey, save) {
        var q = this.typeQueues[rangeKey];
        if (!q) {
            q = new RedisQueue(rangeKey, this.client);
            if (save) {
                this.typeQueues[rangeKey] = q;
            }
        }

        return q;
    };
    return RedisRepository;
})();

var RedisQueue = (function () {
    function RedisQueue(rangeKey, client) {
        this.rangeKey = rangeKey;
        this.client = client;
    }
    RedisQueue.prototype.getQueueLength = function (callback) {
        this.client.llen(this.rangeKey, callback);
    };

    RedisQueue.prototype.write = function (message, expectedQid, callback) {
        var _this = this;
        this.getQueueLength(function (err, queueLength) {
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

            _this.client.rpush(_this.rangeKey, JSON.stringify(message), function (err, newQueueLength) {
                if (err) {
                    callback(err);
                    return;
                }

                callback(null);
            });
        });
    };

    RedisQueue.prototype.deleteTo = function (qid, callback) {
        this.client.ltrim(this.rangeKey, qid, -1, callback);
    };

    RedisQueue.prototype.read = function (start, stop, callback) {
        this.client.lrange(this.rangeKey, start, stop, function (err, results) {
            if (err) {
                callback(err, null);
                return;
            }

            var result;
            try  {
                result = JSON.parse(results);
            } catch (parseError) {
                callback(parseError, null);
                return;
            }

            callback(null, result);
        });
    };
    return RedisQueue;
})();

