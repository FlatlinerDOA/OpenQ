namespace OpenQ.Core
{
    public sealed class Ballot<T>
    {
        public string ProposerId;

        public long Number;

        public T Value;
    }
}