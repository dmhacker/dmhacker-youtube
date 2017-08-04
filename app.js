var express = require('express');
var fs = require('fs');
var path = require('path');
var ytdl = require('ytdl-core');
var ytsearch = require('youtube-search');
var ffmpeg = require('fluent-ffmpeg');

var app = express();

var dir = './public/site';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('index');
});

app.get('/alexa/:id', function(req, res) {
  var id = req.params.id;
  var old_url = 'https://www.youtube.com/watch?v=' + id;
  ytdl.getInfo(old_url, function(err, info) {
    if (err) {
      res.status(500).json({
        state: 'error',
        message: err.message
      });
    } else {
      var tmp_url = path.join(__dirname, 'tmp', id + '.mp4');
      var new_url = path.join(__dirname, 'public', 'site', id + '.mp3');
      var writer = fs.createWriteStream(tmp_url);
      writer.on('finish', function() {
        var converter = ffmpeg(tmp_url)
          .format("mp3")
          .audioBitrate(128)
          .save(new_url);
        converter.on('finish', function() {
          res.status(200).json({
            state: 'success',
            message: 'Uploaded successfully.',
            link: 'https://dmhacker-youtube.herokuapp.com/site/' + id + '.mp3'
          });
        });
      });
      ytdl(old_url, {
        filter: 'audioonly'
      }).pipe(writer);
    }
  });
});

function fetch_target_id(req, res) {
  var id = req.params.id;
  var old_url = 'https://www.youtube.com/watch?v=' + id;
  ytdl.getInfo(old_url, function(err, info) {
    if (err) {
      res.status(500).json({
        state: 'error',
        message: err.message
      });
    } else {
      var new_url = path.join(__dirname, 'public', 'site', id + '.mp4');
      var writer = fs.createWriteStream(new_url);
      writer.on('finish', function() {
        res.status(200).json({
          state: 'success',
          link: '/site/' + id + '.mp4',
          info: {
            id: id,
            title: info.title
          }
        });
      });
      ytdl(old_url).pipe(writer);
    }
  });
}

app.get('/target/:id', fetch_target_id);

app.get('/search/:query', function(req, res) {
  var query = req.params.query;
  ytsearch(query, {
    maxResults: 1,
    type: 'video',
    key: process.env.YOUTUBE_API_KEY
  }, function(err, results) {
    if (err) {
      res.status(500).json({
        state: 'error',
        message: err.message
      });
    } else {
      if (!results || !results.length) {
        res.status(200).send({
          state: 'error',
          message: 'No results found'
        });
      } else {
        var id = results[0].id;
        req.params.id = id;
        fetch_target_id(req, res);
      }
    }
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
