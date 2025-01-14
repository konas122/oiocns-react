import { RangePicker } from '@/components/Common/StringDatePickers/RangePicker';
import CustomBuilder from '@/components/DataStandard/WorkForm/Design/config/formRule/builder';
import OpenFileDialog from '@/components/OpenFileDialog';
import { loadSettingMenu } from '@/components/OpenFileDialog/config';
import SchemaForm from '@/components/SchemaForm';
import FormView from '@/executor/open/form';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { common, model, schema } from '@/ts/base';
import { Node, deepClone } from '@/ts/base/common';
import { IFinancial, IPerson, ITarget } from '@/ts/core';
import { IQuery } from '@/ts/core/work/financial/statistics/query';
import { SumItem } from '@/ts/core/work/financial/statistics/summary';
import { formatDate, formatNumber } from '@/utils';
import { AnyHandler, AnySheet, Excel, generateXlsx } from '@/utils/excel';
import { $confirm } from '@/utils/react/antd';
import { fieldConvert } from '@/utils/tools';
import { CloseOutlined } from '@ant-design/icons';
import {
  ProColumns,
  ProFormColumnsType,
  ProFormInstance,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Input, List, Modal, Select, Space, Spin, Tag, message } from 'antd';
import { TreeView } from 'devextreme-react';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { FieldInfo, MenuItemType } from 'typings/globelType';
import { changeColumns } from '../changes';
import cls from './ledger.module.less';
import { ChangeTable, LedgerModal, OpenProps, SetFormFile } from './ledgerModel';

export interface SummaryColumn {
  label: string;
  prefix: string;
}

const columns: SummaryColumn[] = [
  {
    label: '期初',
    prefix: 'before',
  },
  {
    label: '增加',
    prefix: 'plus',
  },
  {
    label: '减少',
    prefix: 'minus',
  },
  {
    label: '期末',
    prefix: 'after',
  },
];

interface FormProps {
  current: IFinancial | IQuery;
  formType: string;
  finished: () => void;
}

const getName = (user: IPerson, item?: schema.XProperty) => {
  switch (item?.valueType) {
    case '用户型': {
      const target = user.findMetadata<schema.XTarget>(item.speciesId);
      return `${item.name}（${target?.name}）`;
    }
    default:
      return item?.name;
  }
};

