var
 sys = require('sys'),
 vows = require('vows'),
 assert = require('assert'),
 http = require('http');

var cl = http.createClient(3000, 'localhost');

var CHARS = {
    // Reserved characters
    '$':'24','&':'26','\\+':'2B',',':'2C','/':'2F',
    ':':'3A',';':'3B','=':'3D','\\?':'3F','@':'40',

    // Unsafe characters
    ' ':'20','"':'22','<':'3C','>':'3E','#':'23',
    '%':'25','{':'7B','}':'7D','|':'7C','\\\\':'5C',
    '^':'5E','~':'7E','\\[':'5B','\\]':'5D','`':'60'
};

function encode_url(word){
    for (var ch in CHARS) {
        while (word.indexOf(ch) >= 0) word = word.replace(ch, '%'+CHARS[ch]);
    }

    return word;
}

function encode_vars(dict){
    var ret = '';

    for (var key in dict) {
        var value = dict[key];

        if (typeof value === 'object') value = encode_url(JSON.stringify(value));

        ret += key + '=' + value + '&';
    }

    ret = ret ? '?'+ret : ret;

    sys.puts(ret);

    return ret;
}

vows.describe('Node.JobS HTTP URL methods').addBatch({
    'URLs': {
        'Home': function(){
            var req = cl.request('GET', '/', {});
            req.end();
            req.on('response', function(resp){
                assert.equal(resp.statusCode, 200);
                resp.on('data', function(content){
                    content = ''+content;
                    assert.ok(content.match(/.*?(Node\.JobS).*/));
                    });
                });
            },
        'Post job': function(){
            var vars = encode_vars({
                'name': 'testing-from-url',
                'params': {something: 'some value', other_field: 'other thing'},
                })


            var req = cl.request('GET', '/jobs/post/'+vars, {});
            req.end();
            req.on('response', function(resp){
                assert.equal(resp.statusCode, 200);
                resp.on('data', function(content){
                    //sys.puts(content);
                    });
                });
            },
        'Get jobs': function(){
            },
        'Get next job': function(){
            },
        'Delete job': function(){
            },
        'Expire job': function(){
            },
        'Update/Change job': function(){
            },
        'Static file': function(){
            }
        }
    }).run();

