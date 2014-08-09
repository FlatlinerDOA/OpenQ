namespace OpenQ.Core
{
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;

    public interface IStorage
    {
        Task<IQueueMessage> LoadAsync(string path, CancellationToken cancellation);

        Task SaveAsync(string path, IQueueMessage value, CancellationToken cancellation);
    }
}