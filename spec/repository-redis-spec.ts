/// <reference path="../types/common.d.ts" />
/// <reference path="../types/jasmine.d.ts" />
var redisRepo = require('../repository-redis');
var uuid = require('uuid');

describe('When creating a new Redis repo, ', () => {
    var repo: OpenQ.IRepository = redisRepo.createRepository('tablename');

    var Qid = {
        ExpectAny: -1,
        FromFirst: -1,
        FromSecond: 0
    };

    it('then a non-null instance is returned', () => expect(repo).not.toBeNull());
    it('then the repository has the correct table name', () => expect(repo.tableName).toBe('tablename'));

    describe('When reading an empty repository, ', () =>
    {
        var error = null;
        it('then the result is an empty array', (done) => {
            console.log('empty repo read');
            repo.read('urn:test/' + uuid.v4(), -1, 1, (err, messages) => {
                console.log('empty repo result', err, messages);
                expect(err).toBeNull();
                expect(messages).not.toBeNull();
                expect(messages.length).toBe(0);
                done();
            });
        });
    })

    describe('When writing a new message with expected qid of -1 (any), ', () => {
        it('then no error is raised', (done) => {
            var newMessage: OpenQ.IMessage = {
                type: 'urn:test/' + uuid.v4(),
                messageNumber: 1
            }
            repo.write(newMessage.type, newMessage, Qid.ExpectAny, err => {
                expect(err).toBeNull();
                done();
            });
        });
    });

    describe('When reading the first message of the correct type, ', () => {
        it('then the first message is the previously written message, with a qid of zero', (donex) => {
            var writeReadMessage: OpenQ.IMessage = {
                type: 'urn:test/' + uuid.v4(),
                messageNumber: 1
            }
            repo.write(writeReadMessage.type, writeReadMessage, Qid.ExpectAny, (writeErr) => {
                console.log('write', writeErr);
                expect(writeErr).toBeNull();
                //expect(newLength).toBe(1);

                console.log('starting-read', writeReadMessage, Qid.FromFirst, 1);
                repo.read(writeReadMessage.type, Qid.FromFirst, 1, (readErr, readMessages) => {
                    console.log('read', readErr, readMessages);
                    expect(readErr).toBeNull();
                    expect(readMessages).not.toBeNull();
                    expect(readMessages.length).toBe(1);
                    expect(readMessages[0]).not.toBeNull();
                    expect(readMessages[0].type).toBe(writeReadMessage.type);
                    expect(readMessages[0].qid).toBe(0);
                    donex();
                });
            });
        });
    });


        //describe('When reading the second message of the correct type, ', () => {
        //    var readMessages: OpenQ.IMessage[];
        //    runs(() => {

        //        repo.read('urn:test', Qid.FromSecond, 1, (err, results) => {
        //            error = err;
        //            readMessages = results;
        //        });
        //    });
        //    waitsFor(() => error || readMessages, "Failed to read the message", 500);
        //    runs(() => {
        //        it('then zero messages are read', () => {
        //            expect(readMessages).not.toBeNull();
        //            expect(readMessages.length).toBe(0);
        //        });
        //    });
        //});

        //describe('When reading the first message of a different type, ', () => {
        //    var readMessages: OpenQ.IMessage[];
        //    repo.read('urn:test2', Qid.FromFirst, 1, (err, results) => {
        //        readMessages = results;
        //    });

        //    it('then zero messages are read', () => {
        //        expect(readMessages).not.toBeNull();
        //        expect(readMessages.length).toBe(0);
        //    });
        //});

        //describe('When writing a second message with an expected version of -1 (any), ', () => {
        //    var error = null;
        //    repo.write('urn:test', { type: 'urn:test', messageNumber: 2 }, Qid.ExpectAny, (err) => {
        //        error = err;
        //    });

        //    var readMessages: OpenQ.IMessage[];
        //    repo.read('urn:test', Qid.FromSecond, 1, (err, results) => {
        //        readMessages = results;
        //    });

        //    it('then no error is thrown', () => expect(error).toBeNull());

        //    it('then the second message is written', () => {
        //        expect(readMessages).not.toBeNull();
        //        expect(readMessages.length).toBe(0);
        //    });

        //    describe('When deleting up to the second message, ', () => {
        //        var error = null;
        //        repo.deleteTo('urn:test', 1, (err) => {
        //            error = err;
        //        });

        //        it('then no error is thrown', () => expect(error).toBeNull());

        //        it('then only the second message remains', () => {
        //            var remainingMessages: any[];
        //            repo.readAll('urn:test', (err, results) => {
        //                remainingMessages = results;
        //            });

        //            expect(remainingMessages).not.toBeNull();
        //            expect(remainingMessages.length).toBe(1);
        //            expect(remainingMessages[0].messageNumber).toBe(2);
        //        });
        //    });
        //});

        //describe('When writing a second message with an expected version of 0, ', () => {
        //    var error = null;

        //    repo.write('urn:test', { type: 'urn:test', messageNumber: 2 }, 0, (err) => {
        //        error = err;
        //    });

        //    it('then an error is thrown named \'ExpectedQidViolation\'', () => {
        //        expect(error).not.toBeNull();
        //        expect(error.name).toBe('ExpectedQidViolation');
        //    });

        //    it('then the second message is not written', () => {
        //        var readMessages: OpenQ.IMessage[];
        //        repo.read('urn:test', Qid.FromSecond, 1, (err, results) => {
        //            readMessages = results;
        //        });

        //        expect(readMessages).not.toBeNull();
        //        expect(readMessages.length).toBe(0);
        //    });
        //});
});
/*
describe('When creating a new Redis repo, ', () => {
    var repo: OpenQ.IRepository = redisRepo.createRepository('tablename');
    var Qid = {
        ExpectAny: -1,
        FromFirst: -1,
        FromSecond: 0
    };
    describe('When writing three messages, ', () => {
        var error;
        for (var i = 0; i < 3; i++) {
            repo.write('urn:test', { type: 'urn:test', messageNumber: i + 1 }, Qid.ExpectAny, (err) => {
                error = err;
            });
        }

        describe('When deleting up to the third message, ', () => {
            var error = null;
            repo.deleteTo('urn:test', 2, (err) => {
                error = err;
            });

            it('then no error is thrown', () => expect(error).toBeNull());

            it('then only the third message remains', () => {
                var remainingMessages: any[];
                repo.readAll('urn:test', (err, results) => {
                    remainingMessages = results;
                });

                expect(remainingMessages).not.toBeNull();
                expect(remainingMessages.length).toBe(1);
                expect(remainingMessages[0].messageNumber).toBe(3);
            });
        });
    });
});
*/