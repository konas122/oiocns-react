import { schema } from '@/ts/base';
import { IForm } from '@/ts/core';
import { ProTable } from '@ant-design/pro-components';
import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';

interface IProps {
  form: IForm;
  thing: schema.XThing;
  finished: () => void;
}

export const HistoryFlowView: React.FC<IProps> = (props) => {
  const [data, setData] = useState<schema.XHistoryFlow[]>([]);
  useEffect(() => {
    if (props.thing.oldId) {
      props.form.loadHistoryFlows(props.thing.oldId).then((res) => {
        setData(res.data ?? []);
      });
    }
  }, []);
  return (
    <Modal
      open
      title="历史流程"
      width={1200}
      style={{ height: '50vh' }}
      onOk={props.finished}
      onCancel={props.finished}>
      <ProTable
        options={false}
        search={false}
        dataSource={data}
        columns={[
          {
            title: '审核人',
            dataIndex: 'approveUser',
          },
          {
            title: '审核状态',
            dataIndex: 'approveStatus',
          },
          {
            title: '审核状态',
            dataIndex: 'approveNode',
          },
          {
            title: '审核时间',
            dataIndex: 'approveTime',
          },
          {
            title: '审核时间',
            dataIndex: 'approveTime',
          },
          {
            title: '评论',
            dataIndex: 'approveComment',
          },
        ]}
      />
    </Modal>
  );
};
