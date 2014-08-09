namespace OpenQ.Core
{
    using System.Collections.Generic;
    using System.Threading.Tasks;

    public interface IPeerServer : IPeer
    {
        Task StartAsync(IReadOnlyList<IPeer> quorumPeersList);

        Task StopAsync();
    }
}