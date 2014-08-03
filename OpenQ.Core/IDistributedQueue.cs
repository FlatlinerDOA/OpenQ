namespace OpenQ.Core
{
    using System.Collections.Generic;
    using System.Threading.Tasks;

    public interface IDistributedQueue<T>
    {
        #region Public Methods and Operators

        Task<Cursor> EnqueueAsync(T[] values, Cursor cursor);

        Task UpdateCursorAsync(Cursor cursor);

        Task<IReadOnlyList<T>> ReadQueueAsync(long start, int count);

        #endregion
    }
}