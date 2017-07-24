

var express = require('express');
var fs = require('fs');
var path = require('path');
var ytdl = require('ytdl-core');
var s3 = require('s3');
var search = require('youtube-search');

// MongoDB
var mongoose = require('mongoose');
var AudioMetadata = mongoose.model('AudioMetadata', new mongoose.Schema({
    id: String,
    downloaded: Boolean
}));

mongoose.connect(process.env.MONGODB_CONNECTION);

var searchOpts = {
    maxResults: 1,
    type: 'video',
    key: process.env.YOUTUBE_API_KEY
};

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

app.get('/alexa-check/:id', function (req, res) {
    var id = req.params.id;
    AudioMetadata.findOne({
        id: id
    }).exec(function (err, metadata) {
        if (err) {
            res.status(500).json({
                state: 'error',
                message: err.message
            });
        }
        else if (!metadata) {
            res.status(200).json({
                state: 'success',
                message: 'YouTube audio not downloaded'
            });
        }
        else {
            res.status(200).json({
                state: 'success',
                message: 'YouTube audio metadata found',
                metadata: metadata
            });
        }
    });
});

app.get('/alexa/:id', function (req, res) {
    var id = req.params.id;
    var old_url = 'https://www.youtube.com/watch?v='+id;
    ytdl.getInfo(old_url, function (err, info) {
        if (err) {
            res.status(500).json({
                state: 'error',
                message: err.message
            });
        }
        else {
            var metadata = new AudioMetadata({
                id: id,
                downloaded: false
            });
            metadata.save(function (err, metadata) {
                if (err) {
                    res.status(500).json({
                        state: 'error',
                        message: err.message
                    });
                }
                else {
                    var tmpfile = require('path').join('/tmp', id+'.mp3');
                    var key = require('path').join('audio', id+'.mp3');

                    var tmpfile_m3u = require('path').join('/tmp', id+'.m3u8');
                    var key_m3u = require('path').join('audio', id+'.m3u8');

                    var writer = fs.createWriteStream(tmpfile);
                    writer.on('finish', function () {
                        var uploader = s3Client.uploadFile({
                            localFile: tmpfile,
                            s3Params: {
                                Bucket: __bucket,
                                Key: key
                            }
                        });
                        uploader.on('end', function() {
                            fs.writeFile(tmpfile_m3u, '#EXTM3U\n'+s3.getPublicUrl(__bucket, key, 'us-west-1'), function(err) {
                                if (err) {
                                    console.log(err);
                                }
                                else {
                                    var uploader_m3u = s3Client.uploadFile({
                                        localFile: tmpfile_m3u,
                                        s3Params: {
                                            Bucket: __bucket,
                                            Key: key_m3u,
                                            ContentType: 'application/x-mpegurl'
                                        }
                                    });
                                    uploader_m3u.on('end', function() {
                                        metadata.downloaded = true;
                                        metadata.save(function (err, metadata) {});
                                    });
                                }
                            });
                        });
                    });
                    ytdl(old_url, {
                        filter: 'audioonly'
                    }).pipe(writer);

                    res.status(200).json({
                        state: 'success',
                        message: 'Attempting upload ...',
                        link: s3.getPublicUrl(__bucket, key_m3u, 'us-west-1')
                    });
                }
            });
        }
    });
});

function fetch_target_id(req, res) {
    var id = req.params.id;
    var old_url = 'https://www.youtube.com/watch?v='+id;
    ytdl.getInfo(old_url, function (err, info) {
        if (err) {
            res.status(500).json({
                state: 'error',
                message: err.message
            });
        }
        else {
            var new_url = path.join(__dirname, 'public', 'site', id+'.mp4');
            var writeable = ytdl(old_url).pipe(fs.createWriteStream(new_url));
            writeable.on('finish', function () {
                res.status(200).json({
                    state: 'success',
                    link: '/site/'+id+'.mp4',
                    info: {
                        id: id,
                        title: info.title
                    }
                });
            });
        }
    });
}

app.get('/target/:id', fetch_target_id);

app.get('/search/:query', function (req, res) {
    var query = req.params.query;
    search(query, searchOpts, function(err, results) {
        if (err) {
            res.status(500).json({
                state: 'error',
                message: err.message
            });
        }
        else {
            if (!results || !results.length) {
                res.status(200).send({
                    state: 'error',
                    message: 'No results found'
                });
            }
            else {
                var id = results[0].id;
                req.params.id = id;
                fetch_target_id(req, res);
            }
        }
    });
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
    AudioMetadata.remove({}, function (err, results) {
        if (err) {
            console.log(err.message);
        }
        else {
            console.log('Cleared old metadata.');
        }
    });
});
