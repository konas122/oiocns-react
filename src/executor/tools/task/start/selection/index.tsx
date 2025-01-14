import FullScreenModal from '@/components/Common/fullScreen';
import { Command, schema } from '@/ts/base';
import { formatDate } from '@/ts/base/common';
import { IForm, IWork, IWorkApply } from '@/ts/core';
import { Badge, Button, Empty, Tabs } from 'antd';
import { DataGrid } from 'devextreme-react';
import CustomStore from 'devextreme/data/custom_store';
import React, { useEffect, useRef, useState } from 'react';
import GenerateThingTable from '../../../generate/thingTable';
import DefaultWayStart from '../default';

interface IProps {
  work: IWork;
  apply: IWorkApply;
  finished?: (success: boolean) => void;
}

const WorkSelection: React.FC<IProps> = ({ apply, work, finished }) => {
  const [selected, setSelected] = useState(false);
  const [command] = useState(new Command());
  const [hasData, setHasData] = useState(false);
  useEffect(() => {
    const id = command.subscribe((type, cmd, args) => {
      if (type == '暂存' && cmd == 'select') {
        const { form, data } = args;
        if (apply.instanceData.node) {
          apply.instanceData.data[form.id] = [
            {
              before: [],
              after: data,
              nodeId: apply.instanceData.node.id,
              rules: [],
              formName: form.name,
              creator: apply.target.userId,
              createTime: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss.S'),
            },
          ];
          setHasData(
            Object.keys(apply.instanceData.data).some(
              (key) => apply.instanceData.data[key].length > 0,
            ),
          );
        }
      }
    });
    return () => {
      return command.unsubscribe(id);
    };
  }, []);
  const loadTitle = () => {
    if (selected) {
      return '发起办事';
    }
    return '数据选择';
  };
  const loadCenter = () => {
    if (!apply.instanceData.node) {
      return <Empty></Empty>;
    }
    if (selected) {
      return <DefaultWayStart apply={apply} work={work} finished={finished} />;
    }
    const allForms = apply.detailForms.flatMap((item) => [
      { form: item, type: '原始' },
      { form: item.storage.form, type: '暂存' },
    ]);
    return (
      <Tabs
        tabBarExtraContent={
          hasData && (
            <Button
              type="primary"
              ghost
              onClick={async () => {
                for (const form of apply.detailForms) {
                  for (const item of apply.instanceData.data[form.id] ?? []) {
                    item.after = await form.storage.genInstanceData(item.after);
                  }
                }
                setSelected(true);
              }}>
              发起办事
            </Button>
          )
        }
        items={allForms.map((formType) => {
          return {
            key: formType.form.key + formType.type,
            label: <Label {...formType} command={command} />,
            children: <Table {...formType} command={command} />,
          };
        })}
      />
    );
  };
  return (
    <FullScreenModal
      open
      title={loadTitle()}
      onOk={() => finished && finished(true)}
      onCancel={() => finished && finished(false)}
      fullScreen
      destroyOnClose
      cancelText={'关闭'}
      width={'80vw'}
      bodyHeight={'70vh'}>
      {loadCenter()}
    </FullScreenModal>
  );
};

interface FormType {
  form: IForm;
  type: string;
  command: Command;
}

const Label: React.FC<FormType> = ({ form, type, command }) => {
  const [count, setCount] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);
  useEffect(() => {
    form.storage.count().then((count) => setCount(count));
    const id = command.subscribe(async (sendType, cmd, args) => {
      if (sendType == type) {
        switch (cmd) {
          case 'refresh':
            setCount(await form.storage.count());
            break;
          case 'select':
            setSelectedCount(args.data.length);
            break;
        }
      }
    });
    return () => {
      command.unsubscribe(id);
    };
  }, []);
  if (type == '原始') {
    return form.name;
  }
  return (
    <Badge count={count}>
      {`（已选择 ${selectedCount} 条）`}
      {form.name}
      {type == '暂存' && '（暂存）'}
    </Badge>
  );
};

const Table: React.FC<FormType> = ({ form, type, command }) => {
  let ref = useRef<DataGrid<schema.XThing, string>>(null);
  const selected = useRef<schema.XThing[]>([]);
  useEffect(() => {
    const id = command.subscribe((sendType, cmd) => {
      if (sendType == type && cmd == 'refresh') {
        ref.current?.instance.refresh();
      }
    });
    return () => {
      command.unsubscribe(id);
    };
  }, []);
  return (
    <GenerateThingTable
      reference={ref}
      form={form.metadata}
      fields={form.fields}
      height={'80vh'}
      selection={{
        mode: 'multiple',
        allowSelectAll: true,
        selectAllMode: 'page',
        showCheckBoxesMode: 'always',
      }}
      dataIndex={type == '暂存' ? 'attribute' : 'property'}
      toolbar={{
        visible: true,
        items: [
          {
            name: 'putIn',
            location: 'after',
            widget: 'dxButton',
            visible: type == '原始',
            options: {
              text: '放入暂存箱',
              onClick: async () => {
                await form.storage.create(selected.current);
                command.emitter('暂存', 'refresh');
              },
            },
          },
          {
            name: 'takeOut',
            location: 'after',
            widget: 'dxButton',
            visible: type == '暂存',
            options: {
              text: '拿出暂存箱',
              onClick: async () => {
                let current = selected.current;
                selected.current = [];
                await form.storage.remove(current);
                command.emitter('暂存', 'refresh');
                command.emitter('暂存', 'select', { form, data: [] });
              },
            },
          },
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
      onSelectionChanged={async (e) => {
        selected.current = e.selectedRowsData;
        if (type == '暂存') {
          command.emitter('暂存', 'select', { form, data: selected.current });
        }
      }}
      dataSource={
        new CustomStore({
          key: 'id',
          async load(loadOptions) {
            loadOptions.filter = form.parseFilter(loadOptions.filter);
            loadOptions.userData = [];
            if (type == '原始') {
              return form.loadThing(loadOptions);
            } else if (type == '暂存') {
              return form.storage.loadThing(loadOptions);
            }
          },
        })
      }
      remoteOperations={true}
    />
  );
};

export default WorkSelection;
