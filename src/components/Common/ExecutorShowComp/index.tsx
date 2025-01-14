import FormItem from '@/components/DataStandard/WorkForm/Viewer/formItem';
import OpenFileDialog from '@/components/OpenFileDialog';
import SchemaForm from '@/components/SchemaForm';
import { CollectionTable } from '@/executor/operate/entityForm/collectionForm';
import { model, schema } from '@/ts/base';
import { deepClone } from '@/ts/base/common';
import {
  AcquireExecutor,
  FieldModel,
  WebhookExecutor
} from '@/ts/base/model';
import { IWork } from '@/ts/core';
import { ShareIdSet } from '@/ts/core/public/entity';
import { ProFormInstance } from '@ant-design/pro-form';
import ProTable from '@ant-design/pro-table';
import {
  Button,
  Card,
  Checkbox,
  Empty,
  Input,
  message,
  Modal,
  Space,
  Table
} from 'antd';
import { SelectBox } from 'devextreme-react';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import FullScreenModal from '../fullScreen';
import EntityIcon from '../GlobalComps/entityIcon';
import MallOrderSync from './components/MallOrderSync';
import cls from './index.module.less';

interface IProps {
  work: IWork;
  executors: model.Executor[];
  deleteFuc: (id: string) => void;
  onClick?: Function;
}

const ExecutorShowComp: React.FC<IProps> = (props) => {
  return (
    <div className={cls.layout}>
      <div className={cls.title}>已选{props.executors.length}条数据</div>
      <Space direction="vertical">
        {props.executors.map((item: model.Executor) => {
          switch (item.funcName) {
            case '数据申领':
              return (
                <Acquire
                  key={item.id}
                  executor={item}
                  deleteFuc={props.deleteFuc}
                  work={props.work}
                />
              );
            case '字段变更':
              return (
                <FieldChange
                  key={item.id}
                  work={props.work}
                  executor={item}
                  deleteFuc={props.deleteFuc}
                />
              );
            case 'Webhook':
              return (
                <Webhook key={item.id} executor={item} deleteFuc={props.deleteFuc} />
              );
            case '资产领用':
              return (
                <Common key={item.id} executor={item} deleteFuc={props.deleteFuc}>
                  多用于（公益仓、公物仓、商城等）通过集群办事领用数据
                </Common>
              );
            case '任务状态变更':
              return (
                <Common key={item.id} executor={item} deleteFuc={props.deleteFuc}>
                  用于任务状态的回写通知
                </Common>
              );
            case '复制表到子表':
              return (
                <CopyForm
                  key={item.id}
                  work={props.work}
                  executor={item}
                  deleteFuc={props.deleteFuc}
                />
              );

            case '商城订单同步':
              return (
                <MallOrderSync
                  key={item.id}
                  work={props.work}
                  executor={item}
                  deleteFuc={props.deleteFuc}
                />
              );

            default:
              return <></>;
          }
        })}
      </Space>
    </div>
  );
};

interface CommonProps<T extends model.Executor = model.Executor> {
  executor: T;
  deleteFuc: (id: string) => void;
}

interface ExecutorProps extends CommonProps {
  children?: ReactNode | ReactNode[];
  extra?: ReactNode[];
}

export const Common: React.FC<ExecutorProps> = (props) => {
  return (
    <Card
      title={props.executor.funcName}
      extra={
        <Space>
          {...props.extra || []}
          <AiOutlineCloseCircle
            className={cls.closeIcon}
            onClick={() => {
              props.deleteFuc(props.executor.id);
            }}
          />
        </Space>
      }>
      {props.children}
    </Card>
  );
};

interface AcquireProps extends CommonProps<AcquireExecutor> {
  work: IWork;
}

const Acquire: React.FC<AcquireProps> = (props) => {
  const [center, setCenter] = useState(<></>);
  return (
    <Common executor={props.executor} deleteFuc={props.deleteFuc}>
      <Space direction="vertical">
        用于子单位向群管理单位申领数据使用
        <Space>
          <span>数据源单位</span>
          <EntityIcon entityId={props.executor.belongId} showName />
          <Button
            size="small"
            onClick={() =>
              setCenter(<Configuration {...props} finished={() => setCenter(<></>)} />)
            }>
            配置
          </Button>
        </Space>
      </Space>
      {center}
    </Common>
  );
};

