import { h } from 'preact';
import * as path from 'path';
import TreeView from './TreeView';
import Icon from './Icon';
import { Project } from '../utilities';

type FileTree = { [name: string]: FileTreeFile | FileTreeDirectory; };

interface FileTreeNode<T extends string> {
  type: T;
  path: string;
}

interface FileTreeFile extends FileTreeNode<'file'> {
  iconType: string;
  label: string;
}

interface FileTreeDirectory extends FileTreeNode<'directory'> {
  children: FileTree;
}

interface DirectoryTreeItemProps {
  selectedPath?: string;
  directoryPath: string;
  tree: FileTree;
  onClick?: (id: any) => void; // tslint:disable-line no-any
}

const DirectoryTreeItem = ({ directoryPath, tree, onClick, selectedPath }: DirectoryTreeItemProps): JSX.Element => (
  <TreeView
    nodeLabel={directoryPath.substring(directoryPath.lastIndexOf('/') + 1, directoryPath.length)}
    defaultCollapsed={false}
  >
    {/* tslint:disable-next-line no-use-before-declare */}
    <FileTreeFilesView tree={tree} onClick={onClick} selectedPath={selectedPath} />
  </TreeView>
);

interface FileTreeItemProps {
  selected?: boolean;
  filePath: string;
  onClick?: (id: any) => void; // tslint:disable-line no-any
}

const FileTreeItem = ({ filePath, onClick, selected = false }: FileTreeItemProps) => (
  <div
    className={`tree-view_item tree-view_item--clickable ${selected ? 'tree-view_item--selected' : ''}`}
    onClick={() => onClick && onClick(filePath)}
  >
    <Icon name={Project.getDisplayFromFilePath(filePath).iconType} className="sidebar-file-icon" />
    <span>{path.basename(filePath)}</span>
  </div>
);

interface FileTreeFilesViewProps {
  selectedPath?: string;
  tree: FileTree;
  onClick?: (id: any) => void; // tslint:disable-line no-any
}

export const FileTreeFilesView = ({ tree, onClick, selectedPath }: FileTreeFilesViewProps): JSX.Element => {
  const sortedDirectories = Object.keys(tree).filter(filePath => tree[filePath].type === 'directory').sort();
  const sortedFiles = Object.keys(tree).filter(filePath => tree[filePath].type === 'file').sort();
  const sorted = [...sortedDirectories, ...sortedFiles];
  return (
    <div>
      {sorted.map(key => {
        const item = tree[key];
        return tree[key].type === 'file'
          ? <FileTreeItem selected={item.path === selectedPath} filePath={item.path} onClick={onClick} />
          : (
            <DirectoryTreeItem
              selectedPath={selectedPath}
              directoryPath={item.path}
              tree={(item as FileTreeDirectory).children}
              onClick={onClick}
            />
          );
      })}
    </div>
  );
};

function pathsToTree(filePaths: string[]): FileTree {
  const tree: FileTree = {};
  filePaths.forEach(filePath => {
    let fp = filePath.startsWith('.') ? filePath.slice(1) : filePath;
    const parts = fp.split('/');
    var t: FileTree = tree;
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i]) { continue; }
      if (i === parts.length - 1) {
        // console.log(t[parts[i]]);
        t[parts[i]] = {
          type: 'file',
          path: filePath,
          iconType: Project.getDisplayFromFilePath(filePath).iconType,
          label: path.basename(filePath),
        } as FileTreeFile;
      } else {
        t[parts[i]] = t[parts[i]] || {
          type: 'directory',
          path: `.${parts.slice(0, i + 1).join('/')}`,
          children: {}
        } as FileTreeDirectory;
        t = (t[parts[i]] as FileTreeDirectory).children;
      }
    }
  });
  return tree;
}

interface ProjectFilesTreeViewProps {
  className?: string;
  selectedPath?: string;
  filePaths: string[];
  onClick?: (filePath: string) => void;
}

export default ({ className, filePaths, onClick, selectedPath }: ProjectFilesTreeViewProps) => {
  const tree = pathsToTree(filePaths);
  return (
    <div className={className}>
      <FileTreeFilesView
        selectedPath={selectedPath}
        tree={tree}
        onClick={(id: string) => onClick && onClick(id)}
      />
    </div>
  );
};