namespace OpenQ.Core.Messages
{
    using System.Collections.Generic;
    using System.Linq;

    public sealed class EnqueueRequest
    {
        private readonly IReadOnlyList<IQueueMessage> messages;

        private readonly string[] excludePeerIds;

        private readonly Cursor desiredCursor;

        public EnqueueRequest(Cursor desiredCursor, params IQueueMessage[] messages)
        {
            this.desiredCursor = desiredCursor;
            this.messages = messages;
            this.excludePeerIds = new string[0];
        }

        public EnqueueRequest(Cursor desiredCursor, IEnumerable<IQueueMessage> messages, params string[] excludePeerIds)
        {
            this.desiredCursor = desiredCursor;
            this.messages = messages.ToList();
            this.excludePeerIds = excludePeerIds;
        }

        public EnqueueRequest(Cursor desiredCursor, IEnumerable<IQueueMessage> messages, IEnumerable<string> excludePeerIds)
        {
            this.desiredCursor = desiredCursor;
            this.messages = messages.ToList();
            this.excludePeerIds = excludePeerIds.ToArray();
        }

        /// <summary>
        /// Gets a list of zero or more items. An empty list can be used to verify the current version of the queue without modification, 
        /// waiting for acceptance is not necessary in this case.
        /// </summary>
        public IReadOnlyList<IQueueMessage> Messages
        {
            get
            {
                return this.messages;
            }
        }

        /// <summary>
        /// 
        /// </summary>
        public string[] ExcludePeerIds
        {
            get
            {
                return this.excludePeerIds;
            }
        }

        /// <summary>
        /// Gets the expected version of the latest item in the queue, or Empty if append semantics are desired.
        /// </summary>
        public Cursor DesiredCursor
        {
            get
            {
                return this.desiredCursor;
            }
        }
    }
}