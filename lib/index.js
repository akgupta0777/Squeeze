const fs = require('fs');
const { mkdir } = require('fs/promises')
const path = require('path');
const express = require('express');
const {createModule} = require('./Modules');
const {collectModules,toModuleMap,addRuntime} = require('./Utils');
const chalk = require("chalk");

// TODO -  Feature for supporting dev mode (currently failing)
const dev = ({entryFile,outputFolder,htmlTemplatePath,devServerOptions}) => {
  const { outputFiles } = _build({entryFile,htmlTemplatePath});
  console.log(outputFiles)
  // A mapping for fileName -> content
  const outputFileMap = {}
  for(const outputFile of outputFiles){
    outputFileMap[outputFile.name] = outputFile.content;
  }
  console.log("mapp",outputFileMap);
  const indexHTML = outputFileMap['index.html']
  console.log(indexHTML)
  const app = express();
  app.use((req,res) => {
    const requestFile = req.path.slice(1);
    console.log("req file",requestFile);
    if(outputFileMap[requestFile]){
      return res.send(outputFileMap[requestFile]);
    }
    res.send(indexHTML);
  })
  app.listen(devServerOptions.port, () => {
    console.log(`Dev Server starts at https://localhost:${devServerOptions.port}`);
  })
}

const _build = ({entryFile,htmlTemplatePath}) => {
  // Build Dependency Graph
  const graph = buildDependencyGraph(entryFile);
  // Bundle the asset
  const outputFiles = bundle(graph);
  outputFiles.push(generateHTMLTemplate(htmlTemplatePath,outputFiles));
  return {outputFiles,graph};
}

const build = ({entryFile, outputFolder, fileName}) => {
  if(!fs.existsSync(entryFile)){
    throw new Error("[ERROR] : Entry file doesn't exist !");
  }
  if(!fs.existsSync(outputFolder)){
    mkdir(outputFolder);
  }
  console.log(chalk.greenBright("\n Squeezing your code like lemons... 🍋🍋"));
  // Build dependency graph from entry file.
  const graph = buildDependencyGraph(entryFile);
  // Bundle all the files with help of dependency graph.
  const outputFiles = bundle(graph,fileName);
  // Write to output folder.
  for(const outputFile of outputFiles){
    fs.writeFileSync(
      path.join(outputFolder,outputFile.name),
      outputFile.content,
      'utf-8'
    );
  }

  console.log(chalk.blueBright("\n Your squeezed code bundle can be found in ",outputFolder));
}

const END_BODY_TAG = '</body>';
const generateHTMLTemplate = (htmlTemplatePath,outputFiles) => {
  let htmlTemplate = fs.readFileSync(htmlTemplatePath,'utf-8');
  htmlTemplate = htmlTemplate.replace(
    END_BODY_TAG,
    outputFiles.map(({name}) => `<script src="/${name}"></script>`).join("")+END_BODY_TAG
  )
  return { name: 'index.html', content: htmlTemplate };
}

const buildDependencyGraph = (entryFile) => {
  const rootModule = createModule(entryFile);
  return rootModule;
}

const bundle = (graph,fileName) => {
  const modules = collectModules(graph);
  const moduleMap = toModuleMap(modules);
  const moduleCode = addRuntime(moduleMap,modules[0].filePath);
  return [{name:fileName??'bundle.js',content:moduleCode}];
}

module.exports = build;