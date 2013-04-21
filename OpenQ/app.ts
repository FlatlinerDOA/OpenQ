/// <reference path="common.d.ts" />

// Initialize
require('typescript-require');
var Rx = require('rx');

// Get functions.ts
var openq = require("./openq-server.ts");
openq.listen();