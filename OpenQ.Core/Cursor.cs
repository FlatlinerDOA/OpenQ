namespace OpenQ.Core
{
    using System;

    public sealed class Cursor
    {
        public Cursor()
        {
        }

        public Cursor(string subscriber, Guid messageId, int sequence)
        {
            this.Subscriber = subscriber;
            this.MessageId = messageId;
            this.Sequence = sequence;
        }

        #region Public Properties

        public Guid MessageId { get; set; }

        public int Sequence { get; set; }

        public string Subscriber { get; set; }

        #endregion

        ////public byte[] Signature { get; set; }

        #region Public Methods and Operators

        public override bool Equals(object obj)
        {
            if (ReferenceEquals(null, obj))
            {
                return false;
            }
            if (ReferenceEquals(this, obj))
            {
                return true;
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
            return string.Equals(this.SubscriberId, other.SubscriberId) && this.MessageId.Equals(other.MessageId) && this.Sequence == other.Sequence;
        }

        #endregion
    }
}