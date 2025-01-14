import { model, schema } from '@/ts/base';
import { Controller } from '@/ts/controller';
import { IWorkTask } from '@/ts/core';
import { Work } from '@/ts/core/work';
import { IExecutor } from '@/ts/core/work/executor';
import { Acquire, Acquiring, Status } from '@/ts/core/work/executor/acquire';
import { Button, message, Progress, Space, Spin, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { useEffectOnce } from 'react-use';
import { AcquireScreen } from './acquire';
import orgCtrl from '@/ts/controller';
import useAsyncLoad from '@/hooks/useAsyncLoad';

interface IProps {
  current: IWorkTask;
  nodeId: string;
  trigger: string;
  formData: Map<string, model.FormEditData>;
  command: Controller;
}

export const Executors: React.FC<IProps> = (props) => {
  const [loaded, executors] = useAsyncLoad(async () => {
    return await props.current.loadExecutors();
  }, [props.current]);
  return (
    <Spin spinning={!loaded}>
      <Space
        style={{ paddingLeft: 20, paddingTop: 10, width: '100%' }}
        direction="vertical">
        {executors
          ?.filter((item) =>
            ['数据申领', '资产领用', 'Webhook'].includes(item.metadata.funcName),
          )
          .map((item, index) => {
            const matched = orgCtrl.user.companys.some((company) => {
              return company.id == item.task.taskdata.applyId;
            });

            switch (item.metadata.funcName) {
              case '资产领用': {
                if (!matched) return <></>;
                return (
                  <AcquireGroupExecutor
                    key={index}
                    current={item}
                    index={index}
                    formData={props.formData}
                    command={props.command}
                  />
                );
              }
              case '数据申领': {
                if (!matched) return <></>;
                return (
                  <AcquireExecutor
                    key={index}
                    current={item}
                    index={index}
                    formData={props.formData}
                    command={props.command}
                  />
                );
              }
              default:
                return (
                  <DefaultExecutor
                    key={index}
                    index={index}
                    current={item}
                    formData={props.formData}
                    command={props.command}
                  />
                );
            }
          })}
      </Space>
    </Spin>
  );
};

interface ExecutorProps {
  index: number;
  current: IExecutor;
  formData: Map<string, model.FormEditData>;
  command: Controller;
}

const AcquireExecutor: React.FC<ExecutorProps> = (props) => {
  const [center, setCenter] = useState(<></>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [acquires, setAcquire] = useState<Acquiring[]>([]);
  const genAcquires = async () => {
    setLoading(true);
    await (props.current as Acquire).genAcquires();
    setLoading(false);
  };
  const loadAcquires = async () => {
    try {
      setLoading(true);
      const results = await (props.current as Acquire).loadAcquires(true);
      setAcquire(results);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };
  useEffectOnce(() => {
    loadAcquires();
  });
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-around' }} key={props.index}>
        <Tag>{props.current.metadata.funcName}</Tag>
        <Progress
          style={{ flex: 1, marginRight: 16 }}
          percent={Number(
            (
              (acquires.filter((item) => item.operation.status == Status.Completed)
                .length *
                100) /
              acquires.length
            ).toFixed(2),
          )}
        />
        {error && <Tag color="red">{error}</Tag>}
        <Space>
          <Button
            type="primary"
            size="small"
            ghost
            disabled={!!error}
            loading={loading}
            onClick={async () => {
              await genAcquires();
              await loadAcquires();
            }}>
            生成迁移项
          </Button>
          <Button
            type="primary"
            size="small"
            ghost
            disabled={!!error || acquires.length == 0}
            loading={loading}
            onClick={() => {
              setCenter(
                <AcquireScreen
                  executor={props.current as Acquire}
                  acquires={acquires}
                  formData={props.formData}
                  finished={() => setCenter(<></>)}
                />,
              );
            }}>
            发起执行
          </Button>
        </Space>
      </div>
      {center}
    </>
  );
};
const AcquireGroupExecutor: React.FC<ExecutorProps> = (props) => {
  const [loading, setLoading] = useState(false);
  useEffectOnce(() => {
    (props.current as Acquire).loadAcquires();
  });
  const getTaskDetailDatas = async (
    work: Work,
    task: IWorkTask,
  ): Promise<schema.XThing[]> => {
    //集群数据集-数据源
    const groupColl = await work.target.directory.resource.genColl<schema.XThing>(
      '_system-things',
    );
    const { data, node } = task.instanceData as model.InstanceDataModel;
    //申领数据
    const detailFormId = node.detailForms[0].id;
    const acquireDataIds = data[detailFormId][0].after.map((item) => item.id);
    return await groupColl.find(acquireDataIds);
  };
  const insertGroupDataToCompany = async () => {
    const { target, task, work } = props.current as any;
    const acquireData = await getTaskDetailDatas(work, task);
    if (acquireData.length === 0) {
      return;
    }
    setLoading(true);
    //目标单位数据集
    const companyColl = await target.directory.resource.genColl('_system-things');
    //判断单位下是否重复
    const alreadyExistData = await companyColl.loadSpace({
      options: {
        match: {
          oldId: { _in_: acquireData.map((item) => item.id) },
        },
      },
    });
    const alreadyExistIds = alreadyExistData.map((item: { oldId: any }) => item.oldId);
    // 插入数据进入单位
    await companyColl.replace(
      acquireData.map((v) => ({
        ...v,
        oldId: v.id,
        belongId: target.id,
        id: alreadyExistIds.includes(v.id)
          ? alreadyExistData.find((item: any) => item.oldId == v.id)!.id
          : 'snowId()',
      })),
    );
    setLoading(false);
    message.success('数据已申领');
  };
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-around' }} key={props.index}>
        <Tag>{props.current.metadata.funcName}</Tag>
        <Progress style={{ flex: 1, marginRight: 16 }} percent={100} />
        <Button
          type="primary"
          size="small"
          ghost
          loading={loading}
          onClick={async () => {
            insertGroupDataToCompany();
          }}>
          发起执行
        </Button>
      </div>
    </>
  );
};
const DefaultExecutor: React.FC<ExecutorProps> = (props) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(props.current.progress);
  useEffect(() => {
    const id = props.current.command.subscribe(() => setProgress(props.current.progress));
    return () => props.current.command.unsubscribe(id);
  }, []);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around' }} key={props.index}>
      <Tag>{props.current.metadata.funcName}</Tag>
      <Progress style={{ flex: 1, marginRight: 10 }} percent={progress} />
      <Button
        size="small"
        loading={loading}
        type="primary"
        onClick={async () => {
          setLoading(true);
          await props.current.execute(props.formData);
          props.command.changCallback();
          setLoading(false);
        }}>
        执行
      </Button>
    </div>
  );
};
