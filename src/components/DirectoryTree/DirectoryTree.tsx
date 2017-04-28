import * as path from 'path';
import * as React from 'react';
import { SidebarAccordion } from '../';
import FileNode from './FileNode';
import DirectoryNode from './DirectoryNode';
import { Project } from '../../utilities';
import './DirectoryTree.css';

export interface ContextNode {
  x: number;
  y: number;
  contextPath: string;
  directoryPath: string;
}

export interface Props {
  selectedFilePath?: string;
  files?: Project.Files;
  onClick?: (filePath: string) => void;
  onNewProject?: () => void;
  onAddFile?: (directoryPath: string) => void;
  onRemoveFile?: (filePath: string) => void;
  onRemoveDirectory?: (directoryPath: string) => void;
}

export interface State {
  closedFiles: { [filePath: string]: boolean };
  contextNode?: ContextNode;
}

type ContextMenuOpenedType = 'file' | 'directory';

export type ContextMenuOpenedFunction = (
  type: ContextMenuOpenedType,
  x: number,
  y: number,
  contextPath: string,
) => void;

export default class DirectoryTree extends React.Component<Props, State> {
  state: State = {
    closedFiles: {},
  };

  handleContextMenuOpened = (type: ContextMenuOpenedType, x: number, y: number, contextPath: string) => {
    let directoryPath = type === 'directory' ? contextPath : path.dirname(contextPath);
    directoryPath = directoryPath === '.' ? './' : directoryPath;
    this.setState({ contextNode: { x, y, contextPath, directoryPath } });
  }

  render() {
    const { files = [], selectedFilePath, onClick, onNewProject, onAddFile } = this.props;
    const { contextNode } = this.state;

    const titleActions = [];
    if (onNewProject) { titleActions.push({ iconName: 'fork', onClick: onNewProject }); }
    if (onAddFile) { titleActions.push({ iconName: 'file', onClick: () => onAddFile('./') }); }

    return (
      <div>
        <SidebarAccordion
          className="directory-tree"
          title="Files"
          titleActions={titleActions}
          // onContextMenuOpen={(x, y, contextPath) => { debugger; }}
          // onContextMenuOpen={(x, y, contextPath) =>
          //   this.setState({ contextNode: { x, y, contextPath, directoryPath: } }
          // )}
          onContextMenuClose={() => this.setState({ contextNode: undefined })}
        >
          {createTree('/', pathsToTree(Object.keys(files)), onClick, this.handleContextMenuOpened, selectedFilePath)}
        </SidebarAccordion>
        {contextNode && (
          <div className="vs-dark mac">
          <div className="context-view monaco-menu-container" style={{ top: contextNode.x, left: contextNode.y }}>
            <div className="monaco-menu">
              <div className="monaco-action-bar animated vertical">
                <ul className="actions-container" role="toolbar">
                  <li className="action-item" role="presentation">
                    <a className="action-label">Add File</a>
                  </li>
                  <li className="action-item" role="presentation">
                    <a className="action-label">Remove File</a>
                  </li>
                  <li className="action-item" role="presentation">
                    <a className="action-label">Remove File</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>
    );
  }
}

type Node = string | { [name: string]: Node };

function sortNodes(a: Node, b: Node) {
  /* tslint:disable no-string-literal */
  const isADir = !!a && !!a['attributes'] && !!a['attributes']['filePath'];
  const isBDir = !!b && !!b['attributes'] && !!b['attributes']['filePath'];
  if (isADir && !isBDir) {
    return 1;
  } else if (!isADir && isBDir) {
    return -1;
  } else if (!a || !a['attributes'] || !b || !b['attributes']) {
    return 0;
  } else {
    return a['attributes']['name'] < b['attributes']['name'] ? 1 : -1;
  }
  /* tslint:enable no-string-literal */
}

function createTree(
  name: string,
  node: Node,
  onClick?: (filePath: string) => void,
  onContextMenuOpen?: ContextMenuOpenedFunction,
  selectedFilePath?: string
): React.ReactNode {
  if (name === '/') {
    return Object
      .keys(node)
      .map(n => createTree(n, node[n], onClick, onContextMenuOpen, selectedFilePath))
      .sort(sortNodes);
  } else if (typeof node === 'string') {
    return (
      <FileNode
        name={name}
        filePath={node}
        selected={node === selectedFilePath}
        onClick={onClick}
        onContextMenu={onContextMenuOpen}
      />
    );
  } else {
    return (
      <DirectoryNode
        name={name}
        directoryPath={node['$$directoryPath'] as string} // tslint:disable-line no-string-literal
        onContextMenu={onContextMenuOpen}
      >
        {Object
          .keys(node)
          .filter(n => n.indexOf('$$') === -1) // filter $$directoryPath
          .map(n => createTree(n, node[n], onClick, onContextMenuOpen, selectedFilePath))
          .sort(sortNodes)}
      </DirectoryNode>
    );
  }
}

function pathsToTree(filePaths: string[]) {
  const nodes: Node = {};
  filePaths.forEach(filePath => {
    let fp = filePath.startsWith('.') ? filePath.slice(1) : filePath;
    const parts = fp.split('/');
    let current: Node = nodes;
    let directoryPath = './';
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i]) { continue; }
      if (i === parts.length - 1) {
        current[parts[i]] = filePath;
      } else {
        directoryPath += parts[i];
        current = current[parts[i]] = current[parts[i]] || { $$directoryPath: directoryPath };
      }
    }
  });
  return nodes;
}
