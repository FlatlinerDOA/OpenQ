namespace OpenQ.Core
{
    using System;
    using System.Collections.Generic;
    using System.Reactive.Concurrency;
    using System.Reactive.Disposables;
    using System.Reactive.Linq;
    using System.Threading.Tasks;

    public sealed class PeerServer : IPeerServer
    {
        private volatile bool online;
        
        private readonly object syncRoot = new object();

        private IReadOnlyList<IPeer> peers;

        private readonly IStorage storage;

        private readonly IScheduler scheduler;

        private readonly MultipleAssignmentDisposable subscriptions = new MultipleAssignmentDisposable();

        public PeerServer(IStorage storage, IScheduler scheduler)
        {
            this.storage = storage;
            this.scheduler = scheduler;
        }

        public Task StartAsync(IReadOnlyList<IPeer> quorumPeersList)
        {
            lock (this.syncRoot)
            {
                this.online = false;
                this.peers = quorumPeersList;
            }

            var d = new CompositeDisposable();
            foreach (var peer in this.peers)
            {
                // TODO: Peer heartbeat checking for liveness.
                d.Add(peer.Connect().Subscribe());
            }

            this.subscriptions.Disposable = d;
            lock (this.syncRoot)
            {
                this.online = true;
            }

            return Task.Delay(0);
        }

        public Task StopAsync()
        {
            this.subscriptions.Disposable = Disposable.Empty;
            return Task.Delay(0);
        }

        #region Public Properties

        public string Id { get; set; }

        public byte[] PublicKey { get; set; }

        #endregion

        #region Public Methods and Operators

        public IObservable<long> Connect()
        {
            return Observable.Timer(TimeSpan.FromSeconds(2), this.scheduler);
        }

        public IDistributedQueue Open(string topic)
        {
            if (!this.online)
            {
                throw new InvalidOperationException("This peer is offline");
            }

            var d = new DistributedQueue(this.Id, topic, this.storage, this.scheduler);
            d.Configure(this.peers);
            return d;
        }

        #endregion
    }
}