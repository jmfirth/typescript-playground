import { h, Component } from 'preact';
import Prefixer = require('inline-style-prefixer');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.2 (KHTML, like Gecko) Safari/537.2';

interface Props {
  className: string;
  children?: JSX.Element;
  prefixer?: InlineStylePrefixer.Prefixer;
  size?: number | string;
  split?: 'horizontal' | 'vertical';
  style?: Object;
}

interface State {
  size?: number | string;
}

export default class Pane extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { size: this.props.size };
  }

  public render() {
    const {
      children,
      className,
      prefixer = new Prefixer({ userAgent: USER_AGENT }),
      split,
      style: styleProps,
    } = this.props;
    const { size } = this.state;
    const classes = ['Pane', split, className];

    const style = Object.assign({}, styleProps || {}, {
        flex: '1',
        position: 'relative',
        outline: 'none',
    });

    if (size) {
      if (split === 'vertical') {
          style['width'] = size;
      } else {
          style['height'] = size;
          style['display'] = 'flex';
      }
      style['flex'] = 'none';
    }

    return (
      <div
        className={classes.join(' ')}
        style={prefixer.prefix(style)}
      >
        {children}
      </div>
    );
  }
}