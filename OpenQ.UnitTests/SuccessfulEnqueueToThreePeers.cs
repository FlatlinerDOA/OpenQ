namespace OpenQ.UnitTests
{
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Reactive;
    using System.Reactive.Concurrency;

    using Microsoft.Reactive.Testing;
    using Microsoft.VisualStudio.TestTools.UnitTesting;

    using OpenQ.Core;

    public sealed class SuccessfulEnqueueToThreePeers
    {
        #region Fields

        private ITestableObserver<Cursor> acceptedRecorder;

        private TestScheduler test;

        private List<PeerServer> peers;

        #endregion

        #region Public Methods and Operators

        [TestMethod]
        public void AcceptedAfterQuorum()
        {
            ////ReactiveAssert.AreElementsEqual(
            ////    this.acceptedRecorder.Messages, 
            ////    ReactiveTest.OnNext(1, ));
        }

        [TestInitialize]
        public void InitializeTest()
        {
            this.test = new TestScheduler();
            this.acceptedRecorder = this.test.CreateObserver<Cursor>();
            this.peers = new List<PeerServer>()
                        {
                            new PeerServer(new DictionaryStorage(this.test), this.test),
                            new PeerServer(new DictionaryStorage(this.test), this.test),
                            new PeerServer(new DictionaryStorage(this.test), this.test),
                        };

            var router = new PeerRouter(this.peers);
            router.Start(this.test);
        }

        #endregion
    }

    public sealed class PeerRouter
    {
        private readonly IReadOnlyList<IPeerServer> peers;

        public PeerRouter(IReadOnlyList<IPeerServer> peers)
        {
            this.peers = peers;
        }

        public void Start(IScheduler scheduler)
        {
            foreach (var peer in this.peers)
            {
                var peerId = peer.Id;
                peer.Configure(this.peers.Where(p => p.Id != peerId).ToList());
            }
        }
    }
}