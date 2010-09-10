var
 sys = require('sys'),
 fs = require('fs'),
 ws = require('ws'),

 base = require('../node.jobs/base'),
 flags = require('../node.jobs/base'),
 read_settings = require('../node.jobs/common').read_settings,
 default_settings = require('../node.jobs/common').default_settings,
 file_conf = require('../node.jobs/common').file_conf,
 default_job_fields = require('../node.jobs/common').default_job_fields;

function get_params_from_message(msg){
    var params = {};
    for (var k in msg){
        if (k !== 'method') params[k] = msg[k];
    }
    return params;
}

var methods = {
    get_jobs: function(store, db, conn, msg) {
                store.get_jobs(db, get_params_from_message(msg), function(error, jobs){
                  conn.send(JSON.stringify(jobs));
                });
              },
    post_job: function(store, db, conn, msg) {
                var fields = {};

                for (var k in default_job_fields) {
                    var val = msg[k];
                    if (val !== undefined) fields[k] = val
                    else fields[k] = default_job_fields[k]
                }

                store.post_job(db, fields, function(error, job){
                    conn.send(JSON.stringify(job));
                    //broadcast
                });
              },
    delete_job: function(store, db, conn, msg) {
                    store.delete_jobs(db, get_params_from_message(msg), function(error, count){
                        conn.send(JSON.stringify(count));
                        //broadcast
                    });
                },
    next_job: function(store, db, conn, msg) {
                store.get_next_job(db, get_params_from_message(msg), function(error, jobs){
                    if (jobs.length) conn.send(JSON.stringify(jobs[0]));
                    else conn.send('null')
                });
              },
    expire_job: function(store, db, conn, msg) {
                    store.expire_jobs(db, get_params_from_message(msg), function(error, result){
                        conn.send(JSON.stringify(result));
                        //broadcast
                    });
                },
    update_job: function(store, db, conn, msg) {
                    store.update_job(db, get_params_from_message(msg), req.query, function(error, jobs){
                        conn.send(JSON.stringify(jobs[0]));
                        //broadcast
                    });
                }
    //assign_job
}

read_settings(file_conf, function(error, file_settings){
    // Load settings from configuration file
    var settings = file_settings != undefined ? file_settings : {};
    for (var k in default_settings) settings[k] = (settings[k] === undefined) ? default_settings[k] : settings[k];

    // Initializes store (probably on MongoDB connection)
    var store = base.Store(settings.store_backend, {db: settings.store_database});
    store.open(function(error, db){

        // Create application and set its middlewares
        var server = ws.createServer();

        server.addListener("listening", function(){
          sys.log("Listening for connections.");
        });

        // Handle WebSocket Requests
        server.addListener("connection", function(conn){
          //conn.send("Connection: "+conn.id);

          conn.addListener("message", function(message){
            var msg = JSON.parse(message);
            sys.log(msg.method);

            if (msg.method !== undefined) {
                methods[msg.method](store, db, conn, msg);
            }

            //conn.broadcast("<"+conn.id+"> "+message);
          });
        });

        server.addListener("close", function(conn){
          //server.broadcast("<"+conn.id+"> disconnected");
        });

        server.listen(settings.service_port);
    });
});

