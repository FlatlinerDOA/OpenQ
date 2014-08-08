namespace OpenQ.Core
{
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;

    public interface IStorage
    {
        Task<T> LoadAsync<T>(string path, CancellationToken cancellation);

        Task SaveAsync<T>(string path, T value, CancellationToken cancellation);
    }
}