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
    MemoryRepository.prototype.read = function (type, afterQid, take, callback) {
        var q = this.getOrCreateQueue(type, false);
        var fromQid = afterQid + 1;
        var finalTake = Math.min(q.messages.length - fromQid, fromQid + take);
        var m = q.messages.slice(fromQid, finalTake);
        callback(m);
    };
    MemoryRepository.prototype.write = function (messages, expectedQid, callback) {
        if(messages.length == 0) {
            callback(null);
            return;
        }
        var q = this.getOrCreateQueue(messages[0].type, true);
        for(var i = 0; i < messages.length; i++) {
            var m = messages[i];
            if(q.type != m.type) {
                q = this.getOrCreateQueue(q.type, true);
            }
            if(!q.write(m, expectedQid, callback)) {
                return;
            }
        }
        callback(null);
    };
    MemoryRepository.prototype.getOrCreateQueue = function (type, save) {
        var q = this.typeQueues[type];
        if(!q) {
            q = new MemoryQueue(type);
            if(save) {
                this.typeQueues[type] = q;
            }
        }
        return q;
    };
    return MemoryRepository;
})();
var MemoryQueue = (function () {
    function MemoryQueue(type) {
        this.type = type;
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
