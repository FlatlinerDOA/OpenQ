namespace OpenQ.Server
{
    using System.Linq;

    public interface ICommandLineJob
    {
        string[] Required { get; }

        string[] Optional { get; }

        int Start(ILookup<string, string> args);
    }
}