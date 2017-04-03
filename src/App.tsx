import { h, Component } from 'preact';
import * as moment from 'moment';
import {
  Buffer,
  Buffers,
  Container,
  CSSEditor,
  HTMLEditor,
  Icon,
  IconButton,
  IconLink,
  RenderFrame,
  Sidebar,
  Toolbar,
  TypeScriptEditor,
  Window,
} from './components/index';
import { Abilities, Github, Location, Project, Storage } from './utilities';
import * as Examples from './examples/index';
import * as Definitions from './definitions';

const LOCAL_STORAGE_PREFIX = 'tspg-app-';
const RECENT = 'recent';

interface State {
  show: string;
  transpiled: string;
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
    show: 'index.tsx',
    editorMounted: false,
    transpiled: '',
    authenticated: false,
    sidebarOpen: !Abilities.isMobile(),
    user: undefined,
    project: undefined,
    autohideToolbar: false,
    showRenderFrame: true,
    showCodeFrame: true,
    // This line disables errors in jsx tags like <div>, etc.
    syntaxValidation: true,
    semanticValidation: true,
  };

  async componentWillMount() {
    this.authenticate();
    const gistId = Location.getQueryStringParameter('gistId');
    if (gistId && await this.loadGist(gistId)) { return; }
    this.setState({
      project: Project.createNewProject(
        Examples.pixijs.code,
        Examples.pixijs.html,
        Examples.pixijs.css,
        Examples.pixijs.definitions
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
    setTimeout(() => this.setState({ project: Project.createNewProject(), transpiled: '' }), 0);
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
      const description = prompt('Description of gist', this.state.project.description);
      if (!description) { return; }
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
      const gist = await Github.updateGist(current.id, current.description, current.files, current.definitions);
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

  toggleEditorValidations() {
    const { project, semanticValidation } = this.state;
    this.setState({ project: undefined });
    setTimeout(
      () => this.setState({
        project,
        semanticValidation: !semanticValidation,
        syntaxValidation: !semanticValidation,
      }),
      150
    );
  }

  render() {
    const {
      authenticated, show, sidebarOpen, autohideToolbar, showRenderFrame, showCodeFrame,
      editorMounted, project, semanticValidation, syntaxValidation,
    } = this.state;

    const extension = show.substring(show.lastIndexOf('.') + 1);
    let editorType = '';
    switch (extension) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        editorType = 'code';
        break;
      case 'html':
        editorType = 'html';
        break;
      case 'css':
        editorType = 'css';
        break;
      default:
        editorType = 'code';
    }

    return (
      <Window sidebarOpen={sidebarOpen} autohideToolbar={autohideToolbar}>
        <div id="sidebar-overlay" onClick={() => this.setState({ sidebarOpen: false })} />
        <Sidebar>
          <Toolbar>
            <IconButton
              tooltip="New Project"
              name="folder-plus"
              onClick={() => this.createNewProject()}
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
          </Toolbar>
          <div id="sidebar-content">
            <ul className="sidebar-tree">
              <li
                className={`${show === 'index.tsx' ? 'selected' : ''}`}
                onClick={() => this.setState({ show: 'index.tsx' })}
              >
                <Icon name="language-typescript" className="sidebar-file-icon" />
                <span>index.tsx</span>
              </li>
              <li
                className={`${show === 'index.html' ? 'selected' : ''}`}
                onClick={() => this.setState({ show: 'index.html' })}
              >
                <Icon name="language-html5" className="sidebar-file-icon" />
                <span>index.html</span>
              </li>
              <li
                className={`${show === 'style.css' ? 'selected' : ''}`}
                onClick={() => this.setState({ show: 'style.css' })}
              >
                <Icon name="language-css3" className="sidebar-file-icon" />
                <span>style.css</span>
              </li>
            </ul>
          </div>
          <div id="sidebar-footer">
            <Toolbar>
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
              <IconButton
                tooltip={`${semanticValidation ? 'Disable' : 'Enable'} validations`}
                name="code-tags-check"
                className={semanticValidation ? 'toolbar-icon--enabled' : undefined}
                onClick={() => this.toggleEditorValidations()}
              />
              <IconButton
                tooltip="Add TypeScript Definition"
                name="library-plus"
                onClick={() => this.loadDefinition()}
              />
            </Toolbar>
          </div>
        </Sidebar>
        <Container>
          <div id="toolbar-container">
            <Toolbar>
              <IconButton
                name="menu"
                onClick={() => this.setState({ sidebarOpen: !sidebarOpen })}
              />
              <div
                className="toolbar-title is-contenteditable"
                contentEditable={true}
                onInput={(e) => this.onDescriptionInput(e)}
              >
                {project && project.description}
              </div>
              <div className="spacer" />
              <IconButton
                tooltip={`${autohideToolbar ? 'Disable' : 'Enable'} toolbar auto-hide`}
                name="arrow-expand-all" // "fullscreen"
                className={`hide-mobile ${autohideToolbar ? 'toolbar-icon--enabled' : ''}`}
                onClick={() => showCodeFrame && this.setState({ autohideToolbar: !autohideToolbar})}
              />
            </Toolbar>
          </div>
          {project && (
            <Buffers split={showCodeFrame && showRenderFrame}>
              {showCodeFrame && (
                <Buffer>
                  {editorType === 'code' && (
                    <TypeScriptEditor
                      code={project.files[show] ? project.files[show].content : ''}
                      onChange={(source, transpiled, diagnostics) => {
                        project.files[show] = project.files[show] || {};
                        project.files[show].content = source;
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
                  {editorType === 'html' && (
                    <HTMLEditor
                      code={project.files[show] ? project.files[show].content : ''}
                      onChange={html => {
                        project.files[show] = project.files[show] || {};
                        project.files[show].content = html;
                        this.setState({ project });
                      }}
                    />
                  )}
                  {editorType === 'css' && (
                    <CSSEditor
                      code={project.files[show] ? project.files[show].content : ''}
                      onChange={css => {
                        project.files[show] = project.files[show] || {};
                        project.files[show].content = css;
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