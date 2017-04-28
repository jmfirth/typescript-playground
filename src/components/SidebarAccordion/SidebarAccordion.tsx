import * as React from 'react';
import { Accordion, Icon } from 'semantic-ui-react';
import './SidebarAccordion.css';

export interface TitleActions {
  iconName: string;
  onClick: () => void;
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface Props {
  children?: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  title?: React.ReactNode;
  titleActions?: TitleActions[];
  onContextMenuOpen?: (x: number, y: number, contextPath: string) => void;
  onContextMenuClose?: () => void;
}

export interface State {
  open: boolean;
  // location?: Coordinate;
}

export default class SidebarAccordion extends React.Component<Props, State> {
  static Content = Accordion.Content;

  static Title = Accordion.Title;

  static defaultProps = {
    titleActions: [] as TitleActions[]
  };

  state: State = {
    open: this.props.defaultOpen || true,
  };

  // handleTitleActionClick(e: MouseEvent, action: () => void) {
  //   e.stopPropagation();
  //   e.preventDefault();
  //   action();
  // }

  componentDidMount() {
    // document.body.addEventListener('click', (e: MouseEvent) => this.setState({ location: undefined }));
    // document.body.addEventListener('contextmenu', (e: MouseEvent) => this.setState({ location: undefined }));
    const { onContextMenuClose } = this.props;
    document.body.addEventListener('click', () => onContextMenuClose && onContextMenuClose());
    document.body.addEventListener('click', () => onContextMenuClose && onContextMenuClose());
  }

  handleTitleActionClick = (action: () => void) => (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    document.body.click();
    action();
  }

  handleContextMenuOpen = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const { onContextMenuOpen } = this.props;
    if (!onContextMenuOpen) { return; }
    onContextMenuOpen(e.screenX, e.y, '/');
  }

  render() {
    const { children, className, title, titleActions = [], ...props } = this.props;
    const { open, /*location*/ } = this.state;

    return (
      <Accordion
        className={`${className || ' '} sidebar-accordion` }
        {...props}
      >
        <Accordion.Title active={open} onClick={() => this.setState({ open: !open })}>
          <div className="sidebar-accordion__title">
            <div className="sidebar-accordion__title-left">
              <Icon name={open ? 'caret down' : 'caret right'} /> {title}
            </div>
            <div className="sidebar-accordion__title-right">
              {titleActions.map(action => (
                <Icon
                  name={action.iconName}
                  onClick={this.handleTitleActionClick(action.onClick)}
                />
              ))}
            </div>
          </div>
        </Accordion.Title>
        <Accordion.Content active={open} onContextMenu={this.handleContextMenuOpen}>
          {children}
          {/*{location && (
            <div style={{ position: 'absolute', top: location.y, left: location.x }}>
              <p>Hi</p>
            </div>
          )}*/}
        </Accordion.Content>
      </Accordion>
    );
  }
}