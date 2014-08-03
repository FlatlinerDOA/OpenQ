namespace OpenQ.Core
{
    using System.Collections.Generic;
    using System.Threading.Tasks;

    public interface IStorage
    {
        Task<T> LoadAsync<T>(string path);

        Task SaveAsync<T>(string path, T value);
    }
}