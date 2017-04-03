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
import { Github, Location, Project, Storage } from './utilities';
import * as examples from './examples/index';
import * as Definitions from './definitions';

const LOCAL_STORAGE_PREFIX = 'tspg-app-';
const RECENT = 'recent';

interface WindowProps {
  sidebarOpen?: boolean;
  children?: JSX.Element | JSX.Element[];
  autohideToolbar?: boolean;
}
interface WindowState {
  mouseAtTop: boolean;
}
/*
const Window = ({ autohideToolbar, children, sidebarOpen }: WindowProps) => (
  <div
    id="window"
    className={`${sidebarOpen ? 'sidebar-open' : undefined} ${autohideToolbar ? 'autohide-toolbar' : ''}`}
  >
    {children}
  </div>
);
*/
class Window extends Component<WindowProps, WindowState> {
  state: WindowState = {
    mouseAtTop: false,
  };

  handleMouseMove(e: MouseEvent) {
    if (!this.props.autohideToolbar) { return; }
    if (!this.state.mouseAtTop && e.clientY < 30) {
      this.setState({ mouseAtTop: true });
    } else if (this.state.mouseAtTop && e.clientY > 90) {
      this.setState({ mouseAtTop: false });
    }
  }

  render() {
    const { autohideToolbar, children, sidebarOpen } = this.props;
    const { mouseAtTop } = this.state;
    return (
      <div
        id="window"
        // tslint:disable-next-line max-line-length
        className={`${sidebarOpen ? 'sidebar-open' : ''} ${autohideToolbar ? 'autohide-toolbar' : ''} ${mouseAtTop ? 'autohide-toolbar--show' : ''}`}
        onMouseMove={(e: MouseEvent) => this.handleMouseMove(e)}
      >
        {children}
      </div>
    );
  }
}

interface SimpleContainerProps { children?: JSX.Element | JSX.Element[]; }
// const Sidebar = ({ children }: SimpleContainerProps) => <div id="sidebar">{children}</div>;
const Container = ({ children }: SimpleContainerProps) => <div id="container">{children}</div>;
const Toolbar = ({ children }: SimpleContainerProps) => <div id="toolbar">{children}</div>;
const Buffer = ({ children }: SimpleContainerProps) => <div className="buffer">{children}</div>;

interface BufferProps {
  split?: boolean;
  children?: JSX.Element | JSX.Element[];
}
const Buffers = ({ split, children }: BufferProps) =>
  <div id="buffers" className={split ? 'buffers-split' : undefined}>{children}</div>;

interface State {
  show: string;
  transpiled: string;
  diagnostics: TypeScript.Diagnostic[];
  semanticValidation: boolean;
  syntaxValidation: boolean;
  editorMounted: boolean;
  authenticated: boolean;
  sidebarOpen: boolean;
  autohideToolbar: boolean;
  showCodeFrame: boolean;
  showRenderFrame: boolean;
  user?: Github.GithubAuthenticatedUser;
  project?: Project.Project;
}

class App extends Component<null, State> {
  state: State = {
    show: 'code',
    editorMounted: false,
    transpiled: '',
    diagnostics: [],
    authenticated: false,
    sidebarOpen: false,
    user: undefined,
    project: undefined,
    autohideToolbar: false,
    showRenderFrame: true,
    showCodeFrame: true,
    // This line disables errors in jsx tags like <div>, etc.
    syntaxValidation: false,
    semanticValidation: false,
  };

  async componentWillMount() {
    this.authenticate();
    const gistId = Location.getQueryStringParameter('gistId');
    if (gistId && await this.loadGist(gistId)) { return; }
    this.setState({
      project: Project.createNewProject(
        examples.preact.code,
        examples.preact.html,
        examples.preact.css,
        examples.preact.definitions
      )
    });
  }

  async authenticate() {
    const authenticated = Github.checkAuthentication() || await Github.maybeAuthenticate();
    let user = undefined;
    if (authenticated) { user = await Github.getUser(); }
    this.setState({ authenticated, user });
  }

  loadSource() {
    return Storage.getStorageItem(LOCAL_STORAGE_PREFIX, RECENT);
  }

  saveSource(source: string) {
    Storage.setStorageItem(LOCAL_STORAGE_PREFIX, RECENT, source, moment().add(6, 'months').toDate());
  }

  createNewProject() {
    this.setState({ project: undefined });
    setTimeout(() => this.setState({ project: Project.createNewProject(), transpiled: '' }), 250);
  }

