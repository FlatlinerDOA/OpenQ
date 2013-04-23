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
    MemoryRepository.prototype.read = function (type, fromQid, take, callback) {
        var q = this.getOrCreateQueue(type, false);
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
            if(expectedQid != -1) {
                if(q.messages.length != expectedQid) {
                    callback(new Error('Expected next qid to be ' + expectedQid + ' but was ' + q.messages.length));
                    return;
                }
            }
            m.qid = q.messages.length;
            q.messages.push(m);
        }
        callback(null);
    };
    MemoryRepository.prototype.getOrCreateQueue = function (type, save) {
        var q = this.typeQueues[type];
        if(!q) {
            q = {
                type: type,
                messages: []
            };
            if(save) {
                this.typeQueues[type] = q;
            }
        }
        return q;
    };
    return MemoryRepository;
})();
