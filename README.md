# dmhacker-youtube

This contains a gateway for my [alexa-youtube-skill](https://github.com/dmhacker/alexa-youtube-skill) as well as a web-based, Youtube-specific proxy.

### Setup Process

1. Clone this repository to a local folder on your machine.
2. Create a Heroku app using https://git.heroku.com/{APPNAME}.git.
    * Initialize it with the Node.js buildpack (node version = 5.9.1)
    * [Add](https://devcenter.heroku.com/articles/using-multiple-buildpacks-for-an-app) the following buildpack: https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
3. Fill out the following environment variables:

| Key                  | Value                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| YOUTUBE_API_KEY      | the YouTube API key you have generated                                |

4. Push this code to the Heroku server using "git push heroku master".
5. Visit it at https://{APPNAME}.herokuapp.com.