interface ConfigurationProps extends AcquireProps {
  finished: () => void;
}

const Configuration: React.FC<ConfigurationProps> = (props) => {
  const [acquires, setAcquires] = useState(props.executor.acquires ?? []);
  const [center, setCenter] = useState(<></>);
  const updateChecked = (id: string, checked: boolean, key: 'enable' | 'selectable') => {
    const acquire = props.executor.acquires.find((item) => item.id == id);
    if (acquire) {
      acquire[key] = checked;
      setAcquires([...props.executor.acquires]);
    }
  };
  const openSelect = (typeName: string, accepts: string[], multiple: boolean = false) => {
    setCenter(
      <OpenFileDialog
        accepts={accepts}
        rootKey={props.work.directory.spaceKey}
        excludeIds={acquires.map((item) => item.id)}
        multiple={multiple}
        onOk={(files) => {
          if (files.length > 0) {
            props.executor.acquires.push(
              ...files.map((file) => {
                const item: model.Acquire = {
                  id: file.id,
                  typeName: typeName,
                  code: file.code,
                  name: file.name,
                  enable: true,
                };
                if (['表单', '基础数据'].includes(item.typeName)) {
                  item.collName = (file.metadata as schema.XForm).collName;
                }
                return item;
              }),
            );
            setAcquires([...props.executor.acquires]);
          }
          setCenter(<></>);
        }}
        onCancel={() => setCenter(<></>)}
      />,
    );
  };
  const openCollection = (typeName: string) => {
    setCenter(
      <CollectionTable
        multiple={true}
        space={props.work.directory.target.space}
        finished={(coll) => {
          if (coll && Array.isArray(coll)) {
            for (const item of coll) {
              const acquire: model.Acquire = {
                id: item.id,
                typeName: typeName,
                code: item.id,
                name: item.alias,
                enable: true,
              };
              props.executor.acquires.push(acquire);
              setAcquires([...props.executor.acquires]);
            }
          }
          setCenter(<></>);
        }}
      />,
    );
  };
  const filter = (row: any, item: any) => {
    if (row.typeName == '办事' && item.typeName == '表单') {
      return true;
    }
    return row.typeName == item.typeName;
  };
  return (
    <>
      <Modal
        width={1200}
        bodyStyle={{ height: '60vh' }}
        title={'迁移配置'}
        open
        onOk={props.finished}
        onCancel={props.finished}>
        <Table
          rowKey={'typeName'}
          size="small"
          columns={[
            { key: 'typeName', title: '迁移类型', render: (item) => item.typeName },
            {
              title: '迁移项数量',
              render: (row) => {
                return acquires.filter((item) => filter(row, item)).length;
              },
            },
            {
              key: 'operate',
              title: '操作',
              render: (_, row) => {
                let binding = <></>;
                switch (row.typeName) {
                  case '标准':
                    binding = (
                      <a onClick={() => openSelect(row.typeName, ['目录'])}>添加</a>
                    );
                    break;
                  case '应用':
                    binding = (
                      <a onClick={() => openSelect(row.typeName, ['应用'])}>添加</a>
                    );
                    break;
                  case '办事':
                    binding = (
                      <Space>
                        <a onClick={() => openSelect('表单', ['表单'], true)}>
                          按表单迁移
                        </a>
                        <a onClick={() => openCollection('办事')}>按集合迁移</a>
                      </Space>
                    );
                    break;
                  case '基础数据':
                    binding = (
                      <a onClick={() => openSelect('基础数据', ['表单'], true)}>
                        按表单迁移
                      </a>
                    );
                    break;
                }
                return binding;
              },
            },
          ]}
          expandable={{
            expandedRowRender: (row) => {
              return (
                <Table
                  rowKey={'id'}
                  size="small"
                  columns={[
                    { key: 'code', title: '编码', dataIndex: 'code', width: 300 },
                    { key: 'name', title: '名称', dataIndex: 'name', width: 300 },
                    {
                      key: 'enable',
                      title: '是否迁移',
                      dataIndex: 'enable',
                      render: (_, item) => {
                        return (
                          <Checkbox
                            checked={item.enable}
                            onChange={(v) => {
                              updateChecked(item.id, v.target.checked, 'enable');
                            }}
                          />
                        );
                      },
                    },
                    {
                      key: 'selectable',
                      title: '是否选择',
                      dataIndex: 'selectable',
                      render: (_, item) => {
                        if (item.typeName == '表单') {
                          return (
                            <Checkbox
                              checked={item.selectable}
                              onChange={(v) => {
                                updateChecked(item.id, v.target.checked, 'selectable');
                              }}
                            />
                          );
                        }
                      },
                    },
                    {
                      key: 'operate',
                      title: '操作',
                      render: (_, item) => {
                        return (
                          <a
                            onClick={() => {
                              props.executor.acquires = props.executor.acquires.filter(
                                (i) => i.id != item.id,
                              );
                              setAcquires([...props.executor.acquires]);
                            }}>
                            删除
                          </a>
                        );
                      },
                    },
                  ]}
                  dataSource={acquires.filter((item) => filter(row, item))}
                  pagination={false}
                />
              );
            },
          }}
          pagination={false}
          dataSource={[
            {
              typeName: '标准',
            },
            {
              typeName: '应用',
            },
            {
              typeName: '办事',
            },
            {
              typeName: '基础数据',
            },
          ]}
        />
      </Modal>
      {center}
    </>
  );
};

