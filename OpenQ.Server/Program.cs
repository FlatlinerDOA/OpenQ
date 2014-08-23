namespace OpenQ.Server
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    public static class Program
    {
        #region Methods

        public static int Main(string[] args)
        {
            var possibleJobs = new ICommandLineJob[]
                               {
                                   new RunServerJob()
                               };
            var lastKey = string.Empty;

            // AC: Okay so not my finest code, but it parses command lines into a lookup anyway.
            var result = args.Aggregate(
                new Dictionary<string, List<string>>() { { string.Empty, new List<string>() } },
                (acc, arg) =>
                {
                    if (arg.StartsWith("-"))
                    {
                        lastKey = arg.TrimStart('-');
                        acc[lastKey] = new List<string>();
                    }
                    else
                    {
                        acc[lastKey].Add(arg);
                    }

                    return acc;
                })
                .SelectMany(d => d.Value.Select(v => Tuple.Create(d.Key, v)))
                .ToLookup(k => k.Item1, k => k.Item2);

            var matchingJobs = possibleJobs.Where(j => j.Required.All(result.Contains));
            foreach (var job in matchingJobs)
            {
                var exitCode = job.Start(result);
                if (exitCode != 0)
                {
                    return exitCode;
                }
            }

            return 0;
        }

        #endregion
    }
}