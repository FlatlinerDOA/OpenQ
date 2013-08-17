var memoryRepo = require('../repository-memory');
var uuid = require('uuid');

describe('When creating a new memory repo, ', function () {
    var repo;
    var Qid = {
        ExpectAny: -1,
        FromFirst: -1,
        FromSecond: 0
    };
    beforeEach(function () {
        repo = memoryRepo.createRepository('tablename');
    });

    it('then a non-null instance is returned', function () {
        return expect(repo).not.toBeNull();
    });
    it('then the repository has the correct table name', function () {
        return expect(repo.tableName).toBe('tablename');
    });

    describe('When reading an empty repository, ', function () {
        var messages;
        beforeEach(function () {
            repo.read(uuid.v4(), Qid.FromFirst, 1, function (err, results) {
                messages = results;
            });
        });
        it('then the result is an empty array', function () {
            expect(messages).not.toBeNull();
            expect(messages.length).toBe(0);
        });
    });

    describe('When writing a new message with expected qid of -1 (any), ', function () {
        var newMessage;
        var error;
        beforeEach(function () {
            newMessage = {
                topic: uuid.v4(),
                type: 'urn:test',
                messageNumber: 1
            };
            repo.write(newMessage.topic, newMessage, Qid.ExpectAny, function (err) {
                error = err;
            });
        });

        it('then no error is raised', function () {
            return expect(error).toBeNull();
        });

        describe('When reading the first message of the correct topic, ', function () {
            var readMessages;
            beforeEach(function () {
                repo.read(newMessage.topic, Qid.FromFirst, 1, function (err, results) {
                    readMessages = results;
                });
            });

            it('then one message is read', function () {
                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(1);
            });

            it('then the first message is the previously written message', function () {
                expect(readMessages[0]).not.toBeNull();
                expect(readMessages[0].type).toBe('urn:test');
            });

            it('then the first message has a qid of zero', function () {
                return expect(readMessages[0].qid).toBe(0);
            });
        });

        describe('When reading the second message of the correct topic, ', function () {
            var readMessages;
            beforeEach(function () {
                repo.read(newMessage.topic, Qid.FromSecond, 1, function (err, results) {
                    readMessages = results;
                });
            });

            it('then zero messages are read', function () {
                console.log('readMessages', readMessages);
                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(0);
            });
        });

        describe('When reading the first message of a different topic, ', function () {
            var readMessages;
            beforeEach(function () {
                repo.read('topic2', Qid.FromFirst, 1, function (err, results) {
                    readMessages = results;
                });
            });

            it('then zero messages are read', function () {
                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(0);
            });
        });

        describe('When writing a second message with an expected version of -1 (any), ', function () {
            var error = null;
            var readMessages;
            beforeEach(function () {
                var secondMessage = { topic: uuid.v4(), type: 'urn:test', messageNumber: 2 };
                repo.write(secondMessage.topic, secondMessage, Qid.ExpectAny, function (err) {
                    error = err;
                });

                repo.read(secondMessage.topic, Qid.FromSecond, 1, function (err, results) {
                    readMessages = results;
                });
            });

            it('then no error is thrown', function () {
                return expect(error).toBeNull();
            });

            it('then the second message is written', function () {
                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(0);
            });

            describe('When deleting up to the second message, ', function () {
                var error = null;
                var remainingMessages;
                beforeEach(function () {
                    repo.deleteTo(newMessage.topic, 0, function (err) {
                        error = err;
                        repo.readAll(newMessage.topic, function (err, results) {
                            error = error || err;
                            remainingMessages = results;
                        });
                    });
                });

                it('then no error is thrown', function () {
                    return expect(error).toBeNull();
                });
                it('then only the second message remains', function () {
                    expect(remainingMessages).not.toBeNull();
                    expect(remainingMessages.length).toBe(1);
                    expect(remainingMessages[0].messageNumber).toBe(2);
                });
            });
        });

        describe('When writing a second message with an expected version of 0, ', function () {
            var error = null;
            var readMessages;
            beforeEach(function () {
                repo.write(newMessage.topic, { topic: newMessage.topic, type: 'urn:test', messageNumber: 2 }, 0, function (err) {
                    error = err;
                    repo.read(newMessage.topic, Qid.FromSecond, 1, function (err, results) {
                        readMessages = results;
                    });
                });
            });

            it('then an error is thrown named \'ExpectedQidViolation\'', function () {
                expect(error).not.toBeNull();
                expect(error.name).toBe('ExpectedQidViolation');
            });

            it('then the second message is not written', function () {
                expect(readMessages).not.toBeNull();
                expect(readMessages.length).toBe(0);
            });
        });
    });
});

describe('When creating a new memory repo, ', function () {
    var repo = memoryRepo.createRepository('tablename');
    var Qid = {
        ExpectAny: -1,
        FromFirst: -1,
        FromSecond: 0
    };
    describe('When writing three messages, ', function () {
        var error;
        beforeEach(function () {
            for (var i = 0; i < 3; i++) {
                repo.write('topic', { topic: 'topic', type: 'urn:test', messageNumber: i + 1 }, Qid.ExpectAny, function (err) {
                    error = err;
                });
            }
        });
        describe('When deleting up to the third message, ', function () {
            var error = null;
            beforeEach(function () {
                repo.deleteTo('topic', 2, function (err) {
                    error = err;
                });
            });

            it('then no error is thrown', function () {
                return expect(error).toBeNull();
            });

            it('then only the third message remains', function () {
                var remainingMessages;
                repo.readAll('topic', function (err, results) {
                    remainingMessages = results;
                });

                expect(remainingMessages).not.toBeNull();
                expect(remainingMessages.length).toBe(1);
                expect(remainingMessages[0].messageNumber).toBe(3);
            });
        });
    });
});
//# sourceMappingURL=repository-memory-spec.js.map
