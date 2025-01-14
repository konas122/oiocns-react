import React, { useEffect, useState } from 'react';
import { IFile, ITarget } from '@/ts/core';
import { command } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import DirectoryViewer from '@/components/Directory/views';
import useTimeoutHanlder from '@/hooks/useTimeoutHanlder';
import { Button, Spin } from 'antd';
import { ImUndo2 } from 'react-icons/im';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import AppLayout from '@/components/MainLayout/appLayout';
import { useFlagCmdEmitter } from '@/hooks/useCtrlUpdate';

/** 文件浏览器 */
const FileBrowser: React.FC = () => {
  const [current, setCurrent] = useState<ITarget | 'disk'>('disk');
  const [currentTag, setCurrentTag] = useState('全部');
  const [focusFile, setFocusFile] = useState<IFile>();
  const [content, setContent] = useState<IFile[]>([]);
  const [submitHanlder, clearHanlder] = useTimeoutHanlder();
  const [loaded] = useFlagCmdEmitter('');
  useEffect(() => {
    if (loaded) {
      command.emitter('preview', 'store', focusFile);
    }
  }, [focusFile, loaded]);

  useEffect(() => {
    if (content.length > 0) {
      setFocusFile(content[0]);
    }
  }, [content]);

  useEffect(() => {
    setCurrentTag('全部');
    if (current === 'disk') {
      setContent([orgCtrl.user, ...orgCtrl.user.companys]);
    } else {
      current.subscribe(() => {
        setContent(current.content());
      });
    }
  }, [current]);

  const focusHanlder = (file: IFile | undefined) => {
    if (file && file.key !== focusFile?.key) {
      setFocusFile(file);
    }
  };

  const clickHanlder = (file: ITarget | undefined, dblclick: boolean) => {
    if (dblclick) {
      clearHanlder();
      if (file) {
        setCurrent(file);
      }
    } else {
      submitHanlder(() => focusHanlder(file), 300);
    }
  };

  const renderHeader = () => {
    return (
      <div style={{ marginLeft: 10, padding: 2, fontSize: 18, height: 28 }}>
        {current != 'disk' && (
          <Button
            type="link"
            title="返回"
            icon={<ImUndo2 />}
            onClick={() => {
              setFocusFile(current);
              setCurrent(current.superior as ITarget);
            }}
          />
        )}
        {current != 'disk' ? (
          <>
            <EntityIcon entity={current.metadata} disableInfo size={22} />
            <span style={{ paddingLeft: 6 }}>{current.name}</span>
          </>
        ) : (
          <span style={{ paddingLeft: 6 }}>数据</span>
        )}
      </div>
    );
  };
  return (
    <AppLayout previewFlag={'store'}>
      <Spin spinning={!loaded} tip={'加载中...'}>
        {renderHeader()}
        <DirectoryViewer
          isMenu
          initTags={['全部']}
          selectFiles={[]}
          extraTags={true}
          focusFile={focusFile}
          content={content}
          currentTag={currentTag}
          tagChanged={(t) => setCurrentTag(t)}
          fileOpen={(entity, dblclick) => clickHanlder(entity as ITarget, dblclick)}
          contextMenu={() => {
            return {
              items: [],
            };
          }}
        />
      </Spin>
    </AppLayout>
  );
};

export default FileBrowser;
