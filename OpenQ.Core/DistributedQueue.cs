namespace OpenQ.Core
{
    using System;
    using System.Collections.Generic;
    using System.Reactive;
    using System.Security.Cryptography.X509Certificates;
    using System.Threading.Tasks;

    public class DistributedQueue<T>
    {
        private object syncRoot = new object();

        private readonly string queue;

        private IReadOnlyList<byte[]> peerPublicKeys;

        public DistributedQueue(string queue, byte[] privateKey)
        {
            this.queue = queue;
            var cert = new X509Certificate2(privateKey);
        }

        public byte[] PublicKey { get; private set; }

        public void SetPeers(IReadOnlyList<byte[]> peerPublicKeys)
        {
            this.peerPublicKeys = peerPublicKeys;
        }

        public Task LoadAsync()
        {
            return Task.Delay(0);
        }

        public Task<string> EnqueueAsync<T>(IEnumerable<T> values, int expectedVersion)
        {

        }


        protected virtual Task StoreAsync(IEnumerable<T> values)
        {
            return Task.Delay(0);
        }

        public Task CommitAsync(string acceptToken)
        {
            
        }

        public string IssueToken()
        {
        }
    }
}