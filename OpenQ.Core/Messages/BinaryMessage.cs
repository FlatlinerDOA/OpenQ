namespace OpenQ.Core.Messages
{
    using System;
    using System.IO;
    using System.Threading;
    using System.Threading.Tasks;

    public struct BinaryMessage : IQueueMessage
    {
        private readonly Guid messageId;

        private readonly byte[] rawData;

        public BinaryMessage(byte[] rawData)
        {
            var id = new byte[16];
            this.rawData = rawData;
            Array.ConstrainedCopy(rawData, 0, id, 0, 16);
            this.messageId = new Guid(id);
        }

        public BinaryMessage(Guid messageId, byte[] payload)
        {
            this.messageId = messageId;
            this.rawData = new byte[payload.Length + 16];
            messageId.ToByteArray().CopyTo(this.rawData, 0);
            payload.CopyTo(this.rawData, 16);
        }

        #region Public Properties

        public Guid MessageId
        {
            get
            {
                return this.messageId;
            }
        }

        public Task WriteAsync(Stream output, CancellationToken cancellation)
        {
            return output.WriteAsync(this.rawData, 0, this.rawData.Length, cancellation);
        }

        #endregion

    }
}