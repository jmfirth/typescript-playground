import { h, Component } from 'preact';

interface Props<T> {
  id?: T;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  nodeLabel: Element | string | number;
  className?: string;
  itemClassName?: string;
  onClick?: (id?: T) => void;
}

interface State {
  collapsed: boolean;
}

// tslint:disable-next-line no-any
export default class TreeView extends Component<Props<any>, State> {
  // tslint:disable-next-line no-any
  constructor(props: Props<any>) {
    super(props);
    this.state = {
      collapsed: this.props.defaultCollapsed || false
    };
  }

  handleClick() {
    const { onClick, id } = this.props;
    const { collapsed } = this.state;
    this.setState({collapsed: !collapsed});
    if (onClick) { onClick(id); }
  }

  render() {
    const {
      collapsed = this.state.collapsed,
      className = '',
      itemClassName = '',
      nodeLabel,
      children,
    } = this.props;

    let arrowClassName = 'tree-view_arrow';
    let containerClassName = 'tree-view_children';
    if (collapsed) {
      arrowClassName += ' tree-view_arrow-collapsed';
      containerClassName += ' tree-view_children-collapsed';
    }

    return (
      <div className="tree-view">
        <div className={'tree-view_item ' + itemClassName}>
          <div
            className={`${className} ${arrowClassName}`}
            onClick={() => this.handleClick()}
          />
          <span>{nodeLabel}</span>
        </div>
        <div className={containerClassName}>
          {collapsed ? null : children}
        </div>
      </div>
    );
  }
}
