/* tslint:disable no-string-literal no-any */
import { h, Component } from 'preact';

import IThemeRule = monaco.editor.IThemeRule;
export const monokai: IThemeRule[] = [
    { token: '', foreground: 'f8f8f2' },

    { token: 'comment', foreground: '75715e' },

    { token: 'string', foreground: 'e6db74' },
    { token: 'support.property-value.string.value.json', foreground: 'e6db74' },

    { token: 'constant.numeric', foreground: 'ae81ff' },
    { token: 'constant.language', foreground: 'ae81ff' },
    { token: 'constant.character', foreground: 'ae81ff' },
    { token: 'constant.other', foreground: 'ae81ff' },

    { token: 'keyword', foreground: 'f92672' },
    { token: 'support.property-value.keyword.json', foreground: 'f92672' },

    { token: 'storage', foreground: 'aae354' },
    { token: 'storage.type', foreground: '66d9ef', fontStyle: 'italic' },

    { token: 'entity.name.class', foreground: 'a6e22e' },
    { token: 'entity.other', foreground: 'a6e22e' },
    { token: 'entity.name.function', foreground: 'a6e22e' },
    { token: 'entity.name.tag', foreground: 'f92672' },
    { token: 'entity.other.attribute-name', foreground: 'a6e22e' },

    { token: 'variable', foreground: 'f8f8f2' },
    { token: 'variable.parameter', foreground: 'fd971f', fontStyle: 'italic' },

    { token: 'support.function', foreground: '66d9ef' },
    { token: 'support.constant', foreground: '66d9ef' },
    { token: 'support.type', foreground: '66d9ef' },
    { token: 'support.class', foreground: '66d9ef', fontStyle: 'italic' },

    /** We use qualifier for `const`, `var`, `private` etc. */
    { token: 'qualifier', foreground: '00d0ff' },
    /* `def` does not exist. We like to use it for variable definitions */
    { token: 'def', foreground: 'fd971f' },
    /** variable-2 doesn't exist. We use it for identifiers in type positions */
    { token: 'variable-2', foreground: '9effff' },
];

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

  monaco: typeof monaco;

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
      this.monaco = context['monaco'];

      // Before initializing monaco editor
      this.editorWillMount(this.monaco);

      this.monaco.editor.defineTheme('monokai', {
        base: 'vs-dark',
        inherit: true,
        rules: monokai
      });

      // const richLanguageConfiguration: monaco.languages.LanguageConfiguration = {
      //   wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
      //   comments: {
      //     lineComment: '//',
      //     blockComment: ['/*', '*/']
      //   },
      //   brackets: [
      //     ['{', '}'],
      //     ['[', ']'],
      //     ['(', ')']
      //   ],
      //   onEnterRules: [
      //     {
      //       // e.g. /** | */
      //       beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
      //       afterText: /^\s*\*\/$/,
      //       action: { indentAction: monaco.languages.IndentAction.IndentOutdent, appendText: ' * ' }
      //     },
      //     {
      //       // e.g. /** ...|
      //       beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
      //       action: { indentAction: monaco.languages.IndentAction.None, appendText: ' * ' }
      //     },
      //     {
      //       // e.g.  * ...|
      //       beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
      //       action: { indentAction: monaco.languages.IndentAction.Indent, appendText: '* ' }
      //     },
      //     {
      //       // e.g.  */|
      //       beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
      //       action: { indentAction: monaco.languages.IndentAction.None, removeText: 1 }
      //     },
      //     {
      //       // e.g. //|
      //       beforeText: /^\s*\/\/.*$/,
      //       action: { indentAction: monaco.languages.IndentAction.Indent, appendText: '// ' }
      //     },
      //   ],
      //   __electricCharacterSupport: {
      //     docComment: { open: '/**', close: ' */' }
      //   },
      //   autoClosingPairs: [
      //     { open: '{', close: '}' },
      //     { open: '[', close: ']' },
      //     { open: '(', close: ')' },
      //     { open: '"', close: '"', notIn: ['string'] },
      //     { open: '\'', close: '\'', notIn: ['string', 'comment'] },
      //     { open: '`', close: '`' }
      //   ]
      // };

      // this.monaco.languages.setLanguageConfiguration('typescript', richLanguageConfiguration);

      // context['monaco'].languages.register({
      //   id: 'typescript',
      //   extensions: ['.ts', '.tsx'],
      //   aliases: ['TypeScript', 'ts', 'typescript'],
      //   mimetypes: ['text/typescript']
      // });

      // this.monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      //   allowJs: true,
      //   module: monaco.languages.typescript.ModuleKind.System,
      //   outFile: 'bundle.js',
      //   target: monaco.languages.typescript.ScriptTarget.ES5,
      //   // lib: ['es6', 'dom', 'node'],
      //   jsx: monaco.languages.typescript.JsxEmit.React,
      //   jsxFactory: 'h',
      //   maxNodeModuleJsDepth: 100,
      //   allowSyntheticDefaultImports: true,
      //   forceConsistentCasingInFileNames: true,
      //   noImplicitReturns: true,
      //   noImplicitThis: true,
      //   noImplicitAny: true,
      //   strictNullChecks: true,
      //   suppressImplicitAnyIndexErrors: true,
      //   noUnusedLocals: true
      // });

      if (this.props.diagnosticOptions) {
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(this.props.diagnosticOptions);
      }

      this.editor = this.monaco.editor.create(containerElement, {
        value,
        language,
        theme,
        ...options,
      });

      // this.editor.addCommand(monaco.KeyCode.F8, () => {
      //   debugger;
      // }, false);

      this.editor.addAction({
        // An unique identifier of the contributed action.
        id: 'space-block-jumper_move-up',
        // A label of the action that will be presented to the user.
        label: 'Move Up A Block',
        // An optional array of keybindings for the action.
        // tslint:disable-next-line no-bitwise
        keybindings: [
          monaco.KeyMod.WinCtrl | monaco.KeyCode.UpArrow, // tslint:disable-line no-bitwise
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow, // tslint:disable-line no-bitwise
        ],
        keybindingContext: null,
        // contextMenuGroupId: 'navigation',
        // contextMenuOrder: 1.5,
        // Method that will be executed when the action is triggered.
        // @param editor The editor instance is passed in as a convinience
        run: (ed: monaco.editor.IEditor) => {
          markSelection(ed, nextPosition(ed.getModel() as any, ed.getPosition(), true));
          return null;
        }
      });

      this.editor.addAction({
        // An unique identifier of the contributed action.
        id: 'space-block-jumper_move-down',
        // A label of the action that will be presented to the user.
        label: 'Move Down A Block',
        // An optional array of keybindings for the action.
        // tslint:disable-next-line no-bitwise
        keybindings: [
          monaco.KeyMod.WinCtrl | monaco.KeyCode.DownArrow, // tslint:disable-line no-bitwise
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow, // tslint:disable-line no-bitwise
        ],
        keybindingContext: null,
        // contextMenuGroupId: 'navigation',
        // contextMenuOrder: 1.5,
        // Method that will be executed when the action is triggered.
        // @param editor The editor instance is passed in as a convinience
        run: (ed: monaco.editor.IEditor) => {
          markSelection(ed, nextPosition(ed.getModel() as any, ed.getPosition(), false));
          return null;
        }
      });

      this.editor.addAction({
        // An unique identifier of the contributed action.
        id: 'space-block-jumper_select-up',
        // A label of the action that will be presented to the user.
        label: 'Select Up A Block',
        // An optional array of keybindings for the action.
        keybindings: [
          monaco.KeyMod.Shift | monaco.KeyMod.WinCtrl | monaco.KeyCode.UpArrow, // tslint:disable-line no-bitwise
          monaco.KeyMod.Shift | monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow, // tslint:disable-line no-bitwise
        ],
        keybindingContext: null,
        // contextMenuGroupId: 'navigation',
        // contextMenuOrder: 1.5,
        // Method that will be executed when the action is triggered.
        // @param editor The editor instance is passed in as a convinience
        run: (ed: monaco.editor.IEditor) => {
          markSelection(
            ed,
            nextPosition(ed.getModel() as any, ed.getPosition(), true),
            anchorPosition(ed.getSelection(), ed.getPosition()) as monaco.Position
          );
          return null;
        }
      });

      this.editor.addAction({
        // An unique identifier of the contributed action.
        id: 'space-block-jumper_select-down',
        // A label of the action that will be presented to the user.
        label: 'Select Down A Block',
        // An optional array of keybindings for the action.
        // tslint:disable-next-line no-bitwise
        keybindings: [
          monaco.KeyMod.Shift | monaco.KeyMod.WinCtrl | monaco.KeyCode.DownArrow, // tslint:disable-line no-bitwise
          monaco.KeyMod.Shift | monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow, // tslint:disable-line no-bitwise
        ],
        keybindingContext: null,
        // contextMenuGroupId: 'navigation',
        // contextMenuOrder: 1.5,
        // Method that will be executed when the action is triggered.
        // @param editor The editor instance is passed in as a convinience
        run: (ed: monaco.editor.IEditor) => {
          markSelection(
            ed,
            nextPosition(ed.getModel() as any, ed.getPosition(), false),
            anchorPosition(ed.getSelection(), ed.getPosition()) as monaco.Position
          );
          return null;
        }
      });

      // add a command from the editor
      // this.editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.CtrlCmd | monaco.KeyCode.RightArrow, () => {
      //   debugger;
      // });
      /*
      pass in like
      {
        command: keycodes,
        fn:
      }
      */
      // this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_B, () => {

      // });

      // After initializing monaco editor
      this.editorDidMount(this.editor, this.monaco);
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

