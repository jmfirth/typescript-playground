/*

let c = require('./test')
//c.default(['entry.ts', 'test.ts'], { maxNodeModuleJsDepth: 10 })

c.default(['entry.ts', 'test.ts'], { maxNodeModuleJsDepth: 10, module: 'commonjs', target: 'es5', lib: ['es6', 'dom', 'es2015', 'node'] })

*/

import * as ts from 'typescript';

const entryTs = `
import { h, Component, render } from 'preact';
import * as util from './util';
util.writeDom();

const a = h, b = Component, c = render;
console.log(a, b, c);
debugger;
`;

const utilTs = `
export function sayHello() {
  return 1 + 1;
}
export function writeDom() {
  const p = document.createElement('p');
  p.innerHTML = 'Hello world!!!!';
  debugger;
  document.body.appendChild(p);
}
`;

export default function compile(fileNames: string[], options: ts.CompilerOptions): void {
  const host: ts.CompilerHost = {
    getSourceFile: (
      fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void
    ): ts.SourceFile => {
      if (fileName.indexOf('entry.ts') > -1) {
        return ts.createSourceFile('entry.ts', entryTs, ts.ScriptTarget.ES5, undefined, ts.ScriptKind.TSX);
      } else if (fileName.indexOf('util.ts') > -1) {
        return ts.createSourceFile('util.ts', utilTs, ts.ScriptTarget.ES5, undefined, ts.ScriptKind.TSX);
      } else {
        return null as any as ts.SourceFile;
      }
    },
    getDefaultLibFileName: () => '',
    writeFile: (_filename, _content) => {
      console.log(_filename, _content);
    },
    getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
    getCanonicalFileName: fileName => ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase(),
    getNewLine: () => ts.sys.newLine,
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    fileExists: (fileName: string) => fileName === 'test.ts',
    readFile(fileName: string): string {
      if (fileName.indexOf('entry.ts') > -1) {
        return entryTs;
      } else if (fileName.indexOf('util.ts') > -1) {
        return utilTs;
      } else {
        return null as any as string;
      }
    },
    resolveModuleNames(_moduleNames: string[], _containingFile: string): ts.ResolvedModule[] {
      // const t: ts.ResolvedModule = {
      //     resolvedFileName: 'test',
      // }
      // console.log(_moduleNames, _containingFile);
      // throw new Error('unsupported');
      return _moduleNames.map(moduleName => ({
        resolvedFileName: moduleName.slice(1) + '.ts',
      }));
    },
    getDirectories(_path: string): string[] {
      throw new Error('unsupported');
    }
  };

  let program = ts.createProgram(fileNames, options, host);
  let emitResult = program.emit();

  let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

  allDiagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    }
  });
  let exitCode = emitResult.emitSkipped ? 1 : 0;
  console.log(`Process exiting with code '${exitCode}'.`);
  console.log(emitResult);
  // process.exit(exitCode);
}

compile(
  [
    'entry.ts',
    // 'util.ts'
  ],
  {
    outFile: 'test.js',
    module: ts.ModuleKind.AMD,
    target: ts.ScriptTarget.ES5,
    lib: ['es6', 'dom', 'es2015', 'node'],
    jsx: ts.JsxEmit.React,
    jsxFactory: 'h',
    allowJs: true,
    maxNodeModuleJsDepth: 100,
    allowSyntheticDefaultImports: true,
  }
);

/*
"outDir": "build/dist",
"module": "commonjs",
"target": "es5",
"lib": ["es6", "dom"],
"sourceMap": true,
"allowJs": true,
"jsx": "react",
"jsxFactory": "h",
"moduleResolution": "node",
"rootDir": "src",
"forceConsistentCasingInFileNames": true,
"noImplicitReturns": true,
"noImplicitThis": true,
"noImplicitAny": true,
"strictNullChecks": true,
"suppressImplicitAnyIndexErrors": true,
"noUnusedLocals": true
*/

/*
// load require
var script = document.createElement('script')
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.3/require.js'
document.body.appendChild(script)

// inject script

require.config({
  paths: { preact: 'https://cdnjs.cloudflare.com/ajax/libs/preact/7.2.1/preact.min' },
});

define("util", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function sayHello() {
        return 1 + 1;
    }
    exports.sayHello = sayHello;
    function writeDom() {
        var p = document.createElement('p');
        p.innerHTML = 'Hello world!!!!';
        debugger;
        document.body.appendChild(p);
    }
    exports.writeDom = writeDom;
});
define("entry", ["require", "exports", "preact", "util"], function (require, exports, preact_1, util) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    util.writeDom();
    var a = preact_1.h, b = preact_1.Component, c = preact_1.render;
    console.log(a, b, c);
    debugger;
});

//
require(['entry'], outerModules => {
  debugger;
}, error => { debugger; })
*/