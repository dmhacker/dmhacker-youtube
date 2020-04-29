var fs = require('fs');
var path = require('path');
var ytdl = require('ytdl-core');
var yts = require('yt-search');

const YOUTUBE_URL_PREFIX = "https://www.youtube.com/watch?v=";

async function search_one(query, language) {
  let results = await yts({
    'query': query,
    'pageStart': 1,
    'pageEnd': 2,
    'language': language
  });
  let videos = results.videos;
  if (!videos || !videos.length) {
    return null;
  }
  let video = videos[0];
  return {
    id: video.videoId,
    link: video.url,
    title: video.title
  };
}

module.exports = {
  search_one
}
