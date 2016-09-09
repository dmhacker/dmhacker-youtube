var express = require('express');
var proxy = require('express-http-proxy');
var validUrl = require('valid-url');

var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
    response.render('index');
});

var checkUrlExists = function(urlObject, callback) {
    var http = require('http'),
        url = require('url');
    var options = {
        method: 'HEAD',
        host: url.parse(urlObject).host,
        port: 80,
        path: url.parse(urlObject).pathname
    };
    var req = http.request(options, function(r) {
        callback(r.statusCode == 200);
    });
    req.end();
}

// Where the magic happens
app.get('/site/:b64url', function(req, res) {
    var rawUrl = new Buffer(req.params.b64url, 'base64').toString('ascii');
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        rawUrl = 'http://' + rawUrl;
    }
    var urlObject = require('url').parse(rawUrl);
    var urlHost = urlObject.protocol + (urlObject.slashes ? '//' : '') + urlObject.host;
    checkUrlExists(urlObject, function(exists) {
        if (exists) {
            proxy(urlHost, {
                forwardPath: function(req, res) {
                    return urlObject.path;
                }
            })(req, res);
        } else {
            res.render('index');
        }
    });
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
