import { useState } from 'react';
import React from 'react';
import { IWork } from '@/ts/core';
import { schema } from '@/ts/base';
import FullScreenModal from '@/components/Common/fullScreen';
import DefaultWayStart from '../default';
import { Button, Tabs } from 'antd';
import { PlusOutlined } from '@ant-design/icons/lib/icons';
import WorkStagging from './stagging';
import { XWorkInstance } from '@/ts/base/schema';
import useObjectUpdate from '@/hooks/useObjectUpdate';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import TaskRecord from './record';
import orgCtrl from '@/ts/controller';
import LoadingView from '@/components/Common/Loading';

interface IProps {
  current: IWork;
  finished: (success: boolean) => void;
}

/** 多tab表格 */
const MultitabTable: React.FC<IProps> = ({ current, finished }) => {
  const [key, forceUpdate] = useObjectUpdate(current);
  const [openType, setOpenType] = useState(0);
  const [activeTabKey, setActiveTabKey] = useState('1');
  const [selectInstance, setSelectInstance] = useState<schema.XWorkInstance>();
  const [loaded, apply] = useAsyncLoad(() => current.createApply(undefined, undefined));
  if (!loaded || !apply) {
    return (
      <div className="loading-page">
        <LoadingView text="配置信息加载中..." />
      </div>
    );
  }
  const loadItems = () => {
    const items = [
      {
        key: '1',
        forceRender: true,
        label: '草稿箱',
        children: (
          <WorkStagging
            key={key}
            apply={apply!}
            onShow={(instance: XWorkInstance) => {
              setSelectInstance(instance);
              setOpenType(1);
            }}
          />
        ),
      },
      {
        key: '2',
        forceRender: true,
        label: '已发起',
        children: <TaskRecord apply={apply!} typeName={'已发起'} />,
      },
      {
        key: '3',
        forceRender: true,
        label: '已完结',
        children: <TaskRecord apply={apply!} typeName={'已办结'} />,
      },
    ];
    return items.map((item) => ({
      ...item,
      children: activeTabKey === item.key ? item.children : <></>,
    }));
  };
  const loadModal = () => {
    if (apply) {
      switch (openType) {
        case 1:
          apply.instanceData = {
            ...apply.instanceData,
            ...eval(`(${selectInstance?.data})`),
            node: apply.instanceData.node,
          };
          return (
            selectInstance && (
              <DefaultWayStart
                apply={apply!}
                work={current}
                content={selectInstance.remark}
                staggingId={selectInstance.id}
                onStagging={() => {
                  setActiveTabKey('1');
                  forceUpdate();
                  setOpenType(0);
                }}
                finished={(success) => {
                  if (success) {
                    finished(success);
                    orgCtrl.user.workStagging.remove(selectInstance);
                    setActiveTabKey('2');
                  } else {
                    setActiveTabKey('1');
                  }
                  setOpenType(0);
                }}
              />
            )
          );
        case 2:
          return (
            <DefaultWayStart
              apply={apply}
              work={current}
              content={''}
              finished={(success) => {
                if (success) {
                  finished(success);
                  setActiveTabKey('2');
                } else {
                  setActiveTabKey('1');
                }
                setOpenType(0);
              }}
              onStagging={() => {
                setActiveTabKey('1');
                forceUpdate();
                setOpenType(0);
              }}
            />
          );
        case 3:
          return;
        default:
          return <></>;
      }
    }
  };
  return (
    <>
      <Tabs
        items={loadItems()}
        activeKey={activeTabKey}
        onChange={(key: string) => setActiveTabKey(key)}
        tabBarExtraContent={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={async () => {
              setSelectInstance(undefined);
              apply.instanceData = {
                ...apply.instanceData,
                data: {},
                primary: {},
                rules: [],
              };
              await current.createThing(apply.instanceData);
              setOpenType(2);
            }}>
            发起办事
          </Button>
        }
      />
      <FullScreenModal
        open={openType > 0}
        centered
        width={'80vw'}
        bodyHeight={'80vh'}
        destroyOnClose
        maskClosable={false}
        title={'发起流程'}
        footer={[]}
        onCancel={() => setOpenType(0)}>
        {loadModal()}
      </FullScreenModal>
    </>
  );
};

export default MultitabTable;
