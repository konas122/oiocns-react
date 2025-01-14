import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { kernel, schema } from '@/ts/base';
import { getAllNodes } from '@/ts/base/common/tree';
import { NodeType } from '@/ts/base/enum';
import { Column, ReportTaskTreeNodeView } from '@/ts/base/model';
import { ITarget } from '@/ts/core';
import { DataResource } from '@/ts/core/thing/resource';
import { IReportDistribution } from '@/ts/core/work/assign/distribution/report';
import { AnyHandler, AnySheet } from '@/utils/excel';
import { Excel, generateXlsx } from '@/utils/excel/impl/excel';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, DatePicker, Empty, Space, Spin, Tabs, Tag } from 'antd';
import { Resizable, TreeView } from 'devextreme-react';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { useEffectOnce } from 'react-use';
import cls from './index.module.less';

export interface IProps {
  distribution: IReportDistribution;
}

type NodeDict = { [belongId: string]: ReportTaskTreeNodeView };

interface NodesContext {
  nodes: ReportTaskTreeNodeView[];
  index: NodeDict;
  belongIds: string[];
}

const loadColumns = (
  index: NodeDict,
  target?: ITarget,
  onRemove?: (item: schema.XPeriod) => void,
): Column<schema.XPeriod>[] => {
  const columns: Column<schema.XPeriod>[] = [
    {
      title: '期间',
      dataIndex: 'period',
      valueType: 'text',
      render: (item) => {
        return item.period;
      },
    },
    {
      title: '单位名称',
      dataIndex: 'belongId',
      render: (item) => {
        return <EntityIcon entityId={item.belongId} showName />;
      },
      format: (items) => {
        return index[items.belongId]?.name;
      },
    },
    {
      title: '是否已折旧',
      dataIndex: 'period',
      render: (item) => {
        return (
          <Tag color={item.depreciated ? 'green' : 'red'}>
            {item.depreciated ? '已折旧' : '未折旧'}
          </Tag>
        );
      },
      format: (items) => {
        return items.depreciated ? '已折旧' : '未折旧';
      },
    },
    {
      title: '是否已结账',
      dataIndex: 'closed',
      render: (item) => {
        return (
          <Tag color={item.closed ? 'green' : 'red'}>
            {item.closed ? '已结账' : '未结账'}
          </Tag>
        );
      },
      format: (items) => {
        return items.closed ? '已结账' : '未结账';
      },
    },
  ];
  if (target?.hasRelationAuth()) {
    columns.push({
      title: '操作',
      dataIndex: 'action',
      render: (item) => {
        const periods = target?.resource.genColl<schema.XPeriod>('-financial-period');
        return (
          <Space>
            <a
              onClick={() => {
                periods?.remove(item);
                onRemove?.(item);
              }}>
              删除
            </a>
          </Space>
        );
      },
    });
  }
  return columns;
};

const loadCount = async (resource: DataResource, period: string, belongIds: string[]) => {
  const periods = resource.genColl<schema.XPeriod>('-financial-period');
  const depreciated = await periods.count({
    options: {
      match: {
        period,
        belongId: { _in_: [...belongIds] },
        depreciated: true,
      },
    },
  });
  const closed = await periods.count({
    options: {
      match: {
        period,
        belongId: { _in_: [...belongIds] },
        closed: true,
      },
    },
  });
  return { depreciated, closed };
};

const loadGeneratedData = async (
  target: ITarget,
  period: string,
  page: number,
  size: number,
  belongIds: string[],
) => {
  const periods = target.resource.genColl<schema.XPeriod>('-financial-period');
  return await periods.loadResult({
    requireTotalCount: true,
    options: {
      match: {
        period,
        belongId: { _in_: [...belongIds] },
      },
    },
    skip: (page - 1) * size,
    take: size,
  });
};

