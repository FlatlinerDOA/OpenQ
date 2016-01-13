
## Design Goals
1. CP and AP agnostic, purely based on configuration of peer counts 3, 5, 7 etc. for a CP queue. 
    And each instance is an independant pub/sub subscriber for an AP queue, AP will probably require a custom merge function or strategy to be configured on a per topic basis.
2. Support for both permanently Persisted and "Ephemeral" queues where the tail messages in the queue are only kept until all subscribers have caught up, and are then Garbage Collected at idle times
 - Note: This possibly will have a configured maximum-size for the queue and use some kind of ring-buffer style storage pattern.
3. High speed cross-data center synchronisation support with multiple messages being synchronised in a single call, avoiding chatty interfaces.
4. Network optimal [Dynamic two-phase commit](http://en.wikipedia.org/wiki/Two-phase_commit_protocol) strategy where a race is held to achieve quorum as fast as possible.
5. Servers are Partitionable by Topic where each node may participate in an uneven list of Topics depending on Topic configuration.
6. Support for either strong or weak ordering constraints on a per message basis as decided by the client.
 - By enqueing each message with an explicit expected sequence number the write will either pass or fail immediately if that sequence number is taken. 
 - Alternatively enqueuing with a zero sequence number provides a slightly better guarantee of data being stored during peak load periods as the node will try and re-order the queue on behalf of the client in the case of a sequence conflict without the client having to resend the messages.
7. Pluggable storage engine, potentially configurable by topic, allows for flexible choices based on environment, performance needs and recovery requirements etc.
  - Some ideas for storage engines include SQL Server, PostgresQL, Esent, a Custom Memory Mapped storage engine, immutable in memory dictionaries.

### Potential Uses
- Event Store for an Event Sourced CQRS style system
- Robust Publish-Subscriber Hub / Message Bus for occassionally connected clients, where an Ephemeral topic ensures all enlisted subscribers receive their messages with no TTL on messages. 
  - One could conceivably configure a each node to have their own non-quorum queue with messages Enqueued with the reserved "Append" version semantics. Then a central queue could be setup to forward messages to a central ordered queue for aggregation and a stable ordering for subscribers.
