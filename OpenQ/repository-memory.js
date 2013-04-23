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
    MemoryRepository.prototype.read = function (type, version, take, callback) {
        var q = this.typeQueues[type] || {
            messages: []
        };
        if(q) {
            callback(q.messages || []);
        }
    };
    MemoryRepository.prototype.write = function (messages, expectedVersion, callback) {
        for(var i = 0; i < messages.length; i++) {
            var m = messages[i];
            var q = this.typeQueues[m.type];
            if(!q) {
                q = {
                    messages: []
                };
                this.typeQueues[m.type] = q;
            }
            if(expectedVersion != -1) {
                if(q.messages.length != expectedVersion) {
                    callback(new Error('Expected version to be ' + expectedVersion + ' but was ' + q.messages.length));
                    return;
                }
            }
            m.qid = q.messages.length;
            q.messages.push(m);
        }
        callback(null);
    };
    return MemoryRepository;
})();
