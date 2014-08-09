namespace OpenQ.Core
{
    using System;
    using System.IO;
    using System.Threading;
    using System.Threading.Tasks;

    public sealed class FileStreamStorage : IStorage
    {
        public const int BufferSize = 4096;

        private readonly string rootPath;

        #region Constructors and Destructors

        public FileStreamStorage(string rootPath)
        {
            this.rootPath = rootPath.TrimEnd('/', '\\') + "\\";
        }

        #endregion

        #region Public Methods and Operators

        public async Task<IQueueMessage> LoadAsync(string path, CancellationToken cancellation)
        {
            var finalPath = string.Concat(this.rootPath, path);
            using (var fs = new FileStream(finalPath, FileMode.Open, FileAccess.Read, FileShare.Read, BufferSize, true))
            {
                var size = (int)fs.Length;
                var result = new byte[size];
                await fs.ReadAsync(result, 0, size, cancellation);
                return new BinaryMessage(result);
            }
        }

        public async Task SaveAsync(string path, IQueueMessage value, CancellationToken cancellation)
        {
            var finalPath = string.Concat(this.rootPath, path);
            using (var fs = new FileStream(finalPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, BufferSize, true))
            {
                await value.WriteAsync(fs, cancellation);
                await fs.FlushAsync(cancellation);
            }
        }

        #endregion
    }
}