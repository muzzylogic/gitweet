## Git Project and Tweet Search 

# Description
    Command line api to search github projects and output relevant tweets in json format

# Prerequisites 
- Nodejs version 8.0.0 or greater installed 

# Usage 
- Create your twitter application [https://apps.twitter.com/]
- Generate your Consumer key and Consumer Secret 
- Set your consumer key and consumer secret in config.json
- Default git search type can be set in the config file (forks, stars, updated)
- From the command line navigate to the root of the project 
- install dependencies with the following command
    node install
- Run the application using 
    node gitweet 
- To see the list of available args use 
    node gitweet -h

## args 
    -h, --help            Show this help message and exit.
    -v, --version         Show program's version number and exit.
    -o OUTPUT, --output OUTPUT
                        set the output file to write the results, default is
                        output.json
    -s SEARCH, --search SEARCH
                        set the search string, default is football


