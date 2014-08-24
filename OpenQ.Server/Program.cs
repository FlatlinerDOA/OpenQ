namespace OpenQ.Server
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    public static class Program
    {
        #region Public Methods and Operators

        public static int Main(string[] args)
        {
            var possibleJobs = new ICommandLineJob[] { new RunServerJob() };

            var result = ParseIntoLookup(args);
            var matchingJobs = possibleJobs.Where(j => j.Required.All(result.Contains)).ToList();

            if (!matchingJobs.Any())
            {
                Console.WriteLine(string.Join(Environment.NewLine, possibleJobs.Select(p => p.ToString())));
                return 0;
            }

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

        #region Methods

        /// <summary>
        /// Okay so not my finest code, but it parses command line arguments and switches into a lookup.
        /// Supports out of order keys, multiple values for a single key and switch arguments, also is case insensitive and handles - or / prefixes.
        /// </summary>
        /// <param name="args"></param>
        /// <returns></returns>
        private static ILookup<string, string> ParseIntoLookup(string[] args)
        {
            var lastKey = string.Empty;
            var yielded = true;
            var result = args.SelectMany(
                (arg, ix) =>
                {
                    var switches = new List<Tuple<string, string>>();
                    if (arg.StartsWith("-") || arg.StartsWith("/"))
                    {
                        if (!yielded)
                        {
                            switches.Add(Tuple.Create(lastKey, string.Empty));
                        }

                        lastKey = arg.TrimStart('-', '/');

                        if (ix == args.Length - 1)
                        {
                            switches.Add(Tuple.Create(lastKey, string.Empty));
                        }

                        yielded = false;
                        return switches;
                    }

                    yielded = true;
                    switches.Add(Tuple.Create(lastKey, arg));
                    return switches;
                }).ToLookup(k => k.Item1, k => k.Item2, StringComparer.OrdinalIgnoreCase);
            return result;
        }

        #endregion
    }
}