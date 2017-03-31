import { h, Component } from 'preact';
import debounce = require('lodash/debounce');
import MonacoEditor from './MonacoEditor';

interface CSSEditorProps {
  code?: string;
  editorDidMount?: (editor: monaco.editor.IEditor, mod: typeof monaco) => void;
  onChange?: (code: string) => void;
}

export default class CSSEditor extends Component<CSSEditorProps, void> {
  monaco: typeof monaco;

  editor: monaco.editor.IEditor;

  componentWillMount() {
    this.fixWebWorkers();
    this.codeChanged = debounce(this.codeChanged, 500);
  }

  fixWebWorkers() {
    window['MonacoEnvironment'] = { // tslint:disable-line no-string-literal
      getWorkerUrl: () =>  'monaco-editor-worker-loader-proxy.js'
    };
  }

  codeChanged(code: string) {
    const { onChange } = this.props;
    if (onChange) {
      onChange(code);
    }
  }

  render() {
    return (
      <MonacoEditor
        width="100%"
        language="css"
        defaultValue={this.props.code}
        options={{
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          theme: 'vs-dark',
          // cursorBlinking: 'off',
          automaticLayout: true,
          wrappingIndent: 'same',
          parameterHints: true,
          formatOnType: true,
          formatOnPaste: true,
          tabCompletion: true,
          folding: true,
        }}
        onChange={code => this.codeChanged(code)}
        editorWillMount={monaco => this.monaco = monaco}
        editorDidMount={editor => this.editor = editor}
      />
    );
  }
}