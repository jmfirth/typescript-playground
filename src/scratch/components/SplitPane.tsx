import { h, Component } from 'preact';
import Prefixer = require('inline-style-prefixer');
import Pane from './Pane';
import Resizer from './Resizer';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.2 (KHTML, like Gecko) Safari/537.2';

function unFocus(document: Document, window: Window) {
  if (document['selection']) {
    document['selection'].empty();
  } else {
    try {
      window.getSelection().removeAllRanges();
      // eslint-disable-next-line no-empty
    } catch (e) {/* */ }
  }
}

/*
SplitPane.propTypes = {
    allowResize: React.PropTypes.bool,
    children: React.PropTypes.arrayOf(React.PropTypes.node).isRequired,
    className: React.PropTypes.string,
    primary: React.PropTypes.oneOf(['first', 'second']),
    minSize: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.number]),
    maxSize: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.number]),
    // eslint-disable-next-line react/no-unused-prop-types
    defaultSize: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.number]),
    size: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.number]),
    split: React.PropTypes.oneOf(['vertical', 'horizontal']),
    onDragStarted: React.PropTypes.func,
    onDragFinished: React.PropTypes.func,
    onChange: React.PropTypes.func,
    onResizerClick: React.PropTypes.func,
    onResizerDoubleClick: React.PropTypes.func,
    prefixer: React.PropTypes.instanceOf(Prefixer).isRequired,
    style: stylePropType,
    resizerStyle: stylePropType,
    paneStyle: stylePropType,
    pane1Style: stylePropType,
    pane2Style: stylePropType,
    resizerClassName: React.PropTypes.string,
};

SplitPane.defaultProps = {
    allowResize: true,
    minSize: 50,
    prefixer: new Prefixer({ userAgent: USER_AGENT }),
    primary: 'first',
    split: 'vertical',
};
*/

interface Props {
  allowResize?: boolean;
  children?: JSX.Element[];
  className?: string;
  primary?: 'first' | 'second';
  minSize?: string | number;
  maxSize?: any;
  defaultSize?: string | number;
  size?: string | number;
  split?: 'vertical' | 'horizontal';
  onDragStarted?: (size?: string | number) => void;
  onDragFinished?: (size?: string | number) => void;
  onChange?: Function;
  onResizerClick?: (event: MouseEvent) => void;
  onResizerDoubleClick?: (event: MouseEvent) => void;
  prefixer?: InlineStylePrefixer.Prefixer;
  style?: Object;
  resizerStyle?: Object;
  paneStyle?: Object;
  pane1Style?: Object;
  pane2Style?: Object;
  resizerClassName?: string;
}

interface State {
  active: boolean;
  resized: boolean;
  position?: any;
  draggedSize?: number | string;
}

export default class SplitPane extends Component<Props, State> {
  public state: State = {
    active: false,
    resized: false,
  };

  protected pane1: any;

  protected pane2: any;

  protected splitPane: any;

  protected resizer: any;

  /*
  constructor() {
    super();

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }
  */

  componentDidMount() {
    this.setSize(this.props, this.state);
    document.addEventListener('mouseup', () => this.onMouseUp());
    document.addEventListener('mousemove', (event: MouseEvent) => this.onMouseMove(event));
    document.addEventListener('touchmove', (event: TouchEvent) => this.onTouchMove(event));
  }

  componentWillReceiveProps(next: Props) {
    this.setSize(next, this.state);
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', () => this.onMouseUp());
    document.removeEventListener('mousemove', (event: MouseEvent) => this.onMouseMove(event));
    document.removeEventListener('touchmove', (event: TouchEvent) => this.onTouchMove(event));
  }

  onMouseDown(event: MouseEvent) {
    // hack
    const eventWithTouches: any = Object.assign(
      {},
      event,
      { touches: [{ clientX: event.clientX, clientY: event.clientY }] },
    );
    console.log('onMouseDown: ', event)
    this.onTouchStart(eventWithTouches);
  }

  async onTouchStart(event: TouchEvent) {
    const { allowResize, onDragStarted, split = 'vertical' } = this.props;
    if (allowResize) {
      unFocus(document, window);
      const position = split === 'vertical' ? event.touches[0].clientX : event.touches[0].clientY;
      if (typeof onDragStarted === 'function') {
        onDragStarted();
      }
      this.setState({
        active: true,
        position,
      });
    }
  }

  onMouseMove(event: MouseEvent) {
    // hack
    const eventWithTouches: any = Object.assign(
      {},
      event,
      { touches: [{ clientX: event.clientX, clientY: event.clientY }] },
    );
    console.log('onMouseMove: ', eventWithTouches);
    this.onTouchMove(eventWithTouches);
  }

