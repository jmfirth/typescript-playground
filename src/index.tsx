import * as React from 'react';
import { render } from 'react-dom';
import App from './App';
import 'semantic-ui-css/semantic.css';
import './index.css';
// import './appearance/style/main.css';

render(
  <App />,
  document.getElementById('root') as HTMLElement
);
