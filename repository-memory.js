function createRepository(tableName) {
    return new MemoryRepository(tableName);
}
exports.createRepository = createRepository;

var MemoryRepository = (function () {
    function MemoryRepository(tableName) {
        this.tableName = tableName;
        this.typeQueues = {};
    }
    MemoryRepository.prototype.read = function (topic, afterQid, take, callback) {
        var q = this.getOrCreateQueue(topic, false);
        q.read(afterQid, take, callback);
    };

    MemoryRepository.prototype.readLast = function (topic, callback) {
        var q = this.getOrCreateQueue(topic, false);
        this.read(topic, q.messages.length - 2, 1, function (err, results) {
            return callback(err, results[0]);
        });
    };

    MemoryRepository.prototype.readAll = function (topic, callback) {
        this.read(topic, -1, -1, callback);
    };

    MemoryRepository.prototype.write = function (topic, record, expectedQid, callback) {
        if (!record) {
            callback(null);
            return;
        }

        var q = this.getOrCreateQueue(topic, true);
        if (!q.write(record, expectedQid, callback)) {
            return;
        }

        callback(null);
    };

    MemoryRepository.prototype.deleteTo = function (topic, qid, callback) {
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
    };

    MemoryRepository.prototype.getOrCreateQueue = function (topic, save) {
        var rangeKey = this.tableName + "/" + topic;
        var q = this.typeQueues[rangeKey];
        if (!q) {
            q = new MemoryQueue(rangeKey);
            if (save) {
                this.typeQueues[rangeKey] = q;
            }
        }

        return q;
    };
    return MemoryRepository;
})();

var MemoryQueue = (function () {
    function MemoryQueue(rangeKey) {
        this.rangeKey = rangeKey;
        this.messages = [];
    }
    MemoryQueue.prototype.write = function (message, expectedQid, callback) {
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
    };

    MemoryQueue.prototype.deleteTo = function (qid) {
        this.messages = this.messages.filter(function (m) {
            return m.qid >= qid;
        });
    };

    MemoryQueue.prototype.read = function (afterQid, take, callback) {
        var fromQid = afterQid + 1;
        if (take === -1) {
            take = this.messages.length;
        }

        var finalTake = Math.min(this.messages.length - fromQid, fromQid + take);
        var m = this.messages.slice(fromQid, finalTake);
        callback(null, m);
    };
    return MemoryQueue;
})();

//# sourceMappingURL=repository-memory.js.map
