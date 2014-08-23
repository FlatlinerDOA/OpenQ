namespace OpenQ.Core
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Reactive;
    using System.Reactive.Concurrency;
    using System.Reactive.Linq;
    using System.Reactive.Subjects;
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
        /// <exception cref="ConflictException">Thrown if the queue has already been written to with that version with a different request id.</exception>
        /// <returns>Returns this peer's cursor post enqueue</returns>
        public IObservable<Cursor> EnqueueAsync(EnqueueRequest request)
        {
            int minimumAcceptCount;
            Cursor proposedCursor;
            IReadOnlyList<IPeer> peerList;
            var exclusionList = new HashSet<string>(request.ExcludePeerIds) { this.id };
            lock (this.syncRoot)
            {
                if (!this.currentCursor.IsCompatibleWith(request.DesiredCursor))
                {
                    throw new ConflictException(string.Format("Could not write to {0} ({1}) as {2} was at {3}", this.topic, request.DesiredCursor.Sequence, this.Id, this.currentCursor.Sequence));
                }

                minimumAcceptCount = (int)Math.Floor(this.peers.Count / 2M) + 1;
                peerList = this.peers.Where(d => !exclusionList.Contains(d.Id)).ToList();
                proposedCursor = this.currentCursor.Next(request.DesiredCursor.MessageId);
            }

            int storeCount = 0;
            var stored = new List<IObservable<Cursor>>
                         {
                             this.StoreValuesAsync(request.Messages).Select(c => this.currentCursor)
                         };

            var forwardRequest = new EnqueueRequest(proposedCursor, request.Messages, exclusionList);
            stored.AddRange(
                peerList.Select(
                    peer => from remoteCursor in Observable.Defer(
                            () =>
                            {
                                var peerQueue = peer.Open(this.topic);
                                return peerQueue.EnqueueAsync(forwardRequest);
                            }).DefaultIfEmpty(Cursor.Empty(peer.Id))
                            select remoteCursor));

            return stored.Merge().Timeout(TimeSpan.FromSeconds(100)).SelectMany(
                t =>
                {
                    if (!t.IsCompatibleWith(request.DesiredCursor))
                    {
                        return Observable.Throw<Cursor>(new ConflictException(string.Format("Could not write to {0} ({1}) as {2} was at {3}", this.topic, request.DesiredCursor.Sequence, t.Subscriber, t.Sequence)));
                    }

                    if (Interlocked.Increment(ref storeCount) == minimumAcceptCount)
                    {
                        return this.WriteAcceptanceAsync(proposedCursor);
                    }

                    return Observable.Empty<Cursor>();
                }); 
        }

        #endregion

        #region Methods

        private IObservable<Cursor> WriteAcceptanceAsync(Cursor cursor)
        {
            return Observable.FromAsync(c2 => this.storage.SaveAsync(this.topic + "/c/" + cursor.Sequence, cursor, c2)).Select(_ =>
            {
                lock (this.syncRoot)
                {
                    this.currentCursor = cursor;
                }

                this.accepted.OnNext(cursor);
                return cursor;
            });
        }

        private IObservable<Unit> StoreValuesAsync(IReadOnlyList<IQueueMessage> values)
        {
            return values.ToObservable().SelectMany(v => Observable.FromAsync(c => this.storage.SaveAsync(this.topic + "/m/" + v.MessageId, v, c)));
        }

        #endregion
    }
}