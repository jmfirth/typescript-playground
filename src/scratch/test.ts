/*
  // load require
  var script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.3/require.js'
  document.body.appendChild(script)

  // configure external dependencies
  require.config({
    paths: { preact: 'https://cdnjs.cloudflare.com/ajax/libs/preact/7.2.1/preact.min' },
  });

  // inject scripts
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

  // run script
  require(['entry']); // , outerModules => { debugger; }, error => { debugger; })
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

interface CompilerConfiguration {
  sourceBundle: SourceBundle;
  compilerOptions: ts.CompilerOptions;
}

interface SourceBundle {
  entry: string;
  files: EditorSourceFile[];
}

interface EditorSourceFile {
  fileName: string;
  source: string;
}

function createEditorSourceFile(fileName: string, source: string, isEntryPoint: boolean = false): EditorSourceFile {
  return { source, fileName };
}

const mockCompilerConfiguration: CompilerConfiguration = {
  sourceBundle: {
    entry: 'entry.ts',
    files: [
      createEditorSourceFile('entry.ts', entryTs),
      createEditorSourceFile('util.ts', utilTs),
    ],
  },
  compilerOptions: {
    outFile: 'bundle.js',
    module: ts.ModuleKind.AMD,
    target: ts.ScriptTarget.ES5,
    lib: ['es6', 'dom', 'es2015', 'node'],
    jsx: ts.JsxEmit.React,
    jsxFactory: 'h',
    allowJs: true,
    maxNodeModuleJsDepth: 100,
    allowSyntheticDefaultImports: true,
  },
};

interface CompilerResult {
  source: string;
  diagnostics: ts.Diagnostic[];
  emitResult: ts.EmitResult;
}

export default function compile(sourceBundle: SourceBundle, options: ts.CompilerOptions): CompilerResult {
  const outputFiles = {};

  const host: ts.CompilerHost = {
    getSourceFile: (
      fileName: string,
      languageVersion: ts.ScriptTarget,
      onError?: (message: string) => void,
    ): ts.SourceFile => {
      const matches = sourceBundle.files.filter(file => fileName.indexOf(file.fileName) > -1);
      if (matches.length) {
        const file = matches[0];
        return ts.createSourceFile(file.fileName, file.source, ts.ScriptTarget.ES5, undefined, ts.ScriptKind.TSX);
      }
      return null as any as ts.SourceFile;
    },

    getDefaultLibFileName: () => '',

    writeFile: (_filename, _content) => {
      outputFiles[_filename] = _content;
    },

    getCurrentDirectory: () => './', // ts.sys.getCurrentDirectory(),

    getCanonicalFileName: fileName => ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase(),

    getNewLine: () => ts.sys.newLine,

    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,

    fileExists: (fileName: string) => true,

    readFile(fileName: string): string {
      const matches = sourceBundle.files.filter(file => fileName.indexOf(file.fileName) > -1);
      if (matches.length) {
        const file = matches[0];
        return file.source;
      }
      return null as any as string;
    },

    resolveModuleNames(_moduleNames: string[], _containingFile: string): ts.ResolvedModule[] {
      return _moduleNames.map(moduleName => ({
        resolvedFileName: moduleName.slice(1) + '.ts',
      }));
    },

    getDirectories(_path: string): string[] {
      throw new Error('unsupported');
    }
  };

  const program = ts.createProgram([sourceBundle.entry], options, host);
  const emitResult = program.emit();

  return {
    source: Object.keys(outputFiles).map(key => outputFiles[key]).join('\n'),
    diagnostics: ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics),
    emitResult
  };
}

const result = compile(mockCompilerConfiguration.sourceBundle, mockCompilerConfiguration.compilerOptions);

console.log('Diagnostics:');
console.log('-------------------------------------------------------');
result.diagnostics.forEach(diagnostic => {
  if (diagnostic.file) {
    let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
  }
});
console.log('\n');
console.log('Source:');
console.log('-------------------------------------------------------');
console.log(result.source);