const QueryForm: React.FC<FormProps> = (props: FormProps) => {
  const ref = useRef<ProFormInstance>();
  const [loaded, setLoaded] = useState(false);
  const [center, setCenter] = useState(<></>);
  const [sourceFields, setSourceFields] = useState<FieldInfo[]>([]);
  let initialValues: any = { dimensions: [], fields: [] };
  let financial: IFinancial;
  switch (props.formType) {
    case 'updateQuery':
      initialValues = props.current.metadata as schema.XQuery;
      financial = (props.current as IQuery).financial;
      break;
    default:
      financial = props.current as IFinancial;
      break;
  }
  useEffect(() => {
    financial.loadFields().then((fields) => {
      setSourceFields(fieldConvert(fields));
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    return <></>;
  }
  const columns: ProFormColumnsType<schema.XQuery>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      formItemProps: {
        rules: [{ required: true, message: '分类名称为必填项' }],
      },
    },
    {
      title: '代码',
      dataIndex: 'code',
      formItemProps: {
        rules: [{ required: true, message: '分类代码为必填项' }],
      },
    },
    {
      title: '分类维度',
      dataIndex: 'species',
      formItemProps: {
        rules: [{ required: true, message: '分类维度为必填项' }],
      },
      renderFormItem: (_, __, form) => {
        return (
          <Input
            allowClear
            onClick={() => selectOpen('species')}
            value={getName(financial.space.user, form.getFieldValue('species'))}
          />
        );
      },
    },

    {
      title: '扩展维度',
      dataIndex: 'dimensions',
      renderFormItem: (_, __, form) => {
        return (
          <Input
            allowClear
            onClick={() => selectOpen('dimensions')}
            value={(form.getFieldValue('dimensions') || [])
              ?.map((item: schema.XProperty) => getName(financial.space.user, item))
              .join('、')}
          />
        );
      },
    },
    {
      title: '统计字段',
      dataIndex: 'fields',
      formItemProps: {
        rules: [{ required: true, message: '扩展维度为必填项' }],
      },
      renderFormItem: (_, __, form) => {
        return (
          <Input
            allowClear
            onClick={() => selectOpen('fields')}
            value={(form.getFieldValue('fields') || [])
              ?.map((item: any) => item.name)
              .join('、')}
          />
        );
      },
    },
    {
      title: '排除影响维度',
      dataIndex: 'excludes',
      renderFormItem: (_, __, form) => {
        return (
          <Input
            allowClear
            onClick={() => selectOpen('excludes')}
            value={(form.getFieldValue('excludes') || [])
              ?.map((item: any) => item.name)
              .join('、')}
          />
        );
      },
    },
    {
      title: '增加过滤',
      colProps: { span: 24 },
      dataIndex: 'matches',
      renderFormItem: (_, __, form) => {
        return (
          <CustomBuilder
            fields={sourceFields}
            displayText={form.getFieldValue('matches')?.plus ?? '[]'}
            onValueChanged={(value) => {
              const matches = form.getFieldValue('matches') ?? {};
              form.setFieldValue('matches', { ...matches, plus: value });
            }}
          />
        );
      },
    },
    {
      title: '减少过滤',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <CustomBuilder
            fields={sourceFields}
            displayText={form.getFieldValue('matches')?.minus ?? '[]'}
            onValueChanged={(value) => {
              const matches = form.getFieldValue('matches') ?? {};
              form.setFieldValue('matches', { ...matches, minus: value });
            }}
          />
        );
      },
    },
    {
      title: '期初、期末过滤',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <CustomBuilder
            fields={sourceFields}
            displayText={form.getFieldValue('matches')?.time ?? '[]'}
            onValueChanged={(value) => {
              const matches = form.getFieldValue('matches') ?? {};
              form.setFieldValue('matches', { ...matches, time: value });
            }}
          />
        );
      },
    },
    {
      title: '备注信息',
      dataIndex: 'remark',
      valueType: 'textarea',
      colProps: { span: 24 },
      formItemProps: {
        rules: [{ required: true, message: '备注信息为必填项' }],
      },
    },
  ];
  const accepts = (needType: string) => {
    switch (needType) {
      case 'dimensions':
      case 'excludes':
      case 'species':
        return ['变更源'];
      case 'fields':
        return ['可记录的'];
    }
    return [];
  };
  const Bindings = (props: { users: schema.XProperty[] }) => {
    const [target, setTarget] = useState(<></>);
    const [targets, setTargets] = useState<{ [key: string]: ITarget }>({});
    return (
      <div>
        <List<schema.XProperty>
          dataSource={props.users}
          renderItem={(item) => {
            return (
              <Space>
                <span>{item.name}</span>
                <Button
                  size="small"
                  onClick={() => {
                    const key = financial.space.directory.key;
                    const menu = loadSettingMenu(key, true, ['单位']);
                    let value: MenuItemType | undefined;
                    return setTarget(
                      <Modal
                        title="选择组织"
                        open
                        onOk={() => {
                          const target = value?.item?.target;
                          if (value?.item?.target) {
                            item.speciesId = target.id;
                            setTargets({ ...targets, [item.id]: target });
                          }
                          setTarget(<></>);
                        }}
                        onCancel={() => setTarget(<></>)}>
                        <TreeView
                          dataSource={[menu] as any}
                          scrollDirection="vertical"
                          keyExpr="key"
                          selectionMode="single"
                          displayExpr="label"
                          itemsExpr="children"
                          searchEnabled
                          onItemClick={(e) => (value = e.itemData as MenuItemType)}
                        />
                      </Modal>,
                    );
                  }}>
                  绑定组织
                </Button>
                <span>{targets[item.id]?.name}</span>
              </Space>
            );
          }}
        />
        {target}
      </div>
    );
  };
  const binding = async (users: schema.XProperty[]) => {
    if (users.length > 0) {
      await $confirm({
        title: '绑定组织',
        icon: <></>,
        content: <Bindings users={users} />,
      });
      if (users.some((item) => item.speciesId == undefined)) {
        message.error('需绑定所有用户型属性的组织');
        return;
      }
    }
  };
  const selectOpen = async (needType: string) => {
    setCenter(
      <OpenFileDialog
        title={`选择属性`}
        rootKey={props.current.space.directory.spaceKey}
        accepts={accepts(needType)}
        multiple={['dimensions', 'fields', 'excludes'].includes(needType)}
        onCancel={() => setCenter(<></>)}
        onOk={async (files) => {
          if (files.length > 0) {
            let props = deepClone(files.map((i) => i.metadata as schema.XProperty));
            await binding(props.filter((user) => user.valueType == '用户型'));
            switch (needType) {
              case 'dimensions':
                ref.current?.setFieldsValue({ dimensions: props });
                break;
              case 'fields':
                ref.current?.setFieldsValue({ fields: props });
                break;
              case 'species':
                ref.current?.setFieldsValue({ species: props[0] });
                break;
              case 'excludes':
                ref.current?.setFieldsValue({ excludes: props });
                break;
            }
          }
          setCenter(<></>);
        }}
      />,
    );
  };
  return (
    <>
      <SchemaForm<schema.XQuery>
        open
        title={'方案操作'}
        width={640}
        formRef={ref}
        columns={columns}
        initialValues={initialValues}
        rowProps={{
          gutter: [24, 0],
        }}
        layoutType="ModalForm"
        onOpenChange={(open: boolean) => {
          if (!open) {
            props.finished();
          }
        }}
        onFinish={async (values) => {
          values.dimensions = values.dimensions || [];
          values.fields = values.fields || [];
          values.excludes = values.excludes || [];
          switch (props.formType) {
            case 'updateQuery': {
              const query = props.current as IQuery;
              await query.update(values);
              break;
            }
            case 'newQuery': {
              const financial = props.current as IFinancial;
              await financial.createQuery(values);
              break;
            }
          }
          props.finished();
        }}
      />
      {center}
    </>
  );
};

