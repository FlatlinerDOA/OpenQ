/// <reference path="../types/common.d.ts" />
/// <reference path="../types/jasmine.d.ts" />

var memoryRepo = require('../repository-memory.ts');

describe('When creating a new memory repo, ', () => {
    var repo: OpenQ.IRepository = memoryRepo.createRepository('tablename');

    it('then a non-null instance is returned', () => {
        expect(repo).not.toBeNull();
    });

    it('then the repository has the correct table name', () => {
        expect(repo.tableName).toBe('tablename');
    })

    describe('When reading an empty repository, ', () =>
    {
        var messages: OpenQ.IMessage[];
        repo.read('type', 0, 1, results => {
            messages = results;
        });

        it('then the result is an empty array', () => {
            expect(messages).not.toBeNull();
            expect(messages.length).toBe(0);
        });
    })

    describe('When writing a new message with expected qid of -1, ', () => {
        var newMessage: OpenQ.IMessage = {
            type: 'urn:test'
        }

        var error;
        repo.write([newMessage], 0, err => {
            error = err;
        })

        it('then no error is raised', () => expect(error).toBeNull());

        describe('When reading the first message of the correct type, ', () => {
            var readMessages: OpenQ.IMessage[];

            repo.read('urn:test', 0, 1, results => {
                readMessages = results;
            });

            it('then one message is read', () => {
                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(1);
            });

            it('then the first message is the previously written message', () => {

                expect(readMessages[0]).not.toBeNull();
                expect(readMessages[0].type).toBe('urn:test');
            });
            it('then the first message has a qid of zero', () => {
                expect(readMessages[0].qid).toBe(0);
            });
        });

        describe('When reading the second message of the correct type, ', () => {
            var readMessages: OpenQ.IMessage[];

            repo.read('urn:test', 1, 1, results => {
                readMessages = results;
            });

            it('then zero messages are read', () => {
                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(0);
            });
        });

        describe('When reading the first message of a different type, ', () => {
            var readMessages: OpenQ.IMessage[];

            repo.read('urn:test2', 0, 1, results => {
                readMessages = results;
            });

            it('then zero messages are read', () => {
                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(0);
            });
        });
    });
});