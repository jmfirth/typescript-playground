// @TODO:
// hyperscript by default!
// save feature
// css editor
// tabs
// toolbar
// hotkeys
// console
// html editor
// instrumentation
// hot reload

import { h, Component } from 'preact';
import * as TypeScript from 'typescript';
import * as lzs from 'lz-string';
import debounce = require('lodash/debounce');
import MonacoEditor from './MonacoEditor';
import TypeScriptEditor from './TypeScriptEditor';
import IconButton from './IconButton';
import * as defaults from './defaults';
import 'material-design-icons/iconfont/material-icons.css';
import 'mdi/css/materialdesignicons.css';
import 'mdi/fonts/materialdesignicons-webfont.ttf';
import 'mdi/fonts/materialdesignicons-webfont.woff';
import 'mdi/fonts/materialdesignicons-webfont.woff2';
// import * as pastebin from './pastebin';

function getIFrameSource(source: string, css: string, html: string, dependencies: { [key: string]: string }) {
  return `
<html>
  <head>
    <style type="text/css">
${css}
    </style>
  </head>
  <body>
${html}
  </body>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/systemjs/0.20.11/system.js"></script>
  <script>
SystemJS.config({
  baseURL: 'http://browserify-cdn.abstractsequential.com:8080/standalone/',
});

let define = SystemJS.amdDefine;
let __s = System;
System = SystemJS
${source}

SystemJS.import('entry');
System = __s;
  </script>
</html>
`;
}

const RECENT_SOURCE = `ts-pg-recent`;

interface State {
  show: string;
  source: string;
  transpiled: string;
  diagnostics: TypeScript.Diagnostic[];
  html: string;
  css: string;
  dependencies: { [key: string]: string };
  definitions: { [key: string]: string };
  semanticValidation: boolean;
  syntaxValidation: boolean;
  editorMounted: boolean;
}

class App extends Component<null, State> {
  state = {
    show: 'code',
    source: defaults.preactSource,
    css: defaults.css,
    html: defaults.html,
    dependencies: defaults.dependencies,
    definitions: defaults.definitions,
    // This line disables errors in jsx tags like <div>, etc.
    syntaxValidation: false,
    semanticValidation: false,
    editorMounted: false,
    transpiled: '',
    diagnostics: [],
  };

  c: Element;

  componentWillMount() {
    this.setState({ source: this.loadSourceFromUrl() || this.loadSource() || this.state.source });

    // pastebin.createPaste('const square = x => x * x;');
  }

  loadSourceFromUrl() {
    const source = window.location.search.length ? window.location.search.replace('?source=', '') : null;
    return source ? lzs.decompressFromEncodedURIComponent(source) : null;
  }

  loadSource() {
    return localStorage.getItem(RECENT_SOURCE);
  }

  saveSource(source: string) {
    localStorage.setItem(RECENT_SOURCE, lzs.compress(source));
  }

  shareUrl() {
    const { origin, pathname } = window.location;
    return `${origin}${pathname}?source=${lzs.compressToEncodedURIComponent(this.state.source)}`;
  }

  render() {
    const { show } = this.state;
    return (
      <div id="window">
        <div id="toolbar">
          <div>
          <IconButton
            label="TypeScript"
            name="language-typescript"
            selected={this.state.show === 'code'}
            onClick={() => this.setState({ show: 'code' })}
          />
          </div>
          <IconButton
            label="HTML"
            name="language-html5"
            selected={this.state.show === 'html'}
            onClick={() => this.setState({ show: 'html' })}
          />
          <IconButton
            label="CSS"
            name="language-css3"
            selected={this.state.show === 'css'}
            onClick={() => this.setState({ show: 'css' })}
          />
          {/*
          <IconButton
            name="content-save"
            onClick={() => this.saveSource(this.state.source)}
          />
          <IconButton
            name="share"
            onClick={() => prompt('Share URL:', this.shareUrl())}
          />
          <IconButton
            name="code-tags-check"
            onClick={() => this.setState({
              semanticValidation: !this.state.semanticValidation,
              syntaxValidation: !this.state.syntaxValidation,
            })}
          />
          */}
        </div>
        <div id="buffers">
          <div className="buffer">
            {show === 'code' && (
              <TypeScriptEditor
                code={this.state.source}
                onChange={(source, transpiled, diagnostics) => this.setState({ source, transpiled: transpiled || '' })}
                diagnosticOptions={{
                  noSemanticValidation: !this.state.semanticValidation,
                  noSyntaxValidation: !this.state.syntaxValidation,
                }}
                definitions={this.state.definitions}
                editorDidMount={() => this.setState({ editorMounted: true })}
              />
            )}
            {show === 'html' && (
              <HTMLEditor
                code={this.state.html}
                onChange={html => this.setState({ html })}
              />
            )}
            {show === 'css' && (
              <CSSEditor
                code={this.state.css}
                onChange={css => this.setState({ css })}
              />
            )}
          </div>
          <div className="buffer">
            {this.state.editorMounted && (
              <iframe
                className="surface"
                srcDoc={getIFrameSource(
                  this.state.transpiled,
                  this.state.css,
                  this.state.html,
                  this.state.dependencies
                )}
                ref={c => {
                  if (!this.c) {
                    this.setState({ editorMounted: true });
                  }
                  this.c = c as Element;
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default App;

interface HTMLEditorProps {
  code?: string;
  editorDidMount?: (editor: monaco.editor.IEditor, mod: typeof monaco) => void;
  onChange?: (code: string) => void;
}

class HTMLEditor extends Component<HTMLEditorProps, void> {
  monaco: typeof monaco;

  editor: monaco.editor.IEditor;

  componentWillMount() {
    this.codeChanged = debounce(this.codeChanged, 500);
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
        language="html"
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

interface CSSEditorProps {
  code?: string;
  editorDidMount?: (editor: monaco.editor.IEditor, mod: typeof monaco) => void;
  onChange?: (code: string) => void;
}

class CSSEditor extends Component<CSSEditorProps, void> {
  monaco: typeof monaco;

  editor: monaco.editor.IEditor;

  componentWillMount() {
    this.codeChanged = debounce(this.codeChanged, 500);
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
