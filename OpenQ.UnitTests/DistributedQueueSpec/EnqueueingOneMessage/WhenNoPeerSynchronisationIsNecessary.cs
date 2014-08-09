namespace OpenQ.UnitTests.DistributedQueueSpec.EnqueueingOneMessage
{
    using System.Collections.Generic;
    using System.Threading.Tasks;

    using Microsoft.Reactive.Testing;
    using Microsoft.VisualStudio.TestTools.UnitTesting;

    using OpenQ.Core;

    [TestClass]
    public sealed class WhenNoPeerSynchronisationIsNecessary : GivenZeroPeers
    {
        #region Public Methods and Operators

        [TestMethod]
        public async Task AcceptanceIsImmediate()
        {
            var message = new TestMessage(1, "data");
            var list = new List<IQueueMessage>() { message };

            this.Scheduler.AdvanceTo(1);
            await this.Queue.EnqueueAsync(list, Cursor.Empty("testclient"), new string[0]);
            this.Scheduler.AdvanceTo(2);
            var expected = new Cursor(this.Queue.Id, message.MessageId, 1);
            this.AcceptedRecorder.Messages.AssertEqual(ReactiveTest.OnNext(1, expected));
        }

        #endregion
    }
}