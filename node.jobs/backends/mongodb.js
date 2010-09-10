var
 sys = require('sys'),

 MongoDB = require('mongodb/db').Db,
 MongoServer = require('mongodb/connection').Server,
 ObjectID = require('mongodb/bson/bson').ObjectID,

 flags = require('../flags');

exports.Backend = function(settings){
    settings.port = settings.port !== undefined ? settings.port : 27017;
    settings.namespace = settings.namespace !== undefined ? settings.namespace : 'jobs';

    return {
        _settings: settings,

        open: function(callback){
            var db = new MongoDB(this._settings.db, new MongoServer(this._settings.host, this._settings.port, {auto_reconnect: true}, {}));
            db.open(callback);
        },

        close: function(callback){
            //this.db.close();
            if (callback) callback();
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
                                else {
                                    callback(null, results)
                                    self.close();
                                }
                            });
                        }
                    });
                }
            })
        },

        post_job: function(db, attrs, callback){ // Callback function must be function(error, job)
            var self = this;

            if (typeof attrs.params === String) attrs.params = JSON.parse(attrs.params);

            this.get_collection(db, function(error, collection){
                if (error) callback(error)
                else {
                    var job = attrs;
                    collection.insert([job], function(){
                        callback(null, job);
                        self.close();
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
                                        else {
                                            callback(null, results)
                                            self.close();
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            })
        },

        delete_jobs: function(db, attrs, callback){
            var self = this;

            this.get_collection(db, function(error, collection){
                if (error) callback(error)
                else {
                    if (attrs['_all']) attrs = {}

                    collection.remove(attrs, function(){
                        callback(null, 1); // FIXME
                        self.close();
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
                        else {
                            callback(null, 1) // FIXME
                            self.close();
                        }
                    });
                }
            })
        },

        update_job: function(db, job_id, attrs, callback){
            var self = this;

            this.get_collection(db, function(error, collection){
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
                                        else {
                                            callback(null, results);
                                            self.close();
                                        }
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

