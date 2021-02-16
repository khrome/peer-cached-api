var should = require('chai').should();
var path = require('path');
var express = require('express');
var peerPressure = require('peer-pressure');
var Client = require('../client');

var timeoutInSeconds = 10;

peerPressure.handleOrphanedPromises();

describe('peer-cached-api', function(){
    it('caches in the peer layer', function(doneTestingPeers){
        this.timeout(timeoutInSeconds * 1000)
        var app = express();
        var port = 8080;

        var backendCalls = 0;
        app.get('/someapi', function(req, res){
            backendCalls++;
            res.send(JSON.stringify({
                some : {
                    message : 'text'
                }
            }))
        });
        var connection = app.listen(port, function(){
            console.log('SERVER RUNNING');
            var storageOptions = {
                name: 'just-a-test',
                persist: false
            }
            var clientA = new Client(storageOptions);
            console.log('CLIENT A RUNNING');
            var running = 0;
            var complete = function(){
                running--;
                if(running === 0){
                    console.log('DONE');
                    console.log('??', backendCalls);
                    connection.close(function(err2){
                        should.not.exist(err);
                        should.not.exist(err2);
                        console.log('REALLY DONE');
                        doneTestingPeers();
                    });
                    done();
                }
            }
            clientA.request({
                uri:'http://localhost:8080/someapi',
                json: true
            }, function(err, res, body){
                console.log('A', body);
                complete();
            });
            running++;
            var clientB = new Client(storageOptions);
            console.log('CLIENT B RUNNING');
            clientB.request({
                uri:'http://localhost:8080/someapi',
                json: true
            }, function(err, res, body){
                console.log('B', body);
                complete();
            });
            running++;
        });
    });
});
