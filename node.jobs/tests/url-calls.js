var
 sys = require('sys'),
 vows = require('vows'),
 assert = require('assert'),
 http = require('http');

var cl = http.createClient(3000, 'localhost');

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
        'Static file': function(){
            var req = cl.request('GET', '/media/css/base.css', {});
            req.end();
            req.on('response', function(resp){
                assert.equal(resp.statusCode, 200);
                resp.on('data', function(content){
                    content = ''+content;
                    assert.ok(content.match(/.*?(font-family).*/));
                    });
                });
            },
        'Post job, get it, delete and check deleted': function(){
            var vars = encode_vars({
                'name': 'testing-on-url-calls',
                'params': {something: 'some value', other_field: 'other thing'}
                });

            // Posts the new job
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
        'Get next job': function(){
            var vars = encode_vars({
                'name': 'testing-next-job',
                'params': {something: 'some value', other_field: 'other thing'}
                });

            // Posts a new job
            var req = cl.request('GET', '/jobs/post/'+vars, {}); req.end();
            req.on('response', function(resp){
                assert.equal(resp.statusCode, 200);
                resp.on('data', function(content){
                    var job = JSON.parse(content);

                    // Posts other new job
                    var req2 = cl.request('GET', '/jobs/post/'+vars, {}); req2.end();
                    req2.on('response', function(resp2){
                        assert.equal(resp2.statusCode, 200);
                        resp2.on('data', function(content2){
                            var job2 = JSON.parse(content2);

                            // Gets the job again to check it has been deleted
                            var req3 = cl.request('GET', '/jobs/next/?name='+job2['name'], {}); req3.end();
                            req3.on('response', function(resp3){
                                assert.equal(resp3.statusCode, 200);

                                resp3.on('data', function(content3){
                                    var job3 = JSON.parse(content3);
                                    assert.equal(job['_id'], job3['_id']);

                                    // Requests job deletion
                                    var req4 = cl.request('GET', '/jobs/delete/?name='+job['name'], {}); req4.end();
                                    req4.on('response', function(resp4){
                                        assert.equal(resp4.statusCode, 200);
                                        resp4.on('data', function(deleted){
                                            assert.equal(deleted, 'true');
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            },
        'Expire job': function(){
            var vars = encode_vars({
                'name': 'testing-expiration',
                'params': {something: 'some value', other_field: 'other thing'},
                'expire': new Date()
                });

            // Posts a new job
            var req = cl.request('GET', '/jobs/post/'+vars, {}); req.end();
            req.on('response', function(resp){
                assert.equal(resp.statusCode, 200);
                resp.on('data', function(content){
                    var job = JSON.parse(content);

                    // Expires the job
                    var req2 = cl.request('GET', '/jobs/expire/', {}); req2.end();
                    req2.on('response', function(resp2){
                        assert.equal(resp2.statusCode, 200);
                        resp2.on('data', function(expired){
                            assert.equal(expired, 'true');

                            // Gets the job again to check it has been expired
                            var req3 = cl.request('GET', '/jobs/?name='+job['name'], {}); req3.end();
                            req3.on('response', function(resp3){
                                assert.equal(resp3.statusCode, 200);

                                resp3.on('data', function(content3){
                                    var job3 = JSON.parse(content3)[0];
                                    assert.equal(job3['status'], 'expired');

                                    // Requests job deletion
                                    var req4 = cl.request('GET', '/jobs/delete/?name='+job['name'], {}); req4.end();
                                    req4.on('response', function(resp4){
                                        assert.equal(resp4.statusCode, 200);
                                        resp4.on('data', function(deleted){
                                            assert.equal(deleted, 'true');
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            },
        'Update/Change job': function(){
            var vars = encode_vars({
                'name': 'testing-job-changed',
                'params': {something: 'some value', other_field: 'other thing'}
                });

            // Posts a new job
            var req = cl.request('GET', '/jobs/post/'+vars, {}); req.end();
            req.on('response', function(resp){
                assert.equal(resp.statusCode, 200);

                resp.on('data', function(content){
                    var job = JSON.parse(content);

                    // Modifying the job posted
                    var vars = encode_vars({'status': 'failed'});
                    var req2 = cl.request('GET', '/jobs/'+job['_id']+'/update/'+vars, {}); req2.end();
                    req2.on('response', function(resp2){
                        assert.equal(resp2.statusCode, 200);
                        resp2.on('data', function(content2){
                            var job2 = JSON.parse(content2);
                            assert.equal(job['_id'], job2['_id']);
                            assert.equal(job2['status'], 'failed');

                            // Gets the job again to check it has been expired
                            var req3 = cl.request('GET', '/jobs/?_id='+job['_id'], {}); req3.end();
                            req3.on('response', function(resp3){
                                assert.equal(resp3.statusCode, 200);

                                resp3.on('data', function(content3){
                                    var job3 = JSON.parse(content3)[0];
                                    assert.equal(job2['_id'], job3['_id']);
                                    assert.equal(job3['status'], 'failed');

                                    // Requests job deletion
                                    var req4 = cl.request('GET', '/jobs/delete/?name='+job['name'], {}); req4.end();
                                    req4.on('response', function(resp4){
                                        assert.equal(resp4.statusCode, 200);
                                        resp4.on('data', function(deleted){
                                            assert.equal(deleted, 'true');
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }
        }
    }).run();