interface QueryProps {
  financial: IFinancial;
  finished: () => void;
}

const QueryList: React.FC<QueryProps> = ({ financial, finished }) => {
  const [queries, setQueries] = useState<IQuery[]>([]);
  const [center, setCenter] = useState(<></>);
  useEffect(() => {
    const id = financial.subscribe(() => {
      financial.loadQueries().then((queries) => setQueries([...queries]));
    });
    return () => {
      financial.unsubscribe(id);
    };
  }, []);
  return (
    <>
      <Modal
        open={true}
        title={'查询方案'}
        maskClosable
        width={'80%'}
        bodyStyle={{ maxHeight: '60vh' }}
        destroyOnClose
        onCancel={finished}
        onOk={finished}>
        <ProTable<IQuery>
          dataSource={queries}
          search={false}
          options={false}
          toolBarRender={() => {
            return [
              <Button
                onClick={() => {
                  setCenter(
                    <QueryForm
                      current={financial}
                      formType="newQuery"
                      finished={() => setCenter(<></>)}
                    />,
                  );
                }}>
                新增查询方案
              </Button>,
            ];
          }}
          columns={[
            {
              title: '序号',
              valueType: 'index',
            },
            {
              title: '编码',
              dataIndex: 'code',
              valueType: 'text',
            },
            {
              title: '名称',
              dataIndex: 'name',
              valueType: 'text',
            },
            {
              title: '分类维度',
              dataIndex: 'species',
              render: (_, record) => {
                return getName(financial.space.user, record.metadata.species);
              },
            },
            {
              title: '扩展维度',
              dataIndex: 'dimensions',
              render: (_, record) => {
                return record.metadata.dimensions
                  .map((d) => getName(financial.space.user, d))
                  .join('、');
              },
            },
            {
              title: '统计字段',
              dataIndex: 'fields',
              render: (_, record) => {
                return record.fields.map((f) => f.name).join('、');
              },
            },
            {
              title: '排除影响维度',
              dataIndex: 'excludes',
              render: (_, record) => {
                return record.excludes.map((f) => f.name).join('、');
              },
            },
            {
              title: '操作',
              valueType: 'option',
              render: (_, record) => {
                return [
                  <a
                    key="edit"
                    onClick={() => {
                      setCenter(
                        <QueryForm
                          current={record}
                          formType="updateQuery"
                          finished={() => setCenter(<></>)}
                        />,
                      );
                    }}>
                    更新
                  </a>,
                  <a key="remove" onClick={() => record.remove()}>
                    删除
                  </a>,
                ];
              },
            },
          ]}
        />
      </Modal>
      {center}
    </>
  );
};

