namespace OpenQ.Server
{
    using System.Linq;

    public sealed class RunServerJob : ICommandLineJob
    {
        #region Constructors and Destructors

        public RunServerJob()
        {
            this.Required = new[] { "run" };
            this.Optional = new[] { "port" };
        }

        #endregion

        #region Public Properties

        public string[] Optional { get; private set; }

        public string[] Required { get; private set; }

        #endregion

        #region Public Methods and Operators

        public int Start(ILookup<string, string> args)
        {
            return 0;
        }

        #endregion
    }
}