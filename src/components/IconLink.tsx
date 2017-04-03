import { h } from 'preact';
import Icon from './Icon';

interface IconButtonProps {
  label?: string;
  name: string;
  url?: string;
  selected?: boolean;
  tooltip?: string;
}

export default ({ label, name, url, selected, tooltip }: IconButtonProps) => (
  <div className={tooltip ? 'tooltip' : ''}>
    <a className={`button ${selected ? 'button-selected' : ''}`} href={url}>
      <Icon name={name} /> {label}
    </a>
    {tooltip && <span className="tooltiptext tooltiptext-right">{tooltip}</span>}
  </div>
);