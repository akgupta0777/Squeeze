const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const {resolveRequest} = require('../Utils');
const MODULE_CACHE = require('../Cache');

class Module {
  constructor(filePath){
    this.filePath = filePath;
    this.content = fs.readFileSync(filePath,'utf-8');
    // this.ast = babel.parseSync(this.content);
    this.transform();
  }

  initDependencies(){
    this.dependencies = [];
  }

  transform(){}
  transformModule(){}
}

class JSModule extends Module {
  constructor(filePath){
    super(filePath);
    this.ast = babel.parseSync(this.content);
  }

  initDependencies() {
    this.dependencies = this.findDependencies();
  }
  findDependencies() {
    const importDeclarations = this.ast.program.body.filter(
      node => node.type === 'ImportDeclaration'
    );
    const dependencies = [];
    for (const importDeclaration of importDeclarations) {
      const requestPath = importDeclaration.source.value;
      const resolvedPath = resolveRequest(this.filePath, requestPath);
      dependencies.push(createModule(resolvedPath));

      //replace the request path to the resolved path
      importDeclaration.source.value = resolvedPath;
    }
    return dependencies;
  }

  transformModule(){
    const { types: t } = babel;
    const { filePath } = this;
    const { ast, code } = babel.transformFromAstSync(this.ast, this.content, {
      ast: true,
      plugins: [
        function() {
          return {
            visitor: {
              ImportDeclaration(path) {
                const newIdentifier = path.scope.generateUidIdentifier(
                  'imported'
                );

                for (const specifier of path.get('specifiers')) {
                  const binding = specifier.scope.getBinding(
                    specifier.node.local.name
                  );
                  const importedKey = specifier.isImportDefaultSpecifier()
                    ? 'default'
                    : specifier.get('imported.name').node;

                  for (const referencePath of binding.referencePaths) {
                    referencePath.replaceWith(
                      t.memberExpression(
                        newIdentifier,
                        t.stringLiteral(importedKey),
                        true
                      )
                    );
                  }
                }

                path.replaceWith(
                  t.variableDeclaration('const', [
                    t.variableDeclarator(
                      newIdentifier,
                      t.callExpression(t.identifier('require'), [
                        path.get('source').node,
                      ])
                    ),
                  ])
                );
              },
              ExportDefaultDeclaration(path) {
                path.replaceWith(
                  t.expressionStatement(
                    t.assignmentExpression(
                      '=',
                      t.memberExpression(
                        t.identifier('exports'),
                        t.identifier('default'),
                        false
                      ),
                      t.toExpression(path.get('declaration').node)
                    )
                  )
                );
              },
              ExportNamedDeclaration(path) {
                const declarations = [];
                if (path.has('declaration')) {
                  if (path.get('declaration').isFunctionDeclaration()) {
                    declarations.push({
                      name: path.get('declaration.id').node,
                      value: t.toExpression(path.get('declaration').node),
                    });
                  } else {
                    path
                      .get('declaration.declarations')
                      .forEach(declaration => {
                        declarations.push({
                          name: declaration.get('id').node,
                          value: declaration.get('init').node,
                        });
                      });
                  }
                } else {
                  path.get('specifiers').forEach(specifier => {
                    declarations.push({
                      name: specifier.get('exported').node,
                      value: specifier.get('local').node,
                    });
                  });
                }
                path.replaceWithMultiple(
                  declarations.map(decl =>
                    t.expressionStatement(
                      t.assignmentExpression(
                        '=',
                        t.memberExpression(
                          t.identifier('exports'),
                          decl.name,
                          false
                        ),
                        decl.value
                      )
                    )
                  )
                );
              },
            },
          };
        },
      ],
    });
    this.ast = ast;
    this.content = code;
  }
}

class CSSModule extends Module {
  transform() {
    this.content = trim(`
      const content = '${this.content.replace(/\n/g, '')}';
      const style = document.createElement('style');
      style.type = 'text/css';
      if (style.styleSheet) style.styleSheet.cssText = content;
      else style.appendChild(document.createTextNode(content));
      document.head.appendChild(style);
    `);
  }
}

const MODULE_LOADERS = {
  '.css' : CSSModule,
  '.js' : JSModule
}
const createModule = (filePath) => {
  if(!MODULE_CACHE.has(filePath)){
    const fileExtension = path.extname(filePath);
    const moduleClass = MODULE_LOADERS[fileExtension];
    if(!moduleClass) throw new Error(`Unsupported extension "${fileExtension}".`); 
    const module = new moduleClass(filePath);
    MODULE_CACHE.set(filePath,module);
    module.initDependencies();
  }
  return MODULE_CACHE.get(filePath);
}

module.exports = {
  Module,
  JSModule,
  CSSModule,
  createModule
};