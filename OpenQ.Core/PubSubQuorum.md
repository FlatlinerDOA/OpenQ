# The Pub Sub Quorum Strategy

With the Pub-Sub quorum strategy all writes are presumed uncommitted until sufficient store count is achieved by peers.

* Writes are performed with a single message that is blocking until the content is stored by the node.
* Stored content is not available for read until quorum has been reached, unless explicitly requested by the message's version id which must uniquely identify each and every message.
* Each peer has a permanent open connection to it's peers and uses frequent heartbeats to ensure fast notification when communication goes down.
* As soon as insufficient peers have had heartbeats within the allotted time the node will immediately take itself offline for writes.
* Clients have the choice of acting as a peer and communicating via Pub-Sub or can use a simplified API which blocks until a Quorum is achieved or a Timeout occurs.

### Pub-sub Propagation Sequence

     Initial State: All Peers have value v' stored and committed
     Client                                 Peer #1                   Peer #2                   Peer #3
           ---- Enqueue x' ----------------->
                                            ------- Enqueue x' ------>
                                            ----------------------------------- Enqueue x' ---->
                                            Store x'
                                                                      Store x'
           <---- Stored1 -------------------       -- x' Stored @1 -->
           ------------ Get --------------->
           <-- Return v' (x' uncommitted) --
                                                   <-- x' Stored @2 --       -- x' Stored @2 -->
                                                                                                Store x'
           <--- Accepted(1,2) --------------
                                                   <-------------------------- x' Stored @3 ---
           ------------ Get --------------->
           <---- Return x' -----------------


### Single-Node Partition Sequence

     Client                                 Peer #1                  Peer #2                 Peer #3
           ---- Enqueue x' --->
                                            ---- Enqueue x' -------->
                                            ---------------------------------- Enqueue x' -->
                                            Store x'                                         X Communication Link Failure
           <---- x' Stored @1---------------                         Store x'                |
           ------------ Get v' ------------>                                                 |
           <-- Return v' (x' uncommitted) --                                                 |
                                                   <-- x' Stored @2 --                       |
                                                                                             | Store v2*
           <--- Accepted x' (1,2) ----------                                                 |
           ------------ Get x' ------------>                                                 |
           <---- Return x' -----------------                                                 |
                                                                                             X Communication Re-established
                                                                             <--- Get v' -----
                                                                             --- Return x' -->
                                                                      
