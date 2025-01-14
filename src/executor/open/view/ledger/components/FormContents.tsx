import type { IFinancial } from '@/ts/core';
import { formatNumber } from '@/utils';
import { AnyHandler, AnySheet, Excel, generateXlsx } from '@/utils/excel';
import { message, Table } from 'antd';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { transformBalanceSheet, transformLedgerData } from '../utils';
import { IFormBrowserProps } from './FormBrowser';
import FormTools from './FormTools';

interface IProps extends IFormBrowserProps {
  type: string;
  species: any;
  fields:any;
}

const FormContents = ({
  loadOptions,
  latestAndOldestBillingPeriods,
  type,
  species,
  fields,
  period,
  current,
  form,
  directory,
  onUpdatePeriod,
}: IProps) => {
  const belong = directory.target.space;
  const financial: IFinancial = belong.financial;
  const [loading, setLoading] = useState<boolean>(false);
  const [generalLedgerData, setGeneralLedgerData] = useState<any[]>([]);
  const [balanceSheetData, setBalanceSheetData] = useState<any[]>([]);
  const [subjectTree, setSubjectTree] = useState<any[]>([]);
  const [currentSubject, setCurrentSubject] = useState<any[]>([]); // 当前科目
  const [advancedFilter, setAdvancedFilter] = useState<any[]>([]); // 高级过滤
  const [isReload, setIsReload] = useState<boolean>(false); // 重新加载

  useEffect(() => {
    if (period && species) {
      (async () => {
        await loadData();
      })();
    }
  }, [period, species]);

  async function loadData() {
    try {
      setLoading(true);
      if (financial.query && period) {
        const start = financial.getOffsetPeriod(period[0], -1);
        const data = await financial.query.ledgerSummary({
          start,
          end: period[1],
          records: species,
          ...(loadOptions || {}),
        });
        const dataSource = data?.root?.children ?? [];
        const newData = dataSource?.[0].children;
        const transformed = transformBalanceSheet(newData || [], fields);
        setSubjectTree(transformed.tree);
        if (type === 'sum') {
          setBalanceSheetData(transformed.data);
        }
        if (type === 'ledger') {
          const ledgerData = await transformLedgerData({
            data: newData || [],
            species,
            period,
            fields,
            financial,
          });
          setGeneralLedgerData(ledgerData);
        }
      }
    } catch (error) {
      console.log('error', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
      setIsReload(false);
    }
  }

  const mergeCell = useCallback(
    (dataIndex: string, values: any, index: number) => {
      const value = values[dataIndex];
      const obj = {
        rowSpan: 0,
      };
      if (index > 0 && generalLedgerData[index - 1][dataIndex] === value) {
        obj.rowSpan = 0;
      } else {
        let occurCount = 1;
        let count = index;
        while (true) {
          if (
            count < generalLedgerData.length - 1 &&
            generalLedgerData[count + 1][dataIndex] === value
          ) {
            occurCount++;
            count++;
          } else {
            break;
          }
        }
        obj.rowSpan = occurCount;
      }
      return obj;
    },
    [generalLedgerData],
  );

  const formatRowNumber = (text: string | number) => {
    return formatNumber(text ?? 0, 2, true);
  };

  const columns = useMemo(() => {
    const ledgerField = [
      {
        title: '科目编码',
        dataIndex: 'subjectCode',
        onCell: advancedFilter.some((filter) => filter.checked)
          ? undefined
          : mergeCell.bind(this, 'subjectCode'),
      },
      {
        title: '科目名称',
        dataIndex: 'subjectName',
        onCell: advancedFilter.some((filter) => filter.checked)
          ? undefined
          : mergeCell.bind(this, 'subjectName'),
      },
      {
        title: '期间',
        dataIndex: 'reportingPeriod',
      },
      {
        title: '摘要',
        dataIndex: 'summary',
      },
      {
        title: '借方',
        dataIndex: 'debitAmount',
        render: (text: string | number) => formatRowNumber(text),
      },
      {
        title: '贷方',
        dataIndex: 'creditAmount',
        render: (text: string | number) => formatRowNumber(text),
      },
      {
        title: '方向',
        dataIndex: 'transactionDirection',
      },
      {
        title: '余额',
        dataIndex: 'accountBalance',
        render: (text: string | number) => formatRowNumber(text),
      },
    ];
    const sumField = [
      {
        title: '科目编码',
        dataIndex: 'subjectCode',
      },
      {
        title: '科目名称',
        dataIndex: 'subjectName',
      },
      {
        title: '期初金额',
        dataIndex: 'initialAmount',
        children: [
          {
            title: '借方',
            dataIndex: 'debitAmountInitial',
            render: (text: string | number) => formatRowNumber(text),
          },
          {
            title: '贷方',
            dataIndex: 'creditAmountInitial',
            render: (text: string | number) => formatRowNumber(text),
          },
        ],
      },
      {
        title: '本期发生额',
        dataIndex: 'currentPeriodAmount',
        children: [
          {
            title: '借方',
            dataIndex: 'debitAmountCurrent',
            render: (text: string | number) => formatRowNumber(text),
          },
          {
            title: '贷方',
            dataIndex: 'creditAmountCurrent',
            render: (text: string | number) => formatRowNumber(text),
          },
        ],
      },
      {
        title: '期末余额',
        dataIndex: 'endingAmount',
        children: [
          {
            title: '借方',
            dataIndex: 'debitAmountEnding',
            render: (text: string | number) => formatRowNumber(text),
          },
          {
            title: '贷方',
            dataIndex: 'creditAmountEnding',
            render: (text: string | number) => formatRowNumber(text),
          },
        ],
      },
    ];
    let column;
    switch (type) {
      case 'ledger':
        column = ledgerField;
        break;
      case 'sum':
        column = sumField;
        break;
      default:
        break;
    }
    return column;
  }, [type, mergeCell, advancedFilter]);

  const data = useMemo(() => {
    let result =
      type === 'ledger' ? generalLedgerData : type === 'sum' ? balanceSheetData : [];
    // 根据当前选择的科目筛选
    if (currentSubject.length > 0) {
      const newValue = currentSubject.flat();
      result = result.filter((item) => newValue.includes(item.subjectCode));
    }
    // 高级筛选处理
    if (advancedFilter.length > 0) {
      const filterData = (data: any[], filters: any[], type: string) => {
        return data.filter((item) => {
          for (const filter of filters) {
            if (!filter.checked) continue;
            // 根据类型执行不同的筛选逻辑
            if (type === 'ledger') {
              // 条件1：余额为0 不显示
              if (filter.key === 1 && item.accountBalance === 0) return false;
              // 条件2：无发生额且余额为0 不显示
              if (
                filter.key === 2 &&
                item.summary === '本期合计' &&
                item.debitAmount === 0 &&
                item.accountBalance === 0
              )
                return false;
            } else if (type === 'sum') {
              // 条件1：余额为0 不显示
              if (filter.key === 1 && item.creditAmountEnding === 0) return false;
              // 条件2：无发生额且余额为0 不显示
              if (
                filter.key === 2 &&
                item.debitAmountCurrent === 0 &&
                item.creditAmountEnding === 0
              )
                return false;
            }
          }
          return true;
        });
      };
      result = filterData(result, advancedFilter, type);
    }
    return result;
  }, [type, generalLedgerData, balanceSheetData, currentSubject, advancedFilter]);

  return (
    <div>
      <FormTools
        subjectTree={subjectTree}
        period={period}
        current={current}
        form={form}
        isReload={isReload}
        directory={directory}
        currentSubject={currentSubject}
        latestAndOldestBillingPeriods={latestAndOldestBillingPeriods}
        onUpdatePeriod={onUpdatePeriod}
        onUpdateSubject={(value) => {
          setCurrentSubject(value);
        }}
        onUpdateAdFilter={(value) => {
          setAdvancedFilter(value);
        }}
        onExport={() => {
          const title = form?.name || (type === 'sum' ? '余额表' : '总账');
          if (columns) {
            generateXlsx(
              new Excel(financial.space, [
                new AnyHandler(
                  new AnySheet(`${type}_depreciation`, title, columns, data, undefined),
                ),
              ]),
              title,
            );
          }
        }}
        onReload={() => {
          setCurrentSubject([]);
          setAdvancedFilter([]);
          setIsReload(true);
          loadData();
        }}
      />
      <div>
        <Table
          loading={loading}
          columns={columns as any}
          dataSource={data as any}
          bordered
          pagination={false}></Table>
      </div>
    </div>
  );
};

export default memo(FormContents);
