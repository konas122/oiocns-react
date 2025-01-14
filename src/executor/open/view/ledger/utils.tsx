import { schema } from '@/ts/base';
import { IDirectory } from '@/ts/core';
import { IFinancial, SpeciesRecord } from '@/ts/core/work/financial';
import { ReportTree } from '@/ts/core/thing/standard/reporttree/ReportTree';
import { getUuid } from '@/utils/tools';
import _ from 'lodash';

interface ITransformFinancialDataProps {
  period: any;
  data: any;
  fields: any;
  species: SpeciesRecord;
  financial: IFinancial;
}

// 检查 period 数组中的日期是否为连续月份。
// 如果日期不连续，则生成从 period[0] 到 period[1] 的所有月份；如果日期已经连续，则直接返回原数组。
function fillPeriodMonths(period: string[]) {
  const [start, end] = period;
  if (start === end) return [start];

  // 解析年份和月份
  const startDate = new Date(start + '-01');
  const endDate = new Date(end + '-01');

  const result = [];
  let current = new Date(startDate);

  // 按月循环，生成从 start 到 end 的每个月份
  while (current <= endDate) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const formattedDate = `${year}-${month}`;
    result.push(formattedDate);

    // 增加一个月
    current.setMonth(current.getMonth() + 1);
  }

  // 如果生成的结果与原 period 相同，返回原 period，否则返回生成的结果
  return JSON.stringify(result) === JSON.stringify(period) ? period : result;
}

function adjustPeriod(period: string[]) {
  if (!period) return period;

  const [start, end] = period;

  // 获取起始和终止的年份和月份
  const startYear = parseInt(start.split('-')[0], 10);
  const endYear = parseInt(end.split('-')[0], 10);

  // 如果起始年份和终止年份相同，返回从 1 月到终止月份
  if (startYear === endYear) {
    return [`${startYear}-01`, `${end}`];
  }

  // 如果起始年份和终止年份不同，仅返回终止年份的 1 月到终止月份
  return [`${endYear}-01`, `${end}`];
}

/**
 * 转换总账数据
 * @returns
 */

