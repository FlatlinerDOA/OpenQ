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
    using OpenQ.Core.Messages;

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

            var clients = this.peers.Select(p => new TestPeerClient(p)).ToList();
            foreach (var peer in this.peers)
            {
                peer.StartAsync(clients);
            }
        }

        #endregion
    }
}