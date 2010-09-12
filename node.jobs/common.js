var
 sys = require('sys'),
 fs = require('fs'),

 flags = require('../node.jobs/flags');

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

exports.process_date = function(dt, now_if_empty){
    // If empty: current datetime or just returns null
    if (dt === null || dt === '') {
        if (now_if_empty === true) {
            dt = new Date();
        } else {
            return null;
        }
    }

    // Converts to date if string
    if (typeof dt === 'string') {
        dt = new Date(dt);
    }

    return dt;
}

exports.datetime_as_string = function(dt){
    // Returns datatime formatted as 'YYYY-M-D H:M:S' or just '' if not valid
    
    if (!dt) return '';
    
    return dt.getFullYear() + '-' +
           (dt.getMonth()+1) + '-' +
           dt.getDate() + ' ' +
           dt.getHours() + ':' +
           dt.getMinutes() + ':' +
           dt.getSeconds();
}

