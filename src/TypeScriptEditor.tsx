import { h, Component/*, render*/ } from 'preact';
import MonacoEditor from './MonacoEditor';
import * as TypeScript from 'typescript';
import * as compiler from './compiler';
import { debounce } from 'lodash';

interface ExternalReference {
  name: string;
  url: string;
}

interface References { [name: string]: string; }

function createExternalReference(name: string, url: string): ExternalReference {
  return { name, url };
}

const LOCAL_STORAGE_PREFIX = 'tspg-cache-';

const getStorageKey = (fragment: string) => `${LOCAL_STORAGE_PREFIX}${fragment}`;

const getStorageItem = (fragment: string) =>
  localStorage.getItem(getStorageKey(fragment));

const setStorageItem = (fragment: string, value: string) =>
  localStorage.setItem(getStorageKey(fragment), value);

const notInStorage = (fragment: string) => !getStorageItem(fragment); // tslint:disable-line no-any

let definitions = [
  createExternalReference('node.d.ts', 'https://unpkg.com/@types/node/index.d.ts'),
  createExternalReference('preact.d.ts', 'https://unpkg.com/preact/src/preact.d.ts'),
  // createExternalReference('three.d.ts', 'https://unpkg.com/@types/three/index.d.ts'),
  createExternalReference('detector.d.ts', 'https://unpkg.com/@types/three/detector.d.ts'),
  createExternalReference(
    'three-FirstPersonControls.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-FirstPersonControls.d.ts'),
  createExternalReference(
    'three-canvasrenderer.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-canvasrenderer.d.ts'),
  createExternalReference(
    'three-colladaLoader.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-colladaLoader.d.ts'),
  createExternalReference(
    'three-copyshader.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-copyshader.d.ts'),
  createExternalReference(
    'three-css3drenderer.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-css3drenderer.d.ts'),
  createExternalReference(
    'three-ctmloader.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-ctmloader.d.ts'),
  createExternalReference(
    'three-editorcontrols.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-editorcontrols.d.ts'),
  createExternalReference(
    'three-effectcomposer.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-effectcomposer.d.ts'),
  createExternalReference(
    'three-maskpass.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-maskpass.d.ts'),
  createExternalReference(
    'three-octree.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-octree.d.ts'),
  createExternalReference(
    'three-orbitcontrols.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-orbitcontrols.d.ts'),
  createExternalReference(
    'three-orthographictrackballcontrols.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-orthographictrackballcontrols.d.ts'),
  createExternalReference(
    'three-projector.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-projector.d.ts'),
  createExternalReference(
    'three-renderpass.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-renderpass.d.ts'),
  createExternalReference(
    'three-shaderpass.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-shaderpass.d.ts'),
  createExternalReference(
    'three-trackballcontrols.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-trackballcontrols.d.ts'),
  createExternalReference(
    'three-transformcontrols.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-transformcontrols.d.ts'),
  createExternalReference(
    'three-vrcontrols.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-vrcontrols.d.ts'),
  createExternalReference(
    'three-vreffect.d.ts',
    'https://unpkg.com/@types/three@0.84.3/three-vreffect.d.ts'),
  createExternalReference(
    'pixi.js.d.ts',
    'https://unpkg.com/@types/pixi.js@4.4.1/index.d.ts')
];

interface Props {
  code?: string;
  transpile?: boolean;
  editorDidMount?: (editor: monaco.editor.IEditor, mod: typeof monaco) => void;
  onChange?: (code: string, transpiled?: string, diagnostics?: TypeScript.Diagnostic[]) => void;
  diagnosticOptions?: monaco.languages.typescript.DiagnosticsOptions;
  definitions?: References;
}

export default class TypeScriptEditor extends Component<Props, void> {
  monaco: typeof monaco;

  compileSource(source: string) {
    const configuration = compiler.createConfiguration(source);
    const result = compiler.compile(configuration.sourceBundle, configuration.compilerOptions);
    if (!result.emitResult.emitSkipped) {
      return result;
    } else {
      console.log('transpile error'); // tslint:disable-line no-console
    }
    return null;
  }

  componentWillMount() {
    this.load();
    this.fixWebWorkers();
    if (this.props.code) {
      this.editorChanged(this.props.code);
    }
    this.editorChanged = debounce(this.editorChanged, 500);
  }

  async load() {
    this.loadDefinitions();
  }

  async loadDefinitions() {
    return Promise.all(
      Object.keys(this.props.definitions).filter(notInStorage).map(key => {
        if (this.props.definitions) {
          return fetch(this.props.definitions[key])
            .then(res => res.text())
            .then(source => setStorageItem(key, source));
        } else {
          return undefined;
        }
      }).filter(Boolean)
    );
  }

  fixWebWorkers() {
    window['MonacoEnvironment'] = { // tslint:disable-line no-string-literal
      getWorkerUrl: () =>  'monaco-editor-worker-loader-proxy.js'
    };
  }

  addLanguageDefinitions() {
    definitions.forEach((d, n) =>
      this.monaco.languages.typescript.typescriptDefaults.addExtraLib(getStorageItem(d.name) as string, d.name));
  }

  editorChanged(code: string, event?: monaco.editor.IModelContentChangedEvent2) {
    const { onChange, transpile = true } = this.props;
    if (onChange && transpile) {
      const result = this.compileSource(code);
      if (result) {
        onChange(code, result.source, result.diagnostics);
      }
    } else if (onChange) {
      onChange(code);
    }
  }

  render() {
    const requireConfig = {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.1/require.min.js',
      paths: { 'vs': 'https://npmcdn.com/monaco-editor@0.8.3/min/vs/' },
    };

    return (
      <MonacoEditor
        width="100%"
        language="typescript"
        defaultValue={this.props.code}
        options={{
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          theme: 'vs-dark',
          // cursorBlinking: 'off',
          automaticLayout: true,
          wrappingIndent: 'same',
          parameterHints: true,
          // formatOnType: true,
          // formatOnPaste: true,
          tabCompletion: true,
          folding: true,
        }}
        requireConfig={requireConfig}
        onChange={(code, event) => this.editorChanged(code, event)}
        // editorWillMount={monaco => this.monaco = monaco}
        editorDidMount={(editor, mod) => {
          this.monaco = mod;
          this.addLanguageDefinitions();
          if (this.props.editorDidMount) {
            this.props.editorDidMount(editor, mod);
          }
        }}
        diagnosticOptions={this.props.diagnosticOptions}
        // context={{
        //   window: window,
        //   preact: { render, h, Component },
        //   container: this.container,
        // }}
      />
    );
  }
}