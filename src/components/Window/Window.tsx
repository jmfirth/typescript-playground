import * as React from 'react';
import { Icon, Menu, Segment, Sidebar } from 'semantic-ui-react';
import './Window.css';

// tslint:disable-next-line no-any
const ActionSidebarMenu = (props: any) => <Menu {...props} size="large" vertical={true} inverted={true}/>;

// tslint:disable-next-line no-any
const ContentSidebarMenu = (props: any) => <Menu {...props} vertical={true} inverted={true} />;

export interface SidebarItem {
  name: string;
  iconName: string;
  component: React.ReactNode;
}

interface Props {
  sidebarVisible?: boolean;
  sidebarItems?: SidebarItem[];
  children?: React.ReactNode;
  directoryTree?: React.ReactNode;
}

interface State {
  sidebarVisible: boolean;
  activeItemName?: string;
}

export class Window extends React.Component<Props, State> {
  state: State = {
    activeItemName: 'Files',
    sidebarVisible: this.props.sidebarVisible || true,
  };

  toggleItem = (itemName: string) => this.setState({
    activeItemName: itemName,
    sidebarVisible: itemName === this.state.activeItemName ? !this.state.sidebarVisible : true,
  })

  toggleSidebar = () => this.setState({ sidebarVisible: !this.state.sidebarVisible });

  render() {
    const { children, sidebarItems } = this.props;
    const { activeItemName, sidebarVisible } = this.state;

    const activeItemMatches = activeItemName && sidebarItems
      ? sidebarItems.filter(i => i.name === activeItemName)
      : [];

    const activeComponent = activeItemMatches.length ? activeItemMatches[0].component : undefined;

    return (
      <Sidebar.Pushable id="window" as={Segment}>
        <Sidebar
          className="action-sidebar"
          as={ActionSidebarMenu}
          animation="push"
          width="very thin"
          direction="left"
          visible={true}
        >
          {sidebarItems && sidebarItems.map((item, i) => (
            <Menu.Item onClick={() => this.toggleItem(item.name)} key={i}>
              <Icon
                className={`${activeItemName === item.name ? 'action-sidebar__selected' : ''}`}
                name={item.iconName} size="large"
              />
            </Menu.Item>
          ))}
        </Sidebar>
        <Sidebar.Pusher>
          <div style={{ height: '100vh' }}>
            <Sidebar.Pushable as={Segment}>
              <Sidebar
                className="content-sidebar"
                as={ContentSidebarMenu}
                animation="push"
                width="wide"
                direction="left"
                visible={sidebarVisible}
              >
                {activeComponent}
              </Sidebar>
              <Sidebar.Pusher>
                {/*<Menu>
                  <Menu.Item onClick={() => this.toggleSidebar()}>
                    <Icon name="content" />
                  </Menu.Item>
                </Menu>*/}
                {children}
              </Sidebar.Pusher>
            </Sidebar.Pushable>
          </div>
        </Sidebar.Pusher>
      </Sidebar.Pushable>
    );
  }
}
