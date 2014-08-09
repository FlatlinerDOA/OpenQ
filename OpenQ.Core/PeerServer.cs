namespace OpenQ.Core
{
    using System;
    using System.Collections.Generic;
    using System.Reactive.Concurrency;

    public sealed class PeerServer : IPeerServer
    {
        private volatile bool online;
        
        private readonly object syncRoot = new object();

        private IReadOnlyList<IPeer> peers;

        private readonly IStorage storage;

        private readonly IScheduler scheduler;

        public PeerServer(IStorage storage, IScheduler scheduler)
        {
            this.storage = storage;
            this.scheduler = scheduler;
        }

        public void Configure(IReadOnlyList<IPeer> quorumPeersList)
        {
            lock (this.syncRoot)
            {
                this.online = false;
                this.peers = quorumPeersList;
            }


            lock (this.syncRoot)
            {
                this.online = true;
            }
        }

        #region Public Properties

        public string Id { get; set; }

        public byte[] PublicKey { get; set; }

        #endregion

        #region Public Methods and Operators

        public Uri Address { get; private set; }

        public IObservable<long> Connect()
        {
            throw new NotImplementedException();
        }

        public IDistributedQueue<T> Open<T>(string topic) where T : IQueueMessage
        {
            if (!this.online)
            {
                throw new InvalidOperationException("This peer is offline");
            }

            var d = new DistributedQueue<T>(this.Id, topic, this.storage, this.scheduler);
            d.Configure(this.peers);
            return d;
        }

        #endregion
    }
}