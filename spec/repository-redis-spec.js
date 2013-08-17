var redisRepo = require('../repository-redis');
var uuid = require('uuid');

describe('When creating a new Redis repo, ', function () {
    var repo = redisRepo.createRepository('tablename');

    var Qid = {
        ExpectAny: -1,
        FromFirst: -1,
        FromSecond: 0
    };

    it('then a non-null instance is returned', function () {
        return expect(repo).not.toBeNull();
    });
    it('then the repository has the correct table name', function () {
        return expect(repo.tableName).toBe('tablename');
    });

    describe('When reading an empty repository, ', function () {
        it('then the result is an empty array', function (done) {
            repo.read(uuid.v4(), -1, 1, function (err, messages) {
                expect(err).toBeNull();
                expect(messages).not.toBeNull();
                expect(messages.length).toBe(0);
                done();
            });
        });
    });

    describe('When writing a new message with expected qid of -1 (any), ', function () {
        it('then no error is raised', function (done) {
            var newMessage = {
                topic: uuid.v4(),
                type: 'urn:test',
                messageNumber: 1
            };
            repo.write(newMessage.type, newMessage, Qid.ExpectAny, function (err) {
                expect(err).toBeNull();
                done();
            });
        });
    });

    describe('When reading the first message of the correct type, ', function () {
        it('then the first message is the previously written message, with a qid of zero', function (done) {
            var writeReadMessage = {
                topic: uuid.v4(),
                type: 'urn:test',
                messageNumber: 1
            };
            repo.write(writeReadMessage.type, writeReadMessage, Qid.ExpectAny, function (writeErr) {
                console.log('write', writeErr);
                expect(writeErr).toBeNull();

                repo.read(writeReadMessage.type, Qid.FromFirst, 1, function (readErr, readMessages) {
                    expect(readErr).toBeNull();
                    expect(readMessages).not.toBeNull();
                    expect(readMessages.length).toBe(1);
                    expect(readMessages[0]).not.toBeNull();
                    expect(readMessages[0].type).toBe(writeReadMessage.type);
                    expect(readMessages[0].qid).toBe(0);
                    done();
                });
            });
        });
    });

    describe('When writing only one message and reading the second message of the same topic, ', function () {
        it('then zero messages are read', function (done) {
            var writeReadMessage = {
                topic: uuid.v4(),
                type: 'urn:test',
                messageNumber: 1
            };

            repo.write(writeReadMessage.type, writeReadMessage, Qid.ExpectAny, function (writeErr) {
                expect(writeErr).toBeNull();

                repo.read(writeReadMessage.type, Qid.FromSecond, 1, function (readErr, readMessages) {
                    expect(readErr).toBeNull();
                    expect(readMessages).not.toBeNull();
                    expect(readMessages.length).toBe(0);
                    done();
                });
            });
        });
    });
});
//# sourceMappingURL=repository-redis-spec.js.map
