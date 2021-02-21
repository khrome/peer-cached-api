var should = require('chai').should();
var path = require('path');
var express = require('express');
var poly = require('polymorhpic-request');
var util = require('polymorhpic-request/util');
var requestCore = require('request');
var peerPressure = require('peer-pressure');
var Client = require('../client');
var formData = require('form-data');
var request = poly.request(requestCore, formData);
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
            var storageOptions = {
                name: 'just-a-test',
                persist: false
            }
            var clientA = new Client(storageOptions);
            clientA.requestInstance = request;
            var running = 0;
            var complete = function(){
                running--;
                if(running === 0){
                    connection.close(function(err){
                        should.not.exist(err);
                        backendCalls.should.be.above(0);
                        backendCalls.should.be.below(2);
                        doneTestingPeers();
                    });
                }
            }
            var doRequestB;
            clientA.request({
                uri:'http://localhost:8080/someapi',
                json: true
            }, function(err, res, body){
                should.not.exist(err);
                should.exist(body);
                should.exist(body.some);
                should.exist(body.some.message);
                body.some.message.should.equal('text');
                complete();
                doRequestB();
            });
            running++;
            var clientB = new Client(storageOptions);
            clientB.requestInstance = request;
            doRequestB = function(){
                clientB.request({
                    uri:'http://localhost:8080/someapi',
                    json: true
                }, function(err, res, body){
                    should.not.exist(err);
                    should.exist(body);
                    should.exist(body.some);
                    should.exist(body.some.message);
                    body.some.message.should.equal('text');
                    complete();
                });
            }
            running++;
        });
    });
});
