import * as Definitions from '../definitions';

export const definitions = {
  ...Definitions.defaults,
  ...{ 'preact/preact.d.ts': 'https://unpkg.com/preact/src/preact.d.ts' }
};

export const html = '';

export const css = `
html, body {
  margin: 0;
  padding: 0;
}
`;

export const code = `
/** @jsx h */
import { h, Component, render } from 'preact';

class HelloWorld extends Component<void, void> {
  render() {
    return <h1>Hello world!</h1>;
  }
}

render(<HelloWorld />, document.body);
`;