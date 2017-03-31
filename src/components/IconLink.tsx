import { h } from 'preact';
import Icon from './Icon';

interface IconButtonProps {
  label?: string;
  name: string;
  url?: string;
  selected?: boolean;
}

export default ({ label, name, url, selected }: IconButtonProps) => (
  <a className={`button ${selected ? 'button-selected' : ''}`} href={url}>
    <Icon name={name} /> {label}
  </a>
);