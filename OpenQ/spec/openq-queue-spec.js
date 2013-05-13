var openq = require('../openq')
var memoryRepo = require('../repository-memory')
describe('When creating a new queue, ', function () {
    var q = new openq.Queue('userName', 'inbox', memoryRepo.createRepository, []);
    it('then the queue has a non null subscriptions table', function () {
        expect(q.subscriptions).not.toBeNull();
        expect(q.subscriptions.tableName).toBe('table:users/userName/inbox/subscriptions');
    });
    it('then the queue has a non null messages table', function () {
        expect(q.messages).not.toBeNull();
        expect(q.messages.tableName).toBe('table:users/userName/inbox/messages');
    });
    describe('When subscribing for the first time from the beggining, ', function () {
        var subscribeMessage = {
            type: 'urn:openq/subscribe',
            subscriber: 'https://subscriber.com/subscriber/inbox',
            token: 'token',
            exclusive: false,
            fromfirstmessage: true,
            messagesperminute: 60,
            messagetypes: [
                'urn:type1'
            ]
        };
        var error;
        q.subscribe(subscribeMessage, function (err) {
            error = err;
        });
        it('then no error is raised', function () {
            return expect(error).toBeNull();
        });
        it('then a new subscription is created', function () {
            var subscription;
            q.subscriptions.readLast('https://subscriber.com/subscriber/inbox/urn:type1', function (err, last) {
                subscription = last;
            });
            expect(subscription).not.toBeNull();
            expect(subscription.subscriber).toBe(subscribeMessage.subscriber);
            expect(subscription.messageType).toBe('urn:type1');
            expect(subscription.qid).toBe(0);
            expect(subscription.token).toBe('token');
            expect(subscription.exclusive).toBe(false);
            expect(subscription.messagesperminute).toBe(60);
        });
    });
});
