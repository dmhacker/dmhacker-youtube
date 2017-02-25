

var express = require('express');
var fs = require('fs');
var path = require('path');
var ytdl = require('ytdl-core');
var s3 = require('s3');

global.__bucket = process.env.S3_BUCKET;

var s3Client = s3.createClient({
    s3Options: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    }
});

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

app.get('/alexa/:id', function (req, res) {
    var id = req.params.id;
    var old_url = 'https://www.youtube.com/watch?v='+id;
    ytdl.getInfo(old_url, function (err, info) {
        if (err) {
            res.status(500).json({
                message: err.message
            });
        }
        else {
            var tmpfile = require('path').join('/tmp', id+'.mp3');
            var key = require('path').join('audio', id);

            var writer = fs.createWriteStream(tmpfile);
            writer.on('finish', function () {
                var uploader = s3Client.uploadFile({
                    localFile: tmpfile,
                    s3Params: {
                        Bucket: __bucket,
                        Key: key
                    }
                });
            });

            ytdl(old_url, {
                filter: 'audioonly'
            }).pipe(writer);

            res.status(200).json({
                'message': 'Attempting upload ...',
                'link': s3.getPublicUrl(__bucket, key)
            });
        }
    });
});

app.get('/target/:id', function (req, res) {
    var id = req.params.id;
    var old_url = 'https://www.youtube.com/watch?v='+id;
    ytdl.getInfo(old_url, function (err, info) {
        if (err) {
            res.status(500).json({
                message: err.message
            });
        }
        else {
            var new_url = path.join(__dirname, 'public', 'site', id+'.mp4');
            var writeable = ytdl(old_url).pipe(fs.createWriteStream(new_url));
            writeable.on('finish', function () {
                res.status(200).json({
                    link: '/site/'+id+'.mp4',
                    info: {
                        id: id,
                        title: info.title
                    }
                });
            });
        }
    });
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
