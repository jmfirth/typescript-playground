import * as React from 'react';
import Prefixer = require('inline-style-prefixer');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.2 (KHTML, like Gecko) Safari/537.2';

interface Props {
  className: string;
  children?: React.ReactNode;
  prefixer?: any; // tslint:disable-line no-any
  size?: string | number;
  split?: 'vertical' | 'horizontal';
  style?: React.CSSProperties;
}

interface State {
  size?: string | number;
}

class Pane extends React.Component<Props, State> {
    static defaultProps: Partial<Props> = {
      prefixer: new Prefixer({ userAgent: USER_AGENT }),
    };

    state: State = {
      size: this.props.size
    };

    constructor(props: Props) {
        super(props);
    }

    render() {
        const { children, className, prefixer, split, style: styleProps } = this.props;
        const { size } = this.state;
        const classes = ['Pane', split, className];
        // debugger;

        const style = Object.assign({}, styleProps || {}, {
            flex: 1,
            position: 'relative',
            outline: 'none',
        });

        if (size !== undefined) {
            if (split === 'vertical') {
                style.width = size;
            } else {
                style.height = size;
                style.display = 'flex';
            }
            style.flex = 'none' as any; // tslint:disable-line no-any
        }

        return <div className={classes.join(' ')} style={prefixer.prefix(style)}>{children}</div>;
    }
}

export default Pane;