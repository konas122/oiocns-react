import React, { useEffect, useState } from 'react';
import { IFile, ITarget, IWorkTask } from '@/ts/core';
import { command } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import DirectoryViewer from '@/components/Directory/views';
import { loadFileMenus, operatesToMenus } from '@/executor/fileOperate';
import { cleanMenus } from '@/utils/tools';
import useTimeoutHanlder from '@/hooks/useTimeoutHanlder';
import { Button, Spin } from 'antd';
import { targetOperates } from '@/ts/core/public';
import { ImUndo2 } from 'react-icons/im';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import AppLayout from '@/components/MainLayout/appLayout';
import { useFlagCmdEmitter } from '@/hooks/useCtrlUpdate';
/** 关系浏览器 */
const RelationBrowser: React.FC = () => {
  const [current, setCurrent] = useState<ITarget | 'disk'>('disk');
  const [currentTag, setCurrentTag] = useState('全部');
  const [focusFile, setFocusFile] = useState<IFile>();
  const [content, setContent] = useState<IFile[]>([]);
  const [submitHanlder, clearHanlder] = useTimeoutHanlder();
  const [loaded] = useFlagCmdEmitter('');
  useEffect(() => {
    if (loaded) {
      command.emitter('preview', 'relation', focusFile);
    }
  }, [focusFile, loaded]);

  useEffect(() => {
    command.subscribe((type, cmd) => {
      if (type == 'setting') {
        orgCtrl.changCallback();
        setContent([orgCtrl.user, ...orgCtrl.user.companys]);
        setFocusFile(orgCtrl.user);
        command.emitter('preview', 'relation', orgCtrl.user);
      }
    });
  }, []);
  
  useEffect(() => {
    if(content.length > 0) {
      setFocusFile(content[0]);
    }
  }, [content]);

  useEffect(() => {
    setCurrentTag('全部');
    if (current === 'disk') {
      setContent([orgCtrl.user, ...orgCtrl.user.companys])
    } else {
      current.subscribe(() => {
        setContent(current.content())
      })
    }
  }, [current]);
  const contextMenu = (file?: IFile) => {
    const entity = file ?? current;
    if (entity != 'disk') {
      return {
        items: cleanMenus(loadFileMenus(entity)) || [],
        onClick: ({ key }: { key: string }) => {
          command.emitter('executor', key, entity);
        },
      };
    } else {
      return {
        items:
          cleanMenus(
            operatesToMenus(
              [targetOperates.NewCompany, targetOperates.JoinCompany],
              orgCtrl.user,
            ),
          ) || [],
        onClick: ({ key }: { key: string }) => {
          command.emitter('executor', key, orgCtrl.user);
        },
      };
    }
  };

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
          <span style={{ paddingLeft: 6 }}>关系</span>
        )}
      </div>
    );
  };
  return (
    <AppLayout previewFlag={'relation'}>
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
          contextMenu={(entity) => contextMenu(entity as IWorkTask)}
        />
      </Spin>
    </AppLayout>
  );
};

export default RelationBrowser;
