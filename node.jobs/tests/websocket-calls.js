// Depends on http://revhttp.googlecode.com/svn/trunk/nodejs/node-ws-client.js as 'wsclient'
var
 sys = require('sys'),
 vows = require('vows'),
 assert = require('assert'),
 http = require('http'),
 wsclient = require('../tests/wsclient');

vows.describe('Node.JobS WebSocket methods').addBatch({
    'URLs': {
        'Post job, get it, delete and check deleted': function(){
            // Posts the new job
            var cl = wsclient.createClient('ws://localhost:3001/');
            cl.addListener('data', function(data){
                sys.puts(data);
                    // Gets the job
                            // Requests job deletion
                                    // Gets the job again to check it has been deleted
                });
            cl.write(JSON.stringify({
                'method': 'post_job',
                'name': 'testing-on-websockets',
                'params': {something: 'some value', other_field: 'other thing'}
                }));
            },
        'Get next job': function(){
            // Posts a new job
                    // Posts other new job
                            // Gets the job again to check it has been deleted
                                    // Requests job deletion
            },
        'Expire job': function(){
            // Posts a new job
                    // Expires the job
                            // Gets the job again to check it has been expired
                                    // Requests job deletion
            },
        'Update/Change job': function(){
            // Posts a new job
                    // Modifying the job posted
                            // Gets the job again to check it has been expired
                                    // Requests job deletion
            }
        }
    }).run();


