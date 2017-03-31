import { h, Component } from 'preact';
import * as TypeScript from 'typescript';
import * as lzs from 'lz-string';
import * as moment from 'moment';
import {
  CSSEditor,
  HTMLEditor,
  IconButton,
  IconLink,
  RenderFrame,
  TypeScriptEditor,
} from './components/index';
import * as defaults from './defaults';
import { storage, location, github } from './utilities';
import * as examples from './examples/index';
import 'material-design-icons/iconfont/material-icons.css';
import 'mdi/css/materialdesignicons.css';
import 'mdi/fonts/materialdesignicons-webfont.ttf';
import 'mdi/fonts/materialdesignicons-webfont.woff';
import 'mdi/fonts/materialdesignicons-webfont.woff2';

const LOCAL_STORAGE_PREFIX = 'tspg-app-';
const RECENT = 'recent';

interface ContainerProps { children?: JSX.Element | JSX.Element[]; }
const Window = ({ children }: ContainerProps) => <div id="window">{children}</div>;
const Toolbar = ({ children }: ContainerProps) => <div id="toolbar">{children}</div>;
const Buffer = ({ children }: ContainerProps) => <div className="buffer">{children}</div>;
const Buffers = ({ children }: ContainerProps) => <div id="buffers">{children}</div>;

interface State {
  show: string;
  source: string;
  transpiled: string;
  diagnostics: TypeScript.Diagnostic[];
  html: string;
  css: string;
  definitions: { [key: string]: string };
  semanticValidation: boolean;
  syntaxValidation: boolean;
  editorMounted: boolean;
  authenticated: boolean;
}

class App extends Component<null, State> {
  state = {
    show: 'code',
    source: examples.pixijs.code,
    css: examples.pixijs.css,
    html: examples.pixijs.html,
    definitions: defaults.definitions,
    // This line disables errors in jsx tags like <div>, etc.
    syntaxValidation: false,
    semanticValidation: false,
    editorMounted: false,
    transpiled: '',
    diagnostics: [],
    authenticated: false,
  };

  async componentWillMount() {
    this.authenticate();
    this.setState({
      source: this.loadSourceFromUrl() || this.loadSource() || this.state.source
    });
  }

  async authenticate() {
    this.setState({
      authenticated: github.checkAuthentication() || await github.maybeAuthenticate()
    });
  }

  loadSourceFromUrl() {
    const source = location.getQueryStringParameter('source');
    return source ? lzs.decompressFromEncodedURIComponent(source) : undefined;
  }

  loadSource() {
    return storage.getStorageItem(LOCAL_STORAGE_PREFIX, RECENT);
  }

  saveSource(source: string) {
    storage.setStorageItem(LOCAL_STORAGE_PREFIX, RECENT, source, moment().add(6, 'months').toDate());
  }

  shareUrl() {
    const { origin, pathname } = window.location;
    return `${origin}${pathname}?source=${lzs.compressToEncodedURIComponent(this.state.source)}`;
  }

  loadDefinition() {
    // const { show } = this.state;
    const packageName = prompt('Package name', 'react');
    if (!packageName) {
      return;
    }
    const definitionUrl = prompt('Definition url', 'https://unpkg.com/@types/react@15.0.20/index.d.ts');
    if (!definitionUrl) {
      return;
    }
    const definitions = this.state.definitions;
    definitions[`${packageName}.d.ts`] = definitionUrl;
    this.setState({ definitions });
  }

  render() {
    const { show, editorMounted } = this.state;
    return (
      <Window>
        <Toolbar>
          <IconButton
            name="settings"
            onClick={() => alert('Coming soon: persistent editor, layout, and compiler options!!')}
          />
          <IconButton name="content-save" onClick={() => this.saveSource(this.state.source)} />
          <IconButton name="plus" onClick={() => this.loadDefinition()} />
          <IconButton name="share" onClick={() => prompt('Share URL:', this.shareUrl())}/>
          <IconButton
            label="TypeScript"
            name="language-typescript"
            selected={this.state.show === 'code'}
            onClick={() => this.setState({ show: 'code' })}
          />
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
          <div className="spacer" />
          <IconLink name="github-circle" url={github.GITHUB_OAUTH_URL} />
        </Toolbar>
        <Buffers>
          <Buffer>
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
          </Buffer>
          <Buffer>
            {editorMounted && <RenderFrame code={this.state.transpiled} css={this.state.css} html={this.state.html} />}
          </Buffer>
        </Buffers>
      </Window>
    );
  }
}

export default App;