namespace OpenQ.Core
{
    using System;

    public sealed class Cursor
    {
        public Guid SubscriberId { get; set; }
        
        public int Version { get; set; }

        public byte[] Signature { get; set; }
    }
}