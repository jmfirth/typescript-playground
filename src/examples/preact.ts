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