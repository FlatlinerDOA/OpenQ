namespace OpenQ.Core
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Reactive;
    using System.Reactive.Concurrency;
    using System.Reactive.Linq;
    using System.Reactive.Subjects;
    using System.Reactive.Threading.Tasks;
    using System.Threading;
    using System.Threading.Tasks;

    public class DistributedQueue<T> : IDistributedQueue<T>
        where T : IQueueMessage
    {
        #region Fields

        private readonly ReplaySubject<Cursor> accepted;

        private readonly string id;

        private readonly string topic;

        private readonly IStorage storage;

        private readonly object syncRoot = new object();

        private Cursor currentCursor = null;

        private bool online = false;

        private IReadOnlyList<IPeer> peers = new List<IPeer>();

        #endregion

        #region Constructors and Destructors

        public DistributedQueue(string peerId, string topic, IStorage storage, IScheduler scheduler)
        {
            this.id = peerId;
            this.Scheduler = scheduler;
            this.topic = topic;
            this.storage = storage;
            this.accepted = new ReplaySubject<Cursor>(this.Scheduler);
            // TODO: var cert = new X509Certificate2(privateKey);
        }

        #endregion

        ////public byte[] PublicKey { get; private set; }

        public void Configure(IReadOnlyList<IPeer> newPeerList)
        {
            lock (this.syncRoot)
            {
                this.peers = newPeerList;
            }

            // TODO: Load or Store cursor positions? 
            // TODO: Is it part of the queue's responsibility to initialize this? 
            // TODO: What if the queue's are out of sync?
        }

        #region Public Properties

        public string Id
        {
            get
            {
                return this.id;
            }
        }

        public IObservable<Cursor> Accepted
        {
            get
            {
                return this.accepted;
            }
        }

        public Task<IReadOnlyList<T>> ReadQueueAsync(Cursor cursor, int count)
        {
            return Task.FromResult<IReadOnlyList<T>>(new List<T>());
        }

        public IScheduler Scheduler { get; private set; }

        #endregion

        #region Public Methods and Operators

        /// <summary>
        /// Enqueues zero or more values and returns an accept token.
        /// </summary>
        /// <param name="values">A list of zero or more items. An empty list can be used to verify the current version of the queue without modification, 
        /// calling commit is not necessary in this case.</param>
        /// <param name="current">(Optional) The expected version of the latest item in the queue, or null if append semantics are desired.</param>
        /// <param name="excludePeerIds"></param>
        /// <exception cref="ConflictException">Thrown if the queue has already been written to with that version with a different request id.</exception>
        /// <returns>Returns this peer's cursor post enqueue</returns>
        public Task<Cursor> EnqueueAsync(IReadOnlyList<T> values, Cursor current, string[] excludePeerIds)
        {
            int storeCount = 0;
            int minimumAcceptCount;
            var accept = new Cursor(this.id, current.MessageId, current.Sequence);
            IReadOnlyList<IPeer> peerList;
            lock (this.syncRoot)
            {
                minimumAcceptCount = (int)Math.Floor(this.peers.Count / 2M) + 1;
                peerList = this.peers.Where(d => !excludePeerIds.Contains(d.Id)).ToList();
            }

            var stored = new List<IObservable<Unit>>
                         {
                             this.StoreValuesAsync(values)
                         };
            stored.AddRange(
                peerList.Select(
                    peer => from _ in Observable.FromAsync(
                            c =>
                            {
                                var peerQueue = peer.Open<T>(this.topic);
                                return peerQueue.EnqueueAsync(values, current, excludePeerIds);
                            })
                            from __ in Observable.Defer(
                                () =>
                                {
                                    if (Interlocked.Increment(ref storeCount) < minimumAcceptCount)
                                    {
                                        return Observable.Empty<Unit>();
                                    }

                                    return Observable.FromAsync(c2 => this.storage.SaveAsync(this.topic + "/" + current.Sequence, current, c2));
                                })
                            select new Unit()));

            stored.Merge(this.Scheduler).ToTask(); 
            return accept;
        }

        #endregion

        #region Methods

        private IObservable<Unit> StoreValuesAsync(IReadOnlyList<T> values)
        {
            return values.ToObservable().SelectMany(v => Observable.FromAsync(c => this.storage.SaveAsync(this.topic + "/" + v.MessageId, v, c)));
        }

        #endregion
    }
}