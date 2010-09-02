var
 sys = require('sys'),
 kiwi = require('kiwi'),
 express = require('express'),

 base = require('../node.jobs/base'),
 flags = require('../node.jobs/base');

// Create application and set its middlewares
var app = express.createServer();
app.use(express.logger());
app.use(express.bodyDecoder());

var settings = {
    DB_BACKEND: 'mongodb',
    DB_NAME: 'node_jobs_test'
    }

// VIEWS
var views = {
    home: function(req, res){
        res.send('x');
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

        var store = base.Store(settings.DB_BACKEND, {db: settings.DB_NAME});
        store.post_job(fields, function(error, job){
            res.send(JSON.stringify(job));
        });
    },

    jobs_get: function(req, res){
        var store = base.Store(settings.DB_BACKEND, {db: settings.DB_NAME});
        store.get_jobs(req.query, function(error, jobs){
            res.send(JSON.stringify(jobs));
        });
    },

    jobs_get_next: function(req, res){
        var store = base.Store(settings.DB_BACKEND, {db: settings.DB_NAME});
        store.get_next_job(req.query, function(error, jobs){
            if (jobs.length) res.send(JSON.stringify(jobs[0]));
            else res.send('null')
        });
    },

    jobs_delete: function(req, res){
        var store = base.Store(settings.DB_BACKEND, {db: settings.DB_NAME});
        store.delete_jobs(req.query, function(error, count){
            res.send(JSON.stringify(count));
        });
    },

    jobs_expire: function(req, res){
        var store = base.Store(settings.DB_BACKEND, {db: settings.DB_NAME});
        store.expire_jobs(req.query, function(error, result){
            res.send(JSON.stringify(result));
        });
    },

    jobs_update: function(req, res){
        var store = base.Store(settings.DB_BACKEND, {db: settings.DB_NAME});
        store.update_job(req.param('id'), req.query, function(error, jobs){
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

app.listen(3000);

