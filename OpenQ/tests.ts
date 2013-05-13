/// <reference path="types/common.d.ts" />

// Initialize
require('typescript-require');
var j = require('jasmine-node');

var sys = require('sys');
for (var key in j) {
    global[key] = j[key];
}

var isVerbose = true;
var showColors = true;
var args = process.argv || [];
var coffee = false;
args.every(arg => {
    switch (arg) {
        case '--color':
            showColors = true;
            break;
        case '--noColor':
            showColors = false;
            break;
        case '--verbose':
            isVerbose = true;
            break;
    }
});

console.log('Running all tests in ' + __dirname + '/spec');
j.executeSpecsInFolder(
    {
        specFolders: [__dirname + '/spec']
    },
    (runner, log) => {
        if (runner.results().failedCount === 0) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    },
    isVerbose,
    showColors);