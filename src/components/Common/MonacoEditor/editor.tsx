import { editor, languages } from 'monaco-editor/esm/vs/editor/editor.api';
import React, { CSSProperties, MutableRefObject, RefObject, useEffect, useRef, useState } from 'react';
import './index.less';

export type EditorLanguages =
  | 'javascript'
  | 'typescript'
  | 'css'
  | 'json'
  | 'html'
  | 'markdown'
  | 'vue'
  | 'java'
  | 'tsx'
  | 'jsx';

export interface MonacoEditorProps {
  value?: string;
  onChange?: (v: string) => void;
  language: EditorLanguages;
  readonly?: boolean;
  editor?: RefObject<editor.IStandaloneCodeEditor>;
  /**
   * TypeScript类型定义文件，针对language='javascript' | 'typescript' 生效
   */
  definitions?: {
    [filePath: string]: string;
  };
  style?: CSSProperties;
}

export const MonacoEditor = (props: MonacoEditorProps) => {
  const instance = useRef<editor.IStandaloneCodeEditor>(null!);
  const root = useRef<HTMLDivElement>(null!);

  const [ready, setReady] = useState(false);

  function updateDefinition() {
    if (props.language === 'javascript' || props.language === 'typescript') {
      if (props.definitions) {
        languages.typescript[`${props.language}Defaults`].setExtraLibs(
          Object.entries(props.definitions).map(([filePath, content]) => ({
            filePath,
            content,
          })),
        );
      }
    }
  }

  useEffect(() => {
    if (!ready) return;

    const code = instance.current.getValue();
    if (code != props.value) {
      instance.current.setValue(props.value || '');
    }
  }, [props.value]);
  function onCodeChange(e: editor.IModelContentChangedEvent) {
    const code = instance.current.getValue();
    props.onChange?.(code);
  }

  useEffect(() => {
    if (!ready) return;

    editor.setModelLanguage(instance.current.getModel()!, props.language);
  }, [props.language]);

  useEffect(() => {
    if (!ready) return;

    updateDefinition();
  }, [props.definitions]);

  useEffect(() => {
    updateDefinition();

    instance.current = editor.create(root.current, {
      value: props.value || '',
      language: props.language,
      automaticLayout: true,
      readOnly: props.readonly,
    });
    instance.current.onDidChangeModelContent(onCodeChange);
    if (props.editor) {
      (props.editor as MutableRefObject<editor.IStandaloneCodeEditor>).current =
        instance.current;
    }
    setReady(true);
    return () => {
      if (props.language === 'javascript' || props.language === 'typescript') {
        if (props.definitions) {
          languages.typescript[`${props.language}Defaults`].setExtraLibs([]);
        }
      }
      instance.current.dispose();
    };
  }, []);

  return (
    <div className="monaco-editor" style={props.style}>
      <div className="monaco-editor__root" key="editor-root" ref={root}></div>
    </div>
  );
};
