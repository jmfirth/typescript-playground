/* tslint:disable no-string-literal no-any */
import { h, Component } from 'preact';
// import * as MonacoEditor from 'monaco-editor/monaco.d.ts';

function noop(...args: any[]) { /* */ }

interface Props {
  context?: Object;
  width?: string | number;
  height?: string | number;
  value?: string;
  defaultValue?: string;
  language?: string;
  theme?: string;
  options?: monaco.editor.IEditorOptions;
  diagnosticOptions?: monaco.languages.typescript.DiagnosticsOptions;
  editorDidMount?: (editor: monaco.editor.IEditor, monaco: any) => void;
  editorWillMount?: (monaco: any) => void;
  onChange?: (code: string, event: monaco.editor.IModelContentChangedEvent2) => void;
  requireConfig?: any;
}

interface State {

}

class MonacoEditor extends Component<Props, State> {
  __current_value: any; // tslint:disable-line variable-name

  __prevent_trigger_change_event: any;  // tslint:disable-line variable-name

  editor: any;

  container: HTMLDivElement;

  constructor(props: Props) {
    super(props);
    this.__current_value = props.value;
  }

  componentDidMount() {
    this.afterViewInit();
  }

  componentWillUnmount() {
    this.destroyMonaco();
  }

  componentDidUpdate(prevProps: Props) {

    const context = this.props.context || window;
    if (this.props.value !== this.__current_value) {
      // Always refer to the latest value
      this.__current_value = this.props.value;
      // Consider the situation of rendering 1+ times before the editor mounted
      if (this.editor) {
        this.__prevent_trigger_change_event = true;
        this.editor.setValue(this.__current_value);
        this.__prevent_trigger_change_event = false;
      }
    }
    if (prevProps.language !== this.props.language) {
      context['monaco'].editor.setModelLanguage(this.editor.getModel(), this.props.language);
    }
  }

  editorWillMount(monaco: any) {
    const { editorWillMount } = this.props;

    if (editorWillMount) {
      editorWillMount(monaco);
    }
  }

  editorDidMount(editor: any, monaco: any) {
    const { editorDidMount, onChange }: Props = this.props;
    if (editorDidMount) {
      editorDidMount(editor, monaco);
    }
    editor.onDidChangeModelContent((event: any) => {
      const value = editor.getValue();

      // Always refer to the latest value
      this.__current_value = value;

      // Only invoking when user input changed
      if (!this.__prevent_trigger_change_event && onChange) {
        onChange(value, event);
      }
    });
  }

  afterViewInit() {
    const { requireConfig }: Props = this.props;
    const loaderUrl = requireConfig.url || 'vs/loader.js';
    const context = this.props.context || window;
    const onGotAmdLoader = () => {
      if (context['__REACT_MONACO_EDITOR_LOADER_ISPENDING__']) {
        // Do not use webpack
        if (requireConfig.paths && requireConfig.paths.vs) {
          context['require'].config(requireConfig);
        }
      }

      // Load monaco
      context['require'](['vs/editor/editor.main'], () => {
        this.initMonaco();
      });

      // Call the delayed callbacks when AMD loader has been loaded
      if (context['__REACT_MONACO_EDITOR_LOADER_ISPENDING__']) {
        context['__REACT_MONACO_EDITOR_LOADER_ISPENDING__'] = false;
        let loaderCallbacks = context['__REACT_MONACO_EDITOR_LOADER_CALLBACKS__'];
        if (loaderCallbacks && loaderCallbacks.length) {
          let currentCallback = loaderCallbacks.shift();
          while (currentCallback) {
            currentCallback.fn.call(currentCallback.context);
            currentCallback = loaderCallbacks.shift();
          }
        }
      }
    };

    // Load AMD loader if necessary
    if (context['__REACT_MONACO_EDITOR_LOADER_ISPENDING__']) {
      // We need to avoid loading multiple loader.js when there are multiple editors loading concurrently
      //  delay to call callbacks except the first one
      context['__REACT_MONACO_EDITOR_LOADER_CALLBACKS__'] = context['__REACT_MONACO_EDITOR_LOADER_CALLBACKS__'] || [];
      context['__REACT_MONACO_EDITOR_LOADER_CALLBACKS__'].push({
        context: this,
        fn: onGotAmdLoader
      });
    } else {
      if (typeof context['require'] === 'undefined') {
        var loaderScript = context['document'].createElement('script');
        loaderScript.type = 'text/javascript';
        loaderScript.src = loaderUrl;
        loaderScript.addEventListener('load', onGotAmdLoader);
        context['document'].body.appendChild(loaderScript);
        context['__REACT_MONACO_EDITOR_LOADER_ISPENDING__'] = true;
      } else {
        onGotAmdLoader();
      }
    }
  }
  initMonaco() {
    const value = this.props.value !== null ? this.props.value : this.props.defaultValue;
    const { language, theme, options } = this.props;
    const containerElement = this.container;
    const context = this.props.context || window;
    if (typeof context['monaco'] !== 'undefined') {
      // Before initializing monaco editor
      this.editorWillMount(context['monaco']);

      // context['monaco'].languages.register({
      //   id: 'typescript',
      //   extensions: ['.ts', '.tsx'],
      //   aliases: ['TypeScript', 'ts', 'typescript'],
      //   mimetypes: ['text/typescript']
      // });

      if (this.props.diagnosticOptions) {
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(this.props.diagnosticOptions);
        // monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        //   noSemanticValidation: true,
        //   noSyntaxValidation: true, // This line disables errors in jsx tags like <div>, etc.
        // });
      }

      this.editor = context['monaco'].editor.create(containerElement, {
        value,
        language,
        theme,
        ...options,
      });

      // After initializing monaco editor
      this.editorDidMount(this.editor, context['monaco']);
    }
  }

  destroyMonaco() {
    if (typeof this.editor !== 'undefined') {
      this.editor.dispose();
    }
  }

  render() {
    const { width = '100%', height = '100%' } = this.props;
    const fixedWidth = width.toString().indexOf('%') !== -1
                    || width.toString().indexOf('vh') !== -1
                     ? width
                     : `${width}px`;
    const fixedHeight = height.toString().indexOf('%') !== -1
                     || height.toString().indexOf('vh') !== -1
                      ? height
                      : `${height}px`;
    const style = {
      width: fixedWidth,
      height: fixedHeight,
    };

    return (
      <div
        ref={(container: HTMLDivElement) => { this.container = container; }}
        style={style}
        className="react-monaco-editor-container"
      />
    );
  }
}

MonacoEditor.defaultProps = {
  width: '100%',
  height: '100%',
  value: null,
  defaultValue: '',
  language: 'javascript',
  theme: 'vs',
  options: {},
  editorDidMount: noop,
  editorWillMount: noop,
  onChange: noop,
  requireConfig: {},
};

export default MonacoEditor;