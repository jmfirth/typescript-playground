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
}

export interface File {
  content: string;
}

type Files = { [filePath: string]: File };

export function createFile(content: string = ''): File {
  return { content };
}

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
    files: files
  } as Project;
}

// export function createGistDescriptionFromProject(project: Project): Github.GistDescription {
//   return {
//     description: project.description,
//     public: project.public,
//     files: project.files
//   };
// }