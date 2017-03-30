/// <reference path="../node_modules/monaco-editor/monaco.d.ts" />

declare namespace InlineStylePrefixer {
  class Prefixer {
    constructor(options: Object);
    prefix(style?: Object): Object;
  }
}

declare module 'inline-style-prefixer' {
  import ISP = InlineStylePrefixer;
  export = ISP.Prefixer;
}