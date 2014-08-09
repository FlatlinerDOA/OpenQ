namespace OpenQ.UnitTests
{
    using System.Collections.Generic;
    using System.IO;
    using System.Reactive;
    using System.Reactive.Concurrency;
    using System.Reactive.Linq;
    using System.Reactive.Threading.Tasks;
    using System.Threading;
    using System.Threading.Tasks;

    using OpenQ.Core;

    public sealed class DictionaryStorage : IStorage
    {
        private readonly Dictionary<string, IQueueMessage> values = new Dictionary<string, IQueueMessage>(); 
        
        private readonly IScheduler scheduler;

        public DictionaryStorage(IScheduler scheduler)
        {
            this.scheduler = scheduler;
        }

        public Task<IQueueMessage> LoadAsync(string path, CancellationToken cancellation)
        {
            return Observable.Return(this.values[path], this.scheduler).ToTask(cancellation);
        }

        public Task SaveAsync(string path, IQueueMessage value, CancellationToken cancellation)
        {
            return Observable.Defer(
                () =>
                {
                    if (this.values.ContainsKey(path))
                    {
                        return Observable.Throw<Unit>(new IOException("Data already exists at that location"), this.scheduler);
                    }

                    this.values[path] = value;
                    return Observable.Return(new Unit(), this.scheduler);
                }).ToTask(cancellation);
        }
    }
}