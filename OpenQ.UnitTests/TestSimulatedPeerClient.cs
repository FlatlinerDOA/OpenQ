namespace OpenQ.UnitTests
{
    using System;
    using System.Collections.Generic;
    using System.Reactive.Concurrency;
    using System.Reactive.Linq;

    using OpenQ.Core;

    public sealed class TestSimulatedPeerClient : IPeer
    {
        #region Constructors and Destructors

        public TestSimulatedPeerClient(string id, IScheduler scheduler)
        {
            this.Id = id;
            this.Scheduler = scheduler;
            this.OnConnect = new long[] { };
        }

        #endregion

        #region Public Properties

        public string Id { get; private set; }

        public IList<long> OnConnect { get; private set; }

        public IScheduler Scheduler { get; private set; }

        #endregion

        #region Public Methods and Operators

        public IObservable<long> Connect()
        {
            return Observable.Start(() => this.Scheduler.Now.Ticks, this.Scheduler);
        }

        public IDistributedQueue Open(string topic)
        {
            return new TestDistributedQueueClient(new DistributedQueue(this.Id, topic, new DictionaryStorage(this.Scheduler), this.Scheduler), this.Scheduler);
        }

        #endregion
    }
}