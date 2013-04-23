/// <reference path="../types/common.d.ts" />
/// <reference path="../types/jasmine.d.ts" />

var memoryRepo = require('../repository-memory.ts');

describe('Creating a memory repo', () => {
    var repo: OpenQ.IRepository = memoryRepo.createRepository('tablename');

    it('returns a non-null instance', () => {
        expect(repo).not.toBeNull();
    });

    it('has the specified table name', () => {
        expect(repo.tableName).toBe('tablename');
    })

    describe('reading an empty repository', () =>
    {
        var messages: OpenQ.IMessage[];
        repo.read('type', -1, 1, results => {
            messages = results;
        });

        it('calls back with an an empty array', () => {
            expect(messages).not.toBeNull();
            expect(messages.length).toBe(0);
        });
    })
});