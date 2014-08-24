namespace OpenQ.Server
{
    using System.Net;
    using System.Net.Http;
    using System.Web.Http;

    public sealed class QueueController : ApiController
    {
        public HttpResponseMessage Post(string message, int version)
        {
            return new HttpResponseMessage(HttpStatusCode.Accepted);
        }
    }
}