import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { command } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { IFile, IWorkTask } from '@/ts/core';
import { loadFileMenus } from '@/executor/fileOperate';
import { cleanMenus } from '@/utils/tools';
import DirectoryViewer from '@/components/Directory/views';
import OrgIcons from '@/components/Common/GlobalComps/orgIcons';
import AppLayout from '@/components/MainLayout/appLayout';
import useTimeoutHanlder from '@/hooks/useTimeoutHanlder';
import { IReception } from '@/ts/core/work/assign/reception';
interface IProps {
  item: IFile;
  openType: number;
  reception?: IReception[];
}
// 工作台
const HomeWork: React.FC<IProps> = ({ item, openType, reception }) => {
  if (!item || (openType !== 2 && openType !== 3)) {
    return <></>;
  }
  const type = openType === 2 ? '待办' : '任务';
  const [loaded, setLoaded] = useState(true);
  const [currentTag, setCurrentTag] = useState(type);
  const [content, setContent] = useState<IFile[]>(reception || []);
  const [focusFile, setFocusFile] = useState<IFile>();
  const [submitHanlder, clearHanlder] = useTimeoutHanlder();
  useEffect(() => {
    const id = orgCtrl.work.notity.subscribe((..._args) => {
      if (type === '待办') {
        loadContent('待办');
      }
    });
    return () => {
      orgCtrl.work.notity.unsubscribe(id);
    };
  }, []);

  useEffect(() => {
    const id = command.subscribe((type, cmd, ...args: any[]) => {
      if (type != 'data') return;
      switch (cmd) {
        case 'loadMoreData':
          loadTasks(args[0][1], args[0][0]);
          break;
      }
    });
    return () => {
      command.unsubscribe(id);
    };
  }, []);

  useEffect(() => {
    command.emitter('preview', 'work', focusFile);
  }, [focusFile]);

  const contextMenu = (file?: IFile) => {
    return {
      items: cleanMenus(loadFileMenus(file)) || [],
      onClick: ({ key }: { key: string }) => {
        command.emitter('executor', key, file);
      },
    };
  };

  const focusHanlder = (file: IFile | undefined) => {
    if (file && file.key !== focusFile?.key) {
      setFocusFile(file);
    }
  };

  const clickHanlder = (file: IFile | undefined, dblclick: boolean) => {
    if (dblclick && currentTag !== '草稿') {
      clearHanlder();
      if (file) {
        command.emitter('executor', 'open', file);
      }
    } else {
      submitHanlder(() => focusHanlder(file), 200);
    }
  };
  const findTodo = (todos: any, groupName: any) => {
    return todos.filter((item: any) => {
      return item.groupTags.includes(groupName);
    });
  };
  const getBadgeCount = (tag: string) => {
    if (tag === '待办') {
      return findTodo(orgCtrl.work.todos, item.name).length;
    }
    return 0;
  };

  const loadReceptions = () => {
    setLoaded(false);
    orgCtrl.loadReceptions().then((value) => {
      setContent(value);
      setLoaded(true);
    });
  };

  const loadContent = (tag: string) => {
    if (tag?.length < 2) return;
    if (tag === '任务') {
      loadReceptions();
    } else {
      loadTasks(tag, []);
    }
  };
  const loadTasks = (tag: string, args?: IWorkTask[]) => {
    setLoaded(false);
    const oldContent: IWorkTask[] = args || [];
    const newTasks = [...oldContent, ...findTodo(orgCtrl.work.todos, item.name)].sort(
      (a, b) => {
        return (
          new Date(b?.taskdata.updateTime).getTime() -
          new Date(a?.taskdata.updateTime).getTime()
        );
      },
    );
    setCurrentTag(tag);
    setContent([...newTasks]);
    if (
      tag === '待办' &&
      newTasks.length > 0 &&
      (currentTag != tag || focusFile == undefined)
    ) {
      setFocusFile(newTasks[0]);
    }
    setLoaded(true);
  };
  useEffect(() => {
    if (content.length === 0) {
      command.emitter('preview', 'guidance', { empty: true, type: currentTag });
    }
  }, [content]);
  return (
    <AppLayout previewFlag={'work'}>
      <Spin spinning={!loaded} tip={'加载中...'}>
        <div style={{ marginLeft: 10, padding: 2, fontSize: 16 }}>
          <OrgIcons type="navbar/work" />
          <span style={{ paddingLeft: 10 }}>办事</span>
        </div>
        <DirectoryViewer
          isMenu
          extraTags={false}
          currentTag={currentTag}
          height={'calc(100% - 110px)'}
          selectFiles={[]}
          focusFile={focusFile}
          content={content}
          badgeCount={getBadgeCount}
          tagChanged={(t) => loadContent(t)}
          initTags={[type]}
          fileOpen={(entity, dblclick) => clickHanlder(entity as IWorkTask, dblclick)}
          contextMenu={(entity) => contextMenu(entity as IWorkTask)}
        />
      </Spin>
    </AppLayout>
  );
};

export default HomeWork;
