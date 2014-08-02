namespace OpenQ.UnitTests.SingleDecreePaxos
{
    using System.Collections.Generic;
    using System.Threading.Tasks;

    using Microsoft.Reactive.Testing;
    using Microsoft.VisualStudio.TestTools.UnitTesting;

    using OpenQ.Core;

    [TestClass]
    public sealed class WhenEverythingGoesWell
    {
        #region Public Properties

        public List<Acceptor> Acceptors { get; set; }

        public Proposer Proposer { get; set; }

        public TestScheduler Scheduler { get; set; }

        public byte[] Value { get; set; }

        #endregion

        #region Public Methods and Operators

        [TestInitialize]
        public void InitializeTest()
        {
            this.Scheduler = new TestScheduler();
            this.Value = new byte[] { 1, 2, 3 };
            this.Acceptors = new List<Acceptor>() { new Acceptor(), new Acceptor(), new Acceptor() };
            
            this.Proposer = new Proposer("abc", 3, this.Scheduler);
        }

        [TestMethod]
        public async Task RunTest()
        {
            ////this.Proposer.Save();
        }

        #endregion
    }
}