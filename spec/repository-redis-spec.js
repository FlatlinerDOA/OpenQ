var redisRepo = require('../repository-redis');

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
        it('then the result is an empty array', function () {
            var error = null;
            var messages = null;
            runs(function () {
                repo.read('type', -1, 1, function (err, results) {
                    error = err ? "Error: " + err : null;
                    messages = results;
                });
            });

            waitsFor(function () {
                return error || messages;
            }, "Failed to read", 5000);

            runs(function () {
                expect(error).toBeNull();
                expect(messages).not.toBeNull();
                expect(messages.length).toBe(0);
            });
        });
    });

    describe('When writing a new message with expected qid of -1 (any), ', function () {
        var error, completed;

        runs(function () {
            var newMessage = {
                type: 'urn:test',
                messageNumber: 1
            };

            repo.write(newMessage.type, newMessage, Qid.ExpectAny, function (err) {
                error = err;
                completed = true;
            });
        });

        it('then no error is raised', function () {
            waitsFor(function () {
                return error || completed;
            }, "Failed to write a new message", 500);

            runs(function () {
                expect(error).toBeNull();
            });
        });
    });
});
//# sourceMappingURL=repository-redis-spec.js.map
