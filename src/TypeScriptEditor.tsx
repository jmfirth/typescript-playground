import { h, Component/*, render*/ } from 'preact';
import MonacoEditor from './MonacoEditor';
import * as TypeScript from 'typescript';
import * as compiler from './compiler';
import { debounce } from 'lodash';

interface References { [name: string]: string; }

const LOCAL_STORAGE_PREFIX = 'tspg-cache-';

const getStorageKey = (fragment: string) => `${LOCAL_STORAGE_PREFIX}${fragment}`;

const getStorageItem = (fragment: string) =>
  localStorage.getItem(getStorageKey(fragment));

const setStorageItem = (fragment: string, value: string) =>
  localStorage.setItem(getStorageKey(fragment), value);

const notInStorage = (fragment: string) => !getStorageItem(fragment); // tslint:disable-line no-any

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

  compileSource(source: string) {
    const configuration = compiler.createConfiguration(source);
    const result = compiler.compile(configuration.sourceBundle, configuration.compilerOptions);
    if (!result.emitResult.emitSkipped) {
      return result;
    } else {
      console.log('transpile error'); // tslint:disable-line no-console
    }
    return null;
  }

  componentWillMount() {
    this.load();
    this.fixWebWorkers();
    if (this.props.code) {
      this.editorChanged(this.props.code);
    }
    this.editorChanged = debounce(this.editorChanged, 500);
  }

  async load() {
    this.loadDefinitions();
  }

  async loadDefinitions() {
    return Promise.all(
      Object.keys(this.props.definitions).filter(notInStorage).map(key => {
        if (this.props.definitions) {
          return fetch(this.props.definitions[key])
            .then(res => res.text())
            .then(source => setStorageItem(key, source));
        } else {
          return undefined;
        }
      }).filter(Boolean)
    );
  }

  fixWebWorkers() {
    window['MonacoEnvironment'] = { // tslint:disable-line no-string-literal
      getWorkerUrl: () =>  'monaco-editor-worker-loader-proxy.js'
    };
  }

  addLanguageDefinitions() {
    const extraLibsKey = '_extraLibs';
    const typescriptDefaults = this.monaco.languages.typescript.typescriptDefaults;
    Object.keys(this.props.definitions).forEach(key => {
      if (this.props.definitions && !typescriptDefaults[extraLibsKey][key]) {
        typescriptDefaults.addExtraLib(getStorageItem(key) as string, key);
      }
    });
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
        editorDidMount={(editor, mod) => {
          this.monaco = mod;
          this.addLanguageDefinitions();
          if (this.props.editorDidMount) {
            this.props.editorDidMount(editor, mod);
          }
        }}
        diagnosticOptions={this.props.diagnosticOptions}
        // context={{
        //   window: window,
        //   preact: { render, h, Component },
        //   container: this.container,
        // }}
      />
    );
  }
}