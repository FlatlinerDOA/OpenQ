var openq = require('../openq.ts');
describe('When creating a new dispatch publisher, ', function () {
    var d = new openq.DispatchPublisher();
    describe('When adding a single message handler and publishing a message that should be handled, ', function () {
        var callCount = 0;
        var lastHandledType = null;
        var lastSubscriber = null;
        d.addHandler('urn:twitter/tweet', function (m, s) {
            callCount++;
            lastHandledType = m.type;
            lastSubscriber = s;
            return true;
        });
        var result = d.publish([
            {
                type: 'urn:twitter/tweet'
            }
        ], 'subscriber');
        it('then the handler is called once', function () {
            return expect(callCount).toBe(1);
        });
        it('then the result is true', function () {
            return expect(result).toBe(true);
        });
        it('then the handler is called for the correct message type', function () {
            return expect(lastHandledType).toBe('urn:twitter/tweet');
        });
        it('then the handler is given the subscriber id', function () {
            return expect(lastSubscriber).toBe('subscriber');
        });
    });
    describe('When adding a single message handler and publishing a message that shouldn\'t be handled, ', function () {
        var callCount = 0;
        var lastHandledType = null;
        var lastSubscriber = null;
        d.addHandler('urn:linkedin/post', function (m, s) {
            callCount++;
            lastHandledType = m.type;
            lastSubscriber = s;
            return true;
        });
        var result = d.publish([
            {
                type: 'urn:facebook/statusupdate'
            }
        ], 'subscriber');
        it('then the handler is not called', function () {
            return expect(callCount).toBe(0);
        });
        it('then the result is false', function () {
            return expect(result).toBe(false);
        });
    });
});
