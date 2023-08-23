#!/usr/bin/env node
let args = process.argv.slice(2);
const fs = require('fs');
const path = require("path");
const figlet = require("figlet");
const chalk = require("chalk");
const squeeze = require('../lib');
const {trim} = require('../lib/Utils');

const isEmptyObject = (obj) => !Object.keys(obj).length;

const processArgs = (args) => {
  if(!args.length) return ;
  let newArgs = [];
  newArgs.push(args[0]);
  let commandVars = {};
  for(let i=1;i<args.length;i++){
    if(args[i].slice(0,2) == '--'){
      let longArg = args[i].slice(2);
      let value = args[++i];
      commandVars[longArg] = value;
    }else{
      let shortArg = args[i].slice(1);
      let value = args[++i];
      commandVars[shortArg] = value;
    }
  }
  newArgs.push(commandVars);
  return newArgs;
}

const cwd = process.cwd();
console.log(
  chalk.yellowBright(
    figlet.textSync('Squeeze', { horizontalLayout: 'full' })
  )
);
console.log(chalk.blueBright("\t\t Built by Abhay Gupta"))

if(args.length == 0){
  console.log(chalk.redBright("\n No additional arguments found !"));
  console.log(chalk.yellowBright("\n Looking for squeeze config file..."));
  if(!fs.existsSync(path.join(cwd,'squeeze.config.js'))){
    console.log(`\n ${chalk.redBright("[ERROR]: ")}Squeeze.config.js not found !`)
    return ;
  }
  config = require(path.join(cwd,'squeeze.config.js'));
  console.log(chalk.greenBright("\n Squeeze config file found !"));
  squeeze(config);
  return ;
}

const runCommand = (args) => {
  const cmd = args[0];
  const options = args[1];
  if(cmd == "build"){
    if(isEmptyObject(options)){
      console.log(chalk.redBright("\n No additional arguments found !"));
      console.log(chalk.yellowBright("\n Looking for squeeze config file..."));
      if(!fs.existsSync(path.join(cwd,'squeeze.config.js'))){
        console.log(`\n ${chalk.redBright("[ERROR]: ")}Squeeze.config.js not found !`)
        return ;
      }
      let config = require(path.join(cwd,'squeeze.config.js'));
      console.log(chalk.greenBright("\n Squeeze config file found !"));
      squeeze(config);
    }
    else if(options.config || options.c){
      let config = options.c || options.config; 
      let configFile = require(path.join(cwd,config));
      console.log(chalk.greenBright("\n Configuration file found !"));
      squeeze(configFile);
    }else{
      let fileName = options.filename || options.f;
      let entryFile = options.entry || options.e;
      let outputFolder = options.output || options.o;
      if(!entryFile){
        console.log(`\n ${chalk.redBright("[ERROR]: ")}Entry file not specified.`)
        return ;
      }
      entryFile = path.join(cwd,entryFile);
      if(!outputFolder){
        console.log(`\n ${chalk.redBright("[ERROR]: ")}Output path not specified.`)
        return ;
      }
      outputFolder = path.join(cwd,outputFolder);
      config = {
        entryFile,
        outputFolder,
        fileName
      }
      squeeze(config);
    }
  }else if(cmd == "init"){
    console.log(chalk.greenBright("\n Creating a configuration file..."));
    fs.writeFileSync(
      path.join(cwd,"squeeze.config.js"),
      trim(`
      const path = require("path");

      module.exports = {
        entryFile:path.join(__dirname,'/index.js'),
        outputFolder:path.join(__dirname,'/build'),
        fileName:"bundle.js"
      }
      `)
    );
    console.log(chalk.greenBright("\n Configuration file created successfully."));
  }else if(cmd == "--help" || cmd == 'help'){
    console.log("\n Usage \n");
    console.log("  squeeze build \t\t\   : Bundles your code by looking at the default configuration file.");
    console.log("  squeeze build <Config Path> \t\   : Bundles your code by looking at the specified configuration file.");
    console.log("  squeeze build <Options>\t\   : Bundles your code by specified options entered by user.");
    console.log("  <Options>");
    console.log("     --entry or -e \t\t\   : Option for entry file path for squeeze.");
    console.log("     --output or -o \t\t\   : Option for output folder path for squeeze.");
    console.log("     --filename or -f \t\t\   : Option for bundled filename for squeeze.");
    console.log("  squeeze init \t\t\t\   : Creates a configuration file for you.");
    console.log("  squeeze help \t\t\t\   : Help and information related to squeeze commands.\n");
  }else{
    console.log(`\n ${chalk.redBright("[ERROR]: ")}INVALID COMMAND.`);
    console.log(`\n ${chalk.blueBright("[ERROR]: ")}run squeeze help for a list of useful commands`);
  }
}

args = processArgs(args);
runCommand(args);