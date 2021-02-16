var should = require('chai').should();
var path = require('path');
var express = require('express');
var peerPressure = require('peer-pressure');
var peers = peerPressure.with({
    browsers : [
        require('ppp-chrome-browser')
    ],
    dependencies : { //get shipped to the remote browser (with subdependencies)
        'peer-cached-api': path.resolve(process.cwd(), './client.js')
    },
    framework : require('ppp-mocha-framework'),
    packager : require('ppp-webpack-packager'),
    debug:true
});

var timeoutInSeconds = 90;

peerPressure.handleOrphanedPromises();

describe('peer-cached-api', function(){
    it('caches in the peer layer', function(doneTestingPeers){
        this.timeout(timeoutInSeconds * 1000);
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
            peers.test('start & stop without errors', function(done){
                var Client = require('peer-cached-api');
                var client = new Client();
                console.log('CLIENT A RUNNING');
                client.request({
                    uri:'http://localhost:8080/someapi',
                    json: true
                }, function(err, res, body){
                    console.log('A', body);
                    done();
                });
            }, function(done){
                var Client = require('peer-cached-api');
                var client = new Client();
                console.log('CLIENT B RUNNING');
                client.request({
                    uri:'http://localhost:8080/someapi',
                    json: true
                }, function(err, res, body){
                    console.log('B', body);
                    done();
                });
            }, function(err, stats){
                console.log('DONE');
                console.log('??', backendCalls);
                connection.close(function(err2){
                    should.not.exist(err);
                    should.not.exist(err2);
                    console.log('REALLY DONE');
                    doneTestingPeers();
                });
            });
        });
    });
});
