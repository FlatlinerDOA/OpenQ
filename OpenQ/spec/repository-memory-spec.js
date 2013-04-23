var memoryRepo = require('../repository-memory.ts');
describe('Creating a memory repo', function () {
    var repo = memoryRepo.createRepository('tablename');
    it('returns a non-null instance', function () {
        expect(repo).not.toBeNull();
    });
    it('has the specified table name', function () {
        expect(repo.tableName).toBe('tablename');
    });
    describe('reading an empty repository', function () {
        var messages;
        repo.read('type', -1, 1, function (results) {
            messages = results;
        });
        it('calls back with an an empty array', function () {
            expect(messages).not.toBeNull();
            expect(messages.length).toBe(0);
        });
    });
});
