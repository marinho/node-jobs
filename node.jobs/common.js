var
 sys = require('sys'),
 fs = require('fs'),

 flags = require('../node.jobs/base');

exports.read_settings = function(filename, callback) {
    fs.readFile(filename, function(error, content){
        if (error) callback(error)
        else {
            if (content) callback(null, JSON.parse(content))
            else callback(null, {});
        }
    });
}

exports.default_settings = {
    store_backend: 'mongodb',
    store_database: 'node_jobs',
    service_port: 3000,
    output_log: true
}

exports.file_conf = '/etc/node.jobs/conf.json';

exports.default_job_fields = {
    'key': null,
    'name': null,
    'params': null,
    'sender': null,
    'destinatary': null,
    'when': null,
    'status': flags.JOB_STATUS_STANDING,
    'expire': null,
    'assigned_by': null,
    'response_message': null
};

