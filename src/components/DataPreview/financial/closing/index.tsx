import { DatePicker } from '@/components/Common/StringDatePickers/DatePicker';
import { XClosing } from '@/ts/base/schema';
import { IFinancial, ITarget } from '@/ts/core';
import { IPeriod } from '@/ts/core/work/financial/period';
import { formatNumber } from '@/utils';
import { Badge, Button, Modal, Space, Table, Tag, Typography, message } from 'antd';
import { TagBox } from 'devextreme-react';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import Filter from '../filter';
import '../index.less';
import { ClosingTemplate } from './template';

interface IProps {
  financial: IFinancial;
  current: IPeriod;
}

export const Closing: React.FC<IProps> = ({ financial, current }) => {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(current);
  const [closed, setClosed] = useState(current.closed);
  const [center, setCenter] = useState(<></>);
  const [data, setData] = useState(current.closings);
  const [reports, setReports] = useState(financial.reports);

  async function loadData() {
    setLoading(true);
    try {
      if (period.closed) {
        setData(await period.loadClosings());
      } else {
        setData(await period.closingSummary());
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function binding() {
    let parents = financial.space.parentTarget;
    let targets: ITarget[] = [];
    const modal = Modal.confirm({
      title: '月结上报配置',
      icon: <></>,
      width: 600,
      onOk: async () => {
        modal.destroy();
        financial.setReports(
          targets.map((item: ITarget) => {
            return {
              name: item.name,
              targetId: item.id,
              belongId: item.belongId,
              relations: item.relations,
              collName: '-' + financial.periodColl.collName,
            };
          }),
        );
      },
      onCancel: () => modal.destroy(),
      content: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text type="secondary" strong>
            根据监管要求，月结状态需上报至管理集群中，点击下方进行选择。
          </Typography.Text>
          <Typography.Text type="secondary" strong>
            绑定完成后，月结通过时自动上传相关数据。
          </Typography.Text>
          <TagBox
            valueExpr="id"
            displayExpr="name"
            defaultValue={parents
              .filter((item) => reports.some((report) => report.targetId == item.id))
              .map((item) => item.id)}
            dataSource={parents.map((item) => item.metadata)}
            onValueChanged={(e) => {
              targets = parents.filter((item) => {
                return e.value.includes(item.id);
              });
            }}
          />
        </Space>
      ),
    });
  }

  useEffect(() => {
    const id = financial.subscribe(() => {
      setClosed(period.closed);
      setReports(financial.reports);
      loadData();
    });
    return () => {
      financial.unsubscribe(id);
    };
  }, [period]);

  return (
    <>
      <div className="asset-page-element">
        <div className="flex flex-col gap-2 h-full">
          <div className="asset-page-element__topbar">
            <div>资产月结账</div>
            <Tag color={period.deprecated ? 'green' : 'red'}>
              {period.deprecated ? '已折旧' : '未折旧'}
            </Tag>
            <Tag color={closed ? 'green' : 'red'}>{closed ? '已结账' : '未结账'}</Tag>
            <div className="flex-auto"></div>
            <Button
              loading={loading}
              onClick={async () => {
                setLoading(true);
                await financial.reporting(period.metadata);
                setLoading(false);
                message.success('上报成功！');
              }}>
              数据上报
            </Button>
            <Button loading={loading} onClick={() => binding()}>
              绑定上报集群
            </Button>
            {data.length == 0 && (
              <Button
                loading={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const closings = await period.loadClosings(true);
                    if (closings.length == 0) {
                      await period.financial.closingOptions.generateOptions(period.id);
                      await period.financial.periodColl.notity({
                        operate: 'refresh',
                        data: period.metadata,
                      });
                    } else {
                      message.error('当月已生成，无需重复生成！');
                    }
                  } finally {
                    setLoading(false);
                  }
                }}>
                生成模板
              </Button>
            )}
            <Button
              loading={loading}
              onClick={() =>
                setCenter(
                  <ClosingTemplate
                    financial={financial}
                    onFinished={() => setCenter(<></>)}
                    onCancel={() => setCenter(<></>)}
                  />,
                )
              }>
              月结模板配置（修改时下月生效）
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
            {!closed && (
              <Button
                loading={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    setData(await period.trialBalance());
                  } catch (error) {
                    message.error((error as Error).message);
                  } finally {
                    setLoading(false);
                  }
                }}>
                试算平衡
              </Button>
            )}
            {!closed && (
              <Button
                loading={loading}
                onClick={async () => {
                  if (reports.length == 0) {
                    binding();
                    return;
                  }
                  setLoading(true);
                  try {
                    await period.monthlySettlement();
                  } catch (error) {
                    message.error((error as Error).message);
                  } finally {
                    setLoading(false);
                  }
                }}>
                结账
              </Button>
            )}
            <div>期间</div>
            <DatePicker
              picker="month"
              value={period.period}
              onChange={(value) => {
                for (const item of financial.periods) {
                  if (item.period == value) {
                    setPeriod(item);
                    setClosed(item.closed);
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
          <Table<XClosing>
            rowKey={'id'}
            sticky
            columns={[
              {
                title: '会计科目代码',
                dataIndex: 'code',
              },
              {
                title: '会计科目名称',
                dataIndex: 'name',
              },
              {
                title: '期初值',
                align: 'right',
                children: [
                  {
                    title: '资产账',
                    dataIndex: 'assetStartAmount',
                    align: 'right',
                    render: (_, row) => {
                      return (
                        <span style={{ color: row.assetBalanced == false ? 'red' : '' }}>
                          {formatNumber(row.assetStartAmount ?? 0, 2, true)}
                        </span>
                      );
                    },
                  },
                ],
              },
              {
                title: '本期增加',
                align: 'right',
                dataIndex: 'assetStartAmount',
                render: (_, row) => {
                  return (
                    <span style={{ color: row.assetBalanced == false ? 'red' : '' }}>
                      {formatNumber(row.assetAddAmount ?? 0, 2, true)}
                    </span>
                  );
                },
              },
              {
                title: '本期减少',
                align: 'right',
                dataIndex: 'assetSubAmount',
                render: (_, row) => {
                  return (
                    <span style={{ color: row.assetBalanced == false ? 'red' : '' }}>
                      {formatNumber(row.assetSubAmount ?? 0, 2, true)}
                    </span>
                  );
                },
              },
              {
                title: '期末值',
                children: [
                  {
                    title: '资产账',
                    dataIndex: 'assetEndAmount',
                    align: 'right',
                    render: (_, row) => {
                      return (
                        <span style={{ color: row.assetBalanced == false ? 'red' : '' }}>
                          {formatNumber(row.assetEndAmount ?? 0, 2, true)}
                        </span>
                      );
                    },
                  },
                  {
                    title: '财务账',
                    dataIndex: 'financialAmount',
                    align: 'right',
                    render: (_, row) => {
                      return formatNumber(row.financialAmount ?? 0, 2, true);
                    },
                  },
                ],
              },
              {
                title: '对账状态',
                align: 'center',
                dataIndex: 'balanced',
                render: (value) => {
                  return value ? (
                    <Tag color="green">平</Tag>
                  ) : (
                    <Tag color="red">未平</Tag>
                  );
                },
              },
            ]}
            pagination={false}
            bordered
            size="small"
            dataSource={data}
            scroll={{ y: 'calc(100%)' }}
          />
        </div>
      </div>
      {center}
    </>
  );
};
