import React, { useEffect, useState } from 'react';
import orgCtrl from '@/ts/controller';
import { ICompany, IWorkTask } from '@/ts/core';
import { useFlagCmdEmitter } from '@/hooks/useCtrlUpdate';
import FullScreenModal from '@/components/Common/fullScreen';
import cls from '../../index.module.less';
import HomeWork from '../../work';
import HomeChat from '../../chat';
import { IReception } from '@/ts/core/work/assign/reception';

interface IProps {
  company: ICompany;
}
interface IWorkList {
  cmd: number;
  title: string;
  count: number;
  content?: IReception[];
}
// 事项详情
const MatterInfo: React.FC<IProps> = (props) => {
  const [openType, setOpenType] = useState<IWorkList | undefined>(undefined);
  const [workList, setWorkList] = useState<IWorkList[]>([
    {
      cmd: 4,
      title: '集群未读',
      count: 0,
    },
    {
      cmd: 2,
      title: '单位待办',
      count: 0,
    },
    {
      cmd: 1,
      title: '单位提醒',
      count: 0,
    },
    {
      cmd: 3,
      title: '单位任务',
      count: 0,
    },
  ]);
  useFlagCmdEmitter('session', () => {
    setMessageCount();
  });

  const findTodo = (todos: IWorkTask[], groupName: string) => {
    return todos.filter((item: IWorkTask) => {
      return item.groupTags.includes(groupName);
    });
  };

  const setMessageCount = () => {
    props.company.loadGroups().then(async (res: any) => {
      let chats = [];
      for (let target of res) {
        chats.push(...target.chats);
      }
      const allMsgChats = chats.filter((i) => i.isMyChat);
      const allMsgCount = allMsgChats.reduce((sum, i) => sum + i.chatdata.noReadCount, 0);
      const _workList = [...workList];
      _workList[0].count = allMsgCount;
      setWorkList(_workList);
    });
  };

  const setWorkCountFn = () => {
    const workId = orgCtrl.work.notity.subscribe(async () => {
      const _workList = [...workList];
      _workList[1].count = findTodo(orgCtrl.work.todos, props.company.name).length;
      setWorkList(_workList);
    });
    orgCtrl.work.notity.unsubscribe(workId);
  };

  useEffect(() => {
    setMessageCount();
    setWorkCountFn();
    loadReceptions();
  }, [props.company]);

  const loadReceptions = async () => {
    const _workList = [...workList];
    const tasks = await orgCtrl.home.current.loadTasks();
    _workList[3].content = tasks;
    _workList[3].count = tasks.length;
    setWorkList(_workList);
  };

  const renderCmdBtn = (item: IWorkList) => {
    const { cmd, title, count } = item;
    return (
      <div className={cls['matter-item']} onClick={() => setOpenType(item)}>
        <div>
          <img src={'/img/home/matt-' + cmd + '.png'} alt="" />
          <span>{title}</span>
        </div>
        <div className={cls['matter-number']}>{count}</div>
      </div>
    );
  };
  return (
    <>
      <div className="cardGroup">
        <div className="cardItem">
          <div className="cardItem-header">
            <span className="title">事项提醒</span>
          </div>
          <div style={{ width: '100%', minHeight: 60 }} className={cls['matter-content']}>
            {workList.map((item) => {
              return renderCmdBtn(item);
            })}
          </div>
          <FullScreenModal
            open={!!openType}
            title={openType ? props.company.name + '的' + openType?.title : '事项'}
            width={'80vw'}
            bodyHeight={'70vh'}
            onCancel={() => setOpenType(undefined)}>
            {openType?.cmd === 4 && (
              <HomeChat item={props.company} openType={openType.cmd}></HomeChat>
            )}
            {openType?.cmd === 2 && (
              <HomeWork item={props.company} openType={openType.cmd}></HomeWork>
            )}
            {openType?.cmd === 3 && (
              <HomeWork
                item={props.company}
                openType={openType.cmd}
                reception={openType.content}></HomeWork>
            )}
          </FullScreenModal>
        </div>
      </div>
    </>
  );
};
export default MatterInfo;
