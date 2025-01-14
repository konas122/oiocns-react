import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import FullScreenModal from '@/components/Common/fullScreen';
import { getJsonText } from '@/utils';
import axios from 'axios';
import './index.less';
import { ProConfigProvider } from '@ant-design/pro-components';
import { FileItemShare } from '@/ts/base/model';
import { shareOpenLink } from '@/utils/tools';
import { MonacoEditor } from '@/components/Common/MonacoEditor';
import { EditorLanguages } from '@/components/Common/MonacoEditor/editor';
interface IProps {
  finished: () => void;
  share: FileItemShare;
}

/** 文件预览 */
const CodeEditor = ({ finished, share }: IProps) => {
  const [mdContent, setMdContent] = useState(''); // 保存Markdown文本内容
  const onTextChange = React.useCallback((value: string) => {
    setMdContent(value);
  }, []);
  const [language, setLanguage] = useState<EditorLanguages>('markdown');
  const initData = () => {
    switch (share.extension) {
      case '.vue':
        setLanguage('vue');
        break;
      case '.tsx':
        setLanguage('tsx');
        break;
      case '.jsx':
        setLanguage('jsx');
        break;
      case '.js':
        setLanguage('javascript');
        break;
      case '.json':
        setLanguage('json');
        break;
      case '.html':
        setLanguage('html');
        break;
      case '.java':
        setLanguage('java');
        break;
      default:
        break;
    }
    if (share.shareLink) {
      if (share.extension === '.json') {
        getJsonText(shareOpenLink(share.shareLink)).then((data) => {
          setMdContent(data);
        });
        return;
      }
      axios.get(shareOpenLink(share.shareLink)).then((res) => {
        if (res.status === 200) {
          setMdContent(res.data);
        }
      });
    }
  };
  useEffect(() => {
    initData();
  }, []);

  return (
    <ProConfigProvider dark={true}>
      <FullScreenModal
        centered
        open={true}
        width={'1200px'}
        destroyOnClose
        fullScreen
        title={share.name}
        onCancel={() => {
          finished();
        }}>
        <div className={'code'}>
          <div className="right">
            <div
              style={{
                marginBottom: '10px',
                marginLeft: '5px',
                position: 'fixed',
                top: '60px',
              }}>
              {share.name}
            </div>
            <MonacoEditor
              value={mdContent}
              language={language}
              onChange={onTextChange}
            />
          </div>
        </div>
      </FullScreenModal>
    </ProConfigProvider>
  );
};
export default CodeEditor;
