namespace OpenQ.Core
{
    using System.Collections.Generic;
    using System.Threading.Tasks;

    public interface IStorage<T>
    {
        Task<T> LoadAsync(string path);

        Task SaveAsync(string path, T value);
    }
}