namespace OpenQ.Core
{
    using System;
    using System.Collections.Generic;

    public interface IPeer
    {
        #region Public Methods and Operators

        string Id { get; }

        /// <summary>
        /// Connects to the peer and maintains a heartbeat that can be used as a virtual clock for leases
        /// </summary>
        /// <returns></returns>
        IObservable<long> Connect();

        /// <summary>
        /// 
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="topic"></param>
        /// <returns></returns>
        IDistributedQueue<T> Open<T>(string topic) where T : IQueueMessage;

        #endregion
    }

    public interface IPeerServer : IPeer
    {
        void Configure(IReadOnlyList<IPeer> quorumPeersList);
    }
}