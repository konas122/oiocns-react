import FullScreenModal from '@/components/Common/fullScreen';
import GenerateThingTable from '@/executor/tools/generate/thingTable';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { model, schema } from '@/ts/base';
import { Acquire, Acquiring, Status } from '@/ts/core/work/executor/acquire';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import { Badge, Button, Modal, Progress, Space, Table, Tabs } from 'antd';
import CustomStore from 'devextreme/data/custom_store';
import React, { ReactNode, useEffect, useState } from 'react';

interface IProps {
  executor: Acquire;
  acquires: Acquiring[];
  formData: Map<string, model.FormEditData>;
  finished: () => void;
}

export const AcquireScreen: React.FC<IProps> = (props) => {
  const [acquires, setAcquire] = useState<Acquiring[]>(props.acquires);
  useEffect(() => {
    const id = props.executor.command.subscribe(() => {
      setAcquire([...props.executor.acquires]);
    });
    return () => {
      props.executor.command.unsubscribe(id);
    };
  }, []);
  const operate = async (item: Acquiring, data: schema.XThing[]) => {
    if (item.metadata.selectable) {
      return new Promise<schema.XThing[]>((resolve) => {
        Modal.confirm({
          title: '选择',
          width: '80%',
          content: (
            <Selection
              item={item}
              data={data}
              onChange={(changed) => {
                data = changed;
              }}
            />
          ),
          onOk: () => resolve(data),
          onCancel: () => resolve([]),
        });
      });
    }
    return data;
  };
  return (
    <FullScreenModal
      title={'数据申领'}
      open
      fullScreen
      onOk={props.finished}
      onCancel={props.finished}>
      <Tabs
        tabBarExtraContent={
          <Button
            type="primary"
            size="small"
            ghost
            loading={acquires.some((item) => item.status == Status.Running)}
            onClick={() => props.executor.handlingExecute(operate)}>
            批量执行
          </Button>
        }
        items={[...new Set(acquires.map((item) => item.metadata.typeName))].map(
          (item) => {
            const source = acquires.filter((acquire) => acquire.typeName == item);
            const runnings = source.filter((item) => item.status == Status.Running);
            return {
              key: item,
              label: <Badge count={runnings.length}>{item}</Badge>,
              children: (
                <Table<Acquiring>
                  rowKey="key"
                  style={{ marginTop: 8 }}
                  size="small"
                  dataSource={source}
                  pagination={false}
                  columns={[
                    {
                      key: 'typeName',
                      title: '类型',
                      dataIndex: 'typeName',
                      align: 'center',
                    },
                    { key: 'code', title: '编码', dataIndex: 'code', align: 'center' },
                    { key: 'name', title: '名称', dataIndex: 'name', align: 'center' },
                    {
                      key: 'progress',
                      title: '进度',
                      width: 400,
                      align: 'center',
                      render: (_, item) => {
                        if (['标准', '应用'].includes(item.metadata.typeName)) {
                          return <></>;
                        }
                        return <Progress percent={item.progress} />;
                      },
                    },
                    {
                      key: 'status',
                      title: '状态',
                      dataIndex: 'status',
                      align: 'center',
                      render: (_, item) => {
                        switch (item.status) {
                          case Status.Running:
                            return <LoadingOutlined color="blue" />;
                          case Status.Completed:
                            return <CheckCircleOutlined color="green" />;
                          case Status.Error:
                            return <CloseCircleOutlined color="red" />;
                          case Status.Pause:
                            return <PauseCircleOutlined color="yellow" />;
                        }
                      },
                    },
                    {
                      key: 'action',
                      title: '操作',
                      align: 'center',
                      render: (_, item) => {
                        const restart = (
                          <Button
                            key="restart"
                            type="primary"
                            size="small"
                            ghost
                            onClick={() => item.restart(operate)}>
                            重新执行
                          </Button>
                        );
                        switch (item.status) {
                          case Status.Running:
                            return (
                              <Button
                                type="primary"
                                size="small"
                                ghost
                                onClick={() => item.pause()}>
                                暂停
                              </Button>
                            );
                          case Status.Pause:
                            return (
                              <Button
                                type="primary"
                                size="small"
                                ghost
                                onClick={() => item.start(operate)}>
                                执行
                              </Button>
                            );
                          case Status.Completed: {
                            const content: ReactNode[] = [];
                            content.push(restart);
                            return <Space>{content}</Space>;
                          }
                          case Status.Error:
                            return restart;
                        }
                      },
                    },
                  ]}
                />
              ),
            };
          },
        )}
      />
    </FullScreenModal>
  );
};

interface SelectionProps {
  item: Acquiring;
  data: schema.XThing[];
  onChange: (data: schema.XThing[]) => void;
}

export const Selection: React.FC<SelectionProps> = (props) => {
  const [loaded, combine] = useAsyncLoad(async () => {
    if (props.item.operation.params.form) {
      const result = await props.item.loadForm();
      await result?.loadFields();
      return {
        form: result,
        data: props.data.map((item) => {
          const newItem: schema.XThing = { ...item };
          for (const field of result?.fields ?? []) {
            newItem[field.id] = item[field.code];
            delete newItem[field.code];
          }
          return newItem;
        }),
      };
    }
  });
  if (loaded) {
    return (
      <GenerateThingTable
        form={combine?.form?.metadata}
        fields={combine?.form?.fields ?? []}
        height={'60vh'}
        selection={{
          mode: 'multiple',
          allowSelectAll: true,
          selectAllMode: 'page',
          showCheckBoxesMode: 'always',
        }}
        dataIndex={'attribute'}
        toolbar={{
          visible: true,
          items: [
            {
              name: 'columnChooserButton',
              location: 'after',
            },
            {
              name: 'searchPanel',
              location: 'after',
            },
          ],
        }}
        onSelectionChanged={(e) => {
          props.onChange(
            e.selectedRowsData.map((item) => {
              const newItem: schema.XThing = { ...item };
              for (const field of combine?.form?.fields ?? []) {
                if (item[field.id]) {
                  newItem[field.code] = item[field.id];
                  delete newItem[field.id];
                }
              }
              return newItem;
            }),
          );
        }}
        dataSource={
          new CustomStore({
            key: 'id',
            async load() {
              return { data: combine?.data ?? [], totalCount: props.data.length };
            },
          })
        }
        remoteOperations={true}
      />
    );
  }
};
