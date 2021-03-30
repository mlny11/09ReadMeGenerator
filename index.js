// TODO: Include packages needed for this application

// TODO: Create an array of questions for user input


// TODO: Create a function to write README file

// TODO: Create a function to initialize app


// Function call to initialize app

const axios = require("axios");
const inquirer = require("inquirer");
const fs = require("fs");
const template = require('./template.js');
const validator = require('email-validator');

let gitHubUserData;
let gitHubRepos;
let selectedRepo;

// Verify that a given GitHub exists and has at least one repo
async function verifyGitHubAccount(username) {

    if(username.length === 0) 
        return 'username cannot be blank';
    else{

        const url = `https://api.github.com/users/${username}`;

        // User GitHubUser Data
        const userResp = await axios.get(url)

        gitHubUserData = userResp.data;

        reposUrl = userResp.data.repos_url;

        if(typeof reposUrl === 'undefined')
            return `GitHub username ${username} does not exist`;

        reposResp = await axios.get(reposUrl);

        const reposData = reposResp.data;

        if(reposData.length === 0)
            return `GitHub user ${username} has no repos`;

        gitHubRepos = reposData;
        
        questions[1].choices = reposData.map(repo => repo.name);

        return true;
    }
}   

// Filter callback for repo selection question. Sets defaults for subsequent
// questions based on selected repo
function setRepoDefaults(repoName) {

    return new Promise((resolve,reject) => {

        selectedRepo = gitHubRepos.find(repo => repo.name == repoName);

        // Set repo name and description as defaults for Title and Description 
        // question
        questions[2].default = selectedRepo.description;

        // Get contributors and tags from repo
        axios
        .all([
            axios.get(selectedRepo.contributors_url),
            axios.get(selectedRepo.tags_url)
        ])
        .then(respArr => {
            // Set repo contributors as default for Contributors question
            questions[7].default = respArr[0].data.map(contributor => contributor.login).join(',');

            resolve(repoName);
        })
        .catch(err => {
            reject(new Error("Could not set defaults"));
        });
    })
}

function validateEmail(email) {
  
    if(validator.validate(email))
        return true;

    return `${email} is not a valid email`;
}

const questions = [
    {
        name: "username",
        message: "What is your GitHub username?",
        default: "mlny11",
        validate: verifyGitHubAccount
    },
    {
        type: "list",
        name: "repoName",
        message: "Select the project repo:",
        filter:setRepoDefaults
    },
    {
        name: "title",
        message: "Enter a project title:",
    },
    {
        name: "description",
        message: "Enter a project description:",
    },
    {
        name: "installation",
        message: "Enter installation instructions:"
    },
    {
        name: "usage",
        message: "Enter usage directions:"
    },
    {
        type: "list",
        name: "license",
        message: "Select license type:",
        choices: ["copyleft","lpgl","MIT","permissive","proprietary","public"]
    },
    {
        name: "contributors",
        message: "Enter contibutors:"
    },
    {
        name: "tests",
        message: "Enter tests:"
    },
    {
        name: "email",
        message: "Enter contact email:",
        validate: validateEmail
    }
];

function init() {

    inquirer.prompt(questions).then(resp => {

        generateReadMe(resp);
    });
}

function generateReadMe(responses){

    fs.writeFile
    (
        "./output/README.md",
        template.getReadMe(gitHubUserData,responses),
        (err) => {
            if(err)
                console.log("An error occured while writing file");
            else
                console.log("File saved");
        }
    );
}

init();