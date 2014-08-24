namespace OpenQ.UnitTests.DistributedQueueSpec
{
    using System;
    using System.Reactive.Linq;

    using Microsoft.Reactive.Testing;

    using OpenQ.Core;
    using OpenQ.Core.Messages;

    public abstract class EnqueueingSpecification : SpecificationBase
    {
        #region Public Properties

        public ITestableObserver<Cursor> ResponseRecorder { get; set; }

        #endregion

        #region Public Methods and Operators

        public abstract EnqueueRequest When();

        #endregion

        #region Methods

        protected override void RunTest()
        {
            this.ResponseRecorder = this.Scheduler.CreateObserver<Cursor>();
            var request = this.When();
            using (this.Queue.EnqueueAsync(request).SubscribeOn(this.Scheduler).Subscribe(this.ResponseRecorder))
            {
                this.Scheduler.AdvanceTo(10);
            }
        }

        #endregion
    }
}