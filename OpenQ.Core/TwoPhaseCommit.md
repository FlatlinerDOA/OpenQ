# Two-Phase Commit Strategy
With a Two-phase commit strategy the Distributed Queue writes are performed in two stages, the Enqueue and Commit phase.

The first phase Enqueues the value with an expected sequence number that the sender assumes the queue is at. 
This assumes the sender has already read from this or another peer's copy of the queue.

# Design Notes

Using this strategy has some major pitfalls:

1. The number of messages that are required to achieve consensus approaches 4n ^ 2 + 4 where n is the number of nodes in a quorum.
2. The system requires some kind of built in timeout in each and every node to handle failure of peers.
3. In the case recovering from a failure a Presume Abort or Presume Commit strategy is unavoidable and would require coordination with peers to get close to being correct.

## Example:

### Initial State:

|Client     |Peer #1    |Peer #2    |Peer #3    |
|:----------|:----------|:----------|:----------|
|           |1 - Apple  |1 - Apple  |1 - Apple  |
|2 - Orange |2 - Orange |2 - Orange |2 - Orange |


### Write Propagation Sequence


     Client                 Peer #1                 Peer #2                 Peer #3
           ---- Enqueue --->
                                   ---- Enqueue --->
                                   ---------------------------- Enqueue --->
                            store*
                                                    store*
                                   <--- Ready2 -----
                                                                            store*
                                   <--- Ready3 -----------------------------
            <--- Ready1 
            ---  Accept ---> 
                            savecursor1*           
                                   --- Accepted1 --->
                                                    savecursor1*
                                                           --- Accepted2 -->
                                                    savecursor2*
                                   --------------------------- Accepted1 -->
                                                                            savecursor1*
                                   <--- Accepted2 ---
           <--- Accepted1 ---


     Peer #1 -> UpdateCursor -> Peer #2
     Peer #1 -> UpdateCursor -> Peer #3
     Peer #1 -> Enqueue -> Peer #2 [1,2,3]
     Peer #1 -> Enqueue -> Peer #3 [1,2,3]
     Peer #2 -> UpdateCursor -> Peer #1
     Peer #2 -> UpdateCursor -> Peer #3
     Peer #3 -> UpdateCursor -> Peer #1 [Triggers Commit in Peer #1]
     Peer #3 -> UpdateCursor -> Peer #2
     Client &lt;- Accepted <- Peer #1



### Client Request Process: 
    
    // Client has a current cursor position which is a combination of their unique subscriber id, the name of the queue and the latest version the client is aware of.
    var currentCursor = new Cursor("urn:myawesomequeue", this.id, 2);

    // Client chooses any peer (or it may be chosen for him via a load-balancer)
    var peer1Cursor = Peer1.EnqueueAsync([ "Banana", "Pineapple" ], currentCursor);
    currentCursor = new Cursor("urn:myawesomequeue", this.id, peer1Cursor.Version);

### Peer #1's Accept Process:

EnqueueAsync(values, cursor? = null)

1. Check is online -> Throw exception if not ready
2. If cursor is null use Peer #1's current cursor for the queue
   Else check if the cursor is equal to Peer #1's current cursor in the queue
	- If Not Equal - Return Peer #1's current cursor.

3. Store the new values at their appropriate indexes (overwriting any uncommitted values in the same positions)
4. Iterate through Quorum peers:
5. If this peer has accepted this cursor already, increment counter
6. If this peer has not accepted this cursor post values to peer with this peer and all accepted peer's cursors.
7. Async iterate through Quorum peers and update this Peer's cursor on all peers, if a post to a peer fails Quorum is decremented?
8. If counter is greater than minimum quorum, then atomically update the this peer's current cursor
9. Respond to client with this Peer's updated cursor indicating success.

#### Possible Crash Points and Their Impact:
1. A crash at this point will either result in client receiving a http error or a timeout, No state change has been made, client is free to retry
2. No state change, client is free to retry
3. Prior to storage -> No state change
   Mid or Post storage -> Cursor has not moved so values are uncommitted and are free to be overwritten.
6. Cursor has not moved so values are uncommitted, Peer #2 does not update the it's cursor for Peer #1 as a part of this step so it must make up it's own mind about whether quorum has been achieved.
   In the case of Peer #2 timing out, this instance does not count it towards quorum 
7. Cursor is posted to Peers if a post to a peer fails Quorum is decremented?
8. Cursor is either updated or not, if updated, the value is committed on this peer. If not Peer #1 but quorum has already been achieived and this node will have to self repair on startup.


### Peer #2's Accept Process:

UpdateCursor(cursor)

1. Store cursor position for corresponding peer
2. Iterate through Quorum peers, count how many other peers have accepted this cursor already.
3. If count is greater than minimum quorum, then check if new values are stored, if not read values from a random peer in the list of accepted using this peer's current cursor (This will Auto-repair the queue).

### New Peer #4 Startup:
1. Load current cursor and list of Peers and their Cursors.
2. Contact a random Peer x and ReadQueueAsync(currentCursor, 0)
3. this.UpdateCursor(Peer x's Cursor).
4. Mark self as available

