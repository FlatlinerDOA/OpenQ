var openq = require('../openq.ts');
var memoryRepo = require('../repository-memory.ts');
describe('When creating a new queue, ', function () {
    var q = new openq.Queue('userName', 'inbox', memoryRepo.createRepository);
    it('Then the queue has a non null subscriptions table', function () {
        expect(q.subscriptions).not.toBeNull();
        expect(q.subscriptions.tableName).toBe('table:users/userName/inbox/subscriptions');
    });
    it('Then the queue has a non null messages table', function () {
        expect(q.messages).not.toBeNull();
        expect(q.messages.tableName).toBe('table:users/userName/inbox/messages');
    });
});
