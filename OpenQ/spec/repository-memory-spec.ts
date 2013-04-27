/// <reference path="../types/common.d.ts" />
/// <reference path="../types/jasmine.d.ts" />

var memoryRepo = require('../repository-memory.ts');

var Qid = {
    ExpectAny: -1,
    FromFirst: -1,
    FromSecond: 0
};

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
        repo.read('type', Qid.FromFirst, 1, (err, results) => {
            messages = results;
        });

        it('then the result is an empty array', () => {
            expect(messages).not.toBeNull();
            expect(messages.length).toBe(0);
        });
    })

    describe('When writing a new message with expected qid of -1 (any), ', () => {
        var newMessage: OpenQ.IMessage = {
            type: 'urn:test'
        }

        var error;
        repo.write(newMessage.type, newMessage, Qid.ExpectAny, err => {
            error = err;
        })

        it('then no error is raised', () => expect(error).toBeNull());

        describe('When reading the first message of the correct type, ', () => {
            var readMessages: OpenQ.IMessage[];

            repo.read('urn:test', Qid.FromFirst, 1, (err, results) => {
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

            repo.read('urn:test', Qid.FromSecond, 1, (err, results) => {
                readMessages = results;
            });

            it('then zero messages are read', () => {
                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(0);
            });
        });

        describe('When reading the first message of a different type, ', () => {
            var readMessages: OpenQ.IMessage[];

            repo.read('urn:test2', Qid.FromFirst, 1, (err, results) => {
                readMessages = results;
            });

            it('then zero messages are read', () => {
                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(0);
            });
        });

        describe('When writing a second message with an expected version of -1 (any), ', () => {
            var error = null;

            repo.write('urn:test', { type: 'urn:test', messageNumber: 2 }, Qid.ExpectAny, (err) => {
                error = err;
            });

            var readMessages: OpenQ.IMessage[];

            repo.read('urn:test', Qid.FromSecond, 1, (err, results) => {
                readMessages = results;
            });

            it('then no error is thrown', () => {
                expect(error).toBeNull();
            });

            it('then the second message is written', () => {
                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(0);
            });
        });

        describe('When writing a second message with an expected version of 0, ', () => {
            var error = null;

            repo.write('urn:test', { type: 'urn:test', messageNumber: 2 }, 0, (err) => {
                error = err;
            });

            it('then an error is thrown named \'ExpectedQidViolation\'', () => {
                expect(error).not.toBeNull();
                expect(error.name).toBe('ExpectedQidViolation');
            });

            it('then the second message is not written', () => {
                var readMessages: OpenQ.IMessage[];

                repo.read('urn:test', Qid.FromSecond, 1, (err, results) => {
                    readMessages = results;
                });

                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(0);
            });
        });
    });
});