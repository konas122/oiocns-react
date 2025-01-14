import { Card, Table } from 'antd';
import React, { useState, useEffect } from 'react';
import { IForm } from '@/ts/core';
import { schema } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { InstanceDataModel } from '@/ts/base/model';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import WorkForm from '@/executor/tools/workForm';

/**
 * 事项-查看
 */
interface IProps {
  form: IForm;
  thingData: schema.XThing;
}
const columns = [
  {
    title: '单位名称',
    dataIndex: 'belongId',
    render: (text: string) => <EntityIcon entityId={text} showName />,
  },
  {
    title: '审核人',
    dataIndex: 'createUser',
    render: (text: string) => <EntityIcon entityId={text} showName />,
  },
  {
    title: '节点',
    dataIndex: 'title',
  },
  {
    title: '审核时间',
    dataIndex: 'createTime',
  },
  {
    title: '备注信息',
    width: 300,
    dataIndex: 'comment',
  },
];
/**
 * 物-查看
 * @returns
 */
const MatterView: React.FC<IProps> = (props) => {
  if (!props.thingData?.archives) {
    return <p>暂无归档信息</p>;
  }
  const hasDoneTasks = Object.values(props.thingData.archives);
  const instance = hasDoneTasks[0];
  const [task, setTask] = useState<schema.XWorkTask[]>();
  const [data, setData] = useState<InstanceDataModel>();
  const belong =
    orgCtrl.user.companys.find((a) => a.id == instance?.belongId) || orgCtrl.user;

  const getDetail = (id: string, shareId: string, belongId: string) => {
    return orgCtrl.work.loadInstanceDetail(id, shareId, belongId);
  };

  useEffect(() => {
    setTimeout(async () => {
      const detail = instance
        ? await orgCtrl.work.loadInstanceDetail(
            instance.id || instance._id,
            instance.shareId,
            instance.belongId,
          )
        : null;
      if (detail) {
        setTask(detail.tasks?.filter((i) => i.instanceId === instance._id));
        const detailItems = detail.tasks?.filter((i) => i.instanceId === instance._id);
        const item =
          detailItems!.length > 0
            ? await getDetail(
                detailItems![0].instanceId,
                detailItems![0].shareId,
                detailItems![0].belongId,
              ).then((res) => {
                return res?.data;
              })
            : detail.data;
        setData(JSON.parse(item || '{}'));
      }
    }, 0);
  }, []);

  /** 渲染表单 */
  const renderWorkForm = () => {
    if (!data || !task) {
      return <></>;
    }
    const instanceList = [
      {
        title: '开始',
        belongId: instance?.belongId,
        createTime: instance?.createTime,
        createUser: instance?.createUser,
        comment: '提交',
      },
    ];
    task.forEach((tItem) => {
      if (!tItem.records) {
        return;
      }
      const instanceItems: any[] = tItem.records?.map((record: any) => {
        return {
          title: tItem.title,
          belongId: instance?.belongId,
          createTime: record.createTime,
          createUser: record.createUser,
          comment: record.comment ?? '同意',
        };
      });
      instanceList.push(...instanceItems);
    });
    return (
      <>
        {data && (
          <>
            <WorkForm
              allowEdit={false}
              belong={belong}
              nodeId={data.node.id}
              data={data}
            />
            <Table
              title={() => <strong>流程明细</strong>}
              columns={columns}
              size="small"
              dataSource={instanceList}
            />
          </>
        )}
      </>
    );
  };

  return <Card title="办事明细">{renderWorkForm()}</Card>;
};

export default MatterView;
