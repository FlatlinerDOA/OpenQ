namespace OpenQ.Core
{
    using System;

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
        /// <param name="topic"></param>
        /// <returns></returns>
        IDistributedQueue Open(string topic);

        #endregion
    }
}