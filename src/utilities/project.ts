import * as Github from './github';
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
  language: string;
  content: string;
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
      'index.tsx': { content: code } as File,
      'index.html': { content: html } as File,
      'styles.css': { content: css } as File,
    }
  } as Project;
}

export function createProjectFromGist(gist: Github.Gist): Project {
  let files = gist.files;
  const definitions = files['definitions.json'] ? JSON.parse(files['definitions.json'].content) : Definitions.defaults;
  if (definitions) {
    const fb = new Github.GistFilesBuilder(gist.files);
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