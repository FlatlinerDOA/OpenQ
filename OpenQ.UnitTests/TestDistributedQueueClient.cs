namespace OpenQ.UnitTests
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;

    using OpenQ.Core;

    public sealed class TestDistributedQueueClient : IDistributedQueue
    {
        private readonly IDistributedQueue queue;

        public TestDistributedQueueClient(IDistributedQueue queue)
        {
            this.queue = queue;
        }

        public Task<Cursor> EnqueueAsync(IReadOnlyList<IQueueMessage> values, Cursor cursor, string[] excludePeerIds)
        {
            return this.queue.EnqueueAsync(values, cursor, excludePeerIds);
        }

        public IObservable<Cursor> Accepted
        {
            get
            {
                return this.queue.Accepted;
            }
        }

        public Task<IReadOnlyList<IQueueMessage>> ReadQueueAsync(Cursor cursor, int count)
        {
            return this.queue.ReadQueueAsync(cursor, count);
        }
    }
}