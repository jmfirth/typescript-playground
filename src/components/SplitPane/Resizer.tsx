import * as React from 'react';
import Prefixer = require('inline-style-prefixer');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.2 (KHTML, like Gecko) Safari/537.2';

class Resizer extends React.Component<any, any> { // tslint:disable-line no-any
  static defaultProps: any = { // tslint:disable-line no-any
    prefixer: new Prefixer({ userAgent: USER_AGENT }),
    resizerClassName: 'Resizer',
  };

  render() {
    const { className, onClick, onDoubleClick, onMouseDown, onTouchEnd, onTouchStart, prefixer, resizerClassName,
      split, style } = this.props;
    const classes = [resizerClassName, split, className];

    return (
      <span
        className={classes.join(' ')}
        style={prefixer.prefix(style) || {}}
        onMouseDown={event => onMouseDown(event)}
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

export default Resizer;