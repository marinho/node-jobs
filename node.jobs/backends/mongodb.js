const
 MongoClient = require('mongodb').MongoClient,
 Server = require('mongodb').Server,
 ObjectID = require('bson-objectid'),
 flags = require('../flags');

exports.Backend = function(settings){
    settings.port = settings.port !== undefined ? settings.port : 27017;
    settings.namespace = settings.namespace !== undefined ? settings.namespace : 'jobs';

    return {
        _settings: settings,

        open: function(callback){
            const options = {
                // reconnectTries : Number.MAX_VALUE,
                // autoReconnect : true,
                useUnifiedTopology: true // without this line, it's deprecated, but it's incompatible with autoReconnect
            };
            const client = new MongoClient(new Server(this._settings.host, this._settings.port), options);
            client.connect((error, cl) => {
                if (error == null) {
                    const db = cl.db(this._settings.db);
                    callback(null, db);
                } else {
                    callback(error, null);
                }
            });
        },

        close: function(callback){
            //this.db.close(); // XXX why is this line commented?
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

            if (attrs.params) attrs.params = JSON.parse(attrs.params);

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
                if (attrs.exclude_ids) {
                    var list = attrs.exclude_ids.split(',');
                    var ids = [];
                    for (var i=0; i<list.length; i++) ids.push(new ObjectID(list[i]))

                    attrs['_id'] = {'$nin': ids};
                }

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
                    const options = {'sort': 'when', 'limit': 1};
                    collection.find(attrs, options, function(error, cursor){
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

