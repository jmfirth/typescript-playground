import * as path from 'path';
import * as Abilities from './abilities';
import * as Github from './github';
import * as Definitions from '../definitions';

const defaultEditorOptions: monaco.editor.IEditorOptions = {
  lineNumbers: 'on',
  lineNumbersMinChars: 4,
  theme: 'vs-dark', // monokai
  fontSize: Abilities.isMobile() ? 16 : 14,
  // cursorBlinking: 'off',
  automaticLayout: true,
  wrappingIndent: 'same',
  parameterHints: true,
  // formatOnType: true,
  // formatOnPaste: true,
  tabCompletion: true,
  folding: true,
};

export type Definitions = { [path: string]: string; };

export type Modules = { [moduleName: string]: string };

export interface File {
  content: string;
}

export type Files = { [filePath: string]: File };

export class FilesBuilder {
  files: Files = {};

  constructor(files?: Files) {
    if (files) {
      Object.keys(files).forEach(filePath => {
        if (filePath === 'definitions.json' || filePath === 'modules.json') { return; }
        this.files[this.gistToRelativePath(filePath)] = files[filePath];
      });
    }
  }

  gistToRelativePath = (gistPath: string) => `./${gistPath.replace(/___/g, '/')}`;

  toFiles = () => this.files;

  addFile = (fileName: string, content: string = '') => content && (this.files[fileName] = { content });

  removeFile = (fileName: string) => delete this.files[fileName];
}

export abstract class Project {
  public type: string;

  public description: string;

  public definitions: { [key: string]: string };

  public modules: Modules;

  public files: { [path: string]: File };

  public editorOptions: monaco.editor.IEditorOptions;

  constructor(
    type: string = '',
    description: string = '',
    files: Files = {},
    modules: Modules = {},
    definitions: Definitions = {}
  ) {
    this.type = type;
    this.description = description;
    this.files = files;
    this.modules = modules;
    this.definitions = definitions;
    this.editorOptions = defaultEditorOptions;
  }

  public createFile(content: string = ''): File {
    return { content };
  }

  public addFile(filePath?: string) {
    if (!filePath) { return; }
    if (!filePath.startsWith('./')) { filePath = `./${filePath}`; }
    this.files[filePath] = this.createFile();
  }

  public renameFile(oldFilePath?: string, newFilePath?: string) {
    if (!oldFilePath || !newFilePath) { return false; }
    this.files[newFilePath] = this.files[oldFilePath];
    delete this.files[oldFilePath];
    return true;
  }

  // @TODO - fix direct state mutation
  public deleteFile(filePath?: string) {
    if (!filePath) { return false; }
    delete this.files[filePath];
    return true;
  }

  public renameDirectory(oldDirectoryPath?: string, newDirectoryPath?: string) {
    if (!oldDirectoryPath || !newDirectoryPath) { return false; }
    Object.keys(this.files).forEach(filePath => {
      if (filePath.indexOf(oldDirectoryPath) === 0) {
        this.files[filePath.replace(oldDirectoryPath, newDirectoryPath)] = this.files[filePath];
        delete this.files[filePath];
      }
    });
    return true;
  }

  public deleteDirectory(directoryPath?: string) {
    if (!directoryPath) { return false; }
    Object.keys(this.files).forEach(filePath => {
      if (filePath.indexOf(directoryPath) === 0) {
        delete this.files[filePath];
      }
    });
    return true;
  }

  public addModule(moduleName?: string, moduleVersion?: string) {
    if (!moduleName || !moduleVersion) { return false; }
    this.modules[moduleName] = moduleVersion;
    return true;
  }

  public removeModule(moduleName?: string) {
    if (!moduleName) { return false; }
    delete this.modules[moduleName];
    return true;
  }

  public async addDefinition(definitionName?: string) {
    if (!definitionName) { return false; }
    const definitions = Definitions.definitionList[definitionName];
    if (definitions) {
      this.definitions = {
        ...this.definitions,
        ...definitions
      };
    } else {
      let definitionUrl: string | void = await Definitions.findDefinition(definitionName);
      if (!definitionUrl) {
        definitionUrl = prompt(
          'Could not find definition.  Please enter the URL of the definition you wish to add.',
          definitionUrl || 'https://unpkg.com/@types/react@latest/index.d.ts'
        ) || undefined;
      }
      if (definitionUrl) {
        const lastUrlPart = definitionUrl.substring(definitionUrl.lastIndexOf('/') + 1);
        const matches = lastUrlPart.match(/(.*).d.ts$/);
        const fileName = matches ? matches[1] : 'index';
        this.definitions[`${definitionName}/${fileName}.d.ts`] = definitionUrl;
      }
    }
    return true;
  }

  public removeDefinition(definitionFilePath: string) {
    delete this.definitions[definitionFilePath];
    return true;
  }
}

export class LocalProject extends Project {
  constructor(description: string = '', files: Files = {}, modules: Modules = {}, definitions: Definitions = {}) {
    super('local', description, files, modules, definitions);
  }
}

export class GistProject extends Project {
  public gist: Github.Gist;

  constructor(gist: Github.Gist) {
    const description = gist.description;
    const files = new FilesBuilder(gist.files).toFiles();
    const definitions = gist.files['definitions.json']
      ? JSON.parse(gist.files['definitions.json'].content)
      : Definitions.defaults;
    const modules = gist.files['modules.json']
      ? JSON.parse(gist.files['modules.json'].content)
      : {};
    super('gist', description, files, modules, definitions);

    this.gist = gist;
  }
}

export function getDisplayFromFilePath(filePath: string) {
  const extension = path.extname(filePath);
  let editorType = '';
  let iconType = '';
  switch (extension) {
    case '.ts':
    case '.tsx':
      iconType = 'language-typescript';
      editorType = 'code';
      break;
    case '.js':
    case '.jsx':
      iconType = 'language-javascript';
      editorType = 'code';
      break;
    case '.html':
      editorType = 'html';
      iconType = 'language-html5';
      break;
    case '.css':
      editorType = 'css';
      iconType = 'language-css3';
      break;
    case '.definitions':
      editorType = 'definitions';
      iconType = 'code-tags';
      break;
    case '.modules':
      editorType = 'modules';
      iconType = 'code-tags';
      break;
    default:
      editorType = 'code';
      iconType = 'code-tags';
  }
  return { editorType, iconType };
}