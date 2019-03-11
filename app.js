var Twit = require('twit')
var config = require("./config.js")
var fs = require('fs')
var fuzzy = require("fuzzyset.js")
const puppeteer = require('puppeteer')
var crypto = require("crypto")


var T = new Twit(config)
var last_tweet_file_path = "last_tweet_text.txt"
var P1DONE = false

const IMGNAME = crypto.randomBytes(20).toString('hex') + ".png"
const OPTION_GREET = "greet"
const OPTION_HELP = "help"
const OPTION_IMAGE = "image"
const OPTION_TEACH = "teach"
const OPTION_BROKEN = "broken"
const LEARNING_CATS = ["teaching", "images", "helping", "greeting"]

const GREETINGS = ["Hello", "Good Day", "Today is a new day. Hello", "It is morning somewhere in this world so Morning", "I see you mentioning me in your tweet to greet me"]

class FuzzySet_obj{
	constructor(fuzzyset, key, words, fn){
		this.fuzzyset = fuzzyset
		this.key = key
		this.list_words = new Set(words)
		this.filename = fn
	}
	print(){
		console.log("This is the fuzzyset for " + this.key)
	}
}
var fuzzyset_teach = FuzzySet()
var fuzzyset_images = FuzzySet()
var fuzzyset_help = FuzzySet()
var fuzzyset_greet = FuzzySet()
var fuzzyset_learning_cats = FuzzySet()
for (var i = 0; i < LEARNING_CATS.length; i++){
	fuzzyset_learning_cats.add(LEARNING_CATS[i])
}
var fuzzyset_list = []


/*******
* Set Up
********/
function fillFuzzyVars(fuzzyset, filepath){
	let contents = fs.readFileSync(filepath, 'utf-8').split("\n")
	for (let i = 0; i < contents.length; i++){
		fuzzyset.add(contents[i])
	}
	return contents
}

function setup(){
	let tc = fillFuzzyVars(fuzzyset_teach, "learning.txt")
	let ic = fillFuzzyVars(fuzzyset_images, "images.txt")
	let hc = fillFuzzyVars(fuzzyset_help, "help.txt")
	let gc = fillFuzzyVars(fuzzyset_greet, "greetings.txt")
	fuzzyset_list = [new FuzzySet_obj(fuzzyset_teach, OPTION_TEACH, tc, "learning.txt"), new FuzzySet_obj(fuzzyset_images, OPTION_IMAGE, ic, "images.txt"), new FuzzySet_obj(fuzzyset_help, OPTION_HELP, hc, "help.txt"), new FuzzySet_obj(fuzzyset_greet, OPTION_GREET, gc, "greetings.txt")]
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
		return OPTION_BROKEN
	} else {
		return fuzzy_to_use.key
	}
}

function tweetBackToUser_text(params){
	T.post("statuses/update", params, function(err, data, response){
		if(err){
			console.log("\tError in tweeting back to user text")
			console.log("\t\t"+err.message)
		}
		else{
			console.log("\tTweeted back to user")
		}
	})
}

function deleteImage(){
	fs.stat(IMGNAME, function(err, stats){
		if (err){
			return
		}
		else{
			fs.unlink(IMGNAME, function(err){
				if (err) console.log(err)
				else console.log("\tDeleted the image from disk")
			})
		}
	})
}

function tweetBackToUser_img(reply_text, id_str){
	var base64_content = fs.readFileSync(IMGNAME, { encoding: 'base64' })
	T.post('media/upload', {media_data: base64_content}, 
		function(err, data, response){
			if (err){
				console.log("\tCould not upload the image")
			} else{
				console.log("\tUploaded the image")
				let params = {
						status: reply_text, 
						in_reply_to_status_id: id_str,
						media_ids: new Array(data.media_id_string) 
					}
				T.post('statuses/update', params, function(err, data, response) {
					if (err){
						console.log('\tIt didnt tweet back the image')
						console.log(err)
					}
					else{
						console.log('\tTweeted back the image')
					}
					//delete img
					deleteImage()
				})
			}
		}
	)
}

