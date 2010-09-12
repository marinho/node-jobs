var
 sys = require('sys'),

 MongoDB = require('mongodb/db').Db,
 MongoServer = require('mongodb/connection').Server,
 ObjectID = require('mongodb/bson/bson').ObjectID,

 flags = require('../flags'),
 process_date = require('../common').process_date;

exports.Backend = function(settings){
    settings.port = settings.port !== undefined ? settings.port : 27017;
    settings.namespace = settings.namespace !== undefined ? settings.namespace : 'jobs';

    return {
        _settings: settings,

        open: function(callback){
            var db = new MongoDB(this._settings.db, new MongoServer(this._settings.host,
                this._settings.port, {auto_reconnect: true}, {}));
            db.open(callback);
        },

        get_collection: function(db, callback){ // Callback function must be function(error, collection)
            db.collection(this._settings.namespace, function(error, collection){
                if (error) callback(error)
                else callback(null, collection);
            });
        },

        get_jobs: function(db, attrs, callback){ // Callback function must be function(error, list)
            var self = this;
            var attrs = this.process_attrs(attrs);

            this.get_collection(db, function(error, collection){
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

        post_job: function(db, attrs, callback){ // Callback function must be function(error, job)
            if (typeof attrs.params === 'string') attrs.params = JSON.parse(attrs.params);

            attrs.when = process_date(attrs.when, true);
            attrs.expire = process_date(attrs.expire);

            this.get_collection(db, function(error, collection){
                if (error) callback(error)
                else {
                    var job = attrs;

                    collection.insert([job], function(){
                        callback(null, job);
                    });
                }
            });
        },

        process_attrs: function(attrs){
            if ('exclude_ids' in attrs) {
                if (attrs.exclude_ids) attrs['_id'] = {'$nin': attrs.exclude_ids.split(',')};

                delete attrs.exclude_ids;
            }

            return attrs;
        },

        get_next_job: function(db, attrs, callback){
            var self = this;
            var attrs = this.process_attrs(attrs);

            this.get_collection(db, function(error, collection){
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

        delete_jobs: function(db, attrs, callback){
            this.get_collection(db, function(error, collection){
                if (error) callback(error)
                else {
                    if (attrs['_all']) attrs = {}

                    collection.remove(attrs, function(error){
                        if (error) callback(error)
                        else callback(null, true);
                    });
                }
            });
        },

        expire_jobs: function(db, attrs, callback){
            var self = this;

            this.get_collection(db, function(error, collection){
                if (error) callback(error)
                else {
                    attrs['expire'] = {'$lt': new Date()};
                    attrs['status'] = flags.JOB_STATUS_STANDING;
                    new_values = {'$set': {'status': flags.JOB_STATUS_EXPIRED}}

                    collection.update(attrs, new_values, function(error, res){
                        if (error) callback(error)
                        else callback(null, true)
                    });
                }
            })
        },

        update_job: function(db, job_id, attrs, callback){
            var self = this;

            this.get_collection(db, function(error, collection){
                if (error) callback(error)
                else {
                    var conditions = {_id: job_id};
                    var new_values = {'$set': attrs};

                    collection.update(conditions, new_values, function(error, job){
                        if (error) callback(error)
                        else {
                            collection.find(conditions, function(error, cursor){
                                if (error) callback(error)
                                else {
                                    cursor.toArray(function(error, results){
                                        if (error) callback(error)
                                        else callback(null, results);
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

