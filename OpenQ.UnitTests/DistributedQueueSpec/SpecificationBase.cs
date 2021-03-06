﻿namespace OpenQ.UnitTests.DistributedQueueSpec
{
    using System;
    using System.Collections.Generic;

    using Microsoft.Reactive.Testing;
    using Microsoft.VisualStudio.TestTools.UnitTesting;

    using OpenQ.Core;
    using OpenQ.Core.Messages;

    [TestClass]
    public abstract class SpecificationBase
    {
        #region Public Properties


        public ITestableObserver<Tuple<string, IQueueMessage>> SaveRecorder { get; set; }

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
            this.SaveRecorder = this.Scheduler.CreateObserver<Tuple<string, IQueueMessage>>();
            this.ConnectionRecorder = this.Scheduler.CreateObserver<long>();
            this.Storage = new DictionaryStorage(this.Scheduler);
            this.Queue = this.GivenQueue();
            this.Peers = this.GivenPeers();

            foreach (var p in this.Peers)
            {
                p.Connect().Subscribe(this.ConnectionRecorder);
            }

            using (this.Storage.Saves.Subscribe(this.SaveRecorder))
            {
                using (this.Queue.Accepted.Subscribe(this.AcceptedRecorder))
                {
                    this.Queue.Configure(this.Peers);
                    this.RunTest();
                }
            }
        }

        public IObserver<long> ConnectionRecorder { get; set; }

        public IReadOnlyList<IPeer> Peers { get; set; }

        protected virtual DistributedQueue GivenQueue()
        {
            return new DistributedQueue("node1", "topic", this.Storage, this.Scheduler);
        }

        public DictionaryStorage Storage { get; set; }

        protected abstract void RunTest();

        #endregion

        #region Methods

        protected abstract IReadOnlyList<IPeer> GivenPeers();

        protected abstract IEnumerable<IQueueMessage> GivenMessages();

        #endregion
    }
}