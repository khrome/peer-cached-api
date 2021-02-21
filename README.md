peer-cached-api
===============

Let your data swarm like your users do.


Installation
------------

`npm install --save peer-cached-api`


Import
------

```js
var PeerCachedClient = require('peer-cached-api/client');
```

Usage
-----

This library requires an external request module that uses a "`request` like" interface. More modern libraries can be used through [polymorphic-request](https://www.npmjs.com/package/polymorphic-request). Client options support [Hyperdrive options](https://github.com/hypercore-protocol/hyperdrive#var-drive--new-hyperdrivestorage-key-options).

```js
    var client = new PeerCachedClient({ //hypercore options
        name: 'just-a-test',
        persist: false
    });
    client.requestInstance = request; //request instance
    client.request({ //request options
        uri:'http://localhost:8080/someapi',
        json: true
    }, function(err, res, body){
        //do something with the data
    });
```

Testing
-------------

    mocha

Enjoy,

-Abbey Hawk Sparrow
