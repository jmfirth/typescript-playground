import * as React from 'react';
import { debounce } from 'lodash';
import MonacoEditor from './MonacoEditor';

interface References { [name: string]: string; }

interface Props {
  code?: string;
  transpile?: boolean;
  transpileDebounce?: number;
  editorDidMount?: (editor: monaco.editor.IEditor, mod: typeof monaco) => void;
  onChange?: (code: string) => void;
  editorOptions?: monaco.editor.IEditorOptions;
  diagnosticOptions?: monaco.languages.typescript.DiagnosticsOptions;
  definitions?: References;
}

export default class TypeScriptEditor extends React.Component<Props, void> {
  monaco: typeof monaco;
  editor: monaco.editor.IEditor;

  definitionSources: { [pathName: string]: string } = {};

  shouldComponentUpdate() {
    return false;
  }

  componentWillMount() {
    this.loadDefinitions();
    this.fixWebWorkers();
    if (this.props.code) {
      this.editorChanged(this.props.code);
    }
    this.editorChanged = debounce(this.editorChanged, this.props.transpileDebounce || 500);
  }

  componentWillReceiveProps(next: Props) {
    if (this.editor && next.editorOptions) {
      this.editor.updateOptions(next.editorOptions);
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
    const { onChange } = this.props;
    if (onChange) {
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
        height="100%"
        language="typescript"
        defaultValue={this.props.code}
        options={this.props.editorOptions}
        requireConfig={requireConfig}
        onChange={(code, event) => this.editorChanged(code, event)}
        editorWillMount={monaco => { this.monaco = monaco; }}
        editorDidMount={(editor, m) => {
          this.editor = editor;
          this.editorMounted(editor, m);
        }}
        diagnosticOptions={this.props.diagnosticOptions}
      />
    );
  }
}