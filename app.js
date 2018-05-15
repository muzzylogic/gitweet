
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

/*
 * application flow 
 -> call github api and do search
 -> based on search get 10 projects
 -> perform search in twitter for each project and parse results asynchronously 
 -> add results to array of results for parsing and sorting 
 -> main thread waits until all calls are complete (retry on rate limiting)
 -> parse and sort results
 -> output results in designated format 
*/

//includes 
const request = require('request');
const fs = require('fs');


const config = require("./config.json");
const githubTwitterAPI = require("./githubtwitterAPI")

//let serverConfig = config.server
//let request = config.request


var searchTerm = "football"

const githubbaseurl = "https://api.github.com"
const searchRoute = "/search/repositories"
var searchSort = "stars";




//TWITTER
var CONSUMER_SECRET = 		config.request.twitter.consumerkey;
var CONSUMER_KEY = 			config.request.twitter.consumersecret;
var bearer_token; = 		config.request.twitter.bearer_token;


async function main(){
	configObj = config;
	reqDetails = new RequestDetails(config.request);
	console.log(reqDetails.search);


	//call github 
	//do twitter auth 	
	
	//wait for both to complete
	let [gitRes, bearer] = await Promise.all([githubSearch(), twitterAuth()]);
	//call twitter search for each project 

	//wait for results 

	//output results


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
		var filtered = gitRepsonseParse(json);
		console.log("secret is "+CONSUMER_SECRET);
		twitterGenerateBearer();
		

	});

	console.log("main has continued");

}



function gitRepsonseParse(json){
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

async function twitterAuth(){
	let token = config.request.twitter.bearer_token;
	if(token == ""){
		token = await twitterGenerateBearer();
		config.request.twitter.bearer_token = token; 
		saveConfig();
	}
	else{
		var options = {
		    method: 'GET',
		    url: "https://api.twitter.com/1.1/account/verify_credentials.json",
		    headers: {
		        "Authorization": "Bearer " + access_token
		    }
		};
		let validToken = await request(options, (err, res, body) => {
			if(err){
				return false;
			}	
			return true;
		});

		if(!validToken){
			token = await twitterGenerateBearer();
			saveConfig();
		}

	}
	return token;
	
}

async function twitterGenerateBearer(){
	var encoded = new Buffer(CONSUMER_KEY + ':' + CONSUMER_SECRET).toString('base64');
	console.log("encoded is: "+ encoded);
	var options = {
	    url: 'https://api.twitter.com/oauth2/token',
	    headers: {
	        'Authorization': 'Basic ' + encoded,
	        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
	    body: 'grant_type=client_credentials'
	};

	let token = await request.post(options, function(err, response, body) {
     if(err) { return console.log(err);}

     bearer_token = JSON.parse(body).access_token; 
	 return bearer_token;
	});
	return token;
}


async function saveConfig(){
	configString = JSON.stringify(config);
	fs.exists('config.json', function(exists){
		if(exists){
			fs.writeFile("config.json", configString);
		}
		else{
			console.log("config file not found, could not save");
			process.exit();
		}
	}

}

function twitterSearch(token){
	var access_token = JSON.parse(token).access_token
	var twitter_api = 'https://api.twitter.com/1.1/search/tweets.json';
	console.log("requesting timeline with bearer: "+ access_token);
	var options = {
	    method: 'GET',
	    url: twitter_api,
	    qs: {
	        "screen_name": "muzzylogic"
	    },
	    json: true,
	    headers: {
	        "Authorization": "Bearer " + access_token
	    }
	};

	request(options, (err, res, body) =>  {
		console.log(body);

	});
}


main();


function RequestDetails(req){
	this.search = req.search;
}

//module.exports = RequestDetails;

/*const express = require('express');

const app = express();

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(3000, () => console.log('Running App on port 3000'));
*/