import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IFile, IWork, IWorkTask, TaskTypeName } from '@/ts/core';
import { command } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { Spin, Image } from 'antd';
import DirectoryViewer from '@/components/Directory/views';
import { loadFileMenus } from '@/executor/fileOperate';
import { cleanMenus, getUuid } from '@/utils/tools';
import useTimeoutHanlder from '@/hooks/useTimeoutHanlder';
import AppLayout from '@/components/MainLayout/appLayout';
import { useFlagCmdEmitter } from '@/hooks/useCtrlUpdate';
import SelectWork from './select';
import FullScreenModal from '@/components/Common/fullScreen';
import OrgIcons from '@/components/Common/GlobalComps/orgIcons';
import message from '@/utils/message';
import { FormEditData } from '@/ts/base/model';
/**
 * 办事-事项清单
 */
const WorkContent: React.FC = () => {
  const currentTag = useRef<string>('待办');
  const [loaded, setLoaded] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [content, setContent] = useState<IFile[]>([]);
  const [viewContent, setViewContent] = useState<IFile[]>([]);
  const [focusFile, setFocusFile] = useState<IFile>();
  const [submitHanlder, clearHanlder] = useTimeoutHanlder();
  const [todoRefresh, setTodoRefresh] = useState<string>();
  const [autoApproval, setAutoApproval] = useState(false);
  const [autoName, setAutoName] = useState('-');
  const ids: string[] = [];
  const [, key] = useFlagCmdEmitter('_commons', () => {
    if (currentTag.current === '常用') {
      loadContent('常用');
    }
  });
  useEffect(() => {
    const id = orgCtrl.work.notity.subscribe((...args) => {
      const [_key, tag] = args;
      if (tag === undefined || tag === '待办') {
        if (currentTag.current === '待办') {
          loadContent('待办');
        } else {
          setTodoRefresh(getUuid());
        }
      } else if (tag === '草稿' && currentTag.current === tag) {
        currentTag.current = tag;
        loadContent(tag);
      }
    });
    return () => {
      orgCtrl.work.notity.unsubscribe(id);
      orgCtrl.work.tiggleAutoApproval(false, [], (msg) => message.info(msg));
    };
  }, []);

  useEffect(() => {
    orgCtrl.work.tiggleAutoApproval(autoApproval, viewContent as IWorkTask[], (msg) =>
      message.info(msg),
    );
  }, [autoApproval, viewContent]);

  useEffect(() => {
    if (['已办', '抄送', '已发起', '已完结'].includes(currentTag.current)) {
      loadContent(currentTag.current);
    }
  }, [autoName]);

  useEffect(() => {
    if (!focusFile) {
      command.emitter('preview', 'guidance', { empty: true, type: currentTag.current });
    }
    command.emitter('preview', 'work', focusFile, currentTag.current);
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
    if (dblclick && currentTag.current !== '草稿') {
      clearHanlder();
      if (file) {
        command.emitter('executor', 'open', file);
      }
    } else {
      submitHanlder(() => focusHanlder(file), 200);
    }
  };

  const getBadgeCount = useCallback(
    (tag: string) => {
      if (tag === '待办') {
        return orgCtrl.work.todos.length;
      }
      return 0;
    },
    [todoRefresh],
  );

  const loadContent = (tag: string) => {
    if (tag?.length < 2) return;
    if (tag === '常用') {
      loadCommons();
    } else if (tag === '任务') {
      loadReceptions();
    } else if (tag === '重载任务') {
      loadReceptions();
    } else if (tag === '草稿') {
      loadDrafts();
    } else {
      command.emitter('preview', 'guidance', {
        empty: content.length == 0,
        loading: true,
        type: tag,
      });
      loadTasks(tag, []);
    }
  };
  const loadCommons = () => {
    setLoaded(false);
    orgCtrl.loadCommons().then((value) => {
      setLoaded(true);
      const data = value.filter((i) => i.typeName === '办事');
      setContent(data);
    });
  };

  const loadDrafts = () => {
    setLoaded(false);
    orgCtrl.work.loadDraft(true).then((value) => {
      setLoaded(true);
      setContent(value);
    });
  };
  const loadTasks = (tag: string, args: IFile[]) => {
    setLoaded(false);
    let reload = false;
    if (tag === '重载待办') {
      tag = '待办';
      reload = true;
    }
    orgCtrl.work
      .loadContent(
        tag as TaskTypeName,
        autoName == '-' ? '' : autoName,
        args.length,
        reload,
      )
      .then((tasks) => {
        tasks.forEach((task) => {
          if (ids.includes(task.taskdata.instanceId)) {
            task.loadExecutors().then(async (executors) => {
              const executor = executors.find(
                (item) =>
                  item.metadata.funcName == '字段变更' ||
                  item.metadata.funcName == '任务状态变更',
              );
              if (!executor || executor.metadata.funcName === '任务状态变更') {
                command.emitter('preview', 'work', undefined);
                if (executor && task.instanceData?.reception) {
                  const formData = new Map<string, FormEditData>();
                  await executor.execute(formData);
                  message.info(task.name + '执行成功！');
                }
              }
            });
          }
        });
        const newTasks = [...args, ...tasks].sort((a, b) => {
          return (
            new Date(b.metadata.updateTime).getTime() -
            new Date(a.metadata.updateTime).getTime()
          );
        });
        setContent([...newTasks]);
        setLoaded(true);
        if (tag == '待办') {
          command.emitter('preview', 'guidance', {
            empty: newTasks.length == 0,
            loading: false,
            type: tag,
          });
        }
      })
      .catch((reason) => {
        message.error(reason);
        setContent([]);
        setLoaded(true);
      });
  };

  const loadReceptions = () => {
    setLoaded(false);
    orgCtrl.loadReceptions().then((value) => {
      setContent(value);
      setLoaded(true);
    });
  };

  const renderMore = () => {
    switch (currentTag.current) {
      case '常用':
        return (
          <div className="chat-leftBar-search_more">
            <Image
              preview={false}
              height={24}
              width={24}
              onClick={() => {
                setSelectOpen(true);
              }}
              src={`/svg/operate/todoMore.svg?v=1.0.1`}
            />
          </div>
        );
      case '待办':
        return (
          <>
            <div className="chat-leftBar-search_more">
              <OrgIcons
                type="/operate/reload"
                size={22}
                notAvatar
                title="重载待办"
                onClick={() => loadContent('重载待办')}
              />
            </div>
            {autoName.length > 1 && (
              <div className="chat-leftBar-search_more">
                <OrgIcons
                  type={`/operate/${autoApproval ? 'setActive' : 'active'}`}
                  size={22}
                  notAvatar
                  title={`${autoApproval ? '停止自动审核' : '开启自动审核'}`}
                  onClick={() => setAutoApproval((pre) => !pre)}
                />
              </div>
            )}
          </>
        );
      case '任务':
        return (
          <div className="chat-leftBar-search_more">
            <OrgIcons
              type="/operate/reload"
              size={22}
              notAvatar
              title="重载任务"
              onClick={() => loadContent('重载任务')}
            />
          </div>
        );
    }
    return <></>;
  };
  return (
    <AppLayout previewFlag={'work'}>
      <Spin spinning={!loaded} tip={'加载中...'}>
        <div key={key} style={{ marginLeft: 10, padding: 2, fontSize: 18 }}>
          <span style={{ paddingLeft: 10 }}>办事</span>
        </div>
        <DirectoryViewer
          isMenu
          extraTags={false}
          currentTag={currentTag.current}
          height={'calc(100% - 110px)'}
          selectFiles={[]}
          focusFile={focusFile}
          content={content}
          badgeCount={getBadgeCount}
          tagChanged={(t) => {
            currentTag.current = t;
            setAutoApproval(false);
            loadContent(t);
          }}
          initTags={['常用', '草稿', '任务', '待办', '已办', '抄送', '已发起', '已完结']}
          fileOpen={(entity, dblclick) => clickHanlder(entity as IWorkTask, dblclick)}
          contextMenu={(entity) => contextMenu(entity as IWorkTask)}
          rightBars={renderMore()}
          onScrollEnd={() => {
            if (['已办', '抄送', '已发起', '已完结'].includes(currentTag.current)) {
              loadTasks(currentTag.current, content);
            }
          }}
          onFilter={(filter) => {
            setAutoName(filter);
            setAutoApproval(false);
          }}
          onFocusFile={(file) => {
            setFocusFile(file as IFile);
          }}
          onViewChanged={(files) => setViewContent(files as IFile[])}
        />
        {selectOpen && (
          <FullScreenModal
            open
            title={'选择办事'}
            onCancel={() => {
              setSelectOpen(false);
            }}
            destroyOnClose
            width={1000}
            bodyHeight={'75vh'}>
            <SelectWork
              onSelected={(work: IWork) => {
                setSelectOpen(false);
                setTimeout(() => {
                  setFocusFile(work);
                }, 500);
              }}
            />
          </FullScreenModal>
        )}
      </Spin>
    </AppLayout>
  );
};
export default WorkContent;
