var express = require("express");
var app = express();
var Rx = require('rx');
function createServer(port) {
    if (typeof port === "undefined") { port = null; }
    port = port || 8000;
    return new OpenQServer(process.env.COMPUTERNAME + ':' + process.pid, port);
}
exports.createServer = createServer;
var OpenQServer = (function () {
    function OpenQServer(peerId, port) {
        app.listen(port);
    }
    OpenQServer.prototype.send = function (inbox, message) {
        console.log("Sending " + message + " to " + inbox);
    };
    return OpenQServer;
})();
