var
 sys = require('sys'),
 vows = require('vows'),
 assert = require('assert'),

 base = require('../base'),
 flags = require('../flags'),
 process_date = require('../common').process_date,
 datetime_as_string = require('../common').datetime_as_string;

var
 Store = base.Store;

var store = Store('mongodb', {db: 'node_jobs_test'});
store.open(function(error, db){
    vows.describe('Node.JobS base').addBatch({
        'Common functions': {
            'Formatting datetime': function(){
                assert.equal(datetime_as_string(new Date('2010-06-21')), '2010-6-21 0:0:0');
                },
            'Processing datetime': function(){
                assert.equal(datetime_as_string(process_date(new Date())), datetime_as_string(new Date()));
                assert.equal(datetime_as_string(process_date(null)), '');
                assert.equal(datetime_as_string(process_date(null, true)), datetime_as_string(new Date())); // Returns current datetime if empty
                assert.equal(datetime_as_string(process_date("12/30/1981")), '1981-12-30 0:0:0');
                assert.equal(datetime_as_string(process_date("1981-12-30")), '1981-12-30 0:0:0');
                }
            },

        'Store class': {
            'Store persistence - creating, getting and deleting': function(){
                // Get jobs before post
                store.get_jobs(db, {name: 'node_jobs.tests.check_something'}, function(res, jobs){
                    count_before = jobs.length;

                    // Post a new job
                    store.post_job(db, {
                        name: 'node_jobs.tests.check_something',
                        params: {what: 'something', where: 'somewhere'},
                        sender: null,
                        destinatary: null,
                        expire: null,
                        key: null
                        }, function(res, job){
                            // Get jobs after post
                            store.get_jobs(db, {name: 'node_jobs.tests.check_something'}, function(res, jobs2){
                                assert.isTrue(jobs2.length === count_before + 1);

                                // Next job
                                store.get_next_job(db, {name: 'node_jobs.tests.check_something'}, function(res, next_jobs){
                                    assert.equal(next_jobs.length, 1);

                                    // Delete job found
                                    store.delete_jobs(db, {'_id': next_jobs[0]['_id']}, function(error, result){
                                        assert.isTrue(result);

                                        store.get_jobs(db, {'_id': next_jobs[0]['_id']}, function(res, jobs3){
                                            assert.equal(jobs3.length, 0);
                                            });
                                    });
                                });
                            });
                        });
                    });
                },

            'Store persistence - expiring and updating': function(){
                // Post a new job
                store.post_job(db, {
                    name: 'node_jobs.job-to-expire',
                    params: {what: 'something', where: 'somewhere'},
                    sender: null,
                    destinatary: null,
                    expire: new Date(),
                    key: null,
                    status: flags.JOB_STATUS_STANDING
                    }, function(res, job){
                        // Expires the job
                        store.expire_jobs(db, {}, function(error, result){
                            assert.isTrue(result);

                            // Updates the job
                            store.update_job(db, job['_id'], {'status': flags.JOB_STATUS_FAILED}, function(error, res){
                                assert.equal(res[0]['status'], flags.JOB_STATUS_FAILED);

                                // Delete the job to clear database
                                store.delete_jobs(db, {'_id': job['_id']}, function(error, deleted){
                                    assert.isTrue(deleted);
                                    });
                                });
                        });
                    });
                }
            }
        }).run();
    });

