namespace OpenQ.UnitTests.DistributedQueueSpec.SingleNodePartition
{
    using System;
    using System.Collections.Generic;

    using Microsoft.VisualStudio.TestTools.UnitTesting;

    using OpenQ.Core;

    [TestClass]
    public sealed class WhenQuorumHasBeenAchievedOnTheOppositeSideOfAPartition : GivenAThreeNodeQuorum
    {
        private static readonly TestMessage Message = new TestMessage(1, "data");

        #region Public Methods and Operators

        public override EnqueueRequest When()
        {
            throw new NotImplementedException();
        }

        #endregion

        #region Methods

        protected override IEnumerable<IQueueMessage> GivenMessages()
        {
            throw new NotImplementedException();
        }

        #endregion
    }
}