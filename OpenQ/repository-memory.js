function createRepository(tableName) {
    return new MemoryRepository(tableName);
}
exports.createRepository = createRepository;
var MemoryRepository = (function () {
    function MemoryRepository(tableName) {
        this.tableName = tableName;
        this.typeQueues = {
        };
    }
    MemoryRepository.prototype.read = function (rangeKey, afterQid, take, callback) {
        var q = this.getOrCreateQueue(rangeKey, false);
        var fromQid = afterQid + 1;
        if(take === -1) {
            take = q.messages.length;
        }
        var finalTake = Math.min(q.messages.length - fromQid, fromQid + take);
        var m = q.messages.slice(fromQid, finalTake);
        callback(null, m);
    };
    MemoryRepository.prototype.readLast = function (rangeKey, callback) {
        var q = this.getOrCreateQueue(rangeKey, false);
        this.read(rangeKey, q.messages.length - 2, 1, function (err, results) {
            return callback(err, results[0]);
        });
    };
    MemoryRepository.prototype.readAll = function (rangeKey, callback) {
        this.read(rangeKey, -1, -1, callback);
    };
    MemoryRepository.prototype.write = function (rangeKey, record, expectedQid, callback) {
        if(!record) {
            callback(null);
            return;
        }
        var q = this.getOrCreateQueue(rangeKey, true);
        if(!q.write(record, expectedQid, callback)) {
            return;
        }
        callback(null);
    };
    MemoryRepository.prototype.getOrCreateQueue = function (rangeKey, save) {
        var q = this.typeQueues[rangeKey];
        if(!q) {
            q = new MemoryQueue(rangeKey);
            if(save) {
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
        if(expectedQid != -1) {
            if(this.messages.length != expectedQid) {
                var err = {
                    message: 'Expected next qid to be ' + expectedQid + ' but was ' + this.messages.length,
                    name: 'ExpectedQidViolation'
                };
                callback(err);
                return false;
            }
        }
        message.qid = this.messages.length;
        this.messages.push(message);
        return true;
    };
    return MemoryQueue;
})();
