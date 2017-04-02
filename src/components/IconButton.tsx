import { h } from 'preact';
import Icon from './Icon';

interface IconButtonProps {
  className?: string;
  label?: string;
  name: string;
  onClick?: () => void;
  selected?: boolean;
}

export default ({ label, name, onClick, selected, className }: IconButtonProps) => (
  <button className={`button ${selected ? 'button-selected' : ''} ${className || ''}`} onClick={onClick}>
    <Icon name={name} /> {label}
  </button>
);