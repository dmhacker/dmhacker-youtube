var fs = require('fs');
var path = require('path');
var ytdl = require('ytdl-core');
var ytsearch = require('youtube-search');

const YOUTUBE_URL_PREFIX = "https://www.youtube.com/watch?v=";

module.exports = function(app, cache, log) {
  app.get('/alexa-search/:query', function(req, res) {
    // Extract query and language (English is default)
    var query = new Buffer(req.params.query, 'base64').toString();
    var lang = req.query.language || 'en';

    // Setup logging 
    var log_function = log.get("search-v2")
    var log_header = req.connection.remoteAddress + ' [' + lang + ']: '
    log_function.info(log_header + "Query is '" + query + "'");

    // Perform search
    ytsearch(query, {
      maxResults: 1,
      type: 'video',
      relevanceLanguage: lang,
      key: process.env.YOUTUBE_API_KEY
    }, function(err, results) {
      // There was an error that ytsearch was unable to handle
      if (err) {
        log_function.error(log_header + err.message);
        res.status(500).json({
          state: 'error',
          message: err.message
        });
      } 
      // At least one result was found, extract metadata and send to user
      else if (!results || !results.length) {
        log_function.info(log_header + 'No results found');
        res.status(200).send({
          state: 'error',
          message: 'No results found'
        });
      } 
      // Extract metadata from the search results
      else {
        var metadata = results[0];
        var id = metadata.id;
        var title = metadata.title;
        var url = YOUTUBE_URL_PREFIX + id;

        log_function.info(log_header + "Search result is '" + title + "' @ " + url);

        if (id in cache) {
          log_function.info(log_header + "Cache hit.");
        }
        else { 
          log_function.info(log_header + "Cache miss. Starting download ...");

          // Mark video as 'not downloaded' in the cache
          cache[id] = { downloaded: false };

          // Create writer to output file for downloaded audio
          var output_file = path.join(__dirname, '..', 'public', 'site', id + '.m4a');
          var writer = fs.createWriteStream(output_file);

          // Pass writer stream to ytdl
          ytdl(url, {
            filter: 'audioonly',
            quality: '140'
          }).pipe(writer);

          // Mark video as downloaded once writer is finished
          writer.on('finish', function() {
            log_function.info(log_header + "Finished download of video " + id + ".");

            // Mark video as completed
            cache[id]['downloaded'] = true;
          });
        }

        // Return correctly and download the audio in the background
        res.status(200).json({
          state: 'success',
          message: 'Beginning download process.',
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
}
