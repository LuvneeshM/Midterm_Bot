var Twit = require('twit')
var config = require("./config.js")
var fs = require('fs')
var fuzzy = require("fuzzyset.js")

var T = new Twit(config)
var last_tweet_file_path = "last_tweet_text.txt"

const OPTION_GREET = "greet"
const OPTION_HELP = "help"
const OPTION_IMAGE = "image"
const OPTION_TEACH = "teach"
// var fuzzyset_commands = FuzzySet(["image", "help", "greeting", "random"])
// var fuzzyset_images = FuzzySet(["image", "images", "picture", "pic"])
// var fuzzyset_help = FuzzySet(["help", "assist", "aid", "helpme", "advice", "guide"])
// var fuzzyset_greet = FuzzySet(["hello", "hi", "yo", "yoo", "good", "morning", "whatsup", "hey"])

class FuzzySet_obj{
	constructor(fuzzyset, key){
		this.fuzzyset = fuzzyset
		this.key = key
	}
	print(){
		console.log("This is the fuzzyset for " + this.key)
	}
}
var fuzzyset_teach = FuzzySet()
var fuzzyset_images = FuzzySet()
var fuzzyset_help = FuzzySet()
var fuzzyset_greet = FuzzySet()
var fuzzyset_list = []


/*******
* Set Up
********/
function fillFuzzyVars(fuzzyset, filepath){
	let contents = fs.readFileSync(filepath, 'utf-8').split("\n")
	for (let i = 0; i < contents.length; i++){
		fuzzyset.add(contents[i])
	}
}

function setup(){
	fillFuzzyVars(fuzzyset_teach, "learning.txt")
	fillFuzzyVars(fuzzyset_images, "images.txt")
	fillFuzzyVars(fuzzyset_help, "help.txt")
	fillFuzzyVars(fuzzyset_greet, "greetings.txt")
	fuzzyset_list = [new FuzzySet_obj(fuzzyset_teach, OPTION_TEACH), new FuzzySet_obj(fuzzyset_images, OPTION_IMAGE), new FuzzySet_obj(fuzzyset_help, OPTION_HELP), new FuzzySet_obj(fuzzyset_greet, OPTION_GREET)]
}

/*********
* common funtions
* between part 1 and part 2
* does bulk of the work
***********/
//analyze tweet
//tweet format: @LM_BOT2 <args*>
//we will use the Levenshtein Distance to account for some fuzzyness in words
function compareAgainstFuzzies(command){
	let to_return = null
	let score = null
	for(let i = 0; i < fuzzyset_list.length; i++){
		let score_command_list = fuzzyset_list[i].fuzzyset.get(command)
		if (score_command_list == null){
			continue
		}
		if (to_return == null){
			to_return = fuzzyset_list[i]
			score = score_command_list[0][0] 
		} else {
			if (score < score_command_list[0][0]){
				to_return = fuzzyset_list[i]
				score = score_command_list[0][0]
			}
		}
	}
	//only return if the confidence is > threshold(0.4)
	if (score < 0.4){
		return null
	}
	return to_return
}

function analyzeTweet(text) {
	let tokens = text.split(" ")
	let command = tokens[1]
	//compare with the different fuzzy sets and choose the closest if possible
	let fuzzy_to_use = compareAgainstFuzzies(command)
	if (fuzzy_to_use == null){
		console.log("1. send back message saying you do not understand what is being said")
	} else {
		return fuzzy_to_use.key
	}
}


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
//write most recent checked tweet to file
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
		let i = 0;
		while(i < data.length){
			var tweet_obj = data[i]
			var tweet_text = tweet_obj["text"].toLowerCase()
			console.log(tweet_text)
			//we have seen this tweet before
			//that means we have seen all the tweets that follow in data
			if (tweet_text == last_tweet){
				console.log ("reached end of new tweets, we done catching up")
				break
			}
			//tweet back based on their tweet
			//check which option it is and perform action accordingly
			response_option = analyzeTweet(tweet_text)
			if (response_option == OPTION_TEACH){
				console.log("time to get smarter")
			} else if (response_option == OPTION_IMAGE){
				console.log("google search image and send image")
			}
			else if (response_option == OPTION_HELP){
				console.log("tell user how to use me")
			} else if (response_option == OPTION_GREET){
				console.log("I will tweet back at the user now")
			} else {
				console.log("Tweet back saying sorry I dont understand you and say you can try again with another @ mention thing")
			}

			i += 1
		}


		// updateLastTweetFile(data[0]["text"].toLowerCase())
	}
}



/**********
* PART 2
* live responces to @ mentions
* now that we caught up with previous mentions 
* that were from when offline
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





/******
* main
******/
function main(){
	//set up
	setup()
	//part 1
	T.get('statuses/mentions_timeline', {count: 2}, tweetBack)
	//part 2

}
main()