namespace OpenQ.Core
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Reactive;
    using System.Threading.Tasks;

    public class DistributedQueue<T>
    {
        private readonly Guid id = Guid.NewGuid();

        private readonly object syncRoot = new object();

        private readonly string queue;

        private readonly IStorage<T> storage;

        private IReadOnlyList<Peer> peers = new List<Peer>();

        public DistributedQueue(string queue, IStorage<T> storage, byte[] privateKey)
        {
            this.queue = queue;
            this.storage = storage;
            // TODO: var cert = new X509Certificate2(privateKey);
        }

        ////public byte[] PublicKey { get; private set; }

        public void SetPeers(IReadOnlyList<Peer> newPeersList)
        {
            lock (this.syncRoot)
            {
                this.peers = newPeersList;
            }
        }

        /// <summary>
        /// Enqueues zero or more values and returns an accept token.
        /// </summary>
        /// <param name="values">A list of zero or more items. An empty list can be used to verify the current version of the queue without modification, 
        /// calling commit is not necessary in this case.</param>
        /// <param name="expectedVersion">The expected version of the latest item in the queue, or zero if append semantics are desired.</param>
        /// <param name="accepted">The list of responses for peers that have already accepted this request</param>
        /// <exception cref="ConflictException">Thrown if the queue has already been written to with that version with a different request id.</exception>
        /// <returns>Returns an accept token</returns>
        public async Task<AcceptToken> EnqueueAsync(IReadOnlyList<T> values, long expectedVersion, IReadOnlyList<AcceptToken> accepted)
        {
            int acceptCount = 0;
            int minimumAcceptCount;
            var accept = new AcceptToken { PeerId = this.id };
            Dictionary<Guid, Peer> peerList;
            lock (this.syncRoot)
            {
                minimumAcceptCount = (int)Math.Floor(this.peers.Count / 2M) + 1;
                peerList = this.peers.ToDictionary(d => d.Id);
            }

            foreach (var acceptedToken in accepted)
            {
                // TODO: Validate accept tokens are valid and correspond to my peers.
                // Let's determine if this will be an autocommit or a forward.
                acceptCount++;
                peerList.Remove(acceptedToken.PeerId);
                accept.RequestId = acceptedToken.RequestId;
                if (acceptCount >= minimumAcceptCount)
                {
                    // Just store and return an accept token
                    await CommitValues(values, expectedVersion);
                    return accept;
                }
            }

            if (accept.RequestId == Guid.Empty)
            {
                accept.RequestId = Guid.NewGuid();
            }

            var tokenList = new List<AcceptToken>(accepted) { accept };
            foreach (var peer in peerList.Values)
            {
                var peerQueue = peer.Open<T>(this.queue);
                var responseToken = await peerQueue.EnqueueAsync(values, expectedVersion, tokenList);
                
                // TODO: Validate accept token
                acceptCount++;
                if (acceptCount >= minimumAcceptCount)
                {
                    // Just store and return an accept token
                    await CommitValues(values, expectedVersion);
                    return accept;
                }

                tokenList.Add(responseToken);
            }

            return accept;
        }

        public Task<IReadOnlyList<T>> ReadQueueAsync(long start, long count)
        {
            return Task.FromResult<IReadOnlyList<T>>(new List<T>());
        }

        private async Task CommitValues(IReadOnlyList<T> values, long expectedVersion)
        {
            for (int i = 0; i < expectedVersion + values.Count; i++)
            {
                await this.storage.SaveAsync(this.queue + "/" + i, values[i]);
            }
        }
    }

    public class Peer
    {
        public Guid Id { get; set; }

        public byte[] PublicKey { get; set; }

        public DistributedQueue<T> Open<T>(string queue)
        {
            return null;
        }
    }

    public sealed class AcceptToken
    {
        public Guid PeerId { get; set; }

        public Guid RequestId { get; set; }

        public byte[] Signature { get; set; }
    }
}