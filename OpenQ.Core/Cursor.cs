namespace OpenQ.Core
{
    using System;
    using System.IO;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;

    public struct Cursor : IQueueMessage
    {
        private readonly int sequence;

        private readonly string subscriber;

        private readonly Guid messageId;

        public Cursor(string subscriber, Guid messageId, int sequence)
        {
            this.subscriber = subscriber;
            this.messageId = messageId;
            this.sequence = sequence;
        }

        public Cursor(Stream stream)
        {
            using (var r = new BinaryReader(stream, Encoding.UTF8, true))
            {
                this.messageId = new Guid(r.ReadBytes(16));
                this.sequence = r.ReadInt32();
                this.subscriber = r.ReadString();
            }
        }

        public static Cursor Empty(string subscriber)
        {
            return new Cursor(subscriber, Guid.Empty, 0);
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
            using (var w = new BinaryWriter(output, Encoding.UTF8, true))
            {
                w.Write(this.MessageId.ToByteArray());
                w.Write(this.Sequence);
                w.Write(this.Subscriber);
            }

            return Task.Delay(0, cancellation);
        }

        public int Sequence
        {
            get
            {
                return this.sequence;
            }
        }

        public string Subscriber
        {
            get
            {
                return this.subscriber;
            }
        }

        #endregion

        ////public byte[] Signature { get; set; }

        #region Public Methods and Operators

        public override bool Equals(object obj)
        {
            if (ReferenceEquals(null, obj))
            {
                return false;
            }

            return obj is Cursor && this.Equals((Cursor)obj);
        }

        public override int GetHashCode()
        {
            unchecked
            {
                int hashCode = (this.Subscriber != null ? this.Subscriber.GetHashCode() : 0);
                hashCode = (hashCode * 397) ^ this.MessageId.GetHashCode();
                hashCode = (hashCode * 397) ^ this.Sequence;
                return hashCode;
            }
        }

        #endregion

        #region Methods

        private bool Equals(Cursor other)
        {
            return string.Equals(this.Subscriber, other.Subscriber) && this.MessageId.Equals(other.MessageId) && this.Sequence == other.Sequence;
        }

        #endregion

        public bool IsCompatibleWith(Cursor desired)
        {
            if (desired.Sequence == 0)
            {
                return true;
            }

            if (this.MessageId == desired.MessageId)
            {
                return desired.Sequence == this.Sequence;
            }

            return desired.Sequence == this.Sequence + 1;
        }

        public override string ToString()
        {
            return string.Format("{0}[{1}] = {2}", this.Subscriber, this.Sequence, this.MessageId);
        }

        public Cursor ForSubscriber(string id)
        {
            return new Cursor(id, this.messageId, this.sequence);
        }
    }
}