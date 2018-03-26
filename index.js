var express = require('express');
var fs = require('fs');
var path = require('path');
var ytdl = require('ytdl-core');
var ytsearch = require('youtube-search');

// Create express server
var app = express();

// Set server port
app.set('port', (process.env.PORT || 5000));

// Set express static folder
app.use(express.static(__dirname + '/public'));

// Set express view engine
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Configure base route
app.get('/', function(request, response) {
  response.render('index');
});

const YOUTUBE_URL_PREFIX = "https://www.youtube.com/watch?v=";

//////////////////////////// ALEXA ROUTES ////////////////////////////

var cache = {};

app.get('/alexa-search/:query', function(req, res) {
  // Extract query and language (English is default)
  var query = new Buffer(req.params.query, 'base64').toString();
  var lang = req.query.language || 'en';

  console.log('Query from ' + req.connection.remoteAddress +
    ': [' + lang + '] ' +  query);

  // Perform search
  ytsearch(query, {
    maxResults: 1,
    type: 'video',
    relevanceLanguage: lang,
    key: process.env.YOUTUBE_API_KEY
  }, function(err, results) {
    if (err) {
      console.error('An error occurred: ' + err.message);

      // Catastrophic error occurred
      res.status(500).json({
        state: 'error',
        message: err.message
      });
    } else if (!results || !results.length) {
      console.log('No results found.');

      // No results found but no error; highly unlikely to occur
      res.status(200).send({
        state: 'error',
        message: 'No results found'
      });
    } else {
      // Extract metadata from the search results
      var metadata = results[0];
      var id = metadata.id;
      var title = metadata.title;
      var url = YOUTUBE_URL_PREFIX + id;

      console.log('Query result: ' + title);

      if (!(id in cache)) {
        console.log("Starting download ... " + title);

        // Mark video as 'not downloaded' in the cache
        cache[id] = { downloaded: false };

        // Create writer to output file for downloaded audio
        var output_file = path.join(__dirname, 'public', 'site', id + '.m4a');
        var writer = fs.createWriteStream(output_file);

        // Pass writer stream to ytdl
        ytdl(url, {
          filter: 'audioonly',
          quality: '140'
        }).pipe(writer);

        // Mark video as downloaded once writer is finished
        writer.on('finish', function() {
            console.log("Finished download ... " + title);

            // Mark video as completed
            cache[id]['downloaded'] = true;
        });
      }

      // Return correctly and download the audio in the background
      res.status(200).json({
        state: 'success',
        message: 'Uploaded successfully.',
        link: '/site/' + id + '.m4a',
        info: {
          id: id,
          title: metadata.title,
          original: url
        }
      });
    }
  });
});

app.get('/alexa-check/:id', function(req, res) {
  var id = req.params.id;
  if (id in cache) {
    if (cache[id]['downloaded']) {
      // Video is done downloading
      res.status(200).send({
        state: 'success',
        message: 'Downloaded',
        downloaded: true
      });
    }
    else {
      // Video was queried but is still being downloaded
      res.status(200).send({
        state: 'success',
        message: 'Download in progress',
        downloaded: false
      });
    }
  }
  else {
    // No video corresponding to that ID was queried
    res.status(200).send({
      state: 'success',
      message: 'Not in cache'
    });
  }
});


//////////////////////////// NON-ALEXA ROUTES ////////////////////////////

function fetch_target_id(req, res) {
  var id = req.params.id;
  var url = YOUTUBE_URL_PREFIX + id;

  // Fetch information about the video first
  ytdl.getInfo(url, function(err, info) {
    if (err) {
      res.status(500).json({
        state: 'error',
        message: err.message
      });
    } else {
      // Get output file
      var output_file = path.join(__dirname, 'public', 'site', id + '.mp4');
      var writer = fs.createWriteStream(output_file);

      // Writer sends response back after finishing
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

      // Pipe out of ytdl stream to the file writer
      ytdl(url).pipe(writer);
    }
  });
}

app.get('/target/:id', fetch_target_id);

app.get('/search/:query', function(req, res) {
  // Extract query from request
  var query = req.params.query;

  // Search YouTube for query
  ytsearch(query, {
    maxResults: 1,
    type: 'video',
    key: process.env.YOUTUBE_API_KEY
  }, function(err, results) {
    if (err) {
      // An error occurred while searching for the video
      res.status(500).json({
        state: 'error',
        message: err.message
      });
    } else {
      if (!results || !results.length) {
        // No video found for that query
        res.status(200).send({
          state: 'error',
          message: 'No results found'
        });
      } else {
        // Pass request handling to download function
        req.params.id = results[0].id;
        fetch_target_id(req, res);
      }
    }
  });
});

//////////////////////////////////////////////////////////////////////////

// Start the application!
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
