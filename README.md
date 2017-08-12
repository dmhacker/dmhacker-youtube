# dmhacker-youtube

This contains a gateway for my [alexa-youtube-skill](https://github.com/dmhacker/alexa-youtube-skill) as well as a web-based, Youtube-specific proxy.

## Setup Process

1. Follow [this blog post](https://elfsight.com/blog/2016/12/how-to-get-youtube-api-key-tutorial/) to obtain a YouTube API key. Save it; it will come in use later.
2. Fork this repository. Make sure your branch is up-to-date with master.
3. Now, go to https://heroku.com and create an account (or log in, if you already have an account).
4. On your dashboard, click on "New" -> "Create new app"
5. Give your app a name such as "{{{YOUR_USERNAME}}}-youtube" (substitute your username instead of {{{YOUR_USERNAME}}}) and select a region for deployment.
6. Go to the __Deploy__ section on your new app's dashboard.
7. Under "Deployment Method", select the GitHub option. You should be prompted to authorize Heroku's usage of your GitHub account information. 
8. Under "Connect to GitHub", make sure your account is selected and type in "dmhacker-youtube" for the repository to search for.
9. If you correctly forked this repository and typed in the repository name correctly, this should show up as an option to connect to. Click on "Connect".
10. Now, go to the __Settings__ section on your app's dashboard.
11. Under "Config Variables", click on "Reveal Config Vars" and then enter in the following key-value pair(s):

| Key                  | Value                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| YOUTUBE_API_KEY      | the YouTube API key you generated earlier                             |

12. Next, under "Buildpacks", click on "Add buildpack". When prompted, copy-paste this link into the input section: https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
13. Now, you're ready to deploy! Go back to the __Deploy__ section.
14. Scroll to the bottom, and under "Manual deploy", click on "Deploy Branch". 
15. If you get a "Your app was successfully deployed", congratulations, you are done, and your app should be running!
16. To verify, open up https://{{{YOUR_APP_NAME}}}.herokuapp.com in a new tab and see if it returns a correctly formed landing page.
