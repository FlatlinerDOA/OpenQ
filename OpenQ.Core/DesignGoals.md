
## Design Goals
1. CP and AP agnostic, purely based on configuration of peer counts 3, 5, 7 etc. for a CP queue. 
    And each instance is an independant pub/sub subscriber for an AP queue, AP will probably require a custom merge function or strategy to be configured on a per queue.
2. Support for Garbage Collected queues where the tail of the queue is only kept until all subscribers have caught up.
3. High speed synchronisation and catch-up support with multiple messages being synchronised in a single call, avoiding chatty interfaces.
4. Network optimal [Dynamic two-phase commit](http://en.wikipedia.org/wiki/Two-phase_commit_protocol) strategy where a race is performed to achieve quorum as fast as possible.
