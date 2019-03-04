var Twit = require('twit')
var config = require("./config.js")
var fs = require('fs')
var T = new Twit(config)

var last_tweet_file_path = "last_tweet_text.txt"

/*************
* Part 1
* Since it has been some time
* since I have been turned on
* I will go through my last 100 tweets
* and respond to them with a picture
**************/

//encoding utf-8 to get a string
function getLastTweet(){
	if (fs.existsSync(last_tweet_file_path)){
		return fs.readFileSync(last_tweet_file_path, {encoding: 'utf-8'})
	}
	else{
		fs.closeSync(fs.openSync(last_tweet_file_path, 'w'))
		return null
	}
}

function updateLastTweetFile(most_recent_tweet_text) {
	fd = fs.openSync(last_tweet_file_path, 'w')
	fs.writeSync(fd, most_recent_tweet_text)
	fs.closeSync(fd)
}

function tweetBack(err, data, response) {
	if (err){
		console.log("err")
		console.log(err)
	} else {
		//first we need to figure out what the last tweet we responded to was
		//we do not want to respond twice
		let last_tweet = getLastTweet()
		//now we will loop through the data
		var i = 0;
		while(i < data.length){
			tweet_obj = data[i]
			tweet_text = tweet_obj["text"]
			//we have seen this tweet before
			//that means we have seen all the tweets that follow in data
			if (tweet_text == last_tweet){
				console.log ("reached end of new tweets, we done catching up")
				break
			}
			//tweet back with an image that is chose from their tweet
			i += 1
		}


		updateLastTweetFile(data[0]["text"])
		
		//  if (last_tweet == ""){
		//  	console.log("its empty")
		//  }
		//  else{
		//  console.log(last_tweet)
		// }
	}
}
T.get('statuses/mentions_timeline', {count: 2}, tweetBack)



/**********
* PART 2
**********/

// var stream = T.stream("statuses/filter", {track: ["@LM_Bot2"]} );
// stream.on('tweet', tweetBackStream);

// function tweetBackStream(tweet){
// 	console.log(tweet)
// }

// var stream = T.stream('statuses/filter', { track: '@LM_Bot2' })
 
// stream.on('tweet', function (tweet) {
//   console.log(tweet)
// })