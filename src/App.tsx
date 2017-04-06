import { h, Component } from 'preact';
import * as moment from 'moment';
import * as path from 'path';
import {
  Buffer,
  Buffers,
  Container,
  CSSEditor,
  DefinitionsEditor,
  EditorHeader,
  HTMLEditor,
  IconButton,
  IconLink,
  ModulesEditor,
  ProjectFilesTreeView,
  RenderFrame,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  Toolbar,
  TypeScriptEditor,
  Window,
} from './components/index';
import { Abilities, Compiler, Github, Location, Project, Storage } from './utilities';
import * as Examples from './examples/index';
import * as Definitions from './definitions';

const LOCAL_STORAGE_PREFIX = 'tspg-app-';
const RECENT = 'recent';

function compileSource(project: Project.Project) {
  const entry = './index.tsx';
  const sourceFiles = Object.keys(project.files)
    .filter(filePath => Project.getDisplayFromFilePath(filePath).editorType === 'code')
    .map(filePath => Compiler.createEditorSourceFile(filePath, project.files[filePath].content, filePath === entry));
  const configuration = Compiler.createConfiguration(sourceFiles, entry);
  const result = Compiler.compile(configuration.sourceBundle, configuration.compilerOptions);
  if (!result.emitResult.emitSkipped) {
    return result;
  } else {
    // @TODO - handle error
    // console.log('Error compiling source'); // tslint:disable-line no-console
  }
  return null;
}

interface Command {
  combination: any; // tslint:disable-line no-any
  action: () => void;
}

 // tslint:disable-next-line no-any
function createCommand(combination: any, action: () => void): Command {
  return { combination, action };
}

interface State {
  show: string;
  theme: 'light' | 'dark';
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
    theme: 'dark',
    show: './index.tsx',
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
    syntaxValidation: false,
    semanticValidation: false,
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

