import { h } from 'preact';

interface IconProps {
  className?: string;
  name?: string;
  style?: Object;
}

export default ({ name, style, className, ...other }: IconProps) => (
  <i
    style={{ ...{ fontFamily: 'Material Design Icons' }, ...style }}
    className={['material-icons', `mdi-${name}`, `${className || ''}`].filter(Boolean).join(' ')}
    {...other}
  />
);