function writeToFile(list_of_words, fn){
	const filedata = Array.from(list_of_words).join("\n")
	fs.writeFileSync(fn, filedata)
}

//3: greeting
//2: helping
//1: images
//0: teaching
function getSmarter(text){
	let text_nospace = text.split(" ").join("")
	let tokens = text_nospace.split(":")
	let cat = tokens[1]
	let new_command = tokens[2]
	let score_command_list = fuzzyset_learning_cats.get(cat)
	if (score_command_list == null){
		return false
	}

	let chosen_cat = score_command_list[0][1]
	console.log(chosen_cat)
	if (chosen_cat == LEARNING_CATS[0]){
		fuzzyset_teach.add(new_command)
		fuzzyset_list[0].list_words.add(new_command)
		writeToFile(fuzzyset_list[0].list_words, fuzzyset_list[0].filename)
	} else if (chosen_cat == LEARNING_CATS[1]){
		fuzzyset_images.add(new_command)
		fuzzyset_list[1].list_words.add(new_command)
		writeToFile(fuzzyset_list[1].list_words, fuzzyset_list[1].filename)
	}else if (chosen_cat == LEARNING_CATS[2]){
		fuzzyset_help.add(new_command)
		fuzzyset_list[2].list_words.add(new_command)
		writeToFile(fuzzyset_list[2].list_words, fuzzyset_list[2].filename)
	}else if (chosen_cat == LEARNING_CATS[3]){
		fuzzyset_greet.add(new_command)
		fuzzyset_list[3].list_words.add(new_command)
		writeToFile(fuzzyset_list[3].list_words, fuzzyset_list[3].filename)
	}
	return true
}

//https://github.com/GoogleChrome/puppeteer/blob/v1.4.0/docs/api.md
async function googleImage(text){
	const dirname = "./"
	let tokens = text.split(" ")
	if (tokens.length < 3)
		return false
	let query = tokens.slice(2).join(" ")
	const googleUrl = `https://www.google.com/search?q=${query}&tbm=isch`
	const browser = await puppeteer.launch({headless: true})
	const page = await browser.newPage()
	await page.goto(googleUrl)
	const IMAGE_SELECTOR = '#rg_s > div > a > img'
	
	const svgImage = await page.$(IMAGE_SELECTOR)
	if (svgImage == null || svgImage == undefined){
		console.log("rip")
		await browser.close()
		return false
	}
	await svgImage.screenshot({
	    path: IMGNAME,
	    omitBackground: true,
	  })

	await browser.close()

	return true
}

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

