using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpenQ.UnitTests
{
    using System.IO;
    using System.Threading;

    using OpenQ.Core;

    public struct TestMessage : IQueueMessage
    {
        private readonly Guid messageId;

        private readonly string data;

        public TestMessage(int id, string data)
        {
            this.messageId =new Guid(id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            this.data = data;
        }

        public string Data
        {
            get
            {
                return this.data;
            }
        }

        public Guid MessageId
        {
            get
            {
                return this.messageId;
            }
        }

        public Task WriteAsync(Stream output, CancellationToken cancellation)
        {
            using (var b = new BinaryWriter(output, Encoding.UTF8))
            {
                b.Write(this.messageId.ToByteArray());
                b.Write(this.data);
            }

            return Task.Delay(0, cancellation);
        }
    }
}
