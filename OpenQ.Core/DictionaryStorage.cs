namespace OpenQ.UnitTests
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Reactive;
    using System.Reactive.Concurrency;
    using System.Reactive.Linq;
    using System.Reactive.Subjects;
    using System.Reactive.Threading.Tasks;
    using System.Threading;
    using System.Threading.Tasks;

    using OpenQ.Core;

    public sealed class DictionaryStorage : IStorage
    {
        private readonly Dictionary<string, IQueueMessage> values = new Dictionary<string, IQueueMessage>(); 
        
        private readonly IScheduler scheduler;

        private readonly Subject<Tuple<string, IQueueMessage>> saves = new Subject<Tuple<string, IQueueMessage>>();

        public DictionaryStorage(IScheduler scheduler)
        {
            this.scheduler = scheduler;
        }

        public IObservable<Tuple<string, IQueueMessage>> Saves
        {
            get
            {
                return this.saves;
            }
        }

        public Task<IQueueMessage> LoadAsync(string path, CancellationToken cancellation)
        {
            return Task.FromResult(this.values[path]);
        }

        public Task SaveAsync(string path, IQueueMessage value, CancellationToken cancellation)
        {
            if (this.values.ContainsKey(path))
            {
                throw new ConflictException(string.Format("Data already exists at {0}", path));
            }

            this.values[path] = value;
            this.saves.OnNext(Tuple.Create(path, value));
            return Task.Delay(0, cancellation);
        }
    }
}