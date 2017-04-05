import * as path from 'path';
import * as Abilities from './abilities';
import * as Github from './github';
// import * as Compiler from './compiler';
import * as Definitions from '../definitions';

export interface Project {
  type: 'local' | 'gist';
  id?: string;
  ownerId?: string;
  description: string;
  public: boolean;
  definitions: { [key: string]: string };
  files: { [path: string]: File };
  editorOptions: monaco.editor.IEditorOptions;
}

export interface File {
  content: string;
}

type Files = { [filePath: string]: File };

export function createFile(content: string = ''): File {
  return { content };
}

const defaultEditorOptions: monaco.editor.IEditorOptions = {
  lineNumbers: 'on',
  lineNumbersMinChars: 3,
  theme: 'vs-dark', // monokai
  fontSize: Abilities.isMobile() ? 16 : 13,
  // cursorBlinking: 'off',
  automaticLayout: true,
  wrappingIndent: 'same',
  parameterHints: true,
  // formatOnType: true,
  // formatOnPaste: true,
  tabCompletion: true,
  folding: true,
};

export function createNewProject(
  code: string = '',
  html: string = '',
  css: string = '',
  definitions: Definitions.Definitions = Definitions.defaults,
  isPublic: boolean = true,
): Project {
  return {
    type: 'local',
    id: undefined,
    ownerId: undefined,
    description: 'TypeScript Playground Project',
    public: isPublic,
    definitions,
    files: {
      './index.tsx': createFile(code),
      './index.html': createFile(html),
      './style.css': createFile(css),
    },
    editorOptions: defaultEditorOptions,
  } as Project;
}

export class FilesBuilder {
  files: Files = {};

  constructor(files?: Files) {
    if (files) {
      Object.keys(files).forEach(filePath => {
        if (filePath === 'definitions.json') { return; }
        this.files[gistToRelativePath(filePath)] = files[filePath];
      });
    }
  }

  toFiles = () => this.files;

  addFile = (fileName: string, content: string = '') => content && (this.files[fileName] = { content });

  removeFile = (fileName: string) => delete this.files[fileName];
}

function gistToRelativePath(gistPath: string) {
  return `./${gistPath.replace(/___/g, '/')}`;
}

export function createProjectFromGist(gist: Github.Gist): Project {
  let files = gist.files;
  const definitions = files['definitions.json'] ? JSON.parse(files['definitions.json'].content) : Definitions.defaults;
  if (definitions) {
    const fb = new FilesBuilder(gist.files);
    fb.removeFile('definitions.json');
    files = fb.toFiles();
  }
  return {
    type: 'gist',
    id: gist.id,
    ownerId: gist.owner.id ? gist.owner.id.toString() : undefined,
    description: gist.description,
    definitions,
    public: gist.public,
    files: files,
    editorOptions: defaultEditorOptions,
  } as Project;
}

// export function createGistDescriptionFromProject(project: Project): Github.GistDescription {
//   return {
//     description: project.description,
//     public: project.public,
//     files: project.files
//   };
// }

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
    default:
      editorType = 'code';
      iconType = 'code-tags';
  }
  return { editorType, iconType };
}