require('typescript-require');
var jasmine = require('jasmine-node');
var sys = require('sys');
for(var key in jasmine) {
    global[key] = jasmine[key];
}
var isVerbose = true;
var showColors = true;
var args = process.argv || [];
var coffee = false;
args.every(function (arg) {
    switch(arg) {
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
jasmine.executeSpecsInFolder({
    specFolders: [
        __dirname + '/spec'
    ]
}, function (runner, log) {
    if(runner.results().failedCount == 0) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}, isVerbose, showColors);
