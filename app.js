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

app.use('/proxy', proxy('www.google.com'));

app.get('/site/:b64url', function(req, res) {
    var website = new Buffer(req.params.b64url, 'base64').toString('ascii');
    return proxy(website)(req, res);
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
