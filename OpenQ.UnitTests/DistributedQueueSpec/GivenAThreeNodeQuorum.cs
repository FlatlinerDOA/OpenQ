namespace OpenQ.UnitTests.DistributedQueueSpec
{
    using System.Collections.Generic;

    using OpenQ.Core;

    public abstract class GivenAThreeNodeQuorum : EnqueueingSpecification
    {
        #region Methods

        protected override IReadOnlyList<IPeer> GivenPeers()
        {
            return new List<IPeer>
                   {
                       new TestSimulatedPeerClient("node2", this.Scheduler),
                       new TestSimulatedPeerClient("node3", this.Scheduler),
                   };
        }

        #endregion
    }
}