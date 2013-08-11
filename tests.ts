/// <reference path="types/common.d.ts" />

// Initialize
require('typescript-require');
var j = require('jasmine-node');

require('sys');
for (var key in j) {
    global[key] = j[key];
}

var runLoadTests = false;
var isVerbose = true;
var showColors = true;
var args = process.argv || [];
var coffee = false;
args.forEach(arg => {
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
        case '--loadTests':
            runLoadTests = true;
            break;
    }
});

var options = {
    specFolders: runLoadTests ? [__dirname + '/spec'] : [__dirname + '/spec',__dirname + '/loadtests'],
    onComplete: (runner, log) => {
        if (runner.results().failedCount === 0) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    },
    isVerbose: isVerbose,
    showColors: showColors,
    includeStackTrace: true
}

console.log('Running all tests in ' + __dirname + '/spec');
j.executeSpecsInFolder(options);