async function transformLedgerData({
  data,
  species,
  period,
  fields,
  financial,
}: ITransformFinancialDataProps) {
  try {
    if (!period || !financial || !fields) return [];

    const digests = ['期初余额', '本期合计', '本年累计'];
    const [target1, target2] = fields;
    // 开始日期和结束日期是否相同
    const periodEqual = period[0] === period[1];
    // 其它月份数据
    const otherMonthData: any = {};
    const periods = fillPeriodMonths(period);

    // 获取每个月份的统计值（前后月份不相同时）
    if (financial.query && !periodEqual) {
      const threads = periods.map(async (item) => {
        const start = financial.getOffsetPeriod(item, -1);
        const data = await financial.query!.ledgerSummary({
          start,
          end: item,
          records: species,
        });
        const dataSource = data?.root?.children?.[0]?.children;
        otherMonthData[item] = dataSource;
      });
      await Promise.all(threads);
    }

    const currentYear: any = adjustPeriod(period);
    // 获取本年度的统计数据
    const currentYearData = await financial.query!.ledgerSummary({
      start: currentYear[0],
      end: currentYear[1],
      records: species,
    });

    const start = financial.getOffsetPeriod(currentYear[0], -1);
    // 本年度一月份的数据
    const currentYearJanuaryData = await financial.query!.ledgerSummary({
      start,
      end: currentYear[0],
      records: species,
    });
    const currentYearJanDataSource =
      currentYearJanuaryData?.root?.children?.[0]?.children;
    const currentYearDataSource = currentYearData?.root?.children?.[0]?.children;
    const uniqueSubjects = [
      {
        subjectCode: '1602',
        subjectName: '固定资产-累计折旧',
        transactionDirection: '贷',
        type: '2',
      },
      {
        subjectCode: '1702',
        subjectName: '无形资产-累计摊销',
        transactionDirection: '贷',
        type: '2',
      },
      {
        subjectCode: '1832',
        subjectName: '保障性住房-累计折旧',
        transactionDirection: '贷',
        type: '2',
      },
      {
        subjectCode: '1842',
        subjectName: 'PPP项目资产-累计折旧（摊销）',
        transactionDirection: '贷',
        type: '2',
      },
      {
        subjectCode: '1802',
        subjectName: '公共基础设施-累计折旧（摊销）',
        transactionDirection: '贷',
        type: '2',
      },
    ];

    // 生成汇总数据
    const generateSummaryData = (
      itemData: any,
      month: string,
      index1: any,
      index2: any,
      index3: any,
      index5: any,
      index6: any,
      index7: any,
      uqSubjects?: any,
    ) => {
      if (Array.isArray(uqSubjects) && uqSubjects.length > 0) {
        uqSubjects.unshift({
          subjectCode: itemData?.info,
          subjectName: itemData?.name,
          transactionDirection: '借',
          type: '1',
        });

        return uqSubjects.map((subject) => {
          return digests.map((digest) => {
            const baseData = {
              key: getUuid(),
              subjectCode: subject.subjectCode,
              subjectName: subject.subjectName,
              summary: digest,
              transactionDirection: subject.transactionDirection,
              reportingPeriod: month,
            };

            if (digest === '期初余额') {
              return {
                ...baseData,
                debitAmount: subject.type === '2' ? index5 : index1,
                creditAmount: 0,
                accountBalance: subject.type === '2' ? index5 : index1,
              };
            } else if (digest === '本期合计') {
              return {
                ...baseData,
                debitAmount: subject.type === '2' ? index7 : index2,
                creditAmount: subject.type === '2' ? index6 : index3,
                accountBalance:
                  subject.type === '2'
                    ? index5 + index6 - index7
                    : index1 + index2 - index3,
              };
            } else if (digest === '本年累计') {
              const currentYearItem = currentYearDataSource.find(
                (it: any) => it.id === itemData.id,
              );
              const currentYearJanItem = currentYearJanDataSource.find(
                (it: any) => it.id === itemData.id,
              );

              let debitAmountValue = 0,
                creditAmountValue = 0,
                accountBalanceValue = 0;
              if (currentYearItem) {
                if (subject.type === '2') {
                  debitAmountValue = currentYearItem['data'][`minus-root-T${target2.id}`];
                  creditAmountValue = currentYearItem['data'][`plus-root-T${target2.id}`];
                } else {
                  debitAmountValue = currentYearItem['data'][`plus-root-T${target1.id}`];
                  creditAmountValue =
                    currentYearItem['data'][`minus-root-T${target1.id}`];
                }
              }
              if (currentYearJanItem) {
                if (subject.type === '2') {
                  accountBalanceValue =
                    currentYearJanItem['data'][`before-root-T${target2.id}`] +
                    creditAmountValue -
                    debitAmountValue;
                } else {
                  accountBalanceValue =
                    currentYearJanItem['data'][`before-root-T${target1.id}`] +
                    debitAmountValue -
                    creditAmountValue;
                }
              }
              return {
                ...baseData,
                debitAmount: debitAmountValue,
                creditAmount: creditAmountValue,
                accountBalance: accountBalanceValue,
              };
            }
          });
        });
      } else {
        return digests.map((digest) => {
          const baseData = {
            key: getUuid(),
            subjectCode: itemData?.info,
            subjectName: itemData?.name,
            summary: digest,
            reportingPeriod: month,
          };
          if (digest === '期初余额') {
            return {
              ...baseData,
              debitAmount: index1,
              creditAmount: 0,
              transactionDirection: '借',
              accountBalance: index1,
            };
          } else if (digest === '本期合计') {
            return {
              ...baseData,
              debitAmount: index2,
              creditAmount: index3,
              transactionDirection: '借',
              accountBalance: index1 + index2 - index3,
            };
          } else if (digest === '本年累计') {
            const currentYearItem = currentYearDataSource.find(
              (it: any) => it.id === itemData.id,
            );
            const currentYearJanItem = currentYearJanDataSource.find(
              (it: any) => it.id === itemData.id,
            );
            let debitAmountValue = 0,
              creditAmountValue = 0,
              accountBalanceValue = 0;
            if (currentYearItem) {
              debitAmountValue = currentYearItem['data'][`plus-root-T${target1.id}`];
              creditAmountValue = currentYearItem['data'][`minus-root-T${target1.id}`];
            }
            if (currentYearJanItem) {
              accountBalanceValue =
                currentYearJanItem['data'][`before-root-T${target1.id}`] +
                debitAmountValue -
                creditAmountValue;
            }
            return {
              ...baseData,
              debitAmount: debitAmountValue,
              creditAmount: creditAmountValue,
              transactionDirection: '借',
              accountBalance: accountBalanceValue,
            };
          }
        });
      }
    };

    const result = (data || []).flatMap((item: any) => {
      const { data: itemData } = item;
      if (Array.isArray(period) && period.length > 1) {
        // 期间相等
        if (periodEqual) {
          // "资产原值"
          const index1 = itemData[`before-root-T${target1.id}`]; // 期初
          const index2 = itemData[`plus-root-T${target1.id}`]; // 增加
          const index3 = itemData[`minus-root-T${target1.id}`]; // 减少

          // "累计折旧/摊销"
          const index5 = itemData[`before-root-T${target2.id}`];
          const index6 = itemData[`plus-root-T${target2.id}`];
          const index7 = itemData[`minus-root-T${target2.id}`];
          const uqSubjects = uniqueSubjects.filter((subject) =>
            subject.subjectName.includes(itemData['name']),
          );
          if (uqSubjects.length > 0) {
            return generateSummaryData(
              itemData,
              period[0],
              index1,
              index2,
              index3,
              index5,
              index6,
              index7,
              uqSubjects,
            );
          } else {
            return generateSummaryData(
              itemData,
              period[0],
              index1,
              index2,
              index3,
              index5,
              index6,
              index7,
            );
          }
        } else {
          // 期间不相等
          return periods.flatMap((month) => {
            const currentMonthDataSource = otherMonthData[month];
            const currentMonthItem = currentMonthDataSource.find(
              (it: any) => it.id === item.id,
            );
            const index1 = currentMonthItem['data'][`before-root-T${target1.id}`];
            const index2 = currentMonthItem['data'][`plus-root-T${target1.id}`];
            const index3 = currentMonthItem['data'][`minus-root-T${target1.id}`];
            const index5 = currentMonthItem['data'][`before-root-T${target2.id}`];
            const index6 = currentMonthItem['data'][`plus-root-T${target2.id}`];
            const index7 = currentMonthItem['data'][`minus-root-T${target2.id}`];
            const uqSubjects = uniqueSubjects.filter((subject) =>
              subject.subjectName.includes(itemData['name']),
            );
            if (uqSubjects.length > 0) {
              return generateSummaryData(
                itemData,
                month,
                index1,
                index2,
                index3,
                index5,
                index6,
                index7,
                uqSubjects,
              );
            } else {
              return generateSummaryData(
                itemData,
                month,
                index1,
                index2,
                index3,
                index5,
                index6,
                index7,
              );
            }
          });
        }
      }
    });
    return result.flat();
  } catch (error) {
    console.log('error', error);
    return [];
  }
}