async function loadColumns(
  month: [string, string],
  query: IQuery,
  open: (params: OpenLedger) => void,
): Promise<model.Column<Node<SumItem>>[]> {
  const names = query.fields.map((i) => i.name).join('，');
  const format = (month: string) => formatDate(new Date(month), 'yyyy年MM月');
  const root: model.Column<Node<SumItem>> = {
    title: `${format(month[0])}-${format(month[1])} 资产总账（${names}变动情况）`,
    dataIndex: 'root',
    children: [
      {
        title: `时间：${formatDate(new Date(), 'yyyy年MM月dd日')}`,
        dataIndex: 'current',
        children: [
          {
            title: '分类维度',
            dataIndex: 'name',
            style: { width: 36 },
            format: (row) => {
              return row.data.name;
            },
            render: (row) => {
              return row.data.name;
            },
          },
        ],
      },
    ],
  };
  const belong: model.Column<Node<SumItem>> = {
    title: `单位：${query.space.name}`,
    dataIndex: 'belong',
    children: [],
  };
  query.summary.summaryRecursion<model.Column<Node<SumItem>>>({
    speciesRecord: await query.loadSpecies(),
    dimensions: query.dimensions.map((item) => item.id),
    dimensionPath: 'root',
    context: belong,
    summary: (path, context) => {
      query.fields.map((field) => {
        const prop = (key: string) => key + '-' + path + '-' + field.id;
        context?.children?.push({
          dataIndex: field.id,
          title: field.name,
          children: columns.map((prefix) => {
            const dataIndex = prop(prefix.prefix);
            return {
              dataIndex: dataIndex,
              title: prefix.label,
              valueType: '数值型',
              style: { align: 'right', width: 24 },
              render: function (row) {
                const balanced = row.data.balance[path + '-' + field.id];
                return (
                  <a
                    style={{ color: balanced ? '' : 'red' }}
                    onClick={() => open({ prefix, path, field, row })}>
                    {this.format(row)}
                  </a>
                );
              },
              format: function (row) {
                return formatNumber(row.data[dataIndex] ?? 0, 2, true);
              },
            };
          }),
        });
      });
    },
    buildNext: (item, context) => {
      const node: model.Column = {
        title: item.name,
        dataIndex: item.id,
        children: [],
      };
      context?.children?.push(node);
      return node;
    },
  });
  return [{ ...root, children: [...(root.children ?? []), belong] }];
}

interface OpenLedger {
  prefix: SummaryColumn;
  path: string;
  field: model.FieldModel;
  row: common.Node<SumItem>;
}

interface Ledger extends OpenLedger {
  financial: IFinancial;
  query: IQuery;
  month: [string, string];
  data: common.Tree<SumItem>;
  finished: () => void;
}

