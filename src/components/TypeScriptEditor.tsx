import { h, Component } from 'preact';
import { debounce } from 'lodash';
import MonacoEditor from './MonacoEditor';
import * as TypeScript from 'typescript';
import { Abilities, Compiler } from '../utilities';

interface References { [name: string]: string; }

interface Props {
  code?: string;
  transpile?: boolean;
  editorDidMount?: (editor: monaco.editor.IEditor, mod: typeof monaco) => void;
  onChange?: (code: string, transpiled?: string, diagnostics?: TypeScript.Diagnostic[]) => void;
  diagnosticOptions?: monaco.languages.typescript.DiagnosticsOptions;
  definitions?: References;
}

export default class TypeScriptEditor extends Component<Props, void> {
  monaco: typeof monaco;

  definitionSources: { [pathName: string]: string } = {};

  compileSource(source: string) {
    const configuration = Compiler.createConfiguration(source);
    const result = Compiler.compile(configuration.sourceBundle, configuration.compilerOptions);
    if (!result.emitResult.emitSkipped) {
      return result;
    } else {
      console.log('transpile error'); // tslint:disable-line no-console
    }
    return null;
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillMount() {
    this.loadDefinitions();
    this.fixWebWorkers();
    if (this.props.code) {
      this.editorChanged(this.props.code);
    }
    this.editorChanged = debounce(this.editorChanged, 500);
  }

  componentWillReceiveProps(next: Props) {
    if (this.monaco) {
      this.addLanguageDefinitions(next.definitions);
    }
  }

  fixWebWorkers() {
    window['MonacoEnvironment'] = { // tslint:disable-line no-string-literal
      getWorkerUrl: () =>  'monaco-editor-worker-loader-proxy.js'
    };
  }

  async loadDefinitions(definitions?: References) {
    definitions = definitions || this.props.definitions;
    return Promise.all(
      Object.keys(definitions).filter(key => !this.definitionSources[key]).map(key => {
        if (definitions) {
          return fetch(definitions[key])
            .then(res => res.text())
            .then(source => { if (source) { this.definitionSources[key] = source; } });
        } else {
          return undefined;
        }
      }).filter(Boolean)
    );
  }

  async addLanguageDefinitions(definitions?: References) {
    definitions = definitions || this.props.definitions;
    await this.loadDefinitions(definitions);
    const extraLibsKey = '_extraLibs';
    const typescriptDefaults = this.monaco.languages.typescript.typescriptDefaults;
    Object.keys(definitions).forEach(key => {
      if (this.props.definitions && !typescriptDefaults[extraLibsKey][key]) {
        let lib = this.definitionSources[key];
        if (lib.indexOf('declare module \'') === -1) {
          const matches = key.match(/(.*)\/(.*).d.ts/);
          lib = `
declare module '${matches ? matches[1] : key}' {
  ${lib}
}
`;
        }
        typescriptDefaults.addExtraLib(lib, key);
      }
    });
  }

  async editorMounted(editor: monaco.editor.IEditor, m: typeof monaco) {
    this.monaco = m;
    await this.addLanguageDefinitions();
    if (this.props.editorDidMount) {
      this.props.editorDidMount(editor, m);
    }
  }

  editorChanged(code: string, event?: monaco.editor.IModelContentChangedEvent2) {
    const { onChange, transpile = true } = this.props;
    if (onChange && transpile) {
      const result = this.compileSource(code);
      if (result) {
        onChange(code, result.source, result.diagnostics);
      }
    } else if (onChange) {
      onChange(code);
    }
  }

  render() {
    const requireConfig = {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.1/require.min.js',
      paths: { 'vs': 'https://npmcdn.com/monaco-editor@0.8.3/min/vs/' },
    };

    return (
      <MonacoEditor
        width="100%"
        language="typescript"
        defaultValue={this.props.code}
        options={{
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          theme: 'vs-dark',
          fontSize: Abilities.isMobile() ? 16 : 13,
          // cursorBlinking: 'off',
          automaticLayout: true,
          wrappingIndent: 'same',
          parameterHints: true,
          // formatOnType: true,
          // formatOnPaste: true,
          tabCompletion: true,
          folding: true,
        }}
        requireConfig={requireConfig}
        onChange={(code, event) => this.editorChanged(code, event)}
        // editorWillMount={monaco => this.monaco = monaco}
        editorDidMount={(editor, m) => this.editorMounted(editor, m)}
        diagnosticOptions={this.props.diagnosticOptions}
      />
    );
  }
}