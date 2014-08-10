namespace OpenQ.Core
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;

    public interface IDistributedQueue
    {
        #region Public Methods and Operators

        IObservable<Cursor> EnqueueAsync(EnqueueRequest request);

        IObservable<Cursor> Accepted { get; }

        Task<IReadOnlyList<IQueueMessage>> ReadQueueAsync(Cursor cursor, int count);

        #endregion
    }
}