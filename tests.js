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
args.forEach(function (arg) {
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

console.log('Running all tests in ' + __dirname + '/spec');
j.executeSpecsInFolder({
    specFolders: [__dirname + '/spec']
}, function (runner, log) {
    if (runner.results().failedCount === 0) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}, isVerbose, showColors);

if (runLoadTests) {
    console.log('Running all tests in ' + __dirname + '/loadtests');
    j.executeSpecsInFolder({
        specFolders: [__dirname + '/loadtests']
    }, function (runner, log) {
        if (runner.results().failedCount === 0) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    }, isVerbose, showColors);
}
//# sourceMappingURL=tests.js.map
