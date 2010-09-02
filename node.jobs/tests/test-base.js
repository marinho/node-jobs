var
 sys = require('sys'),
 vows = require('vows'),
 assert = require('assert'),

 base = require('../base');

var
 Store = base.Store;

vows.describe('Node.JobS base').addBatch({
    'Store class': {
        'Store class exists': function(){
            assert.notEqual(Store, undefined);
            },

        'Store constructor using Mongo backend': function(){
            var store = Store('mongodb', {db: 'node_jobs_test'});
            //store = Store('redis', {host: 'localhost', db: 5, default_sender: null});
            assert.notEqual(store, undefined);
            },

        'Store persistence': function(){
            var store = Store('mongodb', {db: 'node_jobs_test'});

            store.get_jobs({name: 'node_jobs.tests.check_something'}, function(res, jobs){
                count_before = jobs.length;

                store.post_job({
                    name: 'node_jobs.tests.check_something',
                    params: {what: 'something', where: 'somewhere'},
                    sender: null,
                    destinatary: null,
                    expire: null,
                    key: null
                    }, function(res, job){
                        store.get_jobs({name: 'node_jobs.tests.check_something'}, function(res, jobs2){
                            count_after = jobs2.length;
                            var cmp = count_after === count_before + 1;
                            //assert.isTrue(cmp);
                        });
                });
            });
            }
    }
}).run();

