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
import TypeScriptEditor from './TypeScriptEditor';
import * as TypeScript from 'typescript';
import * as defaults from './defaults';
import * as lzs from 'lz-string';

function getIFrameSource(source: string, css: string, dependencies: { [key: string]: string }) {
  return `
<html>
  <head>
    <style type="text/css">
      ${css}
    </style>
  </head>
  <body></body>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.3/require.js"></script>
  <script>
    require.config({ paths: ${JSON.stringify(dependencies)} });
    // break the js extension override to load modules with .js extensions
    require.jsExtRegExp = /^#$/;
    ${source}
    require(['entry']);
  </script>
</html>
`;
}

const RECENT_SOURCE = `ts-pg-recent`;

interface State {
  source: string;
  transpiled: string;
  diagnostics: TypeScript.Diagnostic[];
  css: string;
  dependencies: { [key: string]: string };
  definitions: { [key: string]: string };
  semanticValidation: boolean;
  syntaxValidation: boolean;
  editorMounted: boolean;
}

class App extends Component<null, State> {
  state = {
    source: defaults.pixiSource,
    transpiled: '',
    diagnostics: [],
    css: defaults.css,
    dependencies: defaults.dependencies,
    definitions: defaults.definitions,
    // This line disables errors in jsx tags like <div>, etc.
    syntaxValidation: true,
    semanticValidation: true,
    editorMounted: false,
  };

  c: Element;

  componentWillMount() {
    this.setState({ source: this.loadSourceFromUrl() || this.loadSource() || this.state.source });
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
    return (
      <div id="window">
        <div id="toolbar">
          <div
            className="toolbar-item"
            onClick={() => this.saveSource(this.state.source)}
          >
            Save
          </div>
          <div
            className="toolbar-item"
            onClick={() => prompt('Share URL:', this.shareUrl())}
          >
            Share
          </div>
        </div>
        <div id="buffers">
          <div className="buffer">
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
          </div>
          <div className="buffer">
            {this.state.editorMounted &&
            <iframe
              className="surface"
              srcDoc={getIFrameSource(
                this.state.transpiled,
                this.state.css,
                this.state.dependencies
              )}
              ref={c => {
                if (!this.c) {
                  this.setState({ editorMounted: true });
                }
                this.c = c as Element;
              }}
            />}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
