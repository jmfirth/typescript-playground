import * as React from 'react';
import { Message } from 'semantic-ui-react';
import { FakeBrowser } from '../';
import { Modules } from '../../utilities/project';
import './RenderFrame.css';

function createSourceHtml(source: string, css: string, html: string, modules?: Modules) {
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
    ${pkgzipQueryString ? `<script src="http://pkgzip.com/?${pkgzipQueryString}"></script>` : ''}
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

// function createErrorHtml(errorMessage: string) {
//   return `
// <html>
//   <head>
//     <style type="text/css">
//       body {
//         margin: 0;
//         padding: 0;
//       }
//       #main {
//         max-width: 960px;
//         margin: 0 auto;
//       }
//       .error {
//         border: 2px solid #871212;
//         background-color: #B33A3A;
//         border-radius: 3px;
//         padding: 15px;
//         width: 100%;
//       }
//       .error-message {
//         color: #fefefe;
//       }
//     </style>
//   </head>
//   <body>
//     <div id="main">
//       <div className="error">
//         <p className="error-message">${errorMessage}</p>
//       </div>
//     </div>
//   </body>
// </html>
// `;
// }

interface Props {
  url: string;
  code: string;
  css: string;
  html: string;
  modules?: Modules;
  onLoading?: () => void;
  onLoaded?: () => void;
  onAddressChange?: (url: string) => void;
  onRefreshClicked?: () => void;
  onHomeClicked?: () => void;
}

interface State {
  errorMessage: string | void;
}

export default class RenderFrame extends React.Component<Props, State> {
  state: State = {
    errorMessage: undefined,
  };

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

  componentWillUnmount() {
    if (this.container && this.iframe) {
      this.iframe.remove();
      this.iframe.innerHTML = '';
      this.iframe = undefined;
    }
  }

  initIframe = (container?: HTMLDivElement) => {
    const { code, css, html, modules, onLoaded } = this.props;
    if (!container) { return; }
    this.container = container;
    this.container.innerText = '';
    this.iframe = document.createElement('iframe');
    if (onLoaded) { this.iframe.onload = () => onLoaded(); }
    this.iframe.className = 'surface';
    this.container.appendChild(this.iframe);
    setTimeout(() => this.loadIframe(code, css, html, modules), 0);
  }

  loadIframe(code: string, css: string, html: string, modules?: Modules) {
    if (!this.iframe) { return; }
    this.setState({ errorMessage: undefined });
    const { onLoading } = this.props;
    if (onLoading) { onLoading(); }
    const win: Window = this.iframe.contentWindow
                          || this.iframe.contentDocument.documentElement
                          || this.iframe.contentDocument;
    try {
      win.document.open();
      // win.onerror = errorMessage => {/* .. */};
      win.document.write(createSourceHtml(code, css, html, modules));
      win.document.close();
    } catch (e) {
      // debugger;
    }
  }

  render() {
    const { url, onAddressChange, onRefreshClicked, onHomeClicked } = this.props;
    const { errorMessage } = this.state;

    return (
      <div className="surface-container">
        {errorMessage && (
          <Message className="render-frame__error-message" error={true}>
            <Message.Header>Uncaught Error</Message.Header>
            <Message.Content>
              {errorMessage}
            </Message.Content>
          </Message>
        )}
        <FakeBrowser
          url={url}
          onAddressChanged={onAddressChange}
          onRefreshClicked={onRefreshClicked}
          onHomeClicked={onHomeClicked}
        >
          <div ref={this.initIframe} />
          {/*<Dimmer.Dimmable dimmed={!!errorMessage}>
            <Dimmer active={!!errorMessage}/>
            <div ref={this.initIframe} />
          </Dimmer.Dimmable>*/}
        </FakeBrowser>
      </div>
    );
  }
}