namespace OpenQ.Core
{
    using System;
    using System.IO;
    using System.Threading;
    using System.Threading.Tasks;

    public interface IQueueMessage
    {
        #region Public Properties

        Guid MessageId { get; }

        string MessageType { get; }

        #endregion

        Task WriteAsync(Stream output, CancellationToken cancellation);
    }
}