interface ChangeProps {
  work: IWork;
  executor: model.FieldsChangeExecutor;
  deleteFuc: (id: string) => void;
}

interface CopyProps {
  work: IWork;
  executor: model.CopyFormExecutor;
  deleteFuc: (id: string) => void;
}

const FieldChange: React.FC<ChangeProps> = (props) => {
  const forms = [...props.work.detailForms, ...props.work.primaryForms];
  const [formId, setFormId] = useState<string>();
  const [changes, setChanges] = useState(props.executor.changes);
  return (
    <Common
      {...props}
      extra={[
        <SelectBox
          key="selectBox"
          width={150}
          showClearButton
          style={{ display: 'inline-block' }}
          value={formId}
          displayExpr={'text'}
          valueExpr={'value'}
          dataSource={forms
            .filter((form) => {
              return props.executor.changes
                .map((change) => change.id)
                .every((formId) => formId != form.id);
            })
            .map((item) => {
              return { text: item.name, value: item.id };
            })}
          onValueChange={(e) => {
            setFormId(e);
          }}
        />,
        <a
          key={'add'}
          onClick={() => {
            if (formId) {
              props.executor.changes.push({
                id: formId,
                name: forms.find((item) => item.id == formId)?.name || '',
                fieldChanges: [],
              });
              setChanges([...props.executor.changes]);
            }
          }}>
          添加
        </a>,
      ]}>
      <FormChangesTable
        work={props.work}
        changes={changes}
        onDel={(formChange: model.FormChange) => {
          props.executor.changes = props.executor.changes.filter(
            (item) => item.id != formChange.id,
          );
          setChanges([...props.executor.changes]);
        }}
      />
    </Common>
  );
};

const CopyForm: React.FC<CopyProps> = (props) => {
  const forms = [...props.work.detailForms, ...props.work.primaryForms];
  const [formIds, setFormIds] = useState<string[]>([]);
  const [changes, setChanges] = useState(props.executor.copyForm);
  const onDel = (index: number) => {
    const _changes = changes;
    _changes.splice(index, 1);
    props.executor.copyForm = _changes;
    setChanges([..._changes]);
  };
  return (
    <Common {...props}>
      <>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <div>
            <SelectBox
              key="selectBox"
              width={120}
              showClearButton
              style={{ display: 'inline-block' }}
              value={formIds[0]}
              displayExpr={'text'}
              valueExpr={'value'}
              dataSource={forms.map((item) => {
                return { text: item.name, value: item.id };
              })}
              onValueChange={(e) => {
                const _formIds = [];
                _formIds[0] = e;
                _formIds[1] = formIds[1];
                setFormIds(_formIds);
              }}
            />
            &nbsp;到&nbsp;
            <SelectBox
              key="selectBox1"
              width={120}
              showClearButton
              style={{ display: 'inline-block' }}
              value={formIds[1]}
              displayExpr={'text'}
              valueExpr={'value'}
              dataSource={forms.map((item) => {
                return { text: item.name, value: item.id };
              })}
              onValueChange={(e) => {
                const _formIds = [];
                _formIds[0] = formIds[0];
                _formIds[1] = e;
                setFormIds(_formIds);
              }}
            />
          </div>
          <a
            key={'add'}
            onClick={() => {
              if (formIds[0] && formIds[1]) {
                const _changes = changes;
                _changes.push([
                  {
                    id: formIds[0],
                    name: forms.find((item) => item.id == formIds[0])?.name || '',
                  },
                  {
                    id: formIds[1],
                    name: forms.find((item) => item.id == formIds[1])?.name || '',
                  },
                ]);
                props.executor.copyForm = _changes;
                setFormIds([]);
                setChanges([..._changes]);
              } else {
                message.error('请选择表单');
              }
            }}>
            添加
          </a>
        </div>
        <p></p>
        {changes.map((item, index) => {
          return (
            <div key={index} style={{ display: 'flex' }}>
              {item.map((child) => {
                return (
                  <div
                    key={child.id}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}>
                    <div>{child.name}</div>
                  </div>
                );
              })}
              <AiOutlineCloseCircle
                className={cls.closeIcon}
                onClick={() => onDel(index)}
                style={{ fontSize: '28px' }}
              />
            </div>
          );
        })}
      </>
    </Common>
  );
};

