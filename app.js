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

// Where the magic happens
app.get('/site/:b64url', function (req, res) {
    var rawUrl = new Buffer(req.params.b64url, 'base64').toString('ascii');
    if (!validUrl.isUri(rawUrl)){
        res.render('index');
        return;
    }
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        rawUrl = 'http://' + rawUrl;
    }
    var urlObject = require('url').parse(rawUrl);
    var urlHost = urlObject.protocol + (urlObject.slashes ? '//' : '') + urlObject.host;
    proxy(urlHost, {
        forwardPath: function(req, res) {
            return urlObject.path;
        }
    })(req, res);
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
