using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpenQ.Server
{
    public sealed class RunServerJob : ICommandLineJob
    {
        public RunServerJob()
        {
            this.Required = new[] { "run" };
            this.Optional = new[] { "port" };
        }

        public string[] Required { get; private set; }

        public string[] Optional { get; private set; }

        public int Start(ILookup<string, string> args)
        {
            return 0;
        }
    }

    public interface ICommandLineJob
    {
        string[] Required { get; }

        string[] Optional { get; }

        int Start(ILookup<string, string> args);
    }
}
