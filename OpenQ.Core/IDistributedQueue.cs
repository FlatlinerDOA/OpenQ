namespace OpenQ.Core
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;

    public interface IDistributedQueue<T> where T : IQueueMessage
    {
        #region Public Methods and Operators

        Task<Cursor> EnqueueAsync(IReadOnlyList<T> values, Cursor cursor, Guid[] excludePeerIds);

        IObservable<Cursor> Accepted { get; }

        Task<IReadOnlyList<T>> ReadQueueAsync(Cursor cursor, int count);

        #endregion
    }
}