import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import SchemaForm from '@/components/SchemaForm';
import { schema } from '@/ts/base';
import { XSubscription } from '@/ts/base/schema';
import { IFile } from '@/ts/core';
import { ISubscription } from '@/ts/core/thing/subscribe';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, Modal, Space } from 'antd';
import React, { ReactNode, useEffect, useState } from 'react';

type Request = (params: { current: number; pageSize: number }) => Promise<{
  data: schema.XRevision<schema.XEntity>[];
  success: boolean;
  total: number;
}>;

interface IProps {
  request: Request;
  toolBar?: () => ReactNode[];
  operate?: () => ProColumns<schema.XRevision<any>, 'text'>;
  actionRef?: React.Ref<ActionType | undefined>;
}

export const Revisions: React.FC<IProps> = (props) => {
  const loadColumns = () => {
    const columns: ProColumns<schema.XRevision<any>, 'text'>[] = [
      { title: '序号', valueType: 'index', width: 50 },
      {
        title: '变动项',
        dataIndex: 'name',
        render: (_, item) => {
          return <EntityIcon entity={item.data} showName />;
        },
      },
      {
        title: '类型',
        dataIndex: 'typeName',
        render: (_, item) => {
          return item.data.typeName;
        },
      },
      {
        title: '操作',
        dataIndex: 'operate',
        valueType: 'select',
        valueEnum: {
          insert: { text: '创建', status: 'Success' },
          update: { text: '修改', status: 'Warning' },
          delete: { text: '删除', status: 'Error' },
          move: { text: '移动', status: 'Processing' },
        },
        render: (_, item) => {
          switch (item.operate) {
            case 'insert':
              return '创建';
            case 'update':
              return '修改';
            case 'delete':
              return '删除';
            case 'move':
              return '移动';
          }
        },
      },
      {
        title: '变动时间',
        dataIndex: 'updateTime',
        valueType: 'dateTime',
        render: (_, item) => {
          return item.data.updateTime;
        },
      },
      {
        title: '操作人',
        dataIndex: 'createUser',
        render: (_, item) => {
          return <EntityIcon entityId={item.createUser} showName />;
        },
      },
    ];
    const operate = props.operate?.();
    if (operate) {
      columns.push(operate);
    }
    return columns;
  };
  return (
    <ProTable<schema.XRevision<any>>
      rowKey={'id'}
      actionRef={props.actionRef}
      options={false}
      search={false}
      style={{ height: '60vh', overflow: 'auto' }}
      scroll={{ x: 'max-content' }}
      pagination={{ pageSize: 10 }}
      request={(params) => {
        return props.request({
          current: params.current ?? 1,
          pageSize: params.pageSize ?? 10,
        });
      }}
      toolBarRender={() => props.toolBar?.() ?? []}
      columns={loadColumns()}
    />
  );
};

interface SubProps {
  file: IFile;
}

const openRevisions = (item: ISubscription) => {
  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    width: '80%',
    title: '变动明细',
    maskClosable: true,
    onOk: () => modal.destroy(),
    onCancel: () => modal.destroy(),
    content: (
      <Revisions
        request={async (params) => {
          const result = await item.loadRevisions({
            skip: (params.current - 1) * params.pageSize,
            take: params.pageSize,
          });
          return { data: result.data ?? [], success: true, total: result.totalCount };
        }}
      />
    ),
  });
};

const loadColumns = (operate?: () => ProColumns<ISubscription, 'text'>) => {
  const columns: ProColumns<ISubscription, 'text'>[] = [
    { title: '序号', valueType: 'index', width: 50 },
    {
      title: '关系',
      dataIndex: 'targetId',
      render: (_, item) => {
        return (
          <Space direction="vertical">
            {item.metadata.relations.map((targetId) => {
              return <EntityIcon key={targetId} entityId={targetId} showName />;
            })}
          </Space>
        );
      },
    },
    {
      title: '订阅内容',
      dataIndex: 'name',
      render: (_, item) => {
        return item.metadata.name;
      },
    },
    {
      title: '可更新内容',
      dataIndex: 'count',
      render: (_, item) => {
        return <a onClick={() => openRevisions(item)}>{item.remainder}</a>;
      },
    },
    {
      title: '上次同步时间',
      dataIndex: 'syncTime',
      render: (_, item) => {
        return item.metadata.syncTime;
      },
    },
  ];
  const operateColumn = operate?.();
  if (operateColumn) {
    columns.push(operateColumn);
  }
  return columns;
};

export const Subscriptions: React.FC<SubProps> = (props) => {
  const manager = props.file.directory.target.space.manager;
  const [loadings, setLoadings] = useState<{ [key: string]: boolean }>({});
  const [subscribes, setSubscribes] = useState<ISubscription[]>([]);
  useEffect(() => {
    const id = manager.subscribe(async () => {
      await Promise.all(manager.subscriptions.map((item) => item.counting()));
      setSubscribes([...manager.subscriptions]);
    });
    return () => {
      manager.unsubscribe(id);
    };
  }, []);
  return (
    <ProTable<ISubscription>
      rowKey={'id'}
      options={false}
      search={false}
      pagination={false}
      style={{ height: '60vh', overflow: 'auto' }}
      scroll={{ x: 'max-content', y: '36vh' }}
      dataSource={subscribes}
      columns={loadColumns(() => {
        return {
          title: '操作',
          dataIndex: 'actions',
          render: (_, item) => {
            return (
              <Space>
                <Button
                  loading={loadings[item.id]}
                  key="update"
                  type="primary"
                  ghost
                  size="small"
                  onClick={async () => {
                    setLoadings({ ...loadings, [item.id]: true });
                    await item.syncing();
                    setLoadings({ ...loadings, [item.id]: false });
                  }}>
                  更新
                </Button>
              </Space>
            );
          },
        };
      })}
    />
  );
};

interface SingleProps {
  subscribe: ISubscription;
  onFinished: () => void;
}

export const Subscription: React.FC<SingleProps> = (props) => {
  return (
    <SchemaForm<XSubscription>
      layoutType="ModalForm"
      open
      title={'订阅信息'}
      initialValues={props.subscribe.metadata}
      onOpenChange={(open: boolean) => {
        if (!open) {
          props.onFinished();
        }
      }}
      columns={[
        {
          title: '关系',
          dataIndex: 'targetId',
          renderFormItem: () => {
            return (
              <Space direction="vertical">
                {props.subscribe.metadata.relations.map((targetId) => {
                  return <EntityIcon key={targetId} entityId={targetId} showName />;
                })}
              </Space>
            );
          },
        },
        {
          title: '名称',
          dataIndex: 'name',
          readonly: true,
        },
        {
          title: '上次同步时间',
          dataIndex: 'syncTime',
          readonly: true,
        },
        {
          title: '可更新内容',
          renderFormItem: (_) => {
            return (
              <a onClick={() => openRevisions(props.subscribe)}>
                {props.subscribe.remainder}
              </a>
            );
          },
        },
      ]}
      onFinish={() => props.onFinished()}
    />
  );
};