  onTouchMove(event: TouchEvent) {
    const { allowResize = true, maxSize, minSize = 50, onChange, split = 'vertical', primary = 'first' } = this.props;
    const { active, position } = this.state;

    console.log('onTouchMove', active, position);
    if (allowResize && active) {
      unFocus(document, window);
      const isPrimaryFirst = primary === 'first';
      const ref = isPrimaryFirst ? this.pane1 : this.pane2;
      if (ref) {
        const node = ref.base;
        const width = node.getBoundingClientRect().width;
        const height = node.getBoundingClientRect().height;
        const current = split === 'vertical' ? event.touches[0].clientX : event.touches[0].clientY;
        const size = split === 'vertical' ? width : height;
        const newPosition = isPrimaryFirst ? (position - current) : (current - position);

        let newMaxSize: string | number = maxSize;
        if ((maxSize !== undefined) && (maxSize <= 0)) {
          const splPane = this.splitPane;
          if (split === 'vertical') {
            newMaxSize = splPane.getBoundingClientRect().width + maxSize;
          } else {
            newMaxSize = splPane.getBoundingClientRect().height + maxSize;
          }
        }

        let newSize: string | number | undefined = size - newPosition;

        if (newSize < minSize) {
          newSize = minSize;
        } else if ((maxSize !== undefined) && (newSize > newMaxSize)) {
          newSize = newMaxSize;
        } else {
          this.setState({
            position: current,
            resized: true,
          });
        }

        if (onChange) {
          onChange(newSize);
        }
        this.setState({ draggedSize: newSize });
        ref.setState({ size: newSize });
      }
    }
  }

  onMouseUp() {
    const { allowResize = true, onDragFinished } = this.props;
    const { active, draggedSize } = this.state;
    if (allowResize && active) {
      if (typeof onDragFinished === 'function') {
        onDragFinished(draggedSize);
      }
      this.setState({ active: false });
    }
  }

  setSize(props: Props, state: State) {
    const { primary = 'first' } = this.props;
    const ref = primary === 'first' ? this.pane1 : this.pane2;
    let newSize;
    if (ref) {
      newSize = props.size || (state && state.draggedSize) || props.defaultSize || props.minSize || 50;
      ref.setState({
        size: newSize,
      });
      if (props.size !== state.draggedSize) {
        this.setState({
          draggedSize: newSize,
        });
      }
    }
  }

  /*
  allowResize: true,
  minSize: 50,
  prefixer: new Prefixer({ userAgent: USER_AGENT }),
  primary: 'first',
  split: 'vertical',
  */

  render() {
    const {
      allowResize = true,
      children,
      className,
      defaultSize,
      minSize = 50,
      onResizerClick,
      onResizerDoubleClick,
      paneStyle,
      pane1Style: pane1StyleProps,
      pane2Style: pane2StyleProps,
      primary = 'first',
      prefixer = new Prefixer({ userAgent: USER_AGENT }),
      resizerClassName,
      resizerStyle,
      size,
      split = 'vertical',
      style: styleProps
    } = this.props;
    const disabledClass = allowResize ? '' : 'disabled';

    const style = Object.assign(
      {},
      styleProps || {},
      {
        display: 'flex',
        flex: 1,
        height: '100%',
        position: 'absolute',
        outline: 'none',
        overflow: 'hidden',
        MozUserSelect: 'text',
        WebkitUserSelect: 'text',
        msUserSelect: 'text',
        userSelect: 'text',
      });

    if (split === 'vertical') {
      Object.assign(style, {
        flexDirection: 'row',
        left: 0,
        right: 0,
      });
    } else {
      Object.assign(style, {
        bottom: 0,
        flexDirection: 'column',
        minHeight: '100%',
        top: 0,
        width: '100%',
      });
    }

    const classes = ['SplitPane', className, split, disabledClass];
    const pane1Style = prefixer.prefix(Object.assign({}, paneStyle || {}, pane1StyleProps || {}));
    const pane2Style = prefixer.prefix(Object.assign({}, paneStyle || {}, pane2StyleProps || {}));

    return (
      <div
        className={classes.join(' ')}
        ref={(node) => { this.splitPane = node; }}
        style={prefixer.prefix(style)}
      >
        <Pane
          className="Pane1"
          key="pane1"
          ref={(node) => { this.pane1 = node; }}
          size={primary === 'first' ? size || defaultSize || minSize : undefined}
          split={split}
          style={pane1Style}
        >
          {children && children[0]}
        </Pane>
        <Resizer
          className={disabledClass}
          onClick={(event: MouseEvent) => onResizerClick && onResizerClick(event)}
          onDoubleClick={(event: MouseEvent) => onResizerDoubleClick && onResizerDoubleClick(event)}
          onMouseDown={(event: MouseEvent) => this.onMouseDown && this.onMouseDown(event)}
          onTouchStart={(event: TouchEvent) => this.onTouchStart && this.onTouchStart(event)}
          onTouchEnd={() => this.onMouseUp && this.onMouseUp()}
          key="resizer"
          ref={(node) => { this.resizer = node; }}
          resizerClassName={resizerClassName}
          split={split}
          style={resizerStyle || {}}
        />
        <Pane
          className="Pane2"
          key="pane2"
          ref={(node) => { this.pane2 = node; }}
          size={primary === 'second' ? size || defaultSize || minSize : undefined}
          split={split}
          style={pane2Style}
        >
          {children && children[1]}
        </Pane>
      </div>
    );
  }
}

