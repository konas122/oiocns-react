import React, { useState } from 'react';
import { Card, Divider } from 'antd';
import cls from './index.module.less';
import { WorkNodeDisplayModel } from '@/utils/work';
import { IBelong, IWork } from '@/ts/core';
import { model } from '@/ts/base';
import { getUuid } from '@/utils/tools';
import ExecutorShowComp from '@/components/Common/ExecutorShowComp';
import ExecutorConfigModal from '../ApprovalNode/configModal';
interface IProps {
  work: IWork;
  belong: IBelong;
  current: WorkNodeDisplayModel;
  refresh: () => void;
}
/**
 * @description: 数据归档节点配置
 * @return {*}
 */

const EndNode: React.FC<IProps> = (props) => {
  props.current.primaryForms = props.current.primaryForms || [];
  props.current.detailForms = props.current.detailForms || [];
  const [executors, setExecutors] = useState<model.Executor[]>(
    props.current.executors ?? [],
  );
  const [executorModal, setExecutorModal] = useState(false);
  return (
    <div className={cls[`app-roval-node`]}>
      <div className={cls[`roval-node`]}>
        <Card
          type="inner"
          title={
            <div>
              <Divider type="vertical" className={cls['divider']} />
              <span>执行器配置</span>
            </div>
          }
          className={cls[`card-info`]}
          bodyStyle={{ padding: executors && executors.length ? '24px' : '0' }}
          extra={
            <>
              <a
                onClick={() => {
                  setExecutorModal(true);
                }}>
                + 添加
              </a>
            </>
          }>
          {executors && executors.length > 0 && (
            <span>
              <ExecutorShowComp
                work={props.work}
                executors={executors}
                deleteFuc={(id: string) => {
                  var exes = executors.filter((a) => a.id != id);
                  setExecutors(exes);
                  props.current.executors = exes;
                }}
              />
            </span>
          )}
        </Card>
        {executorModal && (
          <ExecutorConfigModal
            refresh={(param) => {
              if (param) {
                executors.push({
                  id: getUuid(),
                  trigger: param.trigger,
                  funcName: param.funcName,
                  changes: [],
                  hookUrl: '',
                  belongId: props.belong.id,
                  acquires: [],
                  copyForm: []
                });
                setExecutors([...executors]);
                props.current.executors = executors;
              }
              setExecutorModal(false);
            }}
            current={props.current}
          />
        )}
      </div>
    </div>
  );
};
export default EndNode;
