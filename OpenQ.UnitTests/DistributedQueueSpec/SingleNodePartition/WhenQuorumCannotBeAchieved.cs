namespace OpenQ.UnitTests.DistributedQueueSpec.SingleNodePartition
{
    using System;
    using System.Collections.Generic;

    using Microsoft.Reactive.Testing;
    using Microsoft.VisualStudio.TestTools.UnitTesting;

    using OpenQ.Core;

    [TestClass]
    public sealed class WhenQuorumCannotBeAchieved : GivenAThreeNodeQuorum
    {
        private static readonly TestMessage Message = new TestMessage(1, "data");

        protected override IReadOnlyList<IPeer> GivenPeers()
        {
            return new List<IPeer>
                   {
                       new TestSimulatedPeerClient("node2", this.Scheduler)
                       {
                           DisconnectAtSchedule = 2
                       },
                       new TestSimulatedPeerClient("node3", this.Scheduler),
                   };
        }

        protected override IEnumerable<IQueueMessage> GivenMessages()
        {
            yield break;
        }

        #region Public Methods and Operators

        public override EnqueueRequest When()
        {
            return new EnqueueRequest(new Cursor("client", Message.MessageId, 1));
        }

        #endregion

        [TestMethod]
        public void ThenATimeoutExceptionOccurs()
        {
            this.ResponseRecorder.Messages.AssertEqual(
                ReactiveTest.OnError<Cursor>(TimeSpan.FromSeconds(10).Ticks, new TimeoutException()));
        }
    }
}