var express = require('express');

// Load logging utilities
process.env.LOG_LEVEL = 'info';
require("log-node")();
var log = require('log').get('youtube-proxy')

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

// Setup a cache; used for holding video links
var cache = {};

// Load APIs in separate files 
require('./api/alexa_v3.js')(app, cache, log);
require('./api/alexa_v2.js')(app, cache, log);
require('./api/web_player.js')(app);

// Start the application!
app.listen(app.get('port'), function() {
  log.info('Node app is running on port', app.get('port'));
});
