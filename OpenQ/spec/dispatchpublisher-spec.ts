/// <reference path="../types/common.d.ts" />
/// <reference path="../types/jasmine.d.ts" />
/// <reference path="../openq.ts" />

var openq = require('../openq.ts');

describe('When creating a new dispatch publisher, ', () => {
    var d = new openq.DispatchPublisher();
    describe('When adding a single message handler, ', () => {
        var callCount = 0;
        var lastHandledType = null;
        var lastSubscriber = null;
        d.addHandler('urn:twitter/tweet', (m, s) => {
            callCount++;
            lastHandledType = m.type;
            lastSubscriber = s;
            return true;
        });

        describe('When publishing a message that should be handled, ', () => {
            var callback = false;
            d.publish([{ type: 'urn:twitter/tweet' }], 'subscriber');

            it('then the handler is called once', () => expect(callCount).toBe(1));
            it('then the handler is called for the correct message type', () => expect(lastHandledType).toBe('urn:twitter/tweet'));
            it('then the handler is given the subscriber id', () => expect(lastSubscriber).toBe('subscriber'));
        });
    });
});