/**
 * 转换余额表数据
 */
function transformBalanceSheet(data: any[], fields: any) {
  if (!data || !fields) return { data: [], tree: [] };
  return data.reduce(
    (acc, node) => {
      const transformed = transformNode(node, fields);
      acc.data.push(transformed.data);
      acc.tree.push(transformed.tree);
      return acc;
    },
    { data: [], tree: [] },
  );
}

function transformNode(node: any, fields: any) {
  const { data: itemData } = node;
  const [target1] = fields;
  const transformedNode = {
    key: node.id,
    subjectCode: itemData?.info || '',
    subjectName: itemData?.name || '',
    debitAmountInitial: itemData[`before-root-T${target1.id}`],
    creditAmountInitial: 0,
    debitAmountCurrent: itemData[`plus-root-T${target1.id}`],
    creditAmountCurrent: itemData[`minus-root-T${target1.id}`],
    debitAmountEnding:
      itemData[`before-root-T${target1.id}`] +
      itemData[`plus-root-T${target1.id}`] -
      itemData[`minus-root-T${target1.id}`],
    creditAmountEnding: 0.0,
    children: [],
  };
  const subjectTree = {
    label: itemData?.name || '',
    value: itemData?.info || '',
    children:
      node.children
        ?.map((child: any) => transformNode(child, fields))
        .map(({ tree }: any) => tree) || [],
  };
  return { data: transformedNode, tree: subjectTree };
}

/**
 * 加载报表树
 * @returns
 */
async function loadTreeItemMenu(form: schema.XForm, directory: IDirectory) {
  let rootCode: string = '';
  const loopData = (arr: any[]): any[] => {
    return arr.map((item: any) => {
      item.value = item.targetId;
      return {
        key: item.targetId,
        label: item.name,
        rootCode,
        hasItems: item.children.length > 0,
        typeName: '组织树',
        children: loopData(item.children),
        value: item.targetId,
        item: item,
      };
    });
  };
  let result = [];
  const organizationTree = (form as any).options?.organizationTree;
  if (organizationTree) {
    const res = await directory.resource.reportTreeColl.find([organizationTree]);
    if (Array.isArray(res) && res.length > 0) {
      const _field = res[0];
      const tree = new ReportTree(_field, directory);
      let nodes = _.cloneDeep(await tree.loadNodes(true));
      const root = nodes.find((n) => n.id == _field.rootNodeId);
      if (!root) {
        return [];
      }
      rootCode = root.code;
      let subTree = await tree.loadSubTree(root);
      result = loopData(subTree);
    }
  }
  return result;
}

/**
 * 根据目标value依次找到它的父亲节点
 * @param treeData
 * @param targetValue
 * @returns
 */
function findPathByValue(treeData: any[], targetValue: string): string[] {
  // 定义递归函数以找到路径
  function findPath(node: any): string[] | null {
    if (node.value === targetValue) {
      return [node.value];
    }
    if (node.children && node.children.length > 0) {
      for (let child of node.children) {
        const path = findPath(child);
        if (path) {
          return [node.value, ...path];
        }
      }
    }
    return null;
  }
  for (let node of treeData) {
    const path = findPath(node);
    if (path) {
      return path;
    }
  }
  console.error('验证失败，无法找到目标值:', targetValue);
  return [];
}

export {
  fillPeriodMonths,
  adjustPeriod,
  transformLedgerData,
  transformBalanceSheet,
  loadTreeItemMenu,
  findPathByValue,
};
