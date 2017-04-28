import * as React from 'react';
import * as moment from 'moment';
import { Dimmer, Loader } from 'semantic-ui-react';
import {
  Buffer,
  Dependencies,
  DirectoryTree,
  Editors,
  ExamplesMenu,
  GithubMenu,
  RenderFrame,
  SettingsMenu,
  SplitPane,
  Window,
} from './components';
import { Abilities, Compiler, Github, Location, Project, Storage } from './utilities';
import './App.css';

const { CSSEditor, HTMLEditor, TypeScriptEditor } = Editors;

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
  addressUrl: string;
  theme: 'light' | 'dark';
  transpiled?: string;
  editorMounted: boolean;
  sidebarOpen: boolean;
  autohideToolbar: boolean;
  showCodeFrame: boolean;
  showRenderFrame: boolean;
  renderFrameLoading: boolean;
  // github
  authenticated: boolean;
  user?: Github.GithubAuthenticatedUser;
  // project
  project?: Project.Project;
  semanticValidation: boolean;
  syntaxValidation: boolean;
  // dialogs
  dialog?: 'file-rename' | 'file-remove' | 'file-create' | 'directory-rename' | 'directory-remove';
  dialogPath?: string;
}

class App extends React.Component<{}, State> {
  state: State = {
    theme: 'dark',
    show: './index.tsx',
    addressUrl: './index.html',
    editorMounted: false,
    transpiled: undefined,
    authenticated: false,
    sidebarOpen: !Abilities.isMobile(),
    user: undefined,
    project: undefined,
    autohideToolbar: false,
    showRenderFrame: true,
    renderFrameLoading: true,
    showCodeFrame: true,
    // This line disables errors in jsx tags like <div>, etc.
    syntaxValidation: false,
    semanticValidation: false,
    dialog: undefined,
    dialogPath: undefined,
  };

  project: Project.Project | void;

