var
 sys = require('sys'),

 default_job_fields = require('../node.jobs/common').default_job_fields;

var BACKENDS = {
    'mongodb': require('../node.jobs/backends/mongodb'),
    //'redis': require('../node.jobs/backends/redis')
}

exports.Store = function(backend, settings){
    try {
        var backend_class = BACKENDS[backend].Backend;
    } catch(e) {
        var backend_class = backend;
    }

    // Default settings
    settings.host = settings.host !== undefined ? settings.host : 'localhost';
    settings.db = settings.db !== undefined ? settings.db : null;
    settings.username = settings.username !== undefined ? settings.username : '';
    settings.password = settings.password !== undefined ? settings.password : '';

    return {
        _settings: settings,
        _backend: backend_class,

        open: function(callback){
            if (this._backend_object === undefined) this._backend_object = this._backend(this._settings);
            return this._backend_object.open(callback);
        },

        get_jobs: function(db, attrs, callback){
            if (this._backend_object === undefined) this._backend_object = this._backend(this._settings);
            return this._backend_object.get_jobs(db, attrs, callback);
        },

        post_job: function(db, attrs, callback){

            var fields = {};

            for (var k in default_job_fields) {
                val = attrs[k];
                if (val !== undefined) fields[k] = val
                else fields[k] = default_job_fields[k]
            }

            if (this._backend_object === undefined) this._backend_object = this._backend(this._settings);
            return this._backend_object.post_job(db, fields, callback);
        },

        get_next_job: function(db, attrs, callback){
            if (this._backend_object === undefined) this._backend_object = this._backend(this._settings);
            return this._backend_object.get_next_job(db, attrs, callback);
        },

        delete_jobs: function(db, attrs, callback){
            if (this._backend_object === undefined) this._backend_object = this._backend(this._settings);
            return this._backend_object.delete_jobs(db, attrs, callback);
        },

        expire_jobs: function(db, attrs, callback){
            if (this._backend_object === undefined) this._backend_object = this._backend(this._settings);
            return this._backend_object.expire_jobs(db, attrs, callback);
        },

        update_job: function(db, job_id, attrs, callback){
            if (this._backend_object === undefined) this._backend_object = this._backend(this._settings);
            return this._backend_object.update_job(db, job_id, attrs, callback);
        }
    }
}

