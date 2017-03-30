// import SplitPane from './SplitPane';
/*return (
  <SplitPane split="vertical" primary="second" minSize={50} defaultSize={100}>
    <div>Test</div>
    <div>Test</div>
  </SplitPane>
);*/
// return <Editor />;

/*
interface EditorProps {}

interface EditorState {
  transpiled: string;
  diagnostics: TypeScript.Diagnostic[];
}

class Editor extends Component<EditorProps, EditorState> {
  state = {
    transpiled: '',
    diagnostics: [],
  };

  container: HTMLDivElement;

  updateState(partialState: Partial<EditorState>) {
    this.setState({ ...this.state, ...partialState });
  }

  async transpile(code: string) {
    const diagnostics: TypeScript.Diagnostic[] = [];
    const transpiled = TypeScript.transpile(code, undefined, undefined, diagnostics);
    console.log(transpiled);
    this.updateState({ transpiled, diagnostics });
  }

  editorChanged(code: string, event: monaco.editor.IModelContentChangedEvent2) {
    // debugger;
    this.transpile(code);
  }

  render() {
    const requireConfig = {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.1/require.min.js',
      paths: {
        'vs': 'https://npmcdn.com/monaco-editor@0.8.3/min/vs/',
        // 'preact': 'https://npmcdn.com/preact@7.2.0',
      },
    };

    return (
      <div
        className="window"
        style={{ height: '100vh' }}
      >
        <div className="toolbar">
          <div className="toolbar-item toolbar-item--selected">TypeScript</div>
          <div className="toolbar-item">Strict</div>
          <div className="toolbar-item">Run</div>
        </div>
        <div className="buffers">
          <div className="buffer">
            <MonacoEditor
              width="100%"
              language="typescript"
              defaultValue="// type your code..."
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
              // context={{
              //   window: window,
              //   preact: { render, h, Component },
              //   container: this.container,
              // }}
            />
          </div>
          <div className="buffer">
            <div ref={(container: HTMLDivElement) => { this.container = container; }} />
            <div>
              <pre>
                <code>{this.state.transpiled}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// split (width/2)
// drag (precise)
*/