interface FormChangesProps {
  work: IWork;
  changes: model.FormChange[];
  onDel: (change: model.FormChange) => void;
}

const FormChangesTable: React.FC<FormChangesProps> = (props) => {
  const [center, setCenter] = useState(<></>);
  return (
    <Space style={{ width: '100%' }} direction="vertical">
      {props.changes.map((item, index) => {
        return (
          <div
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}
            key={index}>
            <span>{item.name}</span>
            <Space>
              <span>已设置变更字段 {item.fieldChanges.length} 个</span>
              <a
                onClick={() => {
                  setCenter(
                    <FieldChangeTable
                      work={props.work}
                      formChange={item}
                      finished={() => setCenter(<></>)}
                    />,
                  );
                }}>
                编辑变更字段
              </a>
              <AiOutlineCloseCircle
                className={cls.closeIcon}
                onClick={() => props.onDel(item)}
              />
            </Space>
          </div>
        );
      })}
      {center}
    </Space>
  );
};

interface FieldChangeTableProps {
  work: IWork;
  formChange: model.FormChange;
  finished: (e: model.FieldChange[]) => void;
}

export const FieldChangeTable: React.FC<FieldChangeTableProps> = (props) => {
  const [fieldChanges, setFieldChanges] = useState(props.formChange.fieldChanges);
  const [center, setCenter] = useState(<></>);
  return (
    <>
      <FullScreenModal
        open
        title={'配置变更字段'}
        width={'80vw'}
        destroyOnClose
        onCancel={() => props.finished(fieldChanges)}
        onOk={() => props.finished(fieldChanges)}>
        <ProTable<model.FieldChange>
          search={false}
          options={false}
          tableAlertRender={false}
          dataSource={fieldChanges}
          toolBarRender={() => [
            <Button
              key="value"
              onClick={() =>
                setCenter(
                  <ExecutorForm
                    work={props.work}
                    formChange={props.formChange}
                    onFinished={() => setCenter(<></>)}
                    onSave={(fieldChange) => {
                      props.formChange.fieldChanges.push(fieldChange);
                      setFieldChanges([...props.formChange.fieldChanges]);
                    }}
                  />,
                )
              }>
              新增值变更记录
            </Button>,
            <Button
              key="isDeleted"
              onClick={() => {
                const has = props.formChange.fieldChanges.find(
                  (item) => item.id == 'isDeleted',
                );
                if (!has) {
                  props.formChange.fieldChanges.push({
                    id: 'isDeleted',
                    name: '删除标记',
                    valueType: '布尔型',
                    before: false,
                    beforeName: '未删除',
                    after: true,
                    afterName: '已删除',
                  });
                  setFieldChanges([...props.formChange.fieldChanges]);
                }
              }}>
              添加删除标记
            </Button>,
            <Button
              key="isDeleted"
              onClick={() => {
                const has = props.formChange.fieldChanges.find(
                  (item) => item.id == 'isDeleted',
                );
                if (!has) {
                  props.formChange.fieldChanges.push({
                    id: '527635575122042880',
                    name: '审核时间',
                    valueType: '日期型',
                    before: null,
                    beforeName: '',
                    after: null,
                    afterName: '当前时间',
                  });
                  setFieldChanges([...props.formChange.fieldChanges]);
                }
              }}>
              添加审核时间
            </Button>,
            <Button
              key="belongId"
              onClick={() => {
                const has = props.formChange.fieldChanges.find(
                  (item) => item.id == 'belongId',
                );
                if (!has) {
                  props.formChange.fieldChanges.push({
                    id: 'belongId',
                    name: '归属变更标记',
                    valueType: '用户型',
                    before: '[oldBelongId]',
                    beforeName: '老归属组织',
                    after: '[newBelongId]',
                    afterName: '新归属组织',
                  });
                  setFieldChanges([...props.formChange.fieldChanges]);
                }
              }}>
              添加归属变更标记
            </Button>,
          ]}
          columns={[
            ...changeRecords,
            {
              title: '操作',
              valueType: 'option',
              render: (_, entity) => {
                return (
                  <a
                    onClick={() => {
                      props.formChange.fieldChanges =
                        props.formChange.fieldChanges.filter(
                          (item) => item.id != entity.id,
                        );
                      setFieldChanges([...props.formChange.fieldChanges]);
                    }}>
                    删除
                  </a>
                );
              },
            },
          ]}
        />
      </FullScreenModal>
      {center}
    </>
  );
};

