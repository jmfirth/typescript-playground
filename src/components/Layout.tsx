import { h, Component } from 'preact';

interface WindowProps {
  sidebarOpen?: boolean;
  children?: JSX.Element | JSX.Element[];
  autohideToolbar?: boolean;
}

interface WindowState {
  mouseAtTop: boolean;
}

export class Window extends Component<WindowProps, WindowState> {
  state: WindowState = {
    mouseAtTop: false,
  };

  handleMouseMove(e: MouseEvent) {
    if (!this.props.autohideToolbar) { return; }
    if (!this.state.mouseAtTop && e.clientY < 30) {
      this.setState({ mouseAtTop: true });
    } else if (this.state.mouseAtTop && e.clientY > 90) {
      this.setState({ mouseAtTop: false });
    }
  }

  render() {
    const { autohideToolbar, children, sidebarOpen } = this.props;
    const { mouseAtTop } = this.state;
    return (
      <div
        id="window"
        // tslint:disable-next-line max-line-length
        className={`${sidebarOpen ? 'sidebar-open' : ''} ${autohideToolbar ? 'autohide-toolbar' : ''} ${mouseAtTop ? 'autohide-toolbar--show' : ''}`}
        onMouseMove={(e: MouseEvent) => this.handleMouseMove(e)}
      >
        {children}
      </div>
    );
  }
}

interface SimpleContainerProps { children?: JSX.Element | JSX.Element[]; }

export const Sidebar = ({ children }: SimpleContainerProps) => <div id="sidebar">{children}</div>;
export const Container = ({ children }: SimpleContainerProps) => <div id="container">{children}</div>;
export const Toolbar = ({ children }: SimpleContainerProps) => <div id="toolbar">{children}</div>;
export const Buffer = ({ children }: SimpleContainerProps) => <div className="buffer">{children}</div>;

interface BufferProps {
  split?: boolean;
  children?: JSX.Element | JSX.Element[];
}

export const Buffers = ({ split, children }: BufferProps) =>
  <div id="buffers" className={split ? 'buffers-split' : undefined}>{children}</div>;