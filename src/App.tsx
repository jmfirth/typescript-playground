import { h, Component } from 'preact';
import * as TypeScript from 'typescript';
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

const LOCAL_STORAGE_PREFIX = 'tspg-app-';
const RECENT = 'recent';

interface WindowProps {
  sidebarOpen?: boolean;
  children?: JSX.Element | JSX.Element[];
}
const Window = ({ children, sidebarOpen }: WindowProps) => (
  <div id="window" className={sidebarOpen ? 'sidebar-open' : undefined}>
    {children}
  </div>
);

interface SimpleContainerProps { children?: JSX.Element | JSX.Element[]; }
// const Sidebar = ({ children }: SimpleContainerProps) => <div id="sidebar">{children}</div>;
const Container = ({ children }: SimpleContainerProps) => <div id="container">{children}</div>;
const Toolbar = ({ children }: SimpleContainerProps) => <div id="toolbar">{children}</div>;
const Buffer = ({ children }: SimpleContainerProps) => <div className="buffer">{children}</div>;
const Buffers = ({ children }: SimpleContainerProps) => <div id="buffers">{children}</div>;

// interface Project {
//   type: 'local' | 'string';
//   id?: string;
//   description: string;
//   public: boolean;
//   files: { [path: string]: File };
// }

// interface File {
//   language: string;
//   content: string;
// }

// function createEmptyWebProject(code: string = '', html: string = '', css: string = ''): Project {
//   return {
//     type: 'local',
//     id: undefined,
//     description: 'TypeScript Playground web project',
//     public: true,
//     files: {
//       'index.tsx': { language: 'typescript', content: code } as File,
//       'index.html': { language: 'html', content: html } as File,
//       'styles.css': { language: 'css', content: css } as File,
//     }
//   } as Project;
// }

// function createProjectFromGist(gist: github.Gist): Project {
//   return {
//     description: gist.description,
//     public: gist.public,
//     files: gist.files
//   } as Project;
// }

// function createGistDescriptionFromProject(project: Project): github.GistDescription {
//   return {
//     description: project.description,
//     public: project.public,
//     files: project.files
//   } as GistDescription;
// }

interface State {
  loaded: boolean;
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
  sidebarOpen: boolean;
  user?: github.GithubAuthenticatedUser;
  gist?: github.Gist;
}

class App extends Component<null, State> {
  state: State = {
    loaded: false,
    show: 'code',
    source: '',
    css: '',
    html: '',
    definitions: defaults.definitions,
    // This line disables errors in jsx tags like <div>, etc.
    syntaxValidation: false,
    semanticValidation: false,
    editorMounted: false,
    transpiled: '',
    diagnostics: [],
    authenticated: false,
    sidebarOpen: false,
    user: undefined,
    gist: undefined,
  };

  async componentWillMount() {
    this.authenticate();
    const gistId = location.getQueryStringParameter('gistId');
    if (gistId && await this.loadGist(gistId)) {
      return;
    }
    // default
    this.setState({
      loaded: true,
      source: examples.preact.code,
      css: examples.preact.css,
      html: examples.preact.html,
    });
  }

  async authenticate() {
    const authenticated = github.checkAuthentication() || await github.maybeAuthenticate();
    let user = undefined;
    if (authenticated) {
      user = await github.getUser();
      // debugger;
    }
    this.setState({ authenticated, user });
  }

  loadSource() {
    return storage.getStorageItem(LOCAL_STORAGE_PREFIX, RECENT);
  }

