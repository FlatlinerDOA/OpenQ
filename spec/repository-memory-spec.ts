/// <reference path="../types/common.d.ts" />
/// <reference path="../types/jasmine.d.ts" />

var memoryRepo = require('../repository-memory');
var uuid = require('uuid');

describe('When creating a new memory repo, ', () => {
    var repo: OpenQ.IRepository;
    var Qid = {
        ExpectAny: -1,
        FromFirst: -1,
        FromSecond: 0
    };
    beforeEach(() => {
        repo = memoryRepo.createRepository('tablename');
    });

    it('then a non-null instance is returned', () => expect(repo).not.toBeNull());
    it('then the repository has the correct table name', () => expect(repo.tableName).toBe('tablename'));

    describe('When reading an empty repository, ', () =>
    {
        var messages: OpenQ.IMessage[];
        beforeEach(() => {
            repo.read(uuid.v4(), Qid.FromFirst, 1, (err, results) => {
                messages = results;
            });
        });
        it('then the result is an empty array', () => {
            expect(messages).not.toBeNull();
            expect(messages.length).toBe(0);
        });
    })

    describe('When writing a new message with expected qid of -1 (any), ', () => {
        var newMessage: OpenQ.IMessage;
        var error;
        beforeEach(() => {
            newMessage = {
                topic: uuid.v4(),
                type: 'urn:test',
                messageNumber: 1
            };
            repo.write(newMessage.topic, newMessage, Qid.ExpectAny, err => {
                error = err;
            })
        });

        it('then no error is raised', () => expect(error).toBeNull());

        describe('When reading the first message of the correct topic, ', () => {
            var readMessages: OpenQ.IMessage[];
            beforeEach(() => {
                repo.read(newMessage.topic, Qid.FromFirst, 1, (err, results) => {
                    readMessages = results;
                });
            });

            it('then one message is read', () => {
                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(1);
            });

            it('then the first message is the previously written message', () => {
                expect(readMessages[0]).not.toBeNull();
                expect(readMessages[0].type).toBe('urn:test');
            });

            it('then the first message has a qid of zero', () => expect(readMessages[0].qid).toBe(0));
        });

        describe('When reading the second message of the correct topic, ', () => {
            var readMessages: OpenQ.IMessage[];
            beforeEach(() => {
                repo.read(newMessage.topic, Qid.FromSecond, 1, (err, results) => {
                    readMessages = results;
                });
            });

            it('then zero messages are read', () => {
                console.log('readMessages', readMessages);
                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(0);
            });
        });

        describe('When reading the first message of a different topic, ', () => {
            var readMessages: OpenQ.IMessage[];
            beforeEach(() => {
                repo.read('topic2', Qid.FromFirst, 1, (err, results) => {
                    readMessages = results;
                });
            });

            it('then zero messages are read', () => {
                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(0);
            });
        });

        describe('When writing a second message with an expected version of -1 (any), ', () => {
            var error = null;
            var readMessages: OpenQ.IMessage[];
            beforeEach(() => {
                var secondMessage = { topic: uuid.v4(), type: 'urn:test', messageNumber: 2 }; 
                repo.write(secondMessage.topic, secondMessage, Qid.ExpectAny, (err) => {
                    error = err;
                });

                repo.read(secondMessage.topic, Qid.FromSecond, 1, (err, results) => {
                    readMessages = results;
                });
            });

            it('then no error is thrown', () => expect(error).toBeNull());

            it('then the second message is written', () => {
                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(0);
            });

            describe('When deleting up to the second message, ', () => {
                var error = null;
                var remainingMessages: any[];
                beforeEach(() => {
                    repo.deleteTo(newMessage.topic, 0, (err) => {
                        error = err;
                        repo.readAll(newMessage.topic, (err, results) => {
                            error = error || err;
                            remainingMessages = results;
                        });
                    });
                });

                it('then no error is thrown', () => expect(error).toBeNull());
                it('then only the second message remains', () => {
                    expect(remainingMessages).not.toBeNull();
                    expect(remainingMessages.length).toBe(1);
                    expect(remainingMessages[0].messageNumber).toBe(2);
                });
            });
        });

        describe('When writing a second message with an expected version of 0, ', () => {
            var error = null;
            var readMessages: OpenQ.IMessage[];
            beforeEach(() => {
                repo.write(newMessage.topic, { topic: newMessage.topic, type: 'urn:test', messageNumber: 2 }, 0, (err) => {
                    error = err;
                    repo.read(newMessage.topic, Qid.FromSecond, 1, (err, results) => {
                        readMessages = results;
                    });
                });
            });

            it('then an error is thrown named \'ExpectedQidViolation\'', () => {
                expect(error).not.toBeNull();
                expect(error.name).toBe('ExpectedQidViolation');
            });

            it('then the second message is not written', () => {
                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(0);
            });
        });
    });
});

describe('When creating a new memory repo, ', () => {
    var repo: OpenQ.IRepository = memoryRepo.createRepository('tablename');
    var Qid = {
        ExpectAny: -1,
        FromFirst: -1,
        FromSecond: 0
    };
    describe('When writing three messages, ', () => {
        var error;
        beforeEach(() => {
            for (var i = 0; i < 3; i++) {
                repo.write('topic', { topic: 'topic', type: 'urn:test', messageNumber: i + 1 }, Qid.ExpectAny, (err) => {
                    error = err;
                });
            }
        });
        describe('When deleting up to the third message, ', () => {
            var error = null;
            beforeEach(() => {
                repo.deleteTo('topic', 2, (err) => {
                    error = err;
                });
            });

            it('then no error is thrown', () => expect(error).toBeNull());

            it('then only the third message remains', () => {
                var remainingMessages: any[];
                repo.readAll('topic', (err, results) => {
                    remainingMessages = results;
                });

                expect(remainingMessages).not.toBeNull();
                expect(remainingMessages.length).toBe(1);
                expect(remainingMessages[0].messageNumber).toBe(3);
            });
        });
    });
});