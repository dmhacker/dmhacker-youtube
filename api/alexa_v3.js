const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');
const ytwrappers = require('./youtube_wrappers.js')

const YOUTUBE_URL_PREFIX = "https://www.youtube.com/watch?v=";

module.exports = function(app, cache, log) {
  app.get('/alexa/v3/search/:query', async function(req, res) {
    let query = new Buffer(req.params.query, 'base64').toString();
    let lang = req.query.language || 'en';

    let log_function = log.get("search-v3")
    let log_header = req.connection.remoteAddress + ' [' + lang + ']: '
    log_function.info(log_header + "Query is '" + query + "'");

    let metadata = await ytwrappers.search_one(query, lang);
    if (metadata == null) {
      log_function.info(log_header + 'No results found');
      res.status(200).send({
        state: 'error',
        message: 'No results found'
      });
      return;
    }
    let id = metadata.id;
    let title = metadata.title;
    let url = YOUTUBE_URL_PREFIX + id;

    log_function.info(log_header + "Search result is '" + title + "' @ " + url);
    res.status(200).json({
      state: 'success',
      message: 'Found video result',
      video: {
        id: id,
        title: title,
        link: url
      }
    });
  });

  app.get('/alexa/v3/download/:id', function(req, res) {
    let id = req.params.id;
    let url = YOUTUBE_URL_PREFIX + id;

    let log_function = log.get("download-v3")
    let log_header = req.connection.remoteAddress + ': '
    log_function.info(log_header + "Download requested for video with ID '" + id + "'");

    if (id in cache) {
      log_function.info(log_header + "Cache hit.");
    } else {
      log_function.info(log_header + "Cache miss. Starting download ...");
      cache[id] = {
        downloaded: false
      };
      let output_file = path.join(__dirname, '..', 'public', 'site', id + '.m4a');
      let writer = fs.createWriteStream(output_file);
      ytdl(url, {
        filter: 'audioonly',
        quality: '140'
      }).pipe(writer);
      writer.on('finish', function() {
        log_function.info(log_header + "Finished download of video " + id + ".");
        cache[id]['downloaded'] = true;
      });
    }

    res.status(200).json({
      state: 'success',
      message: 'Beginning download process.',
      link: '/site/' + id + '.m4a'
    });
  });

  app.get('/alexa/v3/cache/:id', function(req, res) {
    let id = req.params.id;
    if (id in cache) {
      if (cache[id]['downloaded']) {
        res.status(200).send({
          state: 'success',
          message: 'Downloaded',
          downloaded: true
        });
      } else {
        res.status(200).send({
          state: 'success',
          message: 'Download in progress',
          downloaded: false
        });
      }
    } else {
      res.status(200).send({
        state: 'success',
        message: 'Not in cache'
      });
    }
  });
}