// export default SplitPane;

/*
import { h, Component } from 'preact';
import Prefixer = require('inline-style-prefixer');
import Pane from './Pane';
import Resizer from './Resizer';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.2 (KHTML, like Gecko) Safari/537.2';

function unFocus(document: Document, window: Window) {
  if (document['selection']) {
    document['selection'].empty();
  } else {
    try {
      window.getSelection().removeAllRanges();
      // eslint-disable-next-line no-empty
    } catch (e) { }
  }
}

interface Props {
  allowResize?: boolean;
  children?: JSX.Element[];
  className?: string;
  primary?: 'first' | 'second';
  minSize?: string | number;
  maxSize?: string | number;
  defaultSize?: string | number;
  size?: string | number;
  split?: 'vertical' | 'horizontal';
  onDragStarted?: (size?: string | number) => void;
  onDragFinished?: (size?: string | number) => void;
  onChange?: Function;
  onResizerClick?: (event: MouseEvent) => void;
  onResizerDoubleClick?: (event: MouseEvent) => void;
  prefixer?: InlineStylePrefixer.Prefixer;
  style?: Object;
  resizerStyle?: Object;
  paneStyle?: Object;
  pane1Style?: Object;
  pane2Style?: Object;
  resizerClassName?: string;
}

interface State {
  active: boolean;
  resized: boolean;
  position?: number;
  draggedSize?: number | string;
}

class SplitPane extends Component<Props, State> {
  state: State = {
    active: false,
    resized: false,
  };

  pane1: any;

  pane2: any;

  splitPane: any;

  resizer: any;

  constructor() {
    super();
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  componentDidMount() {
    this.setSize(this.props, this.state);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('touchmove', this.onTouchMove);
  }

  componentWillReceiveProps(props: Props) {
    this.setSize(props, this.state);
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('touchmove', this.onTouchMove);
  }

  onMouseDown(event: MouseEvent) {
    const eventWithTouches: any = Object.assign(
      {},
      event,
      { touches: [{ clientX: event.clientX, clientY: event.clientY }] },
    );
    this.onTouchStart(eventWithTouches);
  }

  onTouchStart(event: TouchEvent) {
    const { allowResize = true, onDragStarted, split = 'vertical' } = this.props;
    // debugger;
    if (allowResize) {
      unFocus(document, window);
      const position = split === 'vertical' ? event.touches[0].clientX : event.touches[0].clientY;
      if (typeof onDragStarted === 'function') {
        onDragStarted();
      }
      console.log(position);
      this.setState({
        active: true,
        position,
      });
    }
  }

  onMouseMove(event: MouseEvent) {
    const eventWithTouches: any = Object.assign(
      {},
      event,
      { touches: [{ clientX: event.clientX, clientY: event.clientY }] },
    );
    this.onTouchMove(eventWithTouches);
  }

  onTouchMove(event: TouchEvent) {
    const {
      allowResize, maxSize, minSize = 50, onChange,
      split = 'vertical', primary = 'first'
    } = this.props;
    const { active, position } = this.state;
    if (allowResize && active) {
      unFocus(document, window);
      const isPrimaryFirst = primary === 'first';
      const ref = isPrimaryFirst ? this.pane1 : this.pane2;
      // debugger;
      if (ref) {
        // debugger;
        const node = ref;

        if (node.getBoundingClientRect) {
          const width = node.getBoundingClientRect().width;
          const height = node.getBoundingClientRect().height;
          const current = split === 'vertical' ? event.touches[0].clientX : event.touches[0].clientY;
          const size = split === 'vertical' ? width : height;
          const newPosition = isPrimaryFirst ? (position - current) : (current - position);

          let newMaxSize = maxSize || 9999999999;
          if ((maxSize !== undefined) && (maxSize <= 0)) {
            const splPane = this.splitPane;
            if (split === 'vertical') {
              newMaxSize = splPane.getBoundingClientRect().width + maxSize;
            } else {
              newMaxSize = splPane.getBoundingClientRect().height + maxSize;
            }
          }

          let newSize = size - newPosition;
          // console.log(newSize);
          if (newSize < minSize) {
            newSize = typeof minSize === 'number' ? minSize : parseInt(minSize, 10);
          } else if ((maxSize !== undefined) && (newSize > newMaxSize)) {
            newSize = typeof newMaxSize === 'number' ? newMaxSize : parseInt(newMaxSize, 10);
          } else {
            this.setState({
              position: current,
              resized: true,
            });
          }

          if (onChange) {
            onChange(newSize);
          }
          this.setState({ draggedSize: newSize });
          ref.setState({ size: newSize });
        }
      }
    }
  }

  onMouseUp(event: MouseEvent) {
    const { allowResize = true, onDragFinished } = this.props;
    const { active, draggedSize } = this.state;
    if (allowResize && active) {
      if (typeof onDragFinished === 'function') {
        onDragFinished(draggedSize);
      }
      this.setState({ active: false });
    }
  }

  setSize(props: Props, state: State) {
    const { primary = 'first', minSize = 50, defaultSize } = this.props;
    const ref = primary === 'first' ? this.pane1 : this.pane2;
    let newSize;
    if (ref) {
      newSize = props.size || (state && state.draggedSize) || defaultSize || minSize;
      ref.setState({
        size: newSize,
      });
      if (props.size !== state.draggedSize) {
        this.setState({
          draggedSize: newSize,
        });
      }
    }
  }

  render() {
    const {
      allowResize = true,
      children,
      className,
      defaultSize,
      minSize,
      onResizerClick = (e: any) => undefined,
      onResizerDoubleClick = (e: any) => undefined,
      paneStyle,
      pane1Style: pane1StyleProps,
      pane2Style: pane2StyleProps,
      prefixer = new Prefixer({ userAgent: USER_AGENT }),
      primary = 'first',
      resizerClassName,
      resizerStyle,
      size,
      split = 'vertical',
      style: styleProps
    } = this.props;
    const disabledClass = allowResize ? '' : 'disabled';

    const style = Object.assign(
      {},
      styleProps || {},
      {
        display: 'flex',
        flex: 1,
        height: '100%',
        position: 'absolute',
        outline: 'none',
        overflow: 'hidden',
        MozUserSelect: 'text',
        WebkitUserSelect: 'text',
        msUserSelect: 'text',
        userSelect: 'text',
      });

    if (split === 'vertical') {
      Object.assign(style, {
        flexDirection: 'row',
        left: 0,
        right: 0,
      });
    } else {
      Object.assign(style, {
        bottom: 0,
        flexDirection: 'column',
        minHeight: '100%',
        top: 0,
        width: '100%',
      });
    }

    const classes = ['SplitPane', className, split, disabledClass];
    const pane1Style = prefixer.prefix(Object.assign({}, paneStyle || {}, pane1StyleProps || {}));
    const pane2Style = prefixer.prefix(Object.assign({}, paneStyle || {}, pane2StyleProps || {}));
    // const pane1Style = Object.assign({}, paneStyle || {}, pane1StyleProps || {});
    // const pane2Style = Object.assign({}, paneStyle || {}, pane2StyleProps || {});

    return (
      <div
        className={classes.join(' ')}
        ref={(node) => { this.splitPane = node; }}
        style={prefixer.prefix(style)}
        // style={style}
      >
        <Pane
          className="Pane1"
          key="pane1"
          ref={(node) => { this.pane1 = node; }}
          size={primary === 'first' ? size || defaultSize || minSize : undefined}
          split={split}
          style={pane1Style}
        >
          {children && children[0]}
        </Pane>
        <Resizer
          className={disabledClass}
          onClick={onResizerClick}
          onDoubleClick={onResizerDoubleClick}
          onMouseDown={this.onMouseDown}
          onTouchStart={this.onTouchStart}
          onTouchEnd={this.onMouseUp}
          key="resizer"
          prefixer={prefixer}
          ref={(node) => { this.resizer = node; }}
          resizerClassName={resizerClassName}
          split={split}
          style={resizerStyle || {}}
        />
        <Pane
          className="Pane2"
          key="pane2"
          ref={(node) => { this.pane2 = node; }}
          size={primary === 'second' ? size || defaultSize || minSize : undefined}
          split={split}
          style={pane2Style}
        >
          {children && children[1]}
        </Pane>
      </div>
    );
  }
}

export default SplitPane;
*/
