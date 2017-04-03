import { h } from 'preact';
import Icon from './Icon';

interface IconButtonProps {
  className?: string;
  label?: string;
  name: string;
  onClick?: () => void;
  selected?: boolean;
  tooltip?: string;
}

export default ({ label, name, onClick, selected, tooltip, className }: IconButtonProps) => (
  <div className={`${tooltip ? 'tooltip' : ''} ${className || ''}`}>
    <button
      // title={tooltip}
      className={`button ${selected ? 'button-selected' : ''}`}
      onClick={onClick}
    >
      <Icon name={name} /><span className="button-label"> {label}</span>
    </button>
    {tooltip && <span className="tooltiptext tooltiptext-left">{tooltip}</span>}
  </div>
);