  async componentWillMount() {
    this.authenticate();
    const gistId = Location.getQueryStringParameter('gistId');
    if (gistId && await this.loadGist(gistId)) { return; }
    const fb = new Project.FilesBuilder();
    fb.addFile('./index.html', ' ');
    fb.addFile('./index.tsx', ' ');
    fb.addFile('./style.css', ' ');
    this.project = new Project.LocalProject('New Project', fb.toFiles());
    // debugger;
    this.forceUpdate();
    window.addEventListener('resize', () => this.forceUpdate());
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
      /* tslint:enable no-bitwise */
    ];
  }

  showFile(filePath: string) {
    this.setState({ show: '' });
    setTimeout(() => this.setState({ show: filePath }), 0);
  }

  // showFileCreateDialog(dialogPath: string) {
  //   this.setState({ dialog: 'file-create', dialogPath });
  // }

  // showFileRenameDialog(dialogPath: string) {
  //   this.setState({ dialog: 'file-rename', dialogPath });
  // }

  // showFileRemoveDialog(dialogPath: string) {
  //   this.setState({ dialog: 'file-remove', dialogPath });
  // }

  // showDirectoryRenameDialog(dialogPath: string) {
  //   this.setState({ dialog: 'directory-rename', dialogPath });
  // }

  // showDirectoryRemoveDialog(dialogPath: string) {
  //   this.setState({ dialog: 'directory-remove', dialogPath });
  // }

  // closeDialog() {
  //   this.setState({ dialog: undefined, dialogPath: undefined });
  // }

  // @TODO - fix direct state mutation
  addFile(filePath?: string) {
    if (this.project && this.project.addFile(filePath)) {
      this.forceUpdate();
    }
  }

  // @TODO - fix direct state mutation
  renameFile(oldFilePath?: string, newFilePath?: string) {
    if (this.project && this.project.renameFile(oldFilePath, newFilePath)) {
      this.forceUpdate();
    }
  }

  // @TODO - fix direct state mutation
  deleteFile(filePath?: string) {
    if (this.project && this.project.deleteFile(filePath)) {
      this.forceUpdate();
    }
  }

  // @TODO - fix direct state mutation
  renameDirectory(oldDirectoryPath?: string, newDirectoryPath?: string) {
    if (this.project && this.project.renameDirectory(oldDirectoryPath, newDirectoryPath)) {
      this.forceUpdate();
    }
  }

  // @TODO - fix direct state mutation
  deleteDirectory(directoryPath: string) {
    if (this.project && this.project.deleteDirectory(directoryPath)) {
      this.forceUpdate();
    }
  }

  createNewProject() {
    const fb = new Project.FilesBuilder();
    fb.addFile('./index.html', ' ');
    fb.addFile('./index.tsx', ' ');
    fb.addFile('./style.css', ' ');
    this.project = new Project.LocalProject('New Project', fb.toFiles());
    this.setState({ show: '', transpiled: '' });
    setTimeout(() => this.setState({ show: './index.tsx', transpiled: ' ' }), 0);
  }

  async addModule(moduleName: string, moduleVersion: string) {
    if (this.project
     && this.project.addModule(moduleName, moduleVersion)
     && await this.project.addDefinition(moduleName)) {
      this.setState({ editorMounted: false });
      setTimeout(() => this.setState({ editorMounted: true }), 50);
    }
  }

  removeModule(moduleName: string) {
    if (this.project && this.project.removeModule(moduleName)) {
      this.setState({ editorMounted: false });
      setTimeout(() => this.setState({ editorMounted: true }), 50);
    }
  }

  async addDefinition(definitionName: string) {
    if (this.project && await this.project.addDefinition(definitionName)) {
      this.forceUpdate();
    }
  }

  removeDefinition(definitionFilePath: string) {
    if (this.project && this.project.removeDefinition(definitionFilePath)) {
      this.forceUpdate();
    }
  }

  async loadGist(gistId: string) {
    try {
      const gist = await Github.getGist(gistId);
      if (!gist) { throw new Error('Could not load Gist.'); }
      this.project = new Project.GistProject(gist);
      this.forceUpdate();
      return true;
    } catch (e) { return; }
  }

  saveOrUpdateGist() {
    const { user } = this.state;
    if (!user) {
      // @TODO -
      alert('Please copy code, authenticate and repaste.  Sorry, saving before authentication is coming soon.');
    } else if (this.project instanceof Project.GistProject && this.project.gist.owner.id === user.id) {
      this.updateGist();
    } else {
      this.saveGist();
    }
  }

  async saveGist() {
    try {
      if (!this.project || this.project instanceof Project.GistProject) {
        throw new Error('Fatal error.');
      }
      const description = prompt('Description of gist', this.project.description);
      const gist = await Github.createGist(
        description || '',
        this.project.files,
        this.project.definitions,
        this.project.modules,
      );
      if (!gist) {
        throw new Error('Could not create a Gist.  If Github status is fine, we are sorry!  Please file an issue.');
      }
      this.project = new Project.GistProject(gist);
      this.forceUpdate();
      prompt('Gist saved', gist.id);
    } catch (e) {
      alert(e.message);
    }
  }

  async updateGist() {
    try {
      if (!(this.project instanceof Project.GistProject)) {
        throw new Error('Fatal error.');
      }
      const gist = await Github.updateGist(
        this.project.gist.id,
        this.project.description,
        this.project.files,
        this.project.definitions,
        this.project.modules
      );
      if (!gist) {
        throw new Error('Could not create a Gist.  If Github status is fine, we are sorry!  Please file an issue.');
      }
      this.project = new Project.GistProject(gist);
      this.forceUpdate();
      prompt('Gist updated', gist.id);
    } catch (e) {
      alert(e.message);
    }
  }

  shareUrl() {
    const { origin, pathname } = window.location;
    return this.project instanceof Project.GistProject
      ? `${origin}${pathname}?gistId=${this.project.gist.id}`
      : `${origin}${pathname}`;
  }

  setProjectDescription(description: string = '') {
    if (this.project) {
      this.project.description = description;
      this.forceUpdate();
    }
  }

  toggleEditorValidations() {
    const { semanticValidation } = this.state;
    setTimeout(
      () => this.setState({
        semanticValidation: !semanticValidation,
        syntaxValidation: !semanticValidation,
      }),
      0
    );
  }

  renderFrameAddressChanged = (addressUrl: string) => {
    if (addressUrl && this.project && this.project.files[addressUrl]) {
      this.setState({ addressUrl });
    }
  }

  renderFrameRefreshClicked = () => {
    const { addressUrl } = this.state;
    this.setState({ addressUrl: '' });
    setTimeout(() => this.setState({ addressUrl }));
  }

  renderFrameHomeClicked = () => {
    this.setState({ addressUrl: '' });
    setTimeout(() => this.setState({ addressUrl: './index.html' }));
  }

  render() {
    const {
      show, showRenderFrame, showCodeFrame, renderFrameLoading, addressUrl, // autohideToolbar, sidebarOpen,
      /*editorMounted, project,*/ semanticValidation, syntaxValidation, user, // authenticated, // theme,
      // dialog, dialogPath,
    } = this.state;

    const renderFrameIsLoading = !(this.project && typeof this.state.transpiled !== 'undefined') || renderFrameLoading;

    const sidebarItems = [
      {
        name: 'Login',
        iconName: 'github',
        component: <GithubMenu user={user} onSaveOrUpdate={() => this.saveOrUpdateGist()} />
      },
      {
        name: 'Files',
        iconName: 'folder',
        component: this.project
          ? (
            <DirectoryTree
              selectedFilePath={show}
              files={this.project.files}
              onClick={filePath => this.showFile(filePath)}
              onNewProject={() => this.createNewProject()}
              onAddFile={directoryPath => this.addFile(prompt('Add a new file:', directoryPath) || undefined)}
            />
          )
          : <div />,
      },
      // { name: 'Search', iconName: 'search', component: <div>Search</div> },
      {
        name: 'Dependencies',
        iconName: 'cubes',
        component: this.project
          ? (
            <Dependencies
              modules={this.project.modules}
              definitions={this.project.definitions}
              onAddModule={(moduleName, moduleVersion) => this.addModule(moduleName, moduleVersion)}
              onRemoveModule={moduleName => this.removeModule(moduleName)}
              onAddDefinition={definitionName => this.addDefinition(definitionName)}
              onRemoveDefinition={definitionFilePath => this.removeDefinition(definitionFilePath)}
            />
          )
          : <div />,
      },
      {
        name: 'Examples',
        iconName: 'lab',
        component: <ExamplesMenu />,
      },
      {
        name: 'Settings',
        iconName: 'settings',
        component: <SettingsMenu />,
      }
    ];

    return (
      <Window sidebarItems={sidebarItems} sidebarVisible={this.state.sidebarOpen}>
        <SplitPane
          className={`${!showCodeFrame ? 'hideLeft' : ''} ${!showRenderFrame ? 'hideRight' : ''}`}
          minSize={showCodeFrame && showRenderFrame ? '50%' : '100%'}
          split={window.innerWidth < window.innerHeight ? 'horizontal' : 'vertical'}
        >
          {showCodeFrame && (
            <Buffer>
              {this.project && Object.keys(this.project.files).map(filePath => {
                if (show !== filePath || !this.project) { return; }
                const display = Project.getDisplayFromFilePath(filePath);
                let editor: JSX.Element | undefined;
                switch (display.editorType) {
                  case 'code':
                    editor = (
                      <TypeScriptEditor
                        code={this.project.files[filePath] ? this.project.files[filePath].content : ''}
                        onChange={(source) => {
                          if (!this.project) { return; }
                          this.project.files[filePath] = this.project.files[filePath] || {};
                          this.project.files[filePath].content = source;
                          const result = compileSource(this.project);
                          this.setState({ transpiled: result ? result.source : '' });
                        }}
                        diagnosticOptions={{
                          noSemanticValidation: !semanticValidation,
                          noSyntaxValidation: !syntaxValidation,
                        }}
                        editorOptions={this.project.editorOptions}
                        definitions={this.project.definitions}
                        editorDidMount={() => this.setState({ editorMounted: true })}
                      />
                    );
                    break;
                  case 'html':
                    editor = (
                      <HTMLEditor
                        code={this.project.files[filePath] ? this.project.files[filePath].content : ''}
                        onChange={html => {
                          if (!this.project) { return; }
                          this.project.files[filePath] = this.project.files[filePath] || {};
                          this.project.files[filePath].content = html;
                          this.forceUpdate();
                        }}
                      />
                    );
                    break;
                  case 'css':
                    editor = (
                      <CSSEditor
                        code={this.project.files[filePath] ? this.project.files[filePath].content : ''}
                        onChange={css => {
                          if (!this.project) { return; }
                          this.project.files[filePath] = this.project.files[filePath] || {};
                          this.project.files[filePath].content = css;
                          this.forceUpdate();
                        }}
                      />
                    );
                    break;
                  default:
                    break;
                }
                return editor;
              })}
            </Buffer>
          )}
          {showRenderFrame && (
            <Buffer>
              <Dimmer.Dimmable dimmed={renderFrameIsLoading}>
                <Dimmer active={renderFrameIsLoading} />
                <Loader active={renderFrameIsLoading} />
                {this.project && typeof this.state.transpiled !== 'undefined' && addressUrl && (
                  <RenderFrame
                    url={addressUrl}
                    code={this.state.transpiled}
                    html={this.project.files[addressUrl] ? this.project.files[addressUrl].content : ''}
                    css={this.project.files['./style.css'] ? this.project.files['./style.css'].content : ''}
                    modules={this.project.modules}
                    onLoading={() => this.setState({ renderFrameLoading: true })}
                    onLoaded={() => this.setState({ renderFrameLoading: false })}
                    onAddressChange={this.renderFrameAddressChanged}
                    onRefreshClicked={this.renderFrameRefreshClicked}
                    onHomeClicked={this.renderFrameHomeClicked}
                  />
                )}
              </Dimmer.Dimmable>
            </Buffer>
          )}
        </SplitPane>
      </Window>
    );
  }
}

export default App;
