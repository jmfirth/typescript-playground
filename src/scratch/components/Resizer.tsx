import { h, Component } from 'preact';
import Prefixer = require('inline-style-prefixer');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.2 (KHTML, like Gecko) Safari/537.2';

/*
Resizer.propTypes = {
    className: React.PropTypes.string.isRequired,
    onClick: React.PropTypes.func,
    onDoubleClick: React.PropTypes.func,
    onMouseDown: React.PropTypes.func.isRequired,
    onTouchStart: React.PropTypes.func.isRequired,
    onTouchEnd: React.PropTypes.func.isRequired,
    prefixer: React.PropTypes.instanceOf(Prefixer).isRequired,
    split: React.PropTypes.oneOf(['vertical', 'horizontal']),
    style: stylePropType,
    resizerClassName: React.PropTypes.string.isRequired,
};

Resizer.defaultProps = {
    prefixer: new Prefixer({ userAgent: USER_AGENT }),
    resizerClassName: 'Resizer',
};
*/

interface Props {
  className: string;
  onClick: (event: Event) => void;
  onDoubleClick: (event: Event) => void;
  onMouseDown: (event: Event) => void;
  onTouchStart: (event: Event) => void;
  onTouchEnd: (event: Event) => void;
  prefixer?: InlineStylePrefixer.Prefixer;
  split?: 'horizontal' | 'vertical';
  style?: Object;
  resizerClassName?: string;
}

export default class Resizer extends Component<Props, void> {
    public render() {
        const {
          className,
          onClick,
          onDoubleClick,
          onMouseDown,
          onTouchEnd,
          onTouchStart,
          prefixer = new Prefixer({ userAgent: USER_AGENT }),
          resizerClassName = 'Resizer',
          split,
          style
        } = this.props;
        const classes = [resizerClassName, split, className];

        return (
            <span
                className={classes.join(' ')}
                style={prefixer.prefix(style) || {}}
                onMouseDown={(event: Event) => onMouseDown(event)}
                onTouchStart={(event: Event) => {
                    event.preventDefault();
                    onTouchStart(event);
                }}
                onTouchEnd={(event: Event) => {
                    event.preventDefault();
                    onTouchEnd(event);
                }}
                // eslint-disable-next-line no-static-element-interactions
                onClick={(event: Event) => {
                    if (onClick) {
                        event.preventDefault();
                        onClick(event);
                    }
                }}
                onDoubleClick={(event: Event) => {
                    if (onDoubleClick) {
                        event.preventDefault();
                        onDoubleClick(event);
                    }
                }}
            />
        );
    }
}

/*
import { h, Component } from 'preact';
import Prefixer = require('inline-style-prefixer');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.2 (KHTML, like Gecko) Safari/537.2';

interface Props {
  className: string;
  onClick?: (e: MouseEvent) => void;
  onDoubleClick?: (e: MouseEvent) => void;
  onMouseDown?: (event: MouseEvent) => void;
  onTouchStart?: (event: Event) => void;
  onTouchEnd?: (event: Event) => void;
  prefixer?: InlineStylePrefixer.Prefixer;
  split?: 'vertical' | 'horizontal';
  style?: Object;
  resizerClassName?: string;
}

export default class Resizer extends Component<Props, void> {
    render() {
        const {
          className,
          onClick = (event: MouseEvent) => undefined,
          onDoubleClick = (event: MouseEvent) => undefined,
          onMouseDown = (event: MouseEvent) => undefined,
          onTouchEnd = (event: TouchEvent) => undefined,
          onTouchStart = (event: TouchEvent) => undefined,
          prefixer = new Prefixer({ userAgent: USER_AGENT }),
          resizerClassName = 'Resizer',
          split,
          style
        } = this.props;
        const classes = [resizerClassName, split, className];

        return (
            <span
                className={classes.join(' ')}
                style={prefixer.prefix(style) || {}}
                onMouseDown={event => {
                  console.log('here');
                  debugger;
                  onMouseDown(event)
                }}
                onTouchStart={(event) => {
                    event.preventDefault();
                    onTouchStart(event);
                }}
                onTouchEnd={(event) => {
                    event.preventDefault();
                    onTouchEnd(event);
                }}
                // eslint-disable-next-line no-static-element-interactions
                onClick={(event) => {
                  console.log(onClick);
                  debugger;
                    if (onClick) {
                        event.preventDefault();
                        onClick(event);
                    }
                }}
                onDoubleClick={(event) => {
                    if (onDoubleClick) {
                        event.preventDefault();
                        onDoubleClick(event);
                    }
                }}
            />
        );
    }
}
*/