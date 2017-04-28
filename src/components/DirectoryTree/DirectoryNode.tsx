import * as React from 'react';
import { Accordion, Icon } from 'semantic-ui-react';
import { ContextMenuOpenedFunction } from './DirectoryTree';

interface Props {
  name: string;
  directoryPath: string;
  defaultClosed?: boolean;
  children?: React.ReactNode;
  onContextMenu?: ContextMenuOpenedFunction;
}

interface State {
  closed?: boolean;
}

export default class DirectoryNode extends React.Component<Props, State> {
  state: State = {
    closed: !!this.props.defaultClosed,
  };

  toggleClosed = () => this.setState({ closed: !this.state.closed });

  handleContextMenu = (e: MouseEvent) => {
    const { directoryPath, onContextMenu } = this.props;
    if (!onContextMenu) { return; }
    e.stopPropagation();
    e.preventDefault();
    onContextMenu('directory', e.screenX, e.y, directoryPath);
  }

  render() {
    const { name, children } = this.props;
    const { closed } = this.state;

    return (
      <Accordion className="directory-subtree">
        <Accordion.Title
          active={true}
          onClick={this.toggleClosed}
          onContextMenu={this.handleContextMenu}
        >
          <Icon name={!closed ? 'caret down' : 'caret right'} />
          <Icon name="folder" />
          {name}
        </Accordion.Title>
        <Accordion.Content active={!closed}>
          {children}
        </Accordion.Content>
      </Accordion>
    );
  }
}