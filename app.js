var express = require('express');
var proxy = require('express-http-proxy');

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
    var urlObject = require('url').parse(new Buffer(req.params.b64url, 'base64').toString('ascii'));
    var urlHost = urlObject.protocol + (urlObject.slashes ? '//' : '') + urlObject.host;
    console.log(urlObject);
    console.log(urlHost);
    console.log(urlObject.path);
    proxy(urlObject.path, {
        forwardPath: function(req, res) {
            return urlObject.path;
        }
    })(req, res);
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
