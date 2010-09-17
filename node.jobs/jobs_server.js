var
 sys = require('sys'),
 fs = require('fs'),
 express = require('express'),

 base = require('../node.jobs/base'),
 read_settings = require('../node.jobs/common').read_settings,
 default_settings = require('../node.jobs/common').default_settings,
 file_conf = require('../node.jobs/common').file_conf;

read_settings(file_conf, function(error, file_settings){
    // Load settings from configuration file
    var settings = file_settings != undefined ? file_settings : {};
    for (var k in default_settings) settings[k] = (settings[k] === undefined) ? default_settings[k] : settings[k];

    // Initializes store (probably on MongoDB connection)
    var store = base.Store(settings.store_backend, {db: settings.store_database});
    store.open(function(error, db){

        // Create application and set its middlewares
        var app = express.createServer();
        app.use(express.bodyDecoder());
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
                store.post_job(db, req.query, function(error, job){
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
                store.delete_jobs(db, req.query, function(error, deleted){
                    res.send(JSON.stringify(deleted));
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

        app.listen(settings.service_port);
    });
});

