import * as React from 'react';
import { Icon } from 'semantic-ui-react';
import { ContextMenuOpenedFunction } from './DirectoryTree';

interface Props {
  name: string;
  filePath: string;
  selected?: boolean;
  onClick?: (filePath: string) => void;
  onContextMenu?: ContextMenuOpenedFunction;
}

const handleContextMenu = (filePath: string, onContextMenu?: ContextMenuOpenedFunction) => (e: MouseEvent) => {
  if (!onContextMenu) { return; }
  e.stopPropagation();
  e.preventDefault();
  onContextMenu('file', e.x, e.y, filePath);
};

const FileNode = ({ name, filePath, selected = false, onClick, onContextMenu }: Props) => (
  <div
    className={`file title ${selected ? 'file--selected' : ''}`}
    onClick={() => onClick && onClick(filePath)}
    onContextMenu={handleContextMenu(filePath, onContextMenu) as any} // tslint:disable-line no-any -- Fix event
  >
    <Icon name="file" /> {name}
  </div>
);

export default FileNode;