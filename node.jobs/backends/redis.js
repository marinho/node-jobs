var
 sys = require('sys'),
 redis = require("redis-client");

exports.Backend = function(settings){
    settings.port = settings.port !== undefined ? settings.port : '6379';

    return {
        _settings: settings,

        get_client: function(){
            return redis.createClient(this._settings.port, this._settings.host);
        },

        get_jobs: function(attrs){
            return this.get_client().find(attrs);
        },

        post_job: function(attrs){
            var ns = this.get_client();
        }
    }
}

