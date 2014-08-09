namespace OpenQ.UnitTests
{
    using System;

    using OpenQ.Core;

    /// <summary>
    /// Wraps a peer server for testing purposes. 
    /// Also will allow us to tear the virtual network to shreds for failure testing.
    /// </summary>
    public sealed class TestPeerClient : IPeer
    {
        private readonly IPeerServer peerServer;

        public TestPeerClient(IPeerServer peerServer)
        {
            this.peerServer = peerServer;
        }

        public string Id
        {
            get
            {
                return this.peerServer.Id;
            }
        }

        public IObservable<long> Connect()
        {
            return this.peerServer.Connect();
        }

        public IDistributedQueue Open(string topic)
        {
            return this.peerServer.Open(topic);
        }
    }
}