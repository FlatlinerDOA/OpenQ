/// <reference path="../types/common.d.ts" />
/// <reference path="../types/jasmine.d.ts" />

import openq = module('../openq');

describe('When creating a new dispatch publisher, ', () => {
    var d = new openq.DispatchPublisher();
    describe('When adding a single message handler and publishing a message that should be handled, ', () => {
        var callCount = 0;
        var lastHandledType = null;
        var lastSubscriber = null;
        d.addHandler('urn:twitter/tweet', (m, s) => {
            callCount++;
            lastHandledType = m.type;
            lastSubscriber = s;
            return true;
        });

        var result = d.publish([{ type: 'urn:twitter/tweet' }], 'subscriber');

        it('then the handler is called once', () => expect(callCount).toBe(1));
        it('then the result is true', () => expect(result).toBe(true));
        it('then the handler is called for the correct message type', () => expect(lastHandledType).toBe('urn:twitter/tweet'));
        it('then the handler is given the subscriber id', () => expect(lastSubscriber).toBe('subscriber'));
    });

    describe('When adding a single message handler and publishing a message that shouldn\'t be handled, ', () => {
        var callCount = 0;
        var lastHandledType = null;
        var lastSubscriber = null;
        d.addHandler('urn:linkedin/post', (m, s) => {
            callCount++;
            lastHandledType = m.type;
            lastSubscriber = s;
            return true;
        });

        var result = d.publish([{ type: 'urn:facebook/statusupdate' }], 'subscriber');

        it('then the handler is not called', () => expect(callCount).toBe(0));
        it('then the result is false', () => expect(result).toBe(false));
    });
});