function nextPosition(document: monaco.editor.IModel, position: monaco.Position, up: boolean = false) {
  const step = up ? -1 : 1;
  const boundary = up ? 0 : document.getLineCount() - 1;
  if (position.lineNumber === boundary) { return position.lineNumber; }
  return afterBlock(document, step, boundary, position.lineNumber);
}

function afterBlock(
  document: monaco.editor.IModel,
  step: number,
  boundary: number,
  index: number,
  startedBlock: boolean = false
): number {
    const line = document.getLineContent(index);
    return index === boundary || startedBlock && !line.trim()
      ? index
      : afterBlock(document, step, boundary, index + step, startedBlock || !!line.trim());
}

function anchorPosition(selection: monaco.Selection, position: monaco.Position) {
  return selection.selectionStartLineNumber === position.lineNumber
    ? {
      lineNumber: selection.positionLineNumber,
      column: selection.positionColumn,
    }
    : {
      lineNumber: selection.selectionStartLineNumber,
      column: selection.selectionStartColumn,
    };
}

function markSelection(editor: monaco.editor.IEditor, next: number, anchor?: monaco.Position) {
  const active = {
    lineNumber: next,
    column: 0,
  };
  let selection = editor.getSelection();
  if (selection.selectionStartLineNumber === (anchor || active).lineNumber) {
    editor.setSelection({
      selectionStartLineNumber: (anchor || active).lineNumber,
      selectionStartColumn: (anchor || active).column,
      positionLineNumber: next,
      positionColumn: 1,
    });
    editor.revealRange({
      startLineNumber: next,
      startColumn: 1,
      endLineNumber: next,
      endColumn: 1,
    });
  } else {
    editor.setSelection({
      positionLineNumber: (anchor || active).lineNumber,
      positionColumn: (anchor || active).column,
      selectionStartLineNumber: next,
      selectionStartColumn: 1,
    });
    editor.revealRange({
      startLineNumber: next,
      startColumn: 1,
      endLineNumber: next,
      endColumn: 1,
    });
  }
}