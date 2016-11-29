

var express = require('express');
var fs = require('fs');
var path = require('path');
var ytdl = require('ytdl-core');

var app = express();

var dir = './public/site';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
    response.render('index');
});

app.get('/target/:id', function (req, res) {
    var id = req.params.id;
    var old_url = 'http://www.youtube.com/watch?v='+id;
    var new_url = path.join(__dirname, 'public', 'site', id+'.wlv');
    console.log(new_url);
    ytdl(old_url).pipe(fs.createWriteStream(new_url));
    res.status(200).json({
        link: '/site/'+id
    });
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
