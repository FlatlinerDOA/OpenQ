namespace OpenQ.Core
{
    using System;

    public sealed class Peer
    {
        #region Public Properties

        public Guid Id { get; set; }

        public byte[] PublicKey { get; set; }

        #endregion

        #region Public Methods and Operators

        public DistributedQueue<T> Open<T>(string queue) where T : IQueueMessage
        {
            return null;
        }

        #endregion
    }
}