namespace OpenQ.UnitTests.DistributedQueueSpec
{
    using System.Collections.Generic;

    using Microsoft.Reactive.Testing;
    using Microsoft.VisualStudio.TestTools.UnitTesting;

    using OpenQ.Core;

    [TestClass]
    public abstract class SpecificationBase
    {
        #region Public Properties

        public ITestableObserver<Cursor> AcceptedRecorder { get; set; }

        public DistributedQueue Queue { get; set; }

        public TestScheduler Scheduler { get; private set; }

        #endregion

        #region Public Methods and Operators

        [TestInitialize]
        public void InitializeTest()
        {
            this.Scheduler = new TestScheduler();
            this.AcceptedRecorder = this.Scheduler.CreateObserver<Cursor>();
            this.Queue = new DistributedQueue("peerid", "topicid", new DictionaryStorage(this.Scheduler), this.Scheduler);
            this.Queue.Configure(this.GivenPeers());
            this.Queue.Accepted.Subscribe(this.AcceptedRecorder);
        }

        #endregion

        #region Methods

        protected abstract IReadOnlyList<IPeer> GivenPeers();

        #endregion
    }
}