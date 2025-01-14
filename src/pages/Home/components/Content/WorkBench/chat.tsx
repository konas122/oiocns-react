import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { command } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { IFile, ITarget, IWorkTask } from '@/ts/core';
import { loadFileMenus, operatesToMenus } from '@/executor/fileOperate';
import { cleanMenus } from '@/utils/tools';
import DirectoryViewer from '@/components/Directory/views';
import AppLayout from '@/components/MainLayout/appLayout';
import useTimeoutHanlder from '@/hooks/useTimeoutHanlder';
import { targetOperates } from '@/ts/core/public';
interface IProps {
  item: IFile;
  openType: number;
}
// 工作台
const HomeChat: React.FC<IProps> = ({ item, openType }) => {
  if (!item) {
    return <></>;
  }
  const [current, setCurrent] = useState<ITarget | 'disk'>('disk');
  const [currentTag, setCurrentTag] = useState('全部');
  const [focusFile, setFocusFile] = useState<IFile>();
  const [content, setContent] = useState<IFile[]>([]);
  const [submitHanlder, clearHanlder] = useTimeoutHanlder();
  useEffect(() => {
    command.emitter('preview', 'relation', focusFile);
  }, [focusFile]);
  useEffect(() => {
    setCurrentTag('全部');
    const contents: IFile[] = [];
    contents.push(...item.content().filter((i) => i.groupTags.includes('组织群')));

    if (contents.length !== 0) {
      setContent(contents);
      setFocusFile(contents[0]);
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
  return (
    <AppLayout previewFlag={'relation'}>
      <Spin spinning={false} tip={'加载中...'}>
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

export default HomeChat;
