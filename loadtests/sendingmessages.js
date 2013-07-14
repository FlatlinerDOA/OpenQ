var http = require("http");

var TestResult = (function () {
    function TestResult() {
        this.success = false;
    }
    return TestResult;
})();

var Tester = (function () {
    function Tester(testCount, doneCallback) {
        this.testCount = testCount;
    }
    Tester.prototype.loadTest = function () {
        for (var i = 0; i < this.testCount; i++) {
        }
    };

    Tester.prototype.send = function () {
        var options = {
            hostname: 'localhost',
            port: 8080,
            path: '/testuser/inbox',
            method: 'POST',
            body: {
                "type": 'urn:hammer/time',
                "message": "Have at thee!"
            }
        };

        http.request(options, function (res) {
        });
    };
    return Tester;
})();

describe('When setting up a user with an inbox, ', function () {
    describe('When 100 clients send 1000 messages to a single inbox, ', function () {
        var results = [];
        var testers = [];

        var totalCount = 0;
        for (var i = 0; i < 100; i++) {
            var t = new Tester(1000, function () {
                if (totalCount >= 100000) {
                    it('then the mean messages per second does not fall below 1,000', function () {
                    });
                }
            });
            testers.push(t);
        }
    });
});