//for the delay
function sleep(ms){
	return new Promise(resolve=>{
		setTimeout(resolve,ms)
	})
}
//bulk of coding for different options
async function tweetBack(err, data, response) {
	if (err){
		console.log("err in tweetBack")
		console.log(err)
	} else {
		//first we need to figure out what the last tweet we responded to was
		//we do not want to respond twice
		let last_tweet = getLastTweet()
		//now we will loop through the data
		let i = 0
		while(i < data.length){
			var tweet_obj = data[i]
			var tweet_text = tweet_obj["text"].toLowerCase()
			//we have seen this tweet before
			//that means we have seen all the tweets that follow in data
			if (tweet_text == last_tweet){
				console.log ("reached end of new tweets, we done catching up")
				break
			}
			//tweet back based on their tweet
			//check which option it is and perform action accordingly
			response_option = analyzeTweet(tweet_text)

			//USER TEACHES US SOMETHING
			if (response_option == OPTION_TEACH){
				console.log("time to get smarter")
				let success = getSmarter(tweet_text)
				if (success){
					let reply = "Thank you @" + tweet_obj["user"]["screen_name"] + "! Your contribution has helped me get smarter!"
					let params = {
						status: reply, 
						in_reply_to_status_id: tweet_obj.id_str
					}
					console.log("\treply learned something new")
					tweetBackToUser_text(params)
				} else{
					let reply = "Thank you for trying to help me learn, but it seems i did not understand you, @" + tweet_obj["user"]["screen_name"]
					let params = {
						status: reply, 
						in_reply_to_status_id: tweet_obj.id_str
					}
					console.log("\tfailed to learned something new")
					tweetBackToUser_text(params)
				}
			} 
			//USER WANTS AN IMAGE
			else if (response_option == OPTION_IMAGE){
				console.log("google search image and send image")
				let success = await googleImage(tweet_text)
				if (success){
					console.log("\tgot the img")
					reply_text = "@" + tweet_obj["user"]["screen_name"] + " Here is your image."
					tweetBackToUser_img(reply_text, tweet_obj.id_str)
				} else {
					let reply = "@" + tweet_obj["user"]["screen_name"] + " I could not get you and image sorry"
					let params = {
						status: reply, 
						in_reply_to_status_id: tweet_obj.id_str
					}
					tweetBackToUser_text(params)
				}
			}
			//USER WANTS TO LEARN HOW TO USE BOT
			else if (response_option == OPTION_HELP){
				console.log("telling user how to use me")
				let reply = "@" + tweet_obj["user"]["screen_name"] + " After mentioning me, you can use a keyword to Greet, ask for an image, or teach me something." 
				let params = {
						status: reply, 
						in_reply_to_status_id: tweet_obj.id_str
					}
				tweetBackToUser_text(params)
				await sleep(50)
				reply =  "@" + tweet_obj["user"]["screen_name"] + " To teach me something follow the format <Mention> <keyword like add or teach> : <category> : <new ways to recognize the category>\nCategories include: teaching, images, helping, greeting"
				params = {
						status: reply, 
						in_reply_to_status_id: tweet_obj.id_str
					}
				tweetBackToUser_text(params)
				await sleep(50)
				reply = "@" + tweet_obj["user"]["screen_name"] + " For example:\n@ LM_BOT2 Yoo whats up will greet me\n@ LM_BOT2 add: Greeting : hola\n@ LM_BOT2 help\n@ LM_BOT2 image dogs"
				params = {
						status: reply, 
						in_reply_to_status_id: tweet_obj.id_str
					}
				tweetBackToUser_text(params)
			} 
			//USER IS GREETING US
			else if (response_option == OPTION_GREET){
				console.log("replying greet")
				let reply = GREETINGS[Math.floor(Math.random()*GREETINGS.length)] + " @" + tweet_obj["user"]["screen_name"] + "!" 
				let params = {
					status: reply, 
					in_reply_to_status_id: tweet_obj.id_str
				}
				tweetBackToUser_text(params)
			} 
			//I DONT UNDERSTAND THE USER
			else {
				console.log("user makes no sense, replying help")
				let reply = "Tweet back to " + " @"+ tweet_obj["user"]["screen_name"] + " Sorry I dont understand you. You can try again with another @ mention and ask for help. Example: <Mention> help"
				let params = {
					status: reply, 
					in_reply_to_status_id: tweet_obj.id_str
				}
				tweetBackToUser_text(params)
			}

			//small delay between tweets bot catches up to
			await sleep(2000)
			i += 1
		}
		P1DONE = true
		updateLastTweetFile(data[0]["text"].toLowerCase())

	}
}

// var stream = T.stream("statuses/filter", {track: ["@LM_Bot2"]} );
// stream.on('tweet', tweetBackStream);

// function tweetBackStream(tweet){
// 	console.log(tweet)
// }

async function p1(){
	T.get('statuses/mentions_timeline', {count: 5}, tweetBack)
}
function helper(data){
	tweetBack(false, [data], false)
}
function p2(){
	console.log("~~~~Entering Live Tweeting Mode Now~~~~")
	var stream = T.stream('statuses/filter', { track: '@LM_Bot2' })
	stream.on('tweet', helper)

}

/******
* main
******/
async function main(){
	//set up
	setup()
	/*************
	* Part 1
	* Since it has been some time
	* since I have been turned on
	* I will go through my last 100 tweets
	* and respond to them with a picture
	**************/
	p1()
	await sleep(5000)
	/**********
	* PART 2
	* live responces to @ mentions
	* now that we caught up with previous mentions 
	* that were from when offline
	**********/
	while(!P1DONE){
		await sleep(500)
	}
	p2()
	
}
main()