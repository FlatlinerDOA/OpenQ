namespace OpenQ.UnitTests.DistributedQueueSpec.EnqueueingOneMessage
{
    using System;
    using System.Collections.Generic;
    using System.Reactive.Linq;
    using System.Threading.Tasks;

    using Microsoft.Reactive.Testing;
    using Microsoft.VisualStudio.TestTools.UnitTesting;

    using OpenQ.Core;

    [TestClass]
    public sealed class WhenTwoNodesMustSynchronise : GivenTwoPeers
    {
        private static readonly TestMessage Message = new TestMessage(1, "data");

        #region Public Methods and Operators

        [TestMethod]
        public void AcceptanceOccursImmediatelyAfterResponse()
        {
            this.AcceptedRecorder.Messages.AssertEqual(ReactiveTest.OnNext(3, new Cursor(this.Queue.Id, Message.MessageId, 1)));
        }

        [TestMethod]
        public void ResponseComesAfterOnePeerStores()
        {
            this.ResponseRecorder.Messages.AssertEqual(
                ReactiveTest.OnNext(2, new Cursor(this.Queue.Id, Message.MessageId, 1)),
                ReactiveTest.OnCompleted<Cursor>(2));
        }

        #endregion

        protected override IEnumerable<IQueueMessage> GivenMessages()
        {
            yield break;
        }

        public override EnqueueRequest When()
        {
            return new EnqueueRequest(new Cursor("testclient", Message.MessageId, 0), Message);
        }
    }
}