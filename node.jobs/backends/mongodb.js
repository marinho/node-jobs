var
 sys = require('sys'),
 kiwi = require('kiwi'),

 MongoDB = require('mongodb/db').Db,
 MongoServer = require('mongodb/connection').Server,
 ObjectID = require('mongodb/bson/bson').ObjectID,

 flags = require('../flags');

exports.Backend = function(settings){
    settings.port = settings.port !== undefined ? settings.port : 27017;
    settings.namespace = settings.namespace !== undefined ? settings.namespace : 'jobs';

    return {
        _settings: settings,

        get_collection: function(callback){ // Callback function must be function(error, collection)
            if (this.db === undefined) {
                this.db = new MongoDB(this._settings.db, new MongoServer(this._settings.host, this._settings.port, {auto_reconnect: true}, {}));
                this.db.open(function(){ /* Do nothing for a while */ });
            }

            this.db.collection(this._settings.namespace, function(error, collection){
                if (error) callback(error)
                else callback(null, collection);
            });
        },

        get_jobs: function(attrs, callback){ // Callback function must be function(error, list)
            this.get_collection(function(error, collection){
                if (error) callback(error)
                else {
                    collection.find(attrs, function(error, cursor){
                        if (error) callback(error)
                        else {
                            cursor.toArray(function(error, results){
                                if (error) callback(error)
                                else callback(null, results)
                            });
                        }
                    });
                }
            })
        },

        post_job: function(attrs, callback){ // Callback function must be function(error, job)
            this.get_collection(function(error, collection){
                if (error) callback(error)
                else {
                    var job = attrs;
                    collection.insert([job], function(){
                        callback(null, job);
                    });
                }
            });
        },

        get_next_job: function(attrs, callback){
            this.get_collection(function(error, collection){
                if (error) callback(error)
                else {
                    collection.find(attrs, {'sort': 'when'}, function(error, cursor){
                        if (error) callback(error)
                        else {
                            cursor.limit(1, function(error, cursor){
                                if (error) callback(error)
                                else {
                                    cursor.toArray(function(error, results){
                                        if (error) callback(error)
                                        else callback(null, results)
                                    });
                                }
                            });
                        }
                    });
                }
            })
        },

        delete_jobs: function(attrs, callback){
            this.get_collection(function(error, collection){
                if (error) callback(error)
                else {
                    if (attrs['_all']) attrs = {}

                    collection.remove(attrs, function(){
                        callback(null, 1); // FIXME
                    });
                }
            });
        },

        expire_jobs: function(attrs, callback){
            this.get_collection(function(error, collection){
                if (error) callback(error)
                else {
                    attrs['expire'] = {'$lt': new Date()};
                    attrs['status'] = flags.JOB_STATUS_STANDING;
                    new_values = {'$set': {'status': flags.JOB_STATUS_EXPIRED}}

                    collection.update(attrs, new_values, function(error, res){
                        if (error) callback(error)
                        else callback(null, 1) // FIXME
                    });
                }
            })
        },

        update_job: function(job_id, attrs, callback){
            this.get_collection(function(error, collection){
                if (error) callback(error)
                else {
                    var conditions = {_id: ObjectID.createFromHexString(job_id)};
                    var new_values = {'$set': attrs};

                    collection.update(conditions, new_values, function(error, job){
                        if (error) callback(error)
                        else {
                            collection.find(conditions, function(error, cursor){
                                if (error) callback(error)
                                else {
                                    cursor.toArray(function(error, results){
                                        if (error) callback(error)
                                        else callback(null, results)
                                    });
                                }
                            });
                        }
                    });
                }
            })
        }
    }
}

