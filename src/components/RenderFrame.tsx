import { h, Component } from 'preact';

function getIFrameSource(source: string, css: string, html: string) {
  return `
<html>
  <head>
    <style type="text/css">
${css}
    </style>
  </head>
  <body>
${html}
  </body>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/systemjs/0.20.11/system.js"></script>
  <script>
SystemJS.config({
  baseURL: 'https://browserify-cdn.abstractsequential.com/standalone/',
});

let define = SystemJS.amdDefine;
let __s = System;
System = SystemJS
${source}

SystemJS.import('entry');
System = __s;
  </script>
</html>
`;
}

interface Props {
  code: string;
  css: string;
  html: string;
}

export default class RenderFrame extends Component<Props, null> {
  render() {
    const { code, css, html } = this.props;
    return <iframe className="surface" srcDoc={getIFrameSource(code, css, html)}/>;
  }
}