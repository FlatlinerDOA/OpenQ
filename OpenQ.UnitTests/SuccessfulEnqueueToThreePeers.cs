namespace OpenQ.UnitTests
{
    using System.Reactive;

    using Microsoft.Reactive.Testing;
    using Microsoft.VisualStudio.TestTools.UnitTesting;

    public sealed class SuccessfulEnqueueToThreePeers
    {
        #region Fields

        private ITestableObserver<Unit> acceptedRecorder;

        private TestScheduler test;

        #endregion

        #region Public Methods and Operators

        [TestMethod]
        public void AcceptedAfterQuorum()
        {
        }

        [TestInitialize]
        public void InitializeTest()
        {
            this.test = new TestScheduler();
            this.acceptedRecorder = this.test.CreateObserver<Unit>();
        }

        #endregion
    }
}