const loadNotGenerated = async (target: ITarget, period: string, belongIds: string[]) => {
  let data: any[] = [];
  let success = true;
  while (success) {
    const result = await kernel.collectionAggregate(
      target.id,
      target.space.id,
      target.relations,
      '-financial-period',
      [
        {
          match: {
            period,
            belongId: {
              _in_: belongIds,
            },
          },
        },
        { group: { key: ['belongId'] } },
        { skip: data.length },
        { limit: belongIds.length },
      ],
    );
    if ((result?.data ?? []).length > 0) {
      data.push(...result.data);
    } else {
      success = false;
    }
  }
  const exists = data.map((item: any) => item.belongId);
  const notExists = [...belongIds].filter((belongId) => !exists.includes(belongId));
  return notExists.map((belongId) => {
    return {
      period,
      belongId,
      depreciated: false,
      closed: false,
    } as schema.XPeriod;
  });
};

const ClosingPreview: React.FC<IProps> = (props) => {
  const [loaded, setLoaded] = useState(false);
  const [tree, setTree] = useState<ReportTaskTreeNodeView[]>([]);
  const [period, setPeriod] = useState(props.distribution.period);
  const [loading, setLoading] = useState(false);
  const [belongIds, setBelongIds] = useState<string[]>([]);
  const [depreciated, setDepreciated] = useState<number>(0);
  const [closed, setClosed] = useState<number>(0);
  const context = useRef<NodesContext>({ nodes: [], index: {}, belongIds: [] });

  async function loadTree() {
    let tree: ReportTaskTreeNodeView[] = [];

    const space = props.distribution.target.space;
    const roots = await props.distribution.findReportRootNode(space.id);
    if (roots.length == 0) {
      setLoaded(true);
      return;
    }

    const t = await props.distribution.holder.loadTree();
    if (t) {
      [tree] = await t.loadDistributionTree(roots[0], props.distribution);
    }
    const nodes = getAllNodes(tree);
    context.current = {
      nodes,
      index: nodes
        .filter((item) => item.nodeType == NodeType.Normal)
        .reduce((pre, cur) => {
          pre[cur.belongId] = cur;
          return pre;
        }, {} as { [belongId: string]: ReportTaskTreeNodeView }),
      belongIds: [...new Set(nodes.map((item) => item.belongId))],
    };
    setBelongIds(context.current.belongIds);
    setTree(tree);
    setLoaded(true);
    counting();
  }

  const counting = async () => {
    if (belongIds.length == 0) {
      return;
    }
    const resource = props.distribution.task.directory.resource;
    const result = await loadCount(resource, period, belongIds);
    setDepreciated(result.depreciated);
    setClosed(result.closed);
  };

  useEffectOnce(() => {
    loadTree();
  });

  useEffect(() => {
    counting();
  }, [period, belongIds]);

  if (!loaded) {
    return <Spin>正在加载数据中</Spin>;
  }

  if (tree.length == 0) {
    return <Empty>报表树为空</Empty>;
  }

  return (
    <div className={cls['task']}>
      <div className={cls['content']}>
        <Resizable style={{ width: 400 }}>
          <TreeView
            keyExpr="id"
            dataSource={tree}
            displayExpr="name"
            searchEnabled
            searchExpr="name"
            itemsExpr="children"
            selectionMode="single"
            selectByClick={true}
            expandAllEnabled={false}
            onItemClick={(e) => {
              const nodes = getAllNodes([e.itemData as ReportTaskTreeNodeView]);
              setBelongIds([...new Set(nodes.map((item) => item.belongId))]);
            }}
          />
        </Resizable>
        <div style={{ flex: 1, marginLeft: 20 }}>
          <Tabs
            items={[
              {
                key: 'generated',
                label: (
                  <Space>
                    <span>已生成</span>
                    <Tag>已折旧 {depreciated}</Tag>
                    <Tag>已结账 {closed}</Tag>
                  </Space>
                ),
                children: (
                  <Generated
                    distribution={props.distribution}
                    period={period}
                    context={context.current}
                    belongIds={belongIds}
                  />
                ),
              },
              {
                key: 'notGenerated',
                label: '未生成',
                children: (
                  <NotGenerated
                    distribution={props.distribution}
                    period={period}
                    context={context.current}
                    belongIds={belongIds}
                  />
                ),
              },
            ]}
            tabBarExtraContent={
              <Space>
                <Button
                  key="export"
                  loading={loading}
                  onClick={async () => {
                    setLoading(true);
                    let data: schema.XPeriod[] = [];
                    let pass = true;
                    let page = 1;
                    let size = 1000;
                    let target = props.distribution.target;
                    while (pass) {
                      const result = await loadGeneratedData(
                        target,
                        period,
                        page,
                        size,
                        belongIds,
                      );
                      if (result.data.length == 0) {
                        break;
                      }
                      page += 1;
                      data.push(...(result.data ?? []));
                    }
                    data.push(...(await loadNotGenerated(target, period, belongIds)));
                    generateXlsx(
                      new Excel(props.distribution.task.directory.target.space, [
                        new AnyHandler(
                          new AnySheet(
                            'monthly',
                            '月结情况',
                            loadColumns(context.current.index),
                            data,
                          ),
                        ),
                      ]),
                      '月结情况导出',
                    );
                    setLoading(false);
                  }}>
                  导出
                </Button>
                <DatePicker.MonthPicker
                  key="month"
                  value={moment(period)}
                  onChange={(e) => {
                    if (e) {
                      setPeriod(e.format('YYYY-MM'));
                    }
                  }}
                />
              </Space>
            }
          />
        </div>
      </div>
    </div>
  );
};