const ChangeModal: React.FC<Ledger> = (params) => {
  const prefix = params.prefix.prefix;
  const start = params.financial.getOffsetPeriod(params.month[0], -1);
  const form = useRef(
    params.financial.loadSnapshotForm({
      path: params.path,
      prefix: params.prefix.prefix,
      query: params.query,
      node: params.row,
      species: params.query.species,
      dimensions: params.query.dimensions,
      period: prefix == 'before' ? start : params.month[1],
    }),
  );
  switch (prefix) {
    case 'plus':
    case 'minus':
      return (
        <LedgerModal
          financial={params.financial}
          tree={params.data}
          node={params.row}
          species={params.query.species}
          field={params.field}
          prefix={params.prefix.label}
          finished={() => params.finished()}
          child={(open: (params: OpenProps) => void) => {
            const match: any = { ...params.query.parseMatch(prefix), isDeleted: false };
            const path = params.path.split('-');
            for (let i = 0; i < params.query.dimensions.length; i++) {
              match[params.query.dimensions[i].id] = path[i + 1];
            }
            return (
              <ChangeTable
                financial={params.financial}
                between={params.month}
                symbol={prefix == 'plus' ? 1 : -1}
                species={params.query.species}
                tree={params.data}
                node={params.row}
                field={params.field}
                openForm={open}
                match={match}
                export={async () => {
                  let title = `资产总账-${params.financial.space.name} (${params.month[0]}至${params.month[1]})`;
                  let offset = 0;
                  let sheet = new AnySheet(
                    'depreciation',
                    title,
                    changeColumns(params.financial, params.query.species, params.data),
                    [],
                    async () => {
                      const result = await params.financial.loadChanges({
                        species: params.query.species.id,
                        between: params.month,
                        node: params.row,
                        field: params.field,
                        match,
                        symbol: prefix == 'plus' ? 1 : -1,
                        offset: offset,
                        limit: 500,
                      });
                      offset += result.data?.length ?? 0;
                      return result.data ?? [];
                    },
                  );
                  if (sheet) {
                    const excel = new Excel(params.financial.space, [
                      new AnyHandler(sheet),
                    ]);
                    await generateXlsx(excel, title);
                  }
                }}
              />
            );
          }}
        />
      );
    case 'before':
    case 'after': {
      if (form.current) {
        return <FormView form={form.current} finished={() => params.finished()} />;
      }
      return (
        <SetFormFile financial={params.financial} finished={() => params.finished()} />
      );
    }
  }
};

export const build = (
  columns: model.Column<common.Node<SumItem>>[],
): ProColumns<common.Node<SumItem>>[] => {
  return columns.map((item) => {
    return {
      key: item.dataIndex,
      title: item.title,
      align: item.style?.align,
      render: (_, row) => {
        return item.render?.(row);
      },
      hideInTable: item.hidden,
      children: item.children ? build(item.children) : undefined,
    };
  });
};

export const isZero = (
  columns: model.Column<common.Node<SumItem>>[],
  data: common.Tree<SumItem>,
): boolean => {
  const hidden: boolean[] = [];
  for (const column of columns) {
    if (column.children) {
      column.hidden = isZero(column.children, data);
      hidden.push(column.hidden);
    } else {
      hidden.push(data.root.children.every((item) => item.data[column.dataIndex] == 0));
    }
  }
  return hidden.every((item) => item);
};

interface LedgerProps extends IProps {
  period: string;
}

