import * as TypeScript from 'typescript';

export interface CompilerConfiguration {
  sourceBundle: SourceBundle;
  compilerOptions: TypeScript.CompilerOptions;
}

export interface SourceBundle {
  entry: string;
  files: EditorSourceFile[];
}

export interface EditorSourceFile {
  fileName: string;
  source: string;
}

export function createEditorSourceFile(
  fileName: string,
  source: string,
  isEntryPoint: boolean = false
): EditorSourceFile {
  return { source, fileName };
}

export interface CompilerResult {
  source: string;
  diagnostics: TypeScript.Diagnostic[];
  emitResult: TypeScript.EmitResult;
}

export function createConfiguration(files: EditorSourceFile[], entry: string) {
  let jsxFactory = '';
  const jsxFactories = files.map(file => {
    const matches = file.source.match(/\/\*.*\s.*@jsx\s(..)\*.*\//);
    if (matches && matches.length > 1) {
      return matches[1].toString().trim();
    }
    return;
  }).filter(Boolean);
  if (jsxFactories && jsxFactories.length > 0) {
    jsxFactory = (jsxFactories[0] || '').toString().trim();
  }
  return  {
    sourceBundle: {
      entry,
      files,
    },
    compilerOptions: {
      outFile: 'bundle.js',
      module: TypeScript.ModuleKind.AMD,
      target: TypeScript.ScriptTarget.ES5,
      // lib: ['es6', 'dom', 'node'],
      jsx: TypeScript.JsxEmit.React,
      jsxFactory: !!jsxFactory ? 'h' : undefined,
      allowJs: true,
      maxNodeModuleJsDepth: 100,
      allowSyntheticDefaultImports: true,
    },
  };
}

export function compile(sourceBundle: SourceBundle, options: TypeScript.CompilerOptions): CompilerResult {
  const outputFiles = {};

  const host: TypeScript.CompilerHost = {
    getSourceFile: (
      fileName: string,
      languageVersion: TypeScript.ScriptTarget,
      onError?: (message: string) => void,
    ): TypeScript.SourceFile => {
      const matches = sourceBundle.files.filter(file => file.fileName.indexOf(fileName) > -1);
      if (matches.length) {
        const file = matches[0];
        return TypeScript.createSourceFile(
          file.fileName,
          file.source,
          TypeScript.ScriptTarget.ES5,
          undefined, TypeScript.ScriptKind.TSX
        );
      }
      return null as any as TypeScript.SourceFile; // tslint:disable-line no-any
    },

    getDefaultLibFileName: () => '',

    writeFile: (_filename, _content) => {
      outputFiles[_filename] = _content;
    },

    getCurrentDirectory: () => '', // TypeScript.sys.getCurrentDirectory(),

    getCanonicalFileName: fileName => /*TypeScript.sys.useCaseSensitiveFileNames*/ true
      ? fileName : fileName.toLowerCase(),

    getNewLine: () => '\n', // TypeScript.sys.newLine,

    useCaseSensitiveFileNames: () => true, // TypeScript.sys.useCaseSensitiveFileNames,

    fileExists: (fileName: string) => true,

    readFile(fileName: string): string {
      const matches = sourceBundle.files.filter(file => fileName.indexOf(file.fileName) > -1);
      if (matches.length) {
        const file = matches[0];
        return file.source;
      }
      return null as any as string; // tslint:disable-line no-any
    },

    resolveModuleNames(_moduleNames: string[], _containingFile: string): TypeScript.ResolvedModule[] {
      const moduleNames = _moduleNames.map(moduleName => {
        let matches = sourceBundle.files.filter(file => file.fileName.indexOf(moduleName) > -1);
        if (matches.length) {
          return { resolvedFileName: matches[0].fileName };
        } else {
          return { resolvedFileName: `__extraneous__${moduleName}.tsx` };
        }
      });
      return moduleNames;
    },

    getDirectories(_path: string): string[] {
      throw new Error('unsupported');
    }
  };

  const program = TypeScript.createProgram([sourceBundle.entry], options, host);
  const emitResult = program.emit();

  return {
    source: Object.keys(outputFiles).map(key => outputFiles[key]).join('\n'),
    diagnostics: TypeScript.getPreEmitDiagnostics(program).concat(emitResult.diagnostics),
    emitResult
  };
}