interface GenerateProps extends IProps {
  period: string;
  context: NodesContext;
  belongIds: string[];
}

const Generated: React.FC<GenerateProps> = (props) => {
  const target = props.distribution.task.directory.target;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<schema.XPeriod[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(12);
  const loadData = () => {
    setLoading(true);
    loadGeneratedData(target, props.period, page, size, props.belongIds).then(
      (result) => {
        setData(result.data);
        setTotal(result.totalCount);
        setLoading(false);
      },
    );
  };
  useEffect(() => {
    loadData();
  }, [page, size, props.period, props.belongIds]);
  return (
    <ProTable<schema.XPeriod>
      rowKey="id"
      loading={loading}
      search={false}
      options={false}
      dataSource={data}
      pagination={{
        showSizeChanger: true,
        showTitle: true,
        total: total,
        current: page,
        pageSize: size,
        onChange: (page, size) => {
          setPage(page);
          setSize(size);
        },
      }}
      columns={loadColumns({}, target, () => loadData()).map((column) => {
        return {
          ...column,
          render: (_, item) => {
            return column.render?.(item);
          },
        } as ProColumns<schema.XPeriod, 'text'>;
      })}
    />
  );
};

const NotGenerated: React.FC<GenerateProps> = (props) => {
  const target = props.distribution.task.directory.target;
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(12);
  const [periods, setPeriods] = useState<schema.XPeriod[]>([]);
  const loadData = async () => {
    setLoading(true);
    setPeriods(await loadNotGenerated(target, props.period, props.belongIds));
    setLoading(false);
  };
  useEffect(() => {
    loadData();
  }, [props.period, props.belongIds]);
  return (
    <ProTable<schema.XPeriod>
      rowKey="id"
      loading={loading}
      search={false}
      options={false}
      dataSource={periods.slice((page - 1) * size, page * size)}
      pagination={{
        showSizeChanger: true,
        showTitle: true,
        total: periods.length,
        current: page,
        pageSize: size,
        onChange: (page, size) => {
          setPage(page);
          setSize(size);
        },
      }}
      columns={loadColumns({}, target, () => loadData()).map((column) => {
        return {
          ...column,
          render: (_, item) => {
            return column.render?.(item);
          },
        } as ProColumns<schema.XPeriod, 'text'>;
      })}
    />
  );
};

export default ClosingPreview;
