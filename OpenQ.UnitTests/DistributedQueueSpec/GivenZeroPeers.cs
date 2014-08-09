namespace OpenQ.UnitTests.DistributedQueueSpec
{
    using System.Collections.Generic;

    using OpenQ.Core;

    public abstract class GivenZeroPeers : SpecificationBase
    {
        #region Methods

        protected override IReadOnlyList<IPeer> GivenPeers()
        {
            return new List<IPeer>();
        }

        #endregion
    }
}