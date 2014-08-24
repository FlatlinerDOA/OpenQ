namespace OpenQ.UnitTests.DistributedQueueSpec.EnqueueingOneMessage
{
    using System.Collections.Generic;
    using System.Reactive.Linq;
    using System.Threading.Tasks;

    using Microsoft.Reactive.Testing;
    using Microsoft.VisualStudio.TestTools.UnitTesting;

    using OpenQ.Core;
    using OpenQ.Core.Messages;

    [TestClass]
    public sealed class WhenNoPeerSynchronisationIsNecessary : GivenZeroPeers
    {
        private static readonly TestMessage Message = new TestMessage(1, "data");

        #region Public Methods and Operators

        [TestMethod]
        public void AcceptanceComesImmediatelyAfterResponse()
        {
            this.AcceptedRecorder.Messages.AssertEqual(
                ReactiveTest.OnNext(2, new Cursor(this.Queue.Id, Message.MessageId, 1)));
        }

        [TestMethod]
        public void TheResponseComesAfterStorage()
        {
            this.ResponseRecorder.Messages.AssertEqual(
                ReactiveTest.OnNext(1, new Cursor(this.Queue.Id, Message.MessageId, 1)),
                ReactiveTest.OnCompleted<Cursor>(1));
        }

        #endregion

        protected override IEnumerable<IQueueMessage> GivenMessages()
        {
            yield break;
        }

        public override EnqueueRequest When()
        {
            return new EnqueueRequest(new Cursor("client", Message.MessageId, 0), Message);
        }
    }
}