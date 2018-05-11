
/*
 * Command line api
 * entry point to the api 
 * read config file
 * read args
 * override any configuration settings from args 
 * do calls 
 * compile new json for output
 * print to command line or output to file
 Side note(s)
 Look at ways to simpify the command line experience when running
 possibly look at ways to install as a package without putting on the public npm
 */

//includes 
const request = require('request');



//const config = require("./config.json");
const githubTwitterAPI = require("./githubtwitterAPI")

//let serverConfig = config.server
//let request = config.request


var searchTerm = "football"

var githubbaseurl = "https://api.github.com"
var searchRoute = "/search/repositories"

var searchSort = "stars";


//TWITTER
var CONSUMER_SECRET = "";
var CONSUMER_KEY = ""; 
var bearer_token;


function main(){
	var fullUrl = githubbaseurl+searchRoute+"?q="+searchTerm+"&sort="+searchSort; 
	var options = {
		url: fullUrl, 
		headers: {
			'User-Agent': 'muzzylogic'
		}
	}
	console.log("full url is " + fullUrl);
	request(options, (err, res, body) => {
		if(err) { return console.log(err);}

		console.log('handling response');
		var json = JSON.parse(body);
		//console.log(json.items[1].name);
		//var filtered = gitRepsonseHandle(json);
		twitterGenerateBearer(CONSUMER_SECRET, CONSUMER_KEY);
		

	});

	console.log("main has continued");

}



function gitRepsonseHandle(json){
	//print out the first 10 
	//todo filter out unwanted terms from description 
	var filtered = [];

	for(var i = 0; i < 10; i++){
		console.log("Item "+i+" is "+json.items[i].name);
		console.log("with description: \n"+json.items[i].description)

		filtered.push(json.items[i]);
	}

	return filtered;

}

function twitterGenerateBearer(secret, key){
	var encoded = new Buffer(key + ':'+secret).toString('base64');
	console.log("encoded is: "+ encoded);
	var options = {
	    url: 'https://api.twitter.com/oauth2/token',
	    headers: {
	        'Authorization': 'Basic ' + encoded,
	        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
	    body: 'grant_type=client_credentials'
	};

	request.post(options, function(err, response, body) {
     if(err) { return console.log(err);}

     bearer_token = body; 
	 console.log("Bearer Token: " + bearer_token);
	 twitterSearch(bearer_token);
	});
}


function twitterSearch(token){
	var twitter_api = 'https://api.twitter.com/1.1/statuses/user_timeline.json';

	var options = {
	    method: 'GET',
	    url: twitter_api,
	    qs: {
	        "screen_name": "twitterapi"
	    },
	    json: true,
	    headers: {
	        "Authorization": "Bearer " + bearer_token
	    }
	};

	request(options, (err, res, body) =>  {
		console.log(body);

	});
}


main();


/*const express = require('express');

const app = express();

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(3000, () => console.log('Running App on port 3000'));
*/