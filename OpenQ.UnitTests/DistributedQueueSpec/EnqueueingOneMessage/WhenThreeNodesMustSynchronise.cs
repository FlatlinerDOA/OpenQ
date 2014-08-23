namespace OpenQ.UnitTests.DistributedQueueSpec.EnqueueingOneMessage
{
    using System.Collections.Generic;

    using Microsoft.Reactive.Testing;
    using Microsoft.VisualStudio.TestTools.UnitTesting;

    using OpenQ.Core;

    [TestClass]
    public sealed class WhenTwoNodesMustSynchronise : GivenAThreeNodeQuorum
    {
        #region Static Fields

        private static readonly TestMessage Message = new TestMessage(1, "data");

        #endregion

        #region Public Methods and Operators

        [TestMethod]
        public void AcceptanceComesImmediatelyAfterResponse()
        {
            this.AcceptedRecorder.Messages.AssertEqual(ReactiveTest.OnNext(3, new Cursor(this.Queue.Id, Message.MessageId, 1)));
        }

        [TestMethod]
        public void ResponseComesAfterOneOfThePeersStores()
        {
            this.ResponseRecorder.Messages.AssertEqual(
                ReactiveTest.OnNext(2, new Cursor(this.Queue.Id, Message.MessageId, 1)),
                ReactiveTest.OnCompleted<Cursor>(2));
        }

        public override EnqueueRequest When()
        {
            return new EnqueueRequest(new Cursor("client", Message.MessageId, 0), Message);
        }

        #endregion

        #region Methods

        protected override IEnumerable<IQueueMessage> GivenMessages()
        {
            yield break;
        }

        #endregion
    }
}