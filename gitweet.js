
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
const request = require('request-promise');
const fs = require('fs');
const ArgumentParser  = require('argparse').ArgumentParser;


const config = require("./config.json");
let parser = {};
let outputFile = "";
//let serverConfig = config.server
//let request = config.request


var searchTerm = "football"

const githubbaseurl = "https://api.github.com"
const searchRoute = "/search/repositories"
var searchSort = "stars";

var CONSUMER_SECRET = 		config.request.twitter.consumersecret;
var CONSUMER_KEY = 			config.request.twitter.consumerkey;
var bearer_token = 		config.request.twitter.bearer_token;




async function main(){
	addArgs();
	outputFile = parser.parseArgs().output;
	config.request.search = parser.parseArgs().search;
	//call github 
	//do twitter auth 	
	//wait for both to complete
	let [gitRes, be6arer] = await Promise.all([githubSearch().catch(function(err){
		return console.log(error);
	}), twitterAuth().catch(function(error){
		console.log(error);
	})]);
	//console.log("json response is "+gitRes+" token is "+ bearer);
	//call twitter search for each project 
	var projectTweets = [];
	for(var i = 0; i < gitRes.length; i++){
		//make this a blocking call to avoid rate limiting
		let res = await twitterSearch(gitRes[i]).catch(function(error){
			console.log(error);
		});
		projectTweets.push(res);
	} 
	//output results
	await outputResults(gitRes, projectTweets);
}

function addArgs(){
	parser = new ArgumentParser({
		version : '0.0.1',
		addHelp: true,
		description: 'command line api to search github projects and output relevant tweets to those projects'
	});

	parser.addArgument(
		['-o', '--output'],
		{ help: "set the output file to write the results, default is output.json",
		  defaultValue: "output.json"
		}
	);
	parser.addArgument(
		['-s', '--search'],
		{
			help: "set the search string, default is football",
			defaultValue: "football"
		}
	)
}

async function outputResults(gitRes, projectTweets){
	
	var out = [];

	for(var i = 0; i < gitRes.length; i++){
		out.push(
			{	name: gitRes[i].name, 
				description : gitRes[i].description,
				tweets: (function(){
					var t = [];
					for(var j = 0; j < projectTweets[i].statuses.length; j++){
						t.push(projectTweets[i].statuses[j].text);
					}
					return t;
				})()
			}
		);
	}

	fs.writeFile(outputFile, JSON.stringify(out, null, 2), function(err){
		console.log(err);
	});
		
}



/***  github  ****/
async function githubSearch(){
	var fullUrl = githubbaseurl+searchRoute+"?q="+searchTerm+"&sort="+searchSort; 
	var options = {
		url: fullUrl, 
		headers: {
			'User-Agent': 'muzzylogic'
		}
	}
	//console.log("full url is " + fullUrl);
	let resJson = await request(options).then(function(body){
		//console.log('handling response');
		var json = JSON.parse(body);
		let filtered = gitRepsonseParse(json);
		//console.log("secret is "+CONSUMER_SECRET);
		return filtered;

	}).catch(function(err){
		return console.log(err);
	});
	//console.log("filtered json is"+ JSON.stringify(resJson));
	return resJson;
}

function gitRepsonseParse(json){
	var filtered = [];

	for(var i = 0; i < config.request.maxprojects; i++){
		if(i > json.length){
			break;
		}
		filtered.push(json.items[i]);
	}

	return filtered;

}


/***  twitter   ****/
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
		        "Authorization": "Bearer " + token
		    }
		};
		let validToken = await request(options).then(function(body){
			
			return true;
		}).catch(function(err){
			return false;
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
	//console.log("encoded is: "+ encoded);
	var options = {
	    url: 'https://api.twitter.com/oauth2/token',
	    headers: {
	        'Authorization': 'Basic ' + encoded,
	        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
	    body: 'grant_type=client_credentials'
	};

	let token = await request.post(options).then(function(body) {
     bearer_token = JSON.parse(body); 
	 return bearer_token;
	}).catch(function(err){
		return console.log(err);
	});
	return token.access_token;
}

async function twitterSearch(gitProject){
	var access_token = config.request.twitter.bearer_token;
	var twitter_api = 'https://api.twitter.com/1.1/search/tweets.json';
	var query = encodeURI(gitProject.name);
	//console.log("requesting timeline with bearer: "+ access_token);
	var options = {
	    method: 'GET',
	    url: twitter_api,
	    qs: {
	        "q": query
	    },
	    json: true,
	    headers: {
	        "Authorization": "Bearer " + access_token
	    }
	};

	let response = await request(options).then(function(body){
		return body; //body.statuses[].text
	}).catch(function(error){
		return console.log(error);
	});
	return response;
}

async function saveConfig(){
	configString = JSON.stringify(config, null, 2);
	fs.exists('config.json', function(exists){
		if(exists){
			fs.writeFile("config.json", configString, function(err){
				console.log(err);
			});
		}
		else{
			console.log("config file not found, could not save");
			process.exit();
		}
	}, function(err){
		console.log(err);
	});

}




main();