import { DatePicker } from '@/components/Common/StringDatePickers/DatePicker';
import { common, kernel, model, schema } from '@/ts/base';
import { Node, sleep } from '@/ts/base/common';
import { IFinancial } from '@/ts/core';
import { IConfiguration } from '@/ts/core/work/financial/config/depreciation';
import { IPeriod, Operation, OperationStatus } from '@/ts/core/work/financial/period';
import { SumItem } from '@/ts/core/work/financial/statistics/summary';
import { formatDate, formatNumber } from '@/utils';
import { AnyHandler, AnySheet, Excel, generateXlsx } from '@/utils/excel';
import { ProTable } from '@ant-design/pro-components';
import { Button, Modal, Progress, Select, Table, Tag, message } from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useEffectOnce } from 'react-use';
import { changeColumns } from '../changes';
import Filter from '../filter';
import '../index.less';
import { build } from '../ledger/ledger';
import { ChangeTable, LedgerModal } from '../ledger/ledgerModel';
import { DepreciationTemplate } from './template';

interface IProps {
  financial: IFinancial;
  current: IPeriod;
  config: IConfiguration;
}

let summaries = (
  period: IPeriod,
  dimension: schema.XProperty,
  open: (node: common.Node<SumItem>, type: string) => void,
): model.Column<common.Node<SumItem>>[] => {
  return [
    {
      title: `资产大类折旧汇总${period.deprecated ? '（已确认计提）' : '（未确认计提）'}`,
      dataIndex: 'root',
      children: [
        {
          title: `期间：${formatDate(new Date(period.period), 'yyyy年MM月')}`,
          dataIndex: 'current',
          children: [
            {
              title: dimension.name,
              dataIndex: 'name',
              style: { align: 'left', width: 42 },
              format: (row) => {
                return row.data.name;
              },
              render: function (row) {
                return row.data.name;
              },
            },
          ],
        },
        {
          title: `单位：${period.space.name}`,
          dataIndex: 'belong',
          children: [
            {
              title: '本月计提折旧',
              dataIndex: 'current',
              valueType: '数值型',
              style: { align: 'right', width: 36 },
              format: function (r) {
                const value = r.data['current-root-change'] ?? 0;
                return formatNumber(value, 2, true);
              },
              render: function (r) {
                return <a onClick={() => open(r, this.dataIndex)}>{this.format?.(r)}</a>;
              },
            },
            {
              title: '本月增加折旧',
              dataIndex: 'plus',
              valueType: '数值型',
              style: { align: 'right', width: 36 },
              format: function (r) {
                return formatNumber(r.data['plus-root-change'] ?? 0, 2, true);
              },
              render: function (r) {
                return <a onClick={() => open(r, this.dataIndex)}>{this.format?.(r)}</a>;
              },
            },
            {
              title: '本月减少折旧',
              dataIndex: 'minus',
              valueType: '数值型',
              style: { align: 'right', width: 36 },
              format: function (r) {
                return formatNumber(r.data['minus-root-change'] ?? 0, 2, true);
              },
              render: function (r) {
                return <a onClick={() => open(r, this.dataIndex)}>{this.format?.(r)}</a>;
              },
            },
            {
              title: '合计',
              dataIndex: 'sum',
              valueType: '数值型',
              style: { align: 'right', width: 36 },
              format: function (r) {
                const result =
                  +(r.data['current-root-change'] ?? 0) +
                  +(r.data['plus-root-change'] ?? 0) -
                  +(r.data['minus-root-change'] ?? 0);
                return formatNumber(result ?? 0, 2, true);
              },
              render: function (r) {
                return <a onClick={() => open(r, this.dataIndex)}>{this.format?.(r)}</a>;
              },
            },
          ],
        },
      ],
    },
  ];
};

