var
 sys = require('sys'),
 vows = require('vows'),
 assert = require('assert'),
 http = require('http');

var cl = http.createClient(3000, 'localhost');

var CHARS = {
    // Reserved characters
    '$':'24','&':'26','\\+':'2B',',':'2C','/':'2F',
    ':':'3A',';':'3B','=':'3D','\\?':'3F','@':'40',

    // Unsafe characters
    ' ':'20','"':'22','<':'3C','>':'3E','#':'23',
    '%':'25','{':'7B','}':'7D','|':'7C','\\\\':'5C',
    '^':'5E','~':'7E','\\[':'5B','\\]':'5D','`':'60'
};

function encode_vars(dict){
    var ret = '';

    for (var key in dict) {
        var value = dict[key];

        if (typeof value === 'object') value = escape(JSON.stringify(value));

        ret += key + '=' + value + '&';
    }

    return ret ? '?'+ret : ret;
}

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
        'Post job, get it, delete and check deleted': function(){
            var vars = encode_vars({
                'name': 'testing-on-url-calls',
                'params': {something: 'some value', other_field: 'other thing'},
                })

            var req = cl.request('GET', '/jobs/post/'+vars, {}); req.end();
            req.on('response', function(resp){
                assert.equal(resp.statusCode, 200);
                resp.on('data', function(content){
                    var job = JSON.parse(content);
                    assert.equal(job['name'], 'testing-on-url-calls');

                    // Gets the job
                    var vars = encode_vars({'_id': job['_id']})
                    var req2 = cl.request('GET', '/jobs/'+vars, {}); req2.end();
                    req2.on('response', function(resp2){
                        assert.equal(resp2.statusCode, 200);

                        resp2.on('data', function(content2){
                            var job2 = JSON.parse(content);
                            assert.equal(job['_id'], job2['_id']);

                            // Requests job deletion
                            var req3 = cl.request('GET', '/jobs/delete/'+vars, {}); req3.end();
                            req3.on('response', function(resp3){
                                assert.equal(resp3.statusCode, 200);
                                resp3.on('data', function(deleted){
                                    assert.equal(deleted, 'true');

                                    // Gets the job again to check it has been deleted
                                    var req4 = cl.request('GET', '/jobs/'+vars, {}); req4.end();
                                    req4.on('response', function(resp4){
                                        assert.equal(resp4.statusCode, 200);

                                        resp4.on('data', function(content4){
                                            assert.equal(content4, '[]');
                                            });
                                        });
                                    });
                                });
                            });
                        });
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

