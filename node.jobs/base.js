var
 sys = require('sys');

var BACKENDS = {
    'mongodb': require('../node.jobs/backends/mongodb'),
    'redis': require('../node.jobs/backends/redis')
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

        get_jobs: function(attrs, callback){
            var backend = this._backend(this._settings);
            return backend.get_jobs(attrs, callback);
        },

        post_job: function(attrs, callback){
            var backend = this._backend(this._settings);
            return backend.post_job(attrs, callback);
        },

        get_next_job: function(attrs, callback){
            var backend = this._backend(this._settings);
            return backend.get_next_job(attrs, callback);
        },

        delete_jobs: function(attrs, callback){
            var backend = this._backend(this._settings);
            return backend.delete_jobs(attrs, callback);
        },

        expire_jobs: function(attrs, callback){
            var backend = this._backend(this._settings);
            return backend.expire_jobs(attrs, callback);
        },

        update_job: function(job_id, attrs, callback){
            var backend = this._backend(this._settings);
            return backend.update_job(job_id, attrs, callback);
        }
    }
}

