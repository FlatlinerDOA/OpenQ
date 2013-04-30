var openq = require('../openq.ts');
describe('When creating a new dispatch publisher, ', function () {
    var d = new openq.DispatchPublisher();
    describe('When adding a single message handler, ', function () {
        var callCount = 0;
        var lastHandledType = null;
        var lastSubscriber = null;
        d.addHandler('urn:twitter/tweet', function (m, s) {
            callCount++;
            lastHandledType = m.type;
            lastSubscriber = s;
            return true;
        });
        describe('When publishing a message that should be handled, ', function () {
            var callback = false;
            d.publish([
                {
                    type: 'urn:twitter/tweet'
                }
            ], 'subscriber');
            it('then the handler is called once', function () {
                return expect(callCount).toBe(1);
            });
            it('then the handler is called for the correct message type', function () {
                return expect(lastHandledType).toBe('urn:twitter/tweet');
            });
            it('then the handler is given the subscriber id', function () {
                return expect(lastSubscriber).toBe('subscriber');
            });
        });
    });
});
