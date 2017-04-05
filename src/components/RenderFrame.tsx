import { h, Component } from 'preact';
import { ModuleMap } from '../utilities/project';

function getIFrameSource(source: string, css: string, html: string, modules?: ModuleMap) {
  const pkgzipQueryString = modules
    ? Object.keys(modules).map(moduleName =>
        `${moduleName}@${modules[moduleName].replace('*', 'latest').replace(/[~>=<^]/g, '')}`
      ).join(',')
    : undefined;
  const pkgzipRegistration = modules
    ? Object.keys(modules).map(moduleName =>
        // tslint:disable-next-line max-line-length
        `window.pkgzip['${moduleName}'] && SystemJS.set(SystemJS.resolveSync('${moduleName}'), SystemJS.newModule(window.pkgzip['${moduleName}']));`
      ).join('\n')
    : '';

  return `
<html>
  <head>
    <style type="text/css">
${css}
    </style>
    ${pkgzipQueryString ? `<script src="https://pkgzip.com/?${pkgzipQueryString}"></script>` : ''}
    <script src="https://cdnjs.cloudflare.com/ajax/libs/systemjs/0.20.11/system.js"></script>
  </head>
  <body>
${html}
  </body>
  <script>
System.config({
  baseURL: 'https://browserify-cdn.abstractsequential.com/standalone/',
});
if (!!window.pkgzip) {
  ${pkgzipRegistration}
}
var define = System.amdDefine;
${source}
${source && source.indexOf('define("index"') > -1 && 'System.import("index");'}
  </script>
</html>
`;
}

interface Props {
  code: string;
  css: string;
  html: string;
  modules?: ModuleMap;
}

export default class RenderFrame extends Component<Props, null> {
  container: HTMLDivElement | undefined;

  iframe: HTMLIFrameElement | undefined;

  shouldComponentUpdate() {
    return false;
  }

  componentWillReceiveProps(next: Props) {
    if (next.code !== this.props.code
     || next.html !== this.props.html
     || next.css !== this.props.css
     || next.modules !== this.props.modules) {
      this.loadIframe(next.code, next.css, next.html, next.modules);
    }
  }

  loadIframe(code: string, css: string, html: string, modules?: ModuleMap) {
    if (!this.iframe) { return; }
    const win: Window = this.iframe.contentWindow
                          || this.iframe.contentDocument.documentElement
                          || this.iframe.contentDocument;
    win.document.open();
    win.document.write(getIFrameSource(code, css, html, modules));
    win.document.close();
  }

  render() {
    const { code, css, html, modules } = this.props;
    return (
      <div
        style={{ width: '100%', height: '100%' }}
        ref={(c: HTMLDivElement) => {
          if (!c) {
            this.container = undefined;
            this.iframe = undefined;
            return;
          }
          this.container = c;
          this.container.innerText = '';
          this.iframe = document.createElement('iframe');
          this.iframe.className = 'surface';
          this.container.appendChild(this.iframe);
          setTimeout(() => this.loadIframe(code, css, html, modules), 0);
        }}
      />
    );
  }
}