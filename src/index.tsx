import { h, render } from 'preact';
import App from './App';
import 'material-design-icons/iconfont/material-icons.css';
import 'mdi/css/materialdesignicons.css';
import 'mdi/fonts/materialdesignicons-webfont.ttf';
import 'mdi/fonts/materialdesignicons-webfont.woff';
import 'mdi/fonts/materialdesignicons-webfont.woff2';
import './index.css';

render(
  <App />,
  document.getElementById('root') as HTMLElement
);