interface FieldChangeFormProps {
  work: IWork;
  formChange: model.FormChange;
  onSave: (fieldChange: model.FieldChange) => void;
  onFinished: () => void;
}

export const changeRecords: any = [
  {
    title: '序号',
    valueType: 'index',
  },
  {
    title: '字段主键',
    valueType: 'text',
    dataIndex: 'id',
  },
  {
    title: '字段名称',
    valueType: 'text',
    dataIndex: 'name',
  },
  {
    title: '字段类型',
    valueType: 'text',
    dataIndex: 'valueType',
  },
  {
    title: '变动前值',
    valueType: 'text',
    dataIndex: 'before',
    render: (value: any) => {
      return `${value}`;
    },
  },
  {
    title: '变动前名称',
    valueType: 'text',
    dataIndex: 'beforeName',
  },
  {
    title: '变动后值',
    valueType: 'text',
    dataIndex: 'after',
    render: (value: any) => {
      return `${value}`;
    },
  },
  {
    title: '变动后名称',
    valueType: 'text',
    dataIndex: 'afterName',
  },
];

export const ExecutorForm: React.FC<FieldChangeFormProps> = (props) => {
  const formRef = useRef<ProFormInstance>();
  const forms = [...props.work.detailForms, ...props.work.primaryForms];
  const form = forms.find((form) => form.id == props.formChange.id);
  const [fields, setFields] = useState<model.FieldModel[]>(form?.fields || []);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    form?.loadContent().then(() => setFields(form.fields));
  }, []);
  if (!form) {
    return (
      <Modal
        open={open}
        title={'未获取到表单'}
        maskClosable
        width={800}
        destroyOnClose
        onCancel={() => setOpen(false)}
        onOk={() => setOpen(false)}>
        <Empty>未获取到表单</Empty>
      </Modal>
    );
  }
  const setField = (field: FieldModel, fieldName: string, value: any) => {
    formRef.current?.setFieldValue(fieldName, value);
    switch (field.valueType) {
      case '选择型':
      case '分类型':
      case '附件型': {
        const lookup = field.lookups?.find((item) => value == item.value);
        formRef.current?.setFieldValue(fieldName + 'Name', lookup?.text);
        break;
      }
      case '描述型':
      case '数值型':
      case '货币型':
      case '日期型':
      case '时间型':
        formRef.current?.setFieldValue(fieldName + 'Name', value);
        break;
      case '用户型':
        formRef.current?.setFieldValue(fieldName + 'Name', ShareIdSet.get(value)?.name);
        break;
    }
  };
  const cloneField = (field: model.FieldModel) => {
    return {
      ...deepClone(field),
      options: { ...field.options, hideField: false, readOnly: false },
    };
  };
  return (
    <>
      <SchemaForm<model.FieldChange>
        open
        title={'字段变更'}
        width={640}
        formRef={formRef}
        columns={[
          {
            title: '字段主键',
            dataIndex: 'id',
            valueType: 'select',
            readonly: true,
            formItemProps: {
              rules: [{ required: true, message: '字段名称为必填项' }],
            },
          },
          {
            title: '字段名称',
            dataIndex: 'name',
            valueType: 'select',
            formItemProps: {
              rules: [{ required: true, message: '字段名称为必填项' }],
            },
            fieldProps: {
              options: fields.map((i) => {
                return {
                  value: i.id,
                  label: i.name,
                  content: i,
                };
              }),
              showSearch: true,
              notFoundContent: (
                <div
                  style={{
                    textAlign: 'center',
                    lineHeight: '50px',
                  }}>
                  未找到该字段名称
                </div>
              ),
              onSelect: (_: string, value: any) => {
                formRef.current?.setFieldValue('id', value.value);
                formRef.current?.setFieldValue('name', value.label);
                formRef.current?.setFieldValue('valueType', value.content.valueType);
              },
            },
          },
          {
            title: '字段类型',
            dataIndex: 'valueType',
            readonly: true,
            formItemProps: {
              rules: [{ required: true, message: '字段类型为必填项' }],
            },
          },
          {
            title: '变动前值',
            dataIndex: 'before',
            colProps: { span: 24 },
            renderFormItem: (_) => {
              const id = formRef.current?.getFieldValue('id');
              const field = fields.find((item) => item.id == id);
              if (field) {
                field.options?.hideField && (field.options.hideField = false);
                const clone = cloneField(field);
                return (
                  <FormItem
                    data={{}}
                    numStr={'一列'}
                    field={clone}
                    belong={props.work.directory.target.space}
                    onValuesChange={(_, value) => setField(clone, 'before', value)}
                    rules={[]}
                    form={form.metadata}
                  />
                );
              }
              return <></>;
            },
          },
          {
            title: '变动前名称',
            dataIndex: 'beforeName',
            colProps: { span: 24 },
            readonly: true,
            renderFormItem: (_) => {
              return <>{formRef.current?.getFieldValue('beforeName')}</>;
            },
          },
          {
            title: '使用规则计算变动值',
            dataIndex: 'switch',
            valueType: 'switch',
            width: 'md',
            colProps: {
              xs: 12,
              md: 20,
            },
          },
          {
            title: '变动后值',
            dataIndex: 'after',
            colProps: { span: 24 },
            formItemProps: {
              rules: [{ required: false, message: '变动后值为必填项' }],
            },
            renderFormItem: (schema: any) => {
              const id = formRef.current?.getFieldValue('id');
              const isRule = formRef.current?.getFieldValue('switch');
              const field = fields.find((item) => item.id == id);
              if (isRule && field) {
                field.valueType = '描述型';
              }
              if (field) {
                const clone = cloneField(field);
                if (schema?.formItemProps) {
                  schema.formItemProps['required'] = !clone.options?.allowNull;
                }
                return (
                  <FormItem
                    data={{}}
                    numStr={'一列'}
                    field={clone}
                    belong={props.work.directory.target.space}
                    onValuesChange={(_, value) => setField(clone, 'after', value)}
                    rules={[]}
                    form={form.metadata}
                  />
                );
              }
              return <></>;
            },
          },
          {
            title: '变动后名称',
            dataIndex: 'afterName',
            colProps: { span: 24 },
            readonly: true,
            renderFormItem: (_) => {
              return <>{formRef.current?.getFieldValue('afterName')}</>;
            },
          },
        ]}
        rowProps={{
          gutter: [24, 0],
        }}
        layoutType="ModalForm"
        onOpenChange={(open: boolean) => {
          if (!open) {
            props.onFinished();
          }
        }}
        onFinish={async (values) => {
          if (values) {
            const field = fields.find((item) => item.id == values.id)!;
            if (!field.options?.allowNull && !values.after) {
              message.error('变动后值不能为空');
              return false;
            }
            props.onSave(values);
          }
          props.onFinished();
        }}
      />
      {}
    </>
  );
};

export const Webhook: React.FC<CommonProps<WebhookExecutor>> = (props) => {
  const [hookUrl, setHookUrl] = useState(props.executor.hookUrl);
  return (
    <Common executor={props.executor} deleteFuc={props.deleteFuc}>
      <Space style={{ width: '100%' }} direction="vertical">
        <span>用于对接外部系统，审核通过后会发送流程信息到指定地点。</span>
        <Input
          placeholder="输入请求地址"
          value={hookUrl}
          onChange={(e) => {
            props.executor.hookUrl = e.target.value;
            setHookUrl(e.target.value);
          }}
        />
      </Space>
    </Common>
  );
};

export default ExecutorShowComp;
