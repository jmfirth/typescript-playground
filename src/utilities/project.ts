import * as Github from './github';
import * as defaults from '../defaults';

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
  definitions: { [key: string]: string } = defaults.definitions,
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
      'index.tsx': code ? { content: code } as File : undefined,
      'index.html': html ? { content: html } as File : undefined,
      'styles.css': css ? { content: css } as File : undefined,
    }
  } as Project;
}

export function createProjectFromGist(gist: Github.Gist): Project {
  let files = gist.files;
  const definitions = files['definitions.json'] ? JSON.parse(files['definitions.json'].content) : defaults.definitions;
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