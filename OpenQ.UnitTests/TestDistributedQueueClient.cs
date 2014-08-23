namespace OpenQ.UnitTests
{
    using System;
    using System.Collections.Generic;
    using System.Reactive;
    using System.Reactive.Concurrency;
    using System.Reactive.Linq;
    using System.Threading.Tasks;

    using OpenQ.Core;

    public sealed class TestDistributedQueueClient : IDistributedQueue
    {
        #region Fields

        private readonly IDistributedQueue queue;

        #endregion

        #region Constructors and Destructors

        public TestDistributedQueueClient(IDistributedQueue queue, IScheduler scheduler)
        {
            this.Scheduler = scheduler;
            this.queue = queue;
        }

        #endregion

        #region Public Properties

        public IObservable<Cursor> Accepted
        {
            get
            {
                return this.queue.Accepted;
            }
        }

        public IScheduler Scheduler { get; private set; }

        public bool Connected { get; set; }

        #endregion

        #region Public Methods and Operators

        public IObservable<Cursor> EnqueueAsync(EnqueueRequest request)
        {
            if (this.Connected)
            {
                return Observable.Defer(() => this.queue.EnqueueAsync(request).SubscribeOn(this.Scheduler));
            }

            return Observable.Never<Cursor>();
        }

        public Task<IReadOnlyList<IQueueMessage>> ReadQueueAsync(Cursor cursor, int count)
        {
            // TODO: return Observable.Defer(() => this.queue.ReadQueueAsync(cursor, count).SubscribeOn(this.Scheduler));
            return this.queue.ReadQueueAsync(cursor, count);
        }

        #endregion
    }
}