  saveSource(source: string) {
    storage.setStorageItem(LOCAL_STORAGE_PREFIX, RECENT, source, moment().add(6, 'months').toDate());
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

  async loadGist(gistId: string) {
    try {
      const gist = await github.getGist(gistId);
      if (gist) {
        const source = gist.files['index.tsx'] ? gist.files['index.tsx'].content : '';
        const css = gist.files['style.css'] ? gist.files['style.css'].content : '';
        const html = gist.files['index.html'] ? gist.files['index.html'].content : '';
        if (source || css || html) {
          this.setState({ loaded: true, html, css, source, gist });
          return true;
        }
      }
      throw new Error();
    } catch (e) {
      return;
    }
  }

  saveOrUpdateGist() {
    if (!this.state.user) {
      // @TODO -
      alert('Please copy code, authenticate and repaste.  Sorry, saving before authentication is coming soon.');
    } else if (this.state.gist && this.state.gist.owner.id === this.state.user.id) {
      this.updateGist();
    } else {
      this.saveGist();
    }
  }

  async saveGist() {
    const defaultDescription = 'From TypeScript Playground';
    const description = prompt('Description of gist', defaultDescription) || defaultDescription;
    const fb = new github.GistFilesBuilder();
    fb.addFile('index.tsx', this.state.source);
    fb.addFile('style.css', this.state.css);
    fb.addFile('index.html', this.state.html);
    const gist = await github.createGist(description, fb.toFiles());
    if (gist) {
      this.setState({ gist });
      prompt('Gist saved', gist.id);
    } else {
      alert('Error saving gist');
    }
  }

  async updateGist() {
    const { gist } = this.state;
    if (gist) {
      const description = prompt('Description of gist', gist.description) || gist.description;
      const fb = new github.GistFilesBuilder();
      fb.addFile('index.tsx', this.state.source);
      fb.addFile('style.css', this.state.css);
      fb.addFile('index.html', this.state.html);
      const updated = await github.updateGist(gist.id, description, fb.toFiles());
      if (updated) {
        this.setState({ gist: updated });
        prompt('Gist updated', gist.id);
      } else {
        alert('Error updating gist');
      }
    }
  }

  shareUrl() {
    const { gist } = this.state;
    const { origin, pathname } = window.location;
    return gist ? `${origin}${pathname}?gistId=${gist.id}` : `${origin}${pathname}`;
  }

  render() {
    const { loaded, show, editorMounted } = this.state;
    return (
      <Window sidebarOpen={this.state.sidebarOpen}>
        {/*<Sidebar>
          <Toolbar>
            <div className="toolbar-title">Explorer</div>
          </Toolbar>
          <Toolbar>
            <IconButton
              name="menu"
              onClick={() => alert('Coming soon: persistent editor, layout, and compiler options!!')}
            />
          </Toolbar>
          <div id="sidebar-content" />
        </Sidebar>*/}
        <Container>
          <Toolbar>
            {/*<IconButton
              name="menu"
              onClick={() => this.setState({ sidebarOpen: !this.state.sidebarOpen })}
            />*/}
            <div className="spacer" />
            <IconButton name="content-save" onClick={() => this.saveOrUpdateGist()} />
            <IconButton name="plus" onClick={() => this.loadDefinition()} />
            <IconButton name="share" onClick={() => prompt('Share URL:', this.shareUrl())}/>
            <IconButton
              name="settings"
              onClick={() => alert('Coming soon: persistent editor, layout, and compiler options!!')}
            />
            <IconLink name="github-circle" url={github.GITHUB_OAUTH_URL} />
          </Toolbar>
          <Toolbar>
            <IconButton
              className="toolbar-tab"
              label="TypeScript"
              name="language-typescript"
              selected={this.state.show === 'code'}
              onClick={() => this.setState({ show: 'code' })}
            />
            <IconButton
              className="toolbar-tab"
              label="HTML"
              name="language-html5"
              selected={this.state.show === 'html'}
              onClick={() => this.setState({ show: 'html' })}
            />
            <IconButton
              className="toolbar-tab"
              label="CSS"
              name="language-css3"
              selected={this.state.show === 'css'}
              onClick={() => this.setState({ show: 'css' })}
            />
          </Toolbar>
          {loaded && (
            <Buffers>
              <Buffer>
                {show === 'code' && (
                  <TypeScriptEditor
                    code={this.state.source}
                    onChange={(source, transpiled, diagnostics) =>
                      this.setState({ source, transpiled: transpiled || '' })
                    }
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
                {editorMounted &&
                  <RenderFrame code={this.state.transpiled} css={this.state.css} html={this.state.html} />
                }
              </Buffer>
            </Buffers>
          )}
        </Container>
      </Window>
    );
  }
}

export default App;