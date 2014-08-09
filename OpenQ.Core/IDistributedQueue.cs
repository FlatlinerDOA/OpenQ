namespace OpenQ.Core
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;

    public interface IDistributedQueue
    {
        #region Public Methods and Operators

        Task<Cursor> EnqueueAsync(IReadOnlyList<IQueueMessage> values, Cursor cursor, string[] excludePeerIds);

        IObservable<Cursor> Accepted { get; }

        Task<IReadOnlyList<IQueueMessage>> ReadQueueAsync(Cursor cursor, int count);

        #endregion
    }
}