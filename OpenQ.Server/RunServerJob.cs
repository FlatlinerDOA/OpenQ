namespace OpenQ.Server
{
    using System;
    using System.Linq;

    using Microsoft.Owin.Hosting;

    public sealed class RunServerJob : ICommandLineJob
    {
        #region Constructors and Destructors

        public RunServerJob()
        {
            this.Required = new[] { "start" };
            this.Optional = new[] { "port", "hostname" };
        }

        #endregion

        #region Public Properties

        public string[] Optional { get; private set; }

        public string[] Required { get; private set; }

        #endregion

        #region Public Methods and Operators

        public int Start(ILookup<string, string> args)
        {
            var host = args["hostname"].DefaultIfEmpty("localhost").FirstOrDefault();
            var port = args["port"].DefaultIfEmpty("8000").FirstOrDefault();
            var url = string.Format("http://{0}:{1}", host, port);
            using (WebApp.Start<Startup>(url))
            {
                Console.WriteLine("Listening on " + url);
                Console.ReadLine();
            }

            return 0;
        }

        #endregion
    }
}