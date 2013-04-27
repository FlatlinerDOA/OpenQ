/// <reference path="../types/common.d.ts" />
/// <reference path="../types/jasmine.d.ts" />

var openq = require('../openq.ts');
var memoryRepo = require('../repository-memory.ts');

describe('When creating a new queue, ', () => {
    var q = new openq.Queue('userName', 'inbox', memoryRepo.createRepository);
    it('Then the queue has a non null subscriptions table', () => {
        expect(q.subscriptions).not.toBeNull();
        expect(q.subscriptions.tableName).toBe('table:users/userName/inbox/subscriptions');
    });

    it('Then the queue has a non null messages table', () => {
        expect(q.messages).not.toBeNull();
        expect(q.messages.tableName).toBe('table:users/userName/inbox/messages');
    });
});