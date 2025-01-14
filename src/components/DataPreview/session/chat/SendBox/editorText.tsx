import '@wangeditor/editor/dist/css/style.css'; // 引入 css
import React, { useState, useEffect } from 'react';
import { Editor } from '@wangeditor/editor-for-react';
import { DomEditor, IDomEditor, IEditorConfig } from '@wangeditor/editor';
import { ISession } from '@/ts/core';

interface IProps {
  htmlMessage: string;
  onChange: (html: string) => void;
  onSendMessage: (html: string) => void;
  chat: ISession;
}
const EditorText: React.FC<IProps> = ({ htmlMessage, onChange, onSendMessage, chat }) => {
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const [html, setHtml] = useState<string>(htmlMessage);

  useEffect(() => {
    if (htmlMessage == '') {
      editor && editor.clear();
    } else {
      setHtml(htmlMessage);
    }
  }, [htmlMessage]);

  // 编辑器配置
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: 'Enter键发送, Alt+Enter键换行。',
    hoverbarKeys: {
      image: {
        menuKeys: [],
      },
    },
    customPaste(editor, e) {
      let items = e.clipboardData?.items;
      if (items && items.length > 0) {
        const lastItem = items[items.length - 1];
        if (lastItem.type.indexOf('image') !== -1) {
          const blob = lastItem.getAsFile();
          blob &&
            compressImage(blob, 0.92, (newBlob: File) => {
              if (newBlob) {
                let newFile = new File([newBlob], blob.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                const imgUrl = URL.createObjectURL(newFile);
                let files = {
                  file: newFile,
                  imgUrl: imgUrl,
                };
                chat.inputContent.imgList.push(files);
                editor.dangerouslyInsertHtml(`<img src="${imgUrl}">`);
              }
            });
        } else {
          const text = e.clipboardData?.getData('text/plain');
          text && editor.dangerouslyInsertHtml(text);
        }
      }

      e.preventDefault();
      return false;
    },
  };

  //压缩图片
  const compressImage = (
    blob: Blob,
    quality: number,
    callback: (newFile: File) => void,
  ) => {
    var reader = new FileReader();
    reader.onload = function (event) {
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          canvas.toBlob(
            function (compressedBlob) {
              callback(compressedBlob as File);
            },
            'image/jpeg',
            quality,
          );
        }
      };
      img.src = event?.target?.result as string;
    };
    reader.readAsDataURL(blob);
  };

  // 及时销毁 editor ，重要！
  useEffect(() => {
    if (editor) {
      const { $textArea } = DomEditor.getTextarea(editor);
      if ($textArea == null) return;
      $textArea.on('keydown', (e: any) => {
        if (e.altKey == true && e.key === 'Enter') {
          editor.insertBreak();
          e.preventDefault();
        } else if (e.key === 'Enter') {
          onSendMessage(editor.getHtml());
          e.preventDefault();
        }
      });
    }
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  return (
    <>
      <div>
        <Editor
          defaultConfig={editorConfig}
          value={html}
          mode={'simple'}
          onCreated={setEditor}
          onChange={(editor) => {
            onChange(editor.getHtml());
          }}
          style={{ height: '40px', overflowY: 'hidden' }}
        />
      </div>
    </>
  );
};

export default EditorText;
