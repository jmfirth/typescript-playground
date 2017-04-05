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
  render() {
    const { code, css, html, modules } = this.props;
    return (
      <iframe
        ref={(iframe: HTMLIFrameElement) => {
          setTimeout(
            () => {
              try {
                let frame: Window = iframe.contentWindow
                                 || iframe.contentDocument.documentElement
                                 || iframe.contentDocument;
                // iframe.src = "https://mytesturl";
                frame.document.clear();
                frame.document.open();
                frame.document.write(getIFrameSource(code, css, html, modules));
                frame.document.close();
              } catch (e) { /*...*/ }
            },
            0
          );
        }}
        name="request"
        className="surface"
        sandbox="allow-forms allow-scripts allow-same-origin allow-modals allow-popups allow-top-navigation"
        allowFullScreen={true}
        frameBorder="0"
        // href="/"
        // srcDoc={getIFrameSource(code, css, html, modules)}
      />
    );
  }
}