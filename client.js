var request;
var hashFn = require('object-hash');
var SDK = require('dat-sdk');
//var stringStream = require('string-to-stream');
var dat;
var waiting = [];
var handler = function(options, complete){
    if(dat){
        setTimeout(function(){
            complete(undefined, dat);
        }, 0);
    }else{
        if(!waiting.length){
            SDK(options).then(function(instance){
                dat = instance;
                cbs = waiting;
                waiting = [];
                cbs.forEach(function(callback){
                    callback(undefined, instance);
                });
            }).catch(function(err){
                callback(err);
            });
        }
        waiting.push(complete);
    }
}
var datReady = function(options, cb){
    if(cb){
        handler(options, cb);
    }else{
        return new Promise(function(resolve, reject){
            try{
                handler(options, resolve);
            }catch(ex){ reject(ex) }
        });
    }
};

var archiveIsInitialized = function(drive, cb){
    drive.readdir('/requests', function(err){
      if(!err) return cb();
      drive.mkdir('/requests', function(err){
        return cb(err);
      })
    })
};
var Client = function(options, cb){
    this.options = options || {};
    if(!this.options.name) throw new Error('No name provided');
    var ob = this;
    datReady(this.options, function(){
        ob.archive = dat.Hyperdrive(ob.options.name, {
          // This archive will disappear after the process exits
          // This is here so that running the example doesn't clog up your history
          persist: ob.options.persist,
          // storage can be set to an instance of `random-access-*`
          // const RAI = require('random-access-idb')
          // otherwise it defaults to `random-access-web` in the browser
          // and `random-access-file` in node
          storage: ob.options.storage
        });
        if(cb) ob.archive.ready(function(){ cb() });
    });
};
Client.prototype.setRequest = function(instance){
    this.request = instance;
};
Client.prototype.request = function(options, callback){ //callback = t -> Promise
    var cb;
    var rtrn;
    var requestInstance;
    var pipedStream;
    if(callback){
        if(callback === true){
            var resolve;
            var reject;
            cb = function(err, res, body){
                if(err) return reject(err);
                resolve(body)
            };
            rtrn = new Promise(function(res, rej){ resolve = res; reject = rej });
        }else{
            cb = function(err, res, body){
                callback(err, res, body);
            };
        }
    }
    if(!this.requestInstance) throw new Error('request instance not set!');
    var hash = hashFn(options);
    var ob = this;
    datReady(this.options, function(err, datInstance){
        if(!ob.archive) throw new Error('No Archive Found!');
        ob.archive.ready(function(){
            var url = 'dat://'+ob.archive.key.toString('hex');
            archiveIsInitialized(ob.archive, function(initError){
                ob.archive.readFile('/requests/'+hash, function(err, data){
                    if(err || !data){
                        requestInstance = ob.requestInstance(options, function(err, res, body){
                            ob.archive.writeFile(
                                '/requests/'+hash,
                                JSON.stringify({
                                    res : res,
                                    body : body
                                }),
                                function(err){
                                    cb(err, res, body)
                                }
                            )
                        });
                        //todo: handle storage on pipe
                        if(pipedStream) requestInstance.pipe(pipedStream);
                    }else{
                        if(cb){
                            var cached = JSON.parse(data.toString());
                            cb(err, cached.res, cached.body);
                        }else{
                            if(pipedStream){
                                //stringStream(data).pipe(pipedStream);
                            }else throw new Error('No callback, no stream');
                        }
                    }
                });
            });
        });
    });
    if(callback){
        if(callback === true) return rtrn;
        return {}; //usually OK, otherwise have to delay bind to all fns
    }else return {
        pipe : function(stream){
            if(requestInstance) return requestInstance.pipe(stream);
            pipedStream = stream;
        }
    };
};
module.exports = Client;
/*module.exports.default = function(options){
    return new Client(options);
};*/
