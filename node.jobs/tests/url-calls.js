var
 sys = require('sys'),
 vows = require('vows'),
 assert = require('assert'),
 http = require('http');

var cl = http.createClient(3000, 'localhost');

vows.describe('Node.JobS HTTP URL methods').addBatch({
    'URLs': {
        'Home': function(){
            var req = cl.request('GET', '/', {});
            req.end();
            req.on('response', function(resp){
                assert.equal(resp.statusCode, 200);
                resp.on('data', function(content){
                    content = ''+content;
                    assert.ok(content.match(/.*?(Node\.JobS).*/));
                    });
                });
            },
        'Post job': function(){
            var req = cl.request('GET', '/jobs/post/', {
                'name': 'testing-from-url',
                'params': "{something: 'some value', other_field: 'other thing'}",
                });
            req.end();
            req.on('response', function(resp){
                assert.equal(resp.statusCode, 200);
                resp.on('data', function(content){
                    sys.puts(content);
                    });
                });
            },
        'Get jobs': function(){
            },
        'Get next job': function(){
            },
        'Delete job': function(){
            },
        'Expire job': function(){
            },
        'Update/Change job': function(){
            },
        'Static file': function(){
            }
        }
    }).run();