const Ledger: React.FC<LedgerProps> = ({ financial, period }) => {
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState<[string, string]>([period, period]);
  const [query, setQuery] = useState(financial.query);
  const [queries, setQueries] = useState<IQuery[]>(financial.queries);
  const [data, setData] = useState<common.Tree<SumItem> | undefined>();
  const [fields, setFields] = useState<ProColumns<common.Node<SumItem>>[]>([]);
  const columns = useRef<model.Column<common.Node<SumItem>>[]>([]);
  const [center, setCenter] = useState(<></>);
  const [rowKeys, setRowKeys] = useState<readonly React.Key[]>([]);
  const [form, setForm] = useState(financial.form);

  async function loadData() {
    try {
      setLoading(true);
      const queries = await financial.loadQueries();
      if (financial.query) {
        const start = financial.getOffsetPeriod(month[0], -1);
        const species = await financial.query.loadSpecies();
        const data = await financial.query.ledgerSummary({
          start,
          end: month[1],
          records: species,
        });
        columns.current = await loadColumns(month, financial.query, (params) => {
          if (query && data) {
            setCenter(
              <ChangeModal
                path={params.path}
                financial={financial}
                query={query}
                month={month}
                data={data}
                prefix={params.prefix}
                field={params.field}
                row={params.row}
                finished={() => setCenter(<></>)}
              />,
            );
          }
        });
        isZero(columns.current, data);
        setFields(build(columns.current));
        setRowKeys(Object.values(species).map((item) => item.species.id));
        setData(data);
      }
      setQueries(queries);
      setQuery(financial.query);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = financial.subscribe(async () => {
      await financial.loadContent();
      setForm(await financial.loadForm());
      await loadData();
    });
    return () => {
      financial.unsubscribe(id);
    };
  }, [month, query]);

  return (
    <div className={cls.assetLedger + ' asset-page-element'}>
      <Spin spinning={loading}>
        <div className="flex flex-col gap-2" style={{ height: '100%' }}>
          <div className="asset-page-element__topbar">
            <span className={cls.title}>全部资产</span>
            <div className="flex-auto"></div>
            <Space>
              {form && (
                <Tag
                  color="green"
                  icon={<CloseOutlined onClick={() => financial.setForm(undefined)} />}>
                  {form.name}
                </Tag>
              )}
              <Button
                onClick={async () => {
                  setCenter(
                    <SetFormFile
                      financial={financial}
                      finished={() => setCenter(<></>)}
                    />,
                  );
                }}>
                绑定物预览表单
              </Button>
              <a
                onClick={() =>
                  setCenter(
                    <QueryList financial={financial} finished={() => setCenter(<></>)} />,
                  )
                }>
                查询方案
              </a>
              <Select
                style={{ width: 200 }}
                placeholder="选择查询方案"
                value={query?.id}
                onSelect={(value) => {
                  const query = queries.find((item) => item.id == value);
                  if (query) {
                    financial.setQuery(query.metadata);
                  }
                }}
                options={queries?.map((item) => {
                  return {
                    value: item.id,
                    label: item.name,
                  };
                })}
              />
              <div>月份范围</div>
              <RangePicker
                picker="month"
                value={month}
                onChange={setMonth}
                format="YYYY-MM"
                disabledDate={(current) => {
                  if (financial.initialized) {
                    return (
                      current &&
                      (current <
                        moment(financial.getOffsetPeriod(financial.initialized, 1)) ||
                        current > moment(financial.current))
                    );
                  }
                  return false;
                }}
              />
              <Button
                loading={loading}
                onClick={() => {
                  if (data) {
                    let title = `资产总账 (${month[0]}至${month[1]})`;
                    let items = data.extract(rowKeys.map((item) => item.toString()));
                    generateXlsx(
                      new Excel(financial.space, [
                        new AnyHandler(
                          new AnySheet(
                            'depreciation',
                            title,
                            columns.current,
                            items,
                            undefined,
                            (worksheet) => {
                              const fill = (n: number) => new Array(n).fill('');
                              worksheet.addRow([
                                ...fill(1),
                                '领导审核：',
                                ...fill(3),
                                '经办人：',
                                ...fill(3),
                                ...fill(worksheet.columns.length - 9),
                              ]);
                            },
                          ),
                        ),
                      ]),
                      title,
                    );
                  }
                }}>
                导出
              </Button>
              <Button onClick={loadData}>刷新</Button>
            </Space>
          </div>
          <ProTable<Node<SumItem>>
            rowKey={'id'}
            sticky
            columns={fields}
            options={false}
            search={false}
            pagination={false}
            bordered
            size="small"
            expandable={{
              expandedRowKeys: rowKeys,
              onExpandedRowsChange: (expandedRows) => {
                setRowKeys(expandedRows);
              },
            }}
            dataSource={data?.root.children ?? []}
            scroll={{ x: 'max-content' }}
          />
        </div>
      </Spin>
      {center}
    </div>
  );
};

interface IProps {
  financial: IFinancial;
  period?: string;
}

const LedgerTable: React.FC<IProps> = ({ financial, period }) => {
  const [loaded] = useAsyncLoad(() => financial.loadContent(), []);
  if (loaded) {
    period = period ?? financial.current ?? formatDate(new Date(), 'yyyy-MM');
    return <Ledger financial={financial} period={period} />;
  }
  return <Spin spinning={!loaded} />;
};

export default LedgerTable;
