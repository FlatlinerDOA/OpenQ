/// <reference path="../node_modules/typescript-require/typings/node.d.ts" />
/// <reference path="../types/common.d.ts" />
/// <reference path="../types/jasmine.d.ts" />
import http = require('http');

class TestResult {
    success = false;
    startTime: Date;
    endTime: Date;
    duration: Number;
}

class Tester {
    constructor(public testCount:number, doneCallback) {

    }

    loadTest() {
        for (var i = 0; i < this.testCount; i++) {
           
        }
    }

    send() {
        var options = {
            hostname: 'localhost',
            port: 8080,
            path: '/testuser/inbox',
            method: 'POST',
            body: {
                "type": 'urn:hammer/time',
                "message": "Have at thee!"
            }
        }

        http.request(options, res => {
        });
    }
}

describe('When setting up a user with an inbox, ', () => {

    describe('When 100 clients send 1000 messages to a single inbox, ', () => {
        var results = [];
        var testers:Tester[] = [];

        var totalCount = 0;
        for (var i = 0; i < 100;i++) {
            var t = new Tester(1000, () => {
                if (totalCount >= 100000) {
                    it('then the mean messages per second does not fall below 1,000', () => {

                    });
                }
            });
            testers.push(t);
        }
        
    });
});