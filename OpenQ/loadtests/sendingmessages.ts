/// <reference path="../node_modules/typescript-require/typings/node.d.ts" />
/// <reference path="../types/common.d.ts" />
/// <reference path="../types/jasmine.d.ts" />
/// <reference path="../openq.ts" />
var http = require('http');

describe('When posting 100,000 messages to a single inbox, ', () => {
    
    //var options = {
    //    hostname: 'www.google.com',
    //    port: 80,
    //    path: '/upload',
    //    method: 'POST'
    //};

    //http.request(options, () => {
    //});
    it('then the average messages per second does not fall below 1,000', () => {

    });
});