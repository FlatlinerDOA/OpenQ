OpenQ
======

OpenQ is a reference implementation for an Open Message Queing system based on a JSON format and HTTP written in TypeScript for NodeJS. 

The ultimate goal is to create an extremely simple but flexible standard for messaging, that anyone can use in their applications.

Specification
=============

OpenQ mandates the support of a small list of message types. For a server to be OpenQ compliant it MUST be able to handle all message types outlined below unless otherwise specified.

Subscribe Message
-----------------

HTTP POST: http://receivingserver.com/username/outbox
<pre>
{ 
  "type":"urn:openq/subscribe",
  "inbox":"http://callingserver.com/username/inbox",
  "messagetypes":["urn:twitter/tweet", "urn:facebook/statusupdate"]
}
</pre>

Subscribe messages inform the receiving server that messages of the specified types are to be routed to the inbox of the calling server. 
This message MUST be acknowledged by the receiving server with a HTTP 200 OR rejected with a HTTP 4xx or HTTP 5xx error.
It is the discretion of the recipient server whether this subscription is allowed or not and whether authentication is required.

HTTP POST: http://receivingserver.com/username/outbox

Unsubscribe Message
-------------------

<pre>
{ 
  "type":"urn:openq/unsubscribe",
  "inbox":"http://callingserver.com/username/inbox",
  "messagetypes":["urn:twitter/tweet", "urn:facebook/statusupdate"]
}
</pre>

Unsubscribe messages inform the receiving server that messages are to be routed to the inbox of the calling server. 
This message MUST be acknowledged by the receiving server with a HTTP 200 OR rejected with a HTTP 4xx or HTTP 5xx error.


Broadcast Envelope Message
-----------------

HTTP POST: http://server.com/username/outbox

<pre>
{ 
  "type":"urn:openq/broadcast",
  "message": {
	"type":"urn:twitter/tweet",
    "message":{ tweet:"OMG! OpenQ rocks!"}
  }
}
</pre>

A broadcast message can only be sent by the authenticated user on an OpenQ server to their own outbox. All subscribers to this outbox will then receive 1 copy of the message.


Plain Message (Any message type)
-----------------

HTTP POST: http://server.com/username/inbox

<pre>
{ 
    "type":"urn:twitter/tweet",
    "message":{ tweet:"OMG! OpenQ rocks!"}
}
</pre>

A plain message is a message with a type that is not one of the above listed message types. 
It is assumed to be read by the subscribing applications.



The license for this is MIT.

Andrew Chisholm