import { h } from 'preact';
import Icon from './Icon';

interface IconButtonProps {
  label?: string;
  name: string;
  onClick?: () => void;
  selected?: boolean;
}

export default ({ label, name, onClick, selected }: IconButtonProps) => (
  <button className={`button ${selected ? 'button-selected' : ''}`} onClick={onClick}>
    <Icon name={name} /> {label}
  </button>
);