  async loadDefinition() {
    const { project } = this.state;
    if (!project) { return; }
    const moduleName = prompt('Module name', 'react');
    if (!moduleName) { return; }
    // @TODO: helpful defaults!
    const definitions = Definitions.definitionList[moduleName];
    if (definitions) {
      project.definitions = {
        ...project.definitions,
        ...definitions
      };
    } else {
      let definitionUrl: string | void = await Definitions.findDefinition(moduleName);
      const message = definitionUrl
                    ? `Found a definition.  Confirm definition or enter an alternative.`
                    : 'Could not find definition.  Please enter the URL of the definition you wish to add.';
      definitionUrl = prompt(message, definitionUrl || 'https://unpkg.com/@types/react@15.0.20/index.d.ts')
                   || undefined;
      if (!definitionUrl) { return; }
      const lastUrlPart = definitionUrl.substring(definitionUrl.lastIndexOf('/') + 1);
      const matches = lastUrlPart.match(/(.*).d.ts$/);
      const fileName = matches ? matches[1] : 'index';
      project.definitions[`${moduleName}/${fileName}.d.ts`] = definitionUrl;
    }
    this.setState({ project });
  }

  async loadGist(gistId: string) {
    try {
      const gist = await Github.getGist(gistId);
      if (gist) {
        const project = Project.createProjectFromGist(gist);
        if (project) {
          this.setState({ project });
          return true;
        }
      }
      throw new Error();
    } catch (e) { return; }
  }

  saveOrUpdateGist() {
    const { user, project } = this.state;
    if (!user) {
      // @TODO -
      alert('Please copy code, authenticate and repaste.  Sorry, saving before authentication is coming soon.');
    } else if (project && project.ownerId === user.id.toString()) {
      this.updateGist();
    } else {
      this.saveGist();
    }
  }

  async saveGist() {
    try {
      if (!this.state.project) {
        throw new Error('Fatal error: project not found.  Please copy your source and reload.');
      }
      const defaultDescription = 'From TypeScript Playground';
      const description = prompt('Description of gist', defaultDescription) || defaultDescription;
      const gist = await Github.createGist(description, this.state.project.files, this.state.project.definitions);
      if (!gist) {
        throw new Error('Could not create a Gist.  If Github status is fine, we are sorry!  Please file an issue.');
      }
      const project = Project.createProjectFromGist(gist);
      if (!project) {
        throw new Error('Saved Gist was not processable.  Please try again.');
      }
      this.setState({ project });
      prompt('Gist saved', gist.id);
    } catch (e) {
      alert(e.message);
    }
  }

  async updateGist() {
    const { project: current } = this.state;
    try {
      if (!current || !current.id) {
        throw new Error('Fatal error: project not found.  Please copy your source and reload.');
      }
      const gist = await Github.updateGist(current.id, current.description, current.files);
      if (!gist) {
        throw new Error('Could not create a Gist.  If Github status is fine, we are sorry!  Please file an issue.');
      }
      const project = Project.createProjectFromGist(gist);
      if (!project) {
        throw new Error('Saved Gist was not processable.  Please try again.');
      }
      this.setState({ project });
      prompt('Gist updated', gist.id);
    } catch (e) {
      alert(e.message);
    }
  }

  shareUrl() {
    const { project } = this.state;
    const { origin, pathname } = window.location;
    return project ? `${origin}${pathname}?gistId=${project.id}` : `${origin}${pathname}`;
  }

  onDescriptionInput(e: Event) {
    const project = this.state.project;
    if (project) {
      project.description = (e.target as HTMLDivElement).innerText;
      this.setState({ project });
    }
  }

