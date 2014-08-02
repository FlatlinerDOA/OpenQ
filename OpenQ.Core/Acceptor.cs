using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace OpenQ.Core
{
    using System.Reactive.Linq;
    using System.Threading;

    /// <summary>
    /// An acceptor is responsible for tracking the latest values and their ballot number.
    /// </summary>
    public sealed class Acceptor
    {
        private Ballot<T> current;
        
        private long grantedVersion = 0;
        

        public IObservable<Ballot<T>> Grant(string proposerId, long askForBallotNumber)
        {
            var result = Interlocked.CompareExchange(ref this.grantedVersion, askForBallotNumber, askForBallotNumber);
            if (askForBallotNumber >= result)
            {
                grantedVersion = askForBallotNumber;
                return Observable.Return<Ballot>(null);
            }

            return Observable.Return<Ballot>(current);
        }

        public void Accept(long number, byte[] value)
        {
        }
    }
}
