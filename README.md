# OpenQ

OpenQ is an attempt at a simple standard for an Open Message Queueing system, which standardises on the JSON format and a few REST endpoints. 

The OpenQ Server is a reference implementation written in TypeScript for [NodeJS](http://nodejs.org). 

The ultimate goal of this project is to create an extremely simple but flexible standard for messaging, that anyone can use in their applications.

## Specification

OpenQ mandates the support of a small list of message types. For a server to be OpenQ compliant it MUST be able to handle all message types outlined below unless otherwise specified.

In OpenQ a username represents a sender and/or recipient in the system. The user may give multiple applications access to their their OpenQ service and how this is authenticated is left open to application developers. In the reference implementation authentication is via HTTP BASIC auth username/password mandated to be over HTTPS.
Messages can only posted to another user's inbox with a subscription token issued by that User's OpenQ server. Subscriptions can be either set up by the user wanting to receive messages or requested by the sender, but the sender can only send one subscription request.

### Subscribe Request Message

HTTP POST: https://server.com/requestedpeer/inbox
<pre>
{ 
  "type":"urn:openq/subscriberequest",
  "inbox":"https://requestingserver.com/requestinguser/",
  "messagetypes":["urn:twitter/tweet", "urn:facebook/statusupdate"],
  "fromfirstmessage":true
}
</pre>

This message basically asks that the recipient user subscribe to the sender's messages (A follow me request).

A server MUST either accept this message (not the request itself) immediately with a HTTP 200 message, OR reject with 4xx message. The server MUST only accept one active peer request from a given peer and reject all subsequent requests from that peer with an HTTP 4xx until either a Peer Acknowledged or Peer Denied is sent. 

It is then at the server's discretion as to whether future Subscribe Requests from that peer will be accepted or rejected immediately.

### Subscribe Message

HTTP POST: https://receivingserver.com/username/inbox
Request:
<pre>
{ 
  "type":"urn:openq/subscribe",
  "inbox":"https://callingserver.com/username/inbox",
  "token":"bfsgetwg443td4dgoh43fsldjfdk==",
  "messagetypes":["urn:twitter/tweet", "urn:facebook/statusupdate"],
  "messagesperminute":60,
  "fromfirstmessage":true
}
</pre>

Subscribe messages inform the receiving server that messages of the specified types are to be routed to the inbox of the caller's request. 
This message MUST be acknowledged by the receiving server with a HTTP 200 OR rejected with a HTTP 4xx or HTTP 5xx error.
It is the discretion of the recipient server whether this subscription is allowed or not and whether authentication is required.

* type - Identifies this as a subscribe message.
* inbox - The universally addressable url to the inbox that messages are to be forwarded this combined with the token, uniquely identifies the subscription.
* token - Both identifies the subscription and is to be used by the server when submitting back to the user's inbox (this can be considered the equivalent of a Peer Accepted message)
* messagetypes - The array of message types the subscription is for (cannot be empty).
* messagesperminute - The maximum number of messages that should be sent to this endpoint in a minute.
* fromfirstmessage - specifies whether the subscription should start at the first occurrence of that message that was ever sent by that user. If false, only messages sent from the time of the subscription onwards will be forwarded.

> Note: If the token given does not grant permission to post to that inbox the server may reject the subscription request immediately. If at a later date the token is no longer valid, the subscription MAY be automatically unsubscribed by the server.

### Unsubscribe Message

HTTP POST: https://receivingserver.com/username/inbox

<pre>
{ 
  "type":"urn:openq/unsubscribe",
  "inbox":"https://callingserver.com/username/inbox",
  "messagetypes":["urn:twitter/tweet", "urn:facebook/statusupdate"]
}
</pre>

Unsubscribe messages inform the receiving server that messages are to be routed to the inbox of the calling server. 
This message MUST be acknowledged by the receiving server with a HTTP 200 OR rejected with a HTTP 4xx or HTTP 5xx error.

### Broadcast a Message to all Subscribers

HTTP POST: https://server.com/username/outbox

<pre>
{ 
	"type":"urn:twitter/tweet",
    "message":{ tweet:"OMG! OpenQ rocks!"}
}
</pre>

A broadcast message can only be sent by the authenticated user on an OpenQ server to their own outbox. All subscribers to this outbox will then receive 1 copy of the inner message.


### Post a Message to a Subscriber (Any message type to another user's inbox)

HTTP POST: https://server.com/username/inbox

<pre>
{ 
    "type":"urn:twitter/tweet",
    "token":"absdfoweighiueghkigwe==",
    "message":{ tweet:"OMG! OpenQ rocks!"}
}
</pre>

All messages MUST have a type that is not one of the above listed message types, it's content can be anything but the whole message INCLUDING type wrapper must be less than 64kb. 
These messages are to be read by the subscribing applications.


### Subscriber polling for Broadcast Messages 

HTTP GET: https://server.com/username/outbox/&take=100

Response
auth-token:abersfsdkhe532r8uw==
<pre>
[{
    "type":"http://www.msnbc.com/rss.xml",
    "message":{ ... }
}, ...]
</pre>


### User polling for Private Messages 

HTTP GET: https://server.com/username/inbox/take=100&skip=0
auth-token:username:password
Response:
<pre>
[{
    "type":"http://www.msnbc.com/rss.xml",
    "message":{ ... }
}, ...]
</pre>


## Use cases

### Scenario 1: RSS Aggregator

FeedSharkly is a company that hosts an RSS aggregator and providers a mobile phone app for their users to read feeds.

FeedSharkly service periodically refreshes RSS feeds on behalf of a user and delivers the articles to their mobile.

When a user (in this case FrankyJ) pushes the subscribe link to an RSS feed in the mobile client, the mobile client app posts a subscribe message to the aggregator service's inbox.

HTTP POST: https://openq.feedsharkly.com/aggregator/outbox
<pre>
{ 
  "type":"urn:openq/subscribe",
  "token":"1234",
  "inbox":"https://openq.feedsharkly.com/FrankyJ/inbox",
  "messagetypes":["http://www.msnbc.com/rss.xml"]
}
</pre>


The service later posts a broadcast message with the RSS content to it's service outbox.

HTTP POST: https://openq.feedsharkly.com/aggregator/outbox
<pre>
{ 
  "type":"urn:openq/broadcast",
  "message": {
	"type":"http://www.msnbc.com/rss.xml",
    "message":{ ... }
  }
}
</pre>

The mobile client can then periodically check it's inbox for news feeds.

HTTP GET: https://openq.feedsharkly.com/FrankyJ/inbox?take=100&skip=0

Response:
<pre>
[{
    "type":"http://www.msnbc.com/rss.xml",
    "message":{ ... }
}]
</pre>


The license for this is MIT.

Andrew Chisholm