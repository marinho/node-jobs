var
 util = require('util'),
 fs = require('fs'),
 express = require('express'),

 base = require('../node.jobs/base'),
 flags = require('../node.jobs/base');

function read_settings(filename, callback) {
    fs.readFile(filename, function(error, content){
        if (error) callback(error)
        else {
            if (content) callback(null, JSON.parse(content))
            else callback(null, {});
        }
    });
}

var default_settings = {
    store_backend: 'mongodb',
    store_database: 'node_jobs',
    service_port: 3000,
    output_log: true
}

read_settings('/etc/node.jobs/conf.json', function(error, file_settings){
    // Load settings from configuration file
    var settings = file_settings != undefined ? file_settings : {};
    for (var k in default_settings) settings[k] = (settings[k] === undefined) ? default_settings[k] : settings[k];

    // Initializes store (probably on MongoDB connection)
    var store = base.Store(settings.store_backend, {db: settings.store_database});
    store.open(function(error, db){
        // Create application and set its middlewares
        var app = express.createServer();
        app.use(express.bodyParser());
        if (settings.output_log) app.use(express.logger());

        // VIEWS
        var views = {
            home: function(req, res){
                res.writeHead(200, {'Content-Type': 'text/html'});
                fs.readFile(__dirname+'/views/index.html', function(error, content){
                    res.end(content);
                });
            },

            jobs_post: function(req, res){
                var fields = {
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
                for (var k in fields) {
                    val = req.param(k);
                    if (val !== undefined) fields[k] = val
                }

                store.post_job(db, fields, function(error, job){
                    res.send(JSON.stringify(job));
                });
            },

            jobs_get: function(req, res){
                store.get_jobs(db, req.query, function(error, jobs){
                    res.send(JSON.stringify(jobs));
                });
            },

            jobs_get_next: function(req, res){
                store.get_next_job(db, req.query, function(error, jobs){
                    if (jobs.length) res.send(JSON.stringify(jobs[0]));
                    else res.send('null')
                });
            },

            jobs_delete: function(req, res){
                store.delete_jobs(db, req.query, function(error, count){
                    res.send(JSON.stringify(count));
                });
            },

            jobs_expire: function(req, res){
                store.expire_jobs(db, req.query, function(error, result){
                    res.send(JSON.stringify(result));
                });
            },

            jobs_update: function(req, res){
                store.update_job(db, req.param('id'), req.query, function(error, jobs){
                    res.send(JSON.stringify(jobs[0]));
                });
            },

            static_serve: function(req, res){
                res.sendfile(__dirname + '/media/' + req.params[0]);
            }
        }

        // URLS
        app.get('/', views.home);
        app.get('/media/*', views.static_serve);
        app.get('/jobs/', views.jobs_get);
        app.get('/jobs/post/', views.jobs_post);
        app.get('/jobs/delete/', views.jobs_delete); // FIXME: method should be delete
        app.get('/jobs/next/', views.jobs_get_next);
        app.get('/jobs/expire/', views.jobs_expire); // FIXME: method should be post
        app.get('/jobs/:id/update/', views.jobs_update); // FIXME: method should be post
        //app.del('/jobs/', views.jobs_delete);

        app.setMaxListeners(30);
        app.listen(settings.service_port);
    });
});

