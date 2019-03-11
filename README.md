# Midterm_Bot
NYU Dynamic Web Applications Midterm Bot!

## Twitter Bot - [Link to Bot](https://twitter.com/LM_Bot2)

## How to use Bot
* Asking the Bot for help examples:
	* @LM_BOT2 help
	* @LM_BOT2 assist
	* @LM_BOT2 aid
	* @LM_BOT2 advice
* Greeting the Bot examples:
	* @LM_BOT2 hello
	* @LM_BOT2 hi
	* @LM_BOT2 yo
	* @LM_BOT2 hey
	* @LM_BOT2 tweeting you
* Asking for an image follows the format @LM_Bot2 image < what you would like an image of >
	* @LM_Bot2 image h
	* @LM_Bot2 image dog
	* @LM_Bot2 image blue circle

## Teaching the Bot
* Format: @LM_BOT2 < key word > : < category > : < 1 word to trigger category >
	* Key Words include: [new, learn, add]
	* Categories include: [teaching, images, helping, greeting]
	* Examples:
		* @LM_Bot2 learn :Greeting:hola
		* @LM_Bot2 add : helping : assist
		* @LM_Bot2 add : Greeting : wassup

## Fun Facts about the Bot
I incorporated two modes: Catching Up and Live Streaming:
* Catching Up: when the bot is first run, it will load up to the previous 5 tweets it missed and respond to them accordingly.
* Live Streaming: after the bot has finished catching up, it will then enter a live streaming mode where it is tracking and waiting for someone to mention it. Once it is mentioned, the bot will automatically respond to the tweet.

I also played around with using fuzzy matching to allow the users to have some small typos when they are interacting with the bot. The fuzzy matching uses the with the Levenshtein distance in the backend to compare what the user says to what the bot was expecting it to say. As long as the confidence that what is said is what is believed to have actually been said (above a certain threshold I manually set) then the bot will respond accordingly to the Tweet. However, if the bot does not understand the user, the bot will notify the user as well.