const Depreciation: React.FC<IProps> = ({ financial, current, config }) => {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(current);
  const [depreciated, setDepreciated] = useState(current.deprecated);
  const [progress, setProgress] = useState(0);
  const [center, setCenter] = useState(<></>);
  const [operating, setOperating] = useState(false);
  const [curDimension, setCurDimension] = useState(config.metadata?.curDimension);
  const [title] = useState(`资产折旧-${financial.space.name} (${period.period})`);
  const [rowKeys, setRowKeys] = useState<readonly React.Key[]>([]);
  const [data, setData] = useState<common.Tree<SumItem> | undefined>();
  const [columns, setColumns] = useState<model.Column<common.Node<SumItem>>[]>([]);

  const waiting = async (period: IPeriod) => {
    if (period.metadata.operationId) {
      setLoading(true);
      setOperating(true);
      try {
        await loadingOperation(period);
      } finally {
        setOperating(false);
        setLoading(false);
      }
    }
  };

  const loadingOperation = async (period: IPeriod) => {
    var progress = true;
    while (progress) {
      const log = await period.loadOperationLog();
      await common.sleep(500);
      switch (log?.status) {
        case OperationStatus.Working:
          setProgress(log.progress);
          break;
        default:
          setProgress(0);
          if (log?.status == OperationStatus.Error) {
            message.error(log.error);
          }
          progress = false;
          break;
      }
    }
  };

  const init = async (period: IPeriod) => {
    if (config.metadata?.curDimension) {
      const log = await period.loadOperationLog();
      if (log) {
        await waiting(period);
        await loadData(period);
      } else {
        if (!period.deprecated) {
          operate('Calculate');
        }
      }
    }
  };

  const operate = async (operation: Operation) => {
    try {
      await period.depreciation(operation);
      await sleep(100);
      await period.loadMetadata();
      await waiting(period);
      await period.loadMetadata();
      setDepreciated(period.deprecated);
      await loadData(period);
    } catch (e) {
      if (e instanceof Error) {
        message.error(e.message);
      }
    }
  };

  const loadData = async (period: IPeriod) => {
    const dimension = config.metadata?.curDimension;
    if (dimension) {
      const result = await config.loadSpecies();
      setRowKeys(Object.values(result).map((item) => item.species.id));
      const data = await period.depreciationSummary({
        record: result,
        dimension: dimension,
      });
      loadColumns(period, data);
      setData(data);
    }
  };

  const loadColumns = (period: IPeriod, data: common.Tree<SumItem>) => {
    const dimension = config.metadata?.curDimension;
    if (dimension) {
      const columns = summaries(period, dimension, (row, type) => {
        return open(row, type, data);
      });
      setColumns(columns);
    }
  };

  const genXlsx = async (title: string) => {
    if (curDimension && data) {
      setLoading(true);
      const items = data?.extract(rowKeys.map((item) => item.toString()));
      const species = { ...curDimension, id: 'T' + curDimension.id };
      let offset = 0;
      await generateXlsx(
        new Excel(period.space, [
          new AnyHandler(new AnySheet('depreciation', title, columns, items)),
          new AnyHandler(
            new AnySheet(
              'infos',
              '折旧明细',
              changeColumns(financial, species, data),
              [],
              async () => {
                const result = await period.financial.loadChanges({
                  species: species.id,
                  between: [period.period, period.period],
                  node: data.root,
                  field: config.accumulated!,
                  offset: offset,
                  limit: 500,
                  match: {
                    _or_: [period.parseMatch('plus'), period.parseMatch('minus')],
                  },
                });
                offset += result.data?.length ?? 0;
                return result.data ?? [];
              },
            ),
          ),
        ]),
        title,
      );
      setLoading(false);
    }
  };

  const open = (row: common.Node<SumItem>, type: string, data: common.Tree<SumItem>) => {
    if (!curDimension) {
      return <></>;
    }
    const species = { ...curDimension, id: 'T' + curDimension.id };
    let symbol: number;
    let match: { [key: string]: any } = {};
    switch (type) {
      case 'dimension':
        return <></>;
      case 'current':
        symbol = 1;
        match['name'] = '计提折旧';
        match = { ...match, ...period.parseMatch('plus'), isDeleted: !period.deprecated };
        break;
      case 'plus':
        symbol = 1;
        match['name'] = {
          _ne_: '计提折旧',
        };
        match = { ...match, ...period.parseMatch('plus') };
        break;
      case 'minus':
        symbol = -1;
        match = { ...match, ...period.parseMatch('minus') };
        break;
      case 'sum':
        match = {
          ...match,
          _or_: [period.parseMatch('plus'), period.parseMatch('minus')],
        };
        break;
    }
    setCenter(
      <LedgerModal
        prefix={'增加'}
        finished={() => setCenter(<></>)}
        financial={period.financial}
        tree={data!}
        node={row}
        species={species}
        field={config.accumulated!}
        child={(open) => {
          return (
            <ChangeTable
              between={[period.period, period.period]}
              symbol={symbol}
              financial={period.financial}
              tree={data!}
              node={row}
              species={species}
              field={config.accumulated!}
              openForm={open}
              match={match}
              export={async () => {
                let offset = 0;
                await generateXlsx(
                  new Excel(period.space, [
                    new AnyHandler(
                      new AnySheet(
                        'depreciation',
                        title,
                        changeColumns(financial, species, data),
                        [],
                        async () => {
                          const result = await period.financial.loadChanges({
                            species: species.id,
                            between: [period.period, period.period],
                            node: row,
                            field: config.accumulated!,
                            symbol: symbol,
                            offset: offset,
                            limit: 500,
                            match: match,
                          });
                          offset += result.data?.length ?? 0;
                          return result.data ?? [];
                        },
                      ),
                    ),
                  ]),
                  title,
                );
              }}
            />
          );
        }}
      />,
    );
  };

  useEffectOnce(() => {
    init(period);
  });

  useEffect(() => {
    const id = period.financial.subscribe(async () => {
      setDepreciated(period.deprecated);
      setCurDimension(config.metadata?.curDimension);
      await waiting(period);
      await loadData(period);
    });
    return () => {
      period.financial.unsubscribe(id);
    };
  }, [period, curDimension]);

  interface ILockList {
    LockListData: schema.XThing[];
    onFinished: () => void;
  }
  const LockListDisplay: React.FC<ILockList> = ({ LockListData, onFinished }) => {
    // 定义列数据
    const columns = [
      {
        title: '卡片唯一标识',
        render: (text: string, record: schema.XThing) => (text ? record.id : null),
      },
      {
        title: '卡片名称',
        render: (text: string, record: schema.XThing) => (text ? record.name : null),
      },
      {
        title: '锁的来源单据标识',
        render: (text: string, record: schema.XThing) =>
          text ? record.locks?.exclusion.id : null,
      },
      {
        title: '锁的来源办事名称',
        render: (text: string, record: schema.XThing) =>
          text ? record.locks?.exclusion.name : null,
      },
    ];

    return (
      <>
        <Modal
          title="列表"
          open
          width={800}
          onCancel={onFinished} // 点击关闭按钮时调用onFinished
          footer={null} // 不显示底部操作栏
          style={{
            top: 20,
          }}>
          <Table
            columns={columns}
            dataSource={LockListData}
            pagination={{
              pageSize: 20, // 每页显示10条数据
              pageSizeOptions: ['10', '20', '50', '100'], // 指定每页可以显示多少条
              showTotal: (total) => `共 ${total} 条`, // 显示总数

              current: 1, // 当前页数
              total: LockListData.length, // 总条数
            }} // 不显示分页
            rowKey="id" // 行key设置为id
            scroll={{ y: '400px' } /* 设置垂直方向滚动条高度 */}
          />
        </Modal>
      </>
    );
  };

  return (
    <>
      <div className="asset-page-element">
        <div className="flex flex-col gap-2 h-full">
          <div className="asset-page-element__topbar">
            <div>{title}</div>
            <Tag color={depreciated ? 'green' : 'red'}>
              {depreciated ? '已计提' : '未计提'}
            </Tag>
            {operating && <Progress percent={progress} style={{ width: 200 }} />}
            <div className="flex-auto"></div>
            <Select
              disabled={loading}
              dropdownMatchSelectWidth={false}
              value={curDimension?.id}
              options={config.metadata?.dimensions.map((item) => {
                return {
                  value: item.id,
                  label: item.name,
                };
              })}
              onSelect={(value) => {
                const item = config.metadata?.dimensions.find((item) => item.id == value);
                if (item) {
                  config.setCurDimension(item);
                }
              }}
            />
            {curDimension && (
              <Button loading={loading} onClick={() => genXlsx(title)}>
                导出
              </Button>
            )}
            <Button
              loading={loading}
              onClick={() =>
                setCenter(
                  <DepreciationTemplate
                    financial={financial}
                    onFinished={() => setCenter(<></>)}
                    onCancel={() => setCenter(<></>)}
                  />,
                )
              }>
              折旧模板配置
            </Button>
            <Button
              loading={loading}
              onClick={() => {
                setCenter(
                  <Filter financial={financial} onFinished={() => setCenter(<></>)} />,
                );
              }}>
              设置过滤条件
            </Button>
            <Button
              loading={loading}
              onClick={async () => {
                const lockList = await kernel.collectionLoad<schema.XThing[]>(
                  period.belongId,
                  period.belongId,
                  [period.belongId, period.belongId, period.belongId],
                  '_system-things',
                  {
                    options: {
                      match: {
                        locks: {
                          _exists_: true,
                        },
                      },
                    },
                  },
                );
                if (lockList.data) {
                  console.log(lockList.data);
                  let lockListData = [];
                  lockListData.push(...lockList.data);
                  setCenter(
                    <LockListDisplay
                      LockListData={lockListData}
                      onFinished={() => setCenter(<></>)}
                    />,
                  );
                }
              }}>
              查看锁定的卡片
            </Button>
            {!period.deprecated && (
              <Button loading={loading} onClick={() => operate('Calculate')}>
                计算
              </Button>
            )}
            {!period.deprecated && (
              <Button loading={loading} onClick={() => operate('Confirm')}>
                确认
              </Button>
            )}
            {period.deprecated && period.period == period.financial.current && (
              <Button loading={loading} onClick={() => operate('Revoke')}>
                取消折旧
              </Button>
            )}
            <div>期间</div>
            <DatePicker
              picker="month"
              disabled={loading}
              value={current.period}
              onChange={(value) => {
                for (const item of financial.periods) {
                  if (item.period == value) {
                    setPeriod(item);
                    setDepreciated(item.deprecated);
                    break;
                  }
                }
              }}
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
          </div>
          {curDimension && (
            <ProTable<Node<SumItem>>
              loading={loading}
              rowKey={'id'}
              sticky
              columns={build(columns)}
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
              dataSource={data?.root.children || []}
              scroll={{ y: 'calc(100%)' }}
            />
          )}
        </div>
      </div>
      {center}
    </>
  );
};

export default Depreciation;