  createCommands(): Command[] {
    return [
      /* tslint:disable no-bitwise */
      createCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_B,
        () => this.setState({ sidebarOpen: !this.state.sidebarOpen })
      ),
      createCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_B,
        () => this.setState({ sidebarOpen: !this.state.sidebarOpen })
      ),
      createCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_B,
        () => this.setState({ sidebarOpen: !this.state.sidebarOpen })
      ),
      /* tslint:enable no-bitwise */
    ];
  }

  addCodeFile() {
    const { project } = this.state;
    if (!project) { return; }
    let filePath: string | null;
    while (filePath = prompt('Enter the name of a code file.  Please use a ts or tsx extension for now.')) {
      filePath = path.normalize(filePath.replace(/\\/g, '/'));
      const ext = path.extname(filePath);
      if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') { break; }
    }
    if (!filePath) { return; }
    if (!filePath.startsWith('./')) { filePath = `./${filePath}`; }
    project.files[filePath] = Project.createFile();
    this.setState({ project });
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
    const p = { ...project }; // intentional copy
    // @TODO: helpful defaults!
    const definitions = Definitions.definitionList[moduleName];
    if (definitions) {
      p.definitions = {
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

      p.definitions[`${moduleName}/${fileName}.d.ts`] = definitionUrl;
    }
    this.setState({ project: p });
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
      const gist = await Github.createGist(
        description,
        this.state.project.files,
        this.state.project.definitions,
        this.state.project.modules,
      );
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
      const gist = await Github.updateGist(
        current.id,
        current.description,
        current.files,
        current.definitions,
        current.modules
      );
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
      0
    );
  }

  render() {
    const {
      authenticated, show, sidebarOpen, autohideToolbar, showRenderFrame, showCodeFrame,
      editorMounted, project, semanticValidation, syntaxValidation, theme, user
    } = this.state;
    const { editorType, iconType } = Project.getDisplayFromFilePath(show);

    let sidebarHeaderIcon = 'folder';
    if (user && project && project.id === user.id.toString()) {
      sidebarHeaderIcon = 'folder-lock-open';
    } else if (project && project.id) {
      sidebarHeaderIcon = 'folder-lock';
    }

    return (
      <Window sidebarOpen={sidebarOpen} autohideToolbar={autohideToolbar} theme={theme}>
        <div id="sidebar-overlay" onClick={() => this.setState({ sidebarOpen: false })} />
        <Sidebar>
          <Toolbar>
            <IconButton
              tooltip="New Project"
              name="folder-plus"
              onClick={() => this.createNewProject()}
            />
            <IconButton
              tooltip="New File"
              name="file"
              onClick={() => this.addCodeFile()}
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
            <IconButton
              tooltip={`Show ${theme === 'dark' ? 'light' : 'dark'} theme.`}
              name="theme-light-dark"
              onClick={() => {
                if (!project) { return; }
                const p = { ...project };
                p.editorOptions.theme = p.editorOptions.theme === 'vs-dark' ? 'vs-light' : 'vs-dark';
                this.setState({ project: p, theme: theme === 'dark' ? 'light' : 'dark' });
              }}
            />
          </Toolbar>
          <SidebarContent>
            <EditorHeader
              iconType={(
                user && project && project.id === user.id.toString()
                ? 'folder-lock-open'
                : (project && project.id ? 'folder-lock' : 'folder')
              )}
              label={project && project.id || 'local'}
            />
            {project && (
              <ProjectFilesTreeView
                className="sidebar-tree"
                selectedPath={show}
                filePaths={Object.keys(project.files)}
                onClick={(filePath: string) => {
                  this.setState({ show: '' });
                  setTimeout(() => this.setState({ show: filePath }), 0);
                }}
              />
            )}
          </SidebarContent>
          <SidebarFooter>
            <Toolbar>
              <IconButton
                tooltip={`${showCodeFrame ? 'Hide' : 'Show'} code frame`}
                name="code-tags"
                className={showCodeFrame ? 'toolbar-icon--enabled' : undefined}
                onClick={() => {
                  // @TODO - remove this hack
                  if (showRenderFrame) { this.setState({ showRenderFrame: showCodeFrame }); }
                  setTimeout(
                    () => this.setState({
                      showRenderFrame,
                      showCodeFrame: !showCodeFrame,
                      autohideToolbar: showCodeFrame && showRenderFrame ? false : autohideToolbar,
                    }),
                    250
                  );
                }}
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
                tooltip="Manage Modules"
                name="library-plus"
                onClick={() => this.setState({ show: 'project.modules' })}
              />
              <IconButton
                tooltip="Manage TypeScript Definitions"
                name="library-plus"
                onClick={() => this.setState({ show: 'project.definitions' })}
              />
            </Toolbar>
          </SidebarFooter>
        </Sidebar>
        <Container>
          <Toolbar className="toolbar-main">
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
          {project && (
            <Buffers split={showCodeFrame && showRenderFrame}>
              {showCodeFrame && (
                <Buffer>
                  <EditorHeader iconType={iconType} label={show.startsWith('./') ? show.slice(2) : show} />
                  {Object.keys(project.files).map(filePath => {
                    if (show !== filePath) { return; }
                    const display = Project.getDisplayFromFilePath(filePath);
                    let editor: JSX.Element | undefined;
                    switch (display.editorType) {
                      case 'code':
                        editor = (
                          <TypeScriptEditor
                            code={project.files[filePath] ? project.files[filePath].content : ''}
                            onChange={(source) => {
                              project.files[filePath] = project.files[filePath] || {};
                              project.files[filePath].content = source;
                              const result = compileSource(project);
                              if (!result) { return; }
                              this.setState({ project, transpiled: result.source || '' });
                            }}
                            diagnosticOptions={{
                              noSemanticValidation: !semanticValidation,
                              noSyntaxValidation: !syntaxValidation,
                            }}
                            editorOptions={project.editorOptions}
                            definitions={project.definitions}
                            editorDidMount={() => this.setState({ editorMounted: true })}
                          />
                        );
                        break;
                      case 'html':
                        editor = (
                          <HTMLEditor
                            code={project.files[filePath] ? project.files[filePath].content : ''}
                            onChange={html => {
                              project.files[filePath] = project.files[filePath] || {};
                              project.files[filePath].content = html;
                              this.setState({ project });
                            }}
                          />
                        );
                        break;
                      case 'css':
                        editor = (
                          <CSSEditor
                            code={project.files[filePath] ? project.files[filePath].content : ''}
                            onChange={css => {
                              project.files[filePath] = project.files[filePath] || {};
                              project.files[filePath].content = css;
                              this.setState({ project });
                            }}
                          />
                        );
                        break;
                      default:
                        break;
                    }
                    return editor;
                  })}
                  {editorType === 'definitions' && (
                    <DefinitionsEditor
                      definitions={project.definitions}
                      onAddDefinition={() => this.loadDefinition()}
                      onFilePathChanged={(newFilePath, oldFilePath) => {
                        const temp = project.definitions[oldFilePath];
                        delete project.definitions[oldFilePath];
                        project.definitions[newFilePath] = temp;
                        this.setState({ project });
                      }}
                      onUrlChanged={(definitionFilePath, url) => {
                        project.definitions[definitionFilePath] = url;
                        this.setState({ project });
                      }}
                      onRemoveDefinition={(definitionFilePath) => {
                        delete project.definitions[definitionFilePath];
                        this.setState({ project });
                      }}
                    />
                  )}
                  {editorType === 'modules' && (
                    <ModulesEditor
                      modules={project.modules}
                      onAddModule={() => {
                        const moduleName = prompt('Module name:', 'react');
                        if (!moduleName) { return; }
                        const moduleVersion = prompt('Module version:', 'latest');
                        if (!moduleVersion) { return; }
                        const p = { ...project };
                        p.modules[moduleName] = moduleVersion;
                        this.setState({ editorMounted: false });
                        setTimeout(() => this.setState({ project: p, editorMounted: true }), 50);
                      }}
                      onModuleNameChanged={(oldModuleName, newModuleName) => {
                        const p = { ...project };
                        const temp = p.modules[oldModuleName];
                        delete p.modules[oldModuleName];
                        p.modules[newModuleName] = temp;
                        this.setState({ project: p });
                      }}
                      onModuleVersionChanged={(moduleName, moduleVersion) => {
                        const p = { ...project };
                        p.modules[moduleName] = moduleVersion;
                        this.setState({ project: p });
                      }}
                      onRemoveModule={(moduleName) => {
                        const p = { ...project };
                        delete p.modules[moduleName];
                        this.setState({ project: p });
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
                      html={project.files['./index.html'] ? project.files['./index.html'].content : ''}
                      css={project.files['./style.css'] ? project.files['./style.css'].content : ''}
                      modules={project.modules /* {
                        'react': '15.4.2',
                        'react-dom': '15.4.2',
                        'react-router': 'latest',
                        'react-router-dom': 'latest'
                        // 'preact': 'latest',
                        // 'preact-router': 'latest'
                      }*/}
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