  render() {
    const {
      authenticated, show, sidebarOpen, autohideToolbar, showRenderFrame, showCodeFrame,
      editorMounted, project, semanticValidation, syntaxValidation,
    } = this.state;
    return (
      <Window sidebarOpen={sidebarOpen} autohideToolbar={autohideToolbar}>
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
          <div id="toolbar-container">
            <Toolbar>
              {/*<IconButton
                name="menu"
                onClick={() => this.setState({ sidebarOpen: !sidebarOpen })}
              />*/}
              <div
                className="toolbar-title is-contenteditable"
                contentEditable={true}
                onInput={(e) => this.onDescriptionInput(e)}
              >
                {project && project.description}
              </div>
              <div className="spacer" />
              <IconButton
                tooltip="New Project"
                name="folder-plus"
                onClick={() => this.createNewProject()}
              />
              <IconButton
                tooltip="Add TypeScript Definition"
                name="library-plus"
                onClick={() => this.loadDefinition()}
              />
              {authenticated && (
                <IconButton
                  tooltip="Save Gist"
                  name="folder-upload"
                  onClick={() => this.saveOrUpdateGist()}
                />
              )}
              {project && project.id && (
                <IconButton
                  tooltip="Create Share Link"
                  name="share"
                  onClick={() => prompt('Share URL:', this.shareUrl())}
                />
              )}
              {!authenticated &&
                <IconLink tooltip="Login to Github" name="github-circle" url={Github.GITHUB_OAUTH_URL} />
              }
              {/*<IconButton
                tooltip="Settings"
                name="settings"
                onClick={() => alert('Coming soon: persistent editor, layout, and compiler options!!')}
              />*/}
            </Toolbar>
            <Toolbar>
              {showCodeFrame && (
                <IconButton
                  className="toolbar-tab"
                  label="TypeScript"
                  name="language-typescript"
                  selected={this.state.show === 'code'}
                  onClick={() => this.setState({ show: 'code' })}
                />
              )}
              {showCodeFrame && (
                <IconButton
                  className="toolbar-tab"
                  label="HTML"
                  name="language-html5"
                  selected={this.state.show === 'html'}
                  onClick={() => this.setState({ show: 'html' })}
                />
              )}
              {showCodeFrame && (
                <IconButton
                  className="toolbar-tab"
                  label="CSS"
                  name="language-css3"
                  selected={this.state.show === 'css'}
                  onClick={() => this.setState({ show: 'css' })}
                />
              )}
              <div class="spacer" />
              <IconButton
                tooltip={`${autohideToolbar ? 'Disable' : 'Enable'} toolbar auto-hide`}
                name="arrow-expand-all" // "fullscreen"
                className={autohideToolbar ? 'toolbar-icon--enabled' : undefined}
                onClick={() => showCodeFrame && this.setState({ autohideToolbar: !autohideToolbar})}
              />
              <IconButton
                tooltip={`${showCodeFrame ? 'Hide' : 'Show'} code frame`}
                name="code-tags"
                className={showCodeFrame ? 'toolbar-icon--enabled' : undefined}
                onClick={() => this.setState({
                  showCodeFrame: !showCodeFrame,
                  autohideToolbar: showCodeFrame && showRenderFrame ? false : autohideToolbar,
                })}
              />
              <IconButton
                tooltip={`${showRenderFrame ? 'Hide' : 'Show'} render frame`}
                name="eye-outline"
                className={showRenderFrame ? 'toolbar-icon--enabled' : undefined}
                onClick={() => this.setState({
                  showRenderFrame: !showRenderFrame,
                  autohideToolbar: false
                })}
              />
            </Toolbar>
          </div>
          {project && (
            <Buffers split={showCodeFrame && showRenderFrame}>
              {showCodeFrame && (
                <Buffer>
                  {show === 'code' && (
                    <TypeScriptEditor
                      code={project.files['index.tsx'] ? project.files['index.tsx'].content : ''}
                      onChange={(source, transpiled, diagnostics) => {
                        project.files['index.tsx'] = project.files['index.tsx'] || {};
                        project.files['index.tsx'].content = source;
                        this.setState({ project, transpiled: transpiled || '' });
                      }}
                      diagnosticOptions={{
                        noSemanticValidation: !semanticValidation,
                        noSyntaxValidation: !syntaxValidation,
                      }}
                      definitions={project.definitions}
                      editorDidMount={() => this.setState({ editorMounted: true })}
                    />
                  )}
                  {show === 'html' && (
                    <HTMLEditor
                      code={project.files['index.html'] ? project.files['index.html'].content : ''}
                      onChange={html => {
                        project.files['index.html'] = project.files['index.html'] || {};
                        project.files['index.html'].content = html;
                        this.setState({ project });
                      }}
                    />
                  )}
                  {show === 'css' && (
                    <CSSEditor
                      code={project.files['style.css'] ? project.files['style.css'].content : ''}
                      onChange={css => {
                        project.files['style.css'] = project.files['style.css'] || {};
                        project.files['style.css'].content = css;
                        this.setState({ project });
                      }}
                    />
                  )}
                </Buffer>
              )}
              {showRenderFrame && (
                <Buffer>
                  {editorMounted && project && (
                    <RenderFrame
                      code={this.state.transpiled}
                      html={project.files['index.html'] ? project.files['index.html'].content : ''}
                      css={project.files['style.css'] ? project.files['style.css'].content : ''}
                    />
                  )}
                </Buffer>
              )}
            </Buffers>
          )}
        </Container>
      </Window>
    );
  }
}

export default App;