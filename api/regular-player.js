var ytdl = require('ytdl-core');
var ytsearch = require('youtube-search');

const YOUTUBE_URL_PREFIX = "https://www.youtube.com/watch?v=";

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


module.exports = function(app) {
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
}
