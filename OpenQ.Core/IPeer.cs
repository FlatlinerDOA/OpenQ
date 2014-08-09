namespace OpenQ.Core
{
    using System;

    public interface IPeer
    {
        #region Public Methods and Operators

        Uri Address { get; }

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
}