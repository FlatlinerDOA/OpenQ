namespace OpenQ.Core
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Reactive;
    using System.Reactive.Concurrency;
    using System.Reactive.Linq;
    using System.Text;
    using System.Reflection;
    using System.Threading;

    /// <summary>
    /// A proposer is responsible for proposing new values for the acceptors to agree upon.
    /// </summary>
    public sealed class Proposer
    {
        private static readonly Random Rand = new Random();

        private long lastBallot = 0;

        public Proposer(string id, int expectedAcceptorCount): this(id, expectedAcceptorCount, DefaultScheduler.Instance)
        {            
        }

        public Proposer(string id, int expectedAcceptorCount, IScheduler scheduler)
        {
            this.Scheduler = scheduler;
            this.Id = id;
            this.AcceptorCount = expectedAcceptorCount;
            this.QuorumSize = (expectedAcceptorCount / 2) + 1;
            this.Timeout = TimeSpan.FromSeconds(2);
        }

        public int AcceptorCount { get; set; }

        public string Id { get; set; }

        /// <summary>
        /// Gets or sets the minimum number of acceptors to accept an agreed upon value.
        /// </summary>
        public int QuorumSize { get; private set; }

        public TimeSpan Timeout { get; set; }

        /// <summary>
        /// Phase 2 - Propose value.
        /// </summary>
        public IObservable<Ballot> Save<T>(IEnumerable<Acceptor> acceptors, byte[] value)
        {
            return from a in this.Ask(acceptors, ask)
                   from p in this.Propose(a, value)
                   select a;
        }

        private long ChooseBallotNumber()
        {
            return Interlocked.Add(ref lastBallot, Rand.Next(this.QuorumSize));
        }

        /// <summary>
        /// Phase 1 - Ask-grant.
        /// </summary>
        /// <param name="acceptors"></param>
        /// <param name="x"></param>
        public IObservable<Ballot<T>> Ask<T>(IEnumerable<Acceptor> acceptors, T x)
        {
            int count;
            var np = this.ChooseBallotNumber();
            var v = x;
            var n = 0;
            var q = acceptors.Select(a => a.Grant(this.Id, x).Timeout(this.Timeout, this.Scheduler)).Merge(this.Scheduler);
            return q.Select(
                ballot =>
                {
                    count++;
                    if (ballot != null)
                    {
                        if (ballot.Number >= ballotNumber)
                        {
                            v = ballot.Value;
                            n = ballot.Number;

                            return ballot;
                        }
                    }

                    if (count >= this.QuorumSize)
                    {
                        return new Ballot<T>() { Number = n };
                    }
                    return 0;
                });
        }

        public IScheduler Scheduler { get; set; }

        /// <summary>
        /// Phase 2 - Propose value.
        /// </summary>
        public void Propose(int version, byte[] value)
        {
            
        }
    }
}
