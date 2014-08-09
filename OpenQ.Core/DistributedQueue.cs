namespace OpenQ.Core
{
    using System;
    using System.Collections.Generic;
    using System.Data;
    using System.Linq;
    using System.Reactive;
    using System.Reactive.Concurrency;
    using System.Reactive.Linq;
    using System.Reactive.Subjects;
    using System.Reactive.Threading.Tasks;
    using System.Threading;
    using System.Threading.Tasks;

    public sealed class DistributedQueue : IDistributedQueue
    {
        #region Fields

        private readonly ReplaySubject<Cursor> accepted;

        private readonly string id;

        private readonly string topic;

        private readonly IStorage storage;

        private readonly object syncRoot = new object();

        private Cursor currentCursor;

        private bool online = false;

        private IReadOnlyList<IPeer> peers = new List<IPeer>();

        private IReadOnlyList<Cursor> peerCursors = new List<Cursor>(); 
        #endregion

        #region Constructors and Destructors

        public DistributedQueue(string peerId, string topic, IStorage storage, IScheduler scheduler)
        {
            this.id = peerId;
            this.Scheduler = scheduler;
            this.topic = topic;
            this.storage = storage;
            this.accepted = new ReplaySubject<Cursor>(this.Scheduler);
            this.currentCursor = Cursor.Empty(this.id);
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

            foreach (var peer in this.peers)
            {
                var q = peer.Open(this.topic);
                // TODO: Load or Store cursor positions? 
                // TODO: Is it part of the queue's responsibility to initialize this? 
                // TODO: What if the queue's are out of sync?
            }
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

        public Task<IReadOnlyList<IQueueMessage>> ReadQueueAsync(Cursor cursor, int count)
        {
            return Task.FromResult<IReadOnlyList<IQueueMessage>>(new List<IQueueMessage>());
        }

        public IScheduler Scheduler { get; private set; }

        #endregion

        #region Public Methods and Operators

        /// <summary>
        /// Enqueues zero or more values and returns an accept token.
        /// </summary>
        /// <param name="values">A list of zero or more items. An empty list can be used to verify the current version of the queue without modification, 
        /// calling commit is not necessary in this case.</param>
        /// <param name="desired">(Optional) The expected version of the latest item in the queue, or null if append semantics are desired.</param>
        /// <param name="excludePeerIds"></param>
        /// <exception cref="ConflictException">Thrown if the queue has already been written to with that version with a different request id.</exception>
        /// <returns>Returns this peer's cursor post enqueue</returns>
        public async Task<Cursor> EnqueueAsync(IReadOnlyList<IQueueMessage> values, Cursor desired, string[] excludePeerIds)
        {
            if (!this.currentCursor.IsCompatibleWith(desired))
            {
                throw new ConflictException(string.Format("Could not write to {0} ({1}) as {2} was at {3}", this.topic, desired.Sequence, this.Id, this.currentCursor.Sequence));
            }

            int storeCount = 0;
            int minimumAcceptCount;
            IReadOnlyList<IPeer> peerList;
            lock (this.syncRoot)
            {
                minimumAcceptCount = (int)Math.Floor(this.peers.Count / 2M) + 1;
                peerList = this.peers.Where(d => !excludePeerIds.Contains(d.Id)).ToList();
            }

            var stored = new List<IObservable<Cursor>>
                         {
                             this.StoreValuesAsync(values).Select(c => this.currentCursor)
                         };
            stored.AddRange(
                peerList.Select(
                    peer => from remoteCursor in Observable.FromAsync(
                            c =>
                            {
                                var peerQueue = peer.Open(this.topic);
                                return peerQueue.EnqueueAsync(values, desired, excludePeerIds);
                            })
                            select remoteCursor));

            await stored.Merge().Timeout(TimeSpan.FromSeconds(10)).SelectMany(
                t =>
                {
                    if (!t.IsCompatibleWith(desired))
                    {
                        throw new ConflictException(string.Format("Could not write to {0} ({1}) as {2} was at {3}", this.topic, desired.Sequence, t.Subscriber, t.Sequence));
                    }

                    if (Interlocked.Increment(ref storeCount) < minimumAcceptCount)
                    {
                        return Observable.Empty<Cursor>();
                    }

                    var accept = new Cursor(this.id, desired.MessageId, desired.Sequence);
                    return this.WriteAcceptanceAsync(accept);
                }); 
            return this.currentCursor;
        }

        #endregion

        #region Methods

        private IObservable<Cursor> WriteAcceptanceAsync(Cursor cursor)
        {
            return Observable.FromAsync(c2 => this.storage.SaveAsync(this.topic + "/" + cursor.Sequence, cursor, c2)).Select(_ =>
            {
                this.currentCursor = cursor;
                this.accepted.OnNext(cursor);
                return cursor;
            });
        }

        private IObservable<Unit> StoreValuesAsync(IReadOnlyList<IQueueMessage> values)
        {
            return values.ToObservable().SelectMany(v => Observable.FromAsync(c => this.storage.SaveAsync(this.topic + "/" + v.MessageId, v, c)));
        }

        #endregion
    }
}