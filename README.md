Node.jobs is a really simple jobs server, based on Node.js, that workers and requesters
can be the same and can be anonymous too.

There is still no support to callback neither WebSocket, but we will have them in future.

It works on MongoDB but supports backends (a Redis backend is in development process).

## The flow

Its flow works like follow:

1. A requester, called "sender" publishs a new job and set its 'name', 'params' (an object
   with data), 'key'(like a primary key, optional), its 'sender' key (optional), the
   'destinatary' key (optional) and when it 'expire' (optional). So the jobs has a status
   'standing'.
2. Some worker gets the "next job" and assigns it and changes its status to 'assigned' and
   'assigned_by' to its key, if it has one.
3. If done, the worker updates the job's status to "done", if it is invalid to "discarted",
   or if got error to "failed"
4. Any result can attach a "response_message" to the job, so the sender can checks it and
   make a map&reduce with parallel results.
5. Sender should remove the jobs after it has done, but we will have in the future a tool
   to remove them after some time after they have done.

## Advantages

This way of work makes it very simple and distributed, so, we can use it on every language
we want, because it's not dependent on language APIs nor callbacks, but only to assign jobs
and change their status.

This also supports a very distributed and descentralized software with workers assuming by
theirselves their jobs and returning results to senders.

## Dependencies

- Node.js
- ExpressJS
- mongo-db-native (or just "mongodb" on npm)

## Python wrapper library

Just make an instance of Connection class and call its methods. When instancing it, you must
set its host and port, and set the sender key too, if it has one.

## To do

- To support callback and WebSockets, this will help us to have faster and lite services
- To improve our tests. Their were enought for development but aren't for maintainence
- Auto-remover for done jobs after expiration time
- To define a default port instead of 3000
- setup.py on Python wrapper
- Maybe a kiwi/npm installer
- Make expiration work

