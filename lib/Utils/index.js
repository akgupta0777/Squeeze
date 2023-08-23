const path = require('path');

const resolveRequest = (requester,requestedPath) => {
  if (requestedPath[0] === '.') {
    // relative import
    return path.join(path.dirname(requester), requestedPath);
  } else {
    const requesterParts = requester.split('/');
    const requestPaths = [];
    for (let i = requesterParts.length - 1; i > 0; i--) {
      requestPaths.push(requesterParts.slice(0, i).join('/') + '/node_modules');
    }
    // absolute import
    return require.resolve(requestedPath, { paths: requestPaths });
  }
}

const trim = (str) => {
  const lines = str.split('\n').filter(Boolean);
  const padLength = lines[0].length - lines[0].trimLeft().length;
  const regex = new RegExp(`^\\s{${padLength}}`);
  const trimmed =  lines.map(line => line.replace(regex, '')).join('\n');
  return trimmed;
}

const collectModules = (graph) => {
  const modules = new Set();
  collect(graph,modules);
  return Array.from(modules);

  function collect (module,modules) {
    if(!modules.has(module)){
      modules.add(module);
      module.dependencies.forEach(dependency => collect(dependency,modules));
    }
  }
}

const toModuleMap = (modules) => {
  let moduleMap = "";
  moduleMap += "{";

  for(const module of modules){
    module.transformModule();
    module.filePath = module.filePath.replace(/\\/g,'\\\\');
    moduleMap += `"${module.filePath}": `;
    moduleMap += `function(exports, require) { ${module.content}\n },`;
  }
  moduleMap += "}";
  return moduleMap;
}

const addRuntime = (moduleMap,entryPoint) => {
  return trim(`
    const modules = ${moduleMap};
    const entry = "${entryPoint}";

    function webpackStart({modules, entry}) {
      const moduleCache = {};
      const require = moduleName => {
        if(moduleCache[moduleName]) return moduleCache[moduleName];
        const exports = {};
        moduleCache[moduleName] = exports;
        modules[moduleName](exports,require);
        return moduleCache[moduleName];
      };

      require(entry);
    }
    webpackStart({modules,entry});
  `);
}

module.exports = {
  resolveRequest,
  trim,
  toModuleMap,
  collectModules,
  addRuntime
};