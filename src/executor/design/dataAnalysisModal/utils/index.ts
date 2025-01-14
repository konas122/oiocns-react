import { FullEntityColumns } from '@/config/column';
import { FieldModel } from '@/ts/base/model';
import { IForm } from '@/ts/core';
import { fieldConvert } from '@/utils/tools';
import orgCtrl from '@/ts/controller';
import _ from 'lodash';
import moment from 'moment';

type TimeDimension = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

interface GroupOptions {
  data: any[];
  step?: number;
  mode?: string;
  dimension?: TimeDimension;
  hashDimension?: {
    caption?: string;
  };
  tileDimension?: {
    caption?: string;
  };
  summaryDimension?: {
    caption?: string;
  };
}

interface GroupedDateItem {
  item: string;
  count: number;
  percent: number;
}

/**
 * 获取过滤条件
 * @param valueType
 * @returns
 */
export const getFilterOperations = (valueType: string) => {
  if (['货币型', '时间型', '日期型', '数值型'].includes(valueType)) {
    return [
      {
        id: 1,
        name: '= 等于',
        value: '=',
      },
      {
        id: 2,
        name: '≠ 不等于',
        value: '<>',
      },
      {
        id: 3,
        name: '< 小于',
        value: '<',
      },
      {
        id: 4,
        name: '≤ 小于或等于',
        value: '<=',
      },
      {
        id: 5,
        name: '> 大于',
        value: '>',
      },
      {
        id: 6,
        name: '≥ 大于或等于',
        value: '>=',
      },

      {
        id: 10,
        name: '[a, b] 在...之间',
        value: 'between',
      },
    ];
  } else if (
    ['描述型', '选择型', '引用型', '对象型', '用户型', '办事流程'].includes(valueType)
  ) {
    return [
      {
        id: 7,
        name: '∋ 包含',
        value: 'contains',
      },
      {
        id: 8,
        name: '$ 以...结尾',
        value: 'endswith',
      },

      {
        id: 9,
        name: '^ 以...开头',
        value: 'startswith',
      },
      {
        id: 1,
        name: '= 等于',
        value: '=',
      },
      {
        id: 2,
        name: '≠ 不等于',
        value: '<>',
      },
    ];
  }
  return [
    {
      id: 1,
      name: '= 等于',
      value: '=',
    },
  ];
};

/**
 * 格式化日期
 * @param date
 * @param timeUnit
 * @returns
 */
export const formatDate = (date: any, timeUnit: string) => {
  let result: string = '';
  if (Object.prototype.toString.call(date) !== '[object Date]') return result;
  switch (timeUnit) {
    case 'year':
      result = date.getFullYear().toString();
      break;
    case 'month':
      result = `${date.getFullYear()}-${date.getMonth() + 1}`; // 月份从0开始
      break;
    case 'day':
      result = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      break;
    case 'hour':
      result = `${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()} ${date.getHours()}`;
      break;
    case 'minute':
      result = `${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
      break;
    case 'second':
      result = `${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
      break;
    default:
      throw new Error('不支持的时间单位');
  }
  return result;
};

/**
 * 转换条件
 * @param input
 * @param current
 * @returns
 */
export const transformConditions = async (input: any, current: IForm) => {
  if (!Array.isArray(input)) {
    throw new Error('输入必须是一个数组');
  }
  return await input.reduce(async (accPromise: Promise<any[]>, item, index) => {
    const acc = await accPromise; // 需要等待前面的异步结果
    if (
      typeof item !== 'object' ||
      !item.attribute ||
      !item.condition ||
      item.value === undefined
    ) {
      throw new Error("每个条件对象必须包含 'attribute', 'condition', 和 'value' 属性");
    }
    if (item.condition === 'between') {
      const resultFields = FullEntityColumns(await current.loadFields());
      const fields = fieldConvert(resultFields as FieldModel[]);
      const rows: any = fields.filter((v: any) => v.dataField === item.attribute);
      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0];
        const fieldType = row.fieldType;
        if (fieldType === '数值型' || fieldType === '货币型') {
          if (Array.isArray(item.value)) {
            item.value.forEach((it: any, idx: number) => {
              if (it) {
                acc.push([item.attribute, idx ? '<=' : '>=', Number(it)]);
                if (idx < item.value.length - 1) {
                  acc.push('and');
                }
              }
            });
          }
        } else if (fieldType === '日期型' || fieldType === '时间型') {
          if (Array.isArray(item.value)) {
            item.value.forEach((it: any, idx: number) => {
              if (it) {
                acc.push([
                  item.attribute,
                  idx ? '<=' : '>=',
                  fieldType === '日期型'
                    ? it.format('YYYY-MM-DD')
                    : it.format('YYYY-MM-DD HH:mm:ss'),
                ]);
                if (idx < item.value.length - 1) {
                  acc.push('and');
                }
              }
            });
          }
        }
      }
    } else {
      const conditionArray = [item.attribute, item.condition, item.value];
      acc.push(conditionArray);
    }
    if (index < input.length - 1) {
      acc.push('and');
    }
    return acc;
  }, Promise.resolve([])); // 这里初始化为 Promise
};

/**
 * 合并条件
 * @param oldConditions
 * @param newConditions
 * @returns
 */
export const mergeConditions = (oldConditions: any, newConditions: any) => {
  let mergedData = _.cloneDeep(oldConditions);
  let data2Clone = _.cloneDeep(newConditions);
  if (Array.isArray(mergedData)) {
    if (mergedData.length && Array.isArray(mergedData[0])) {
      // 如果是二维数组（条件组合）
      mergedData.push('and', ...data2Clone);
    } else {
      // 如果是一维数组（单个条件）
      mergedData = [mergedData, 'and', ...data2Clone];
    }
  }
  return mergedData;
};

/**
 * 根据属性 ID 查找单位
 * @param current
 * @param id
 * @returns
 */
export const lookupsFieldUnitById = async (
  current: IForm,
  id: string,
): Promise<string> => {
  if (!!id) {
    const result = await current.directory.resource.propertyColl.find([id]);
    if (Array.isArray(result) && result.length > 0) {
      return result[0]['unit'];
    }
  }
  return '';
};

/**
 * 根据字段 ID 查找对应的值（名称）
 * @param id
 * @returns
 */
export const lookupsFieldNameById = async (
  id: string,
  data: any,
  lookups: any,
): Promise<string> => {
  if (lookups && Array.isArray(lookups)) {
    try {
      // 查找对象数组中键值与传入值相等的对象
      const findObjectInArray = (array: any, value: string) => {
        const searchValue = String(value);
        return array.find((obj: any) => {
          return Object.values(obj).some((objValue) => {
            if (String(objValue) === searchValue) return true;
            if (searchValue.startsWith('S') && String(objValue) === searchValue.slice(1))
              return true;
            if (searchValue.startsWith('T') && String(objValue) === searchValue.slice(1))
              return true;
            return false;
          });
        });
      };

      const item = findObjectInArray(lookups, id);
      if (item) {
        return item?.name;
      }
    } catch (error) {}
  }

  if (data) {
    try {
      const lookup = data?.lookup?.dataSource.find((item: any) => item.value === id);
      if (lookup) {
        return lookup.text;
      }
    } catch (error) {
      console.log('error in lookupsFieldValueById', error);
    }
  }

  const type1Regex = /^T\d{18}$/;
  const type2Regex = /^\d{18}$/;

  // 以 "T" 开头，后面跟随 18 位数字 或仅由 18 位数字组成 才去查找
  if (type1Regex.test(id) || type2Regex.test(id)) {
    const result: any = await orgCtrl.user.findMetadata(id);
    if (result) {
      return result?.name;
    }
    const user = await orgCtrl.user.findEntityAsync(id);
    if (user) {
      return user?.name;
    }
  }
  return id;
};

/**
 * 生成适配特殊查询语法的聚合管道
 * @param hashDimension - 用于分组的散列维度字段
 * @param summaryDimension - 用于汇总的字段
 * @param tileDimension - 用于平铺显示的维度字段（可选）
 * @returns 转换后的特殊查询语法管道
 */
export const generateAggregationPipeline = ({
  hashDimension,
  summaryDimension,
  tileDimension,
  totalIndicators,
}: {
  hashDimension: string;
  summaryDimension: string;
  tileDimension?: string;
  totalIndicators: 'totalValue' | 'averageValue' | 'maxValue' | 'minValue';
}) => {
  const group: any = {};
  // 设置分组键
  group.key = tileDimension ? [hashDimension, tileDimension] : [hashDimension];
  if (summaryDimension === 'count') {
    group.count = { $sum: 1 }; // 汇总计数
  } else {
    const aggregationOperator: { [key: string]: string } = {
      totalValue: '_sum_',
      averageValue: '_avg_',
      maxValue: '_max_',
      minValue: '_min_',
    };
    if (aggregationOperator[totalIndicators]) {
      group[summaryDimension] = {
        [aggregationOperator[totalIndicators]]: `$${summaryDimension}`,
      };
    }
  }
  return group;
};

/**
 * 根据步长分组
 * @returns
 */
const groupByStep = ({
  data,
  step = 10,
  mode = '2d',
  hashDimension,
  tileDimension,
  summaryDimension,
}: GroupOptions) => {
  // 参数校验
  if (!data || data.length === 0) return [];

  // 通用的分段逻辑
  const calculateRange = (value: number) => {
    const rangeStart = Math.floor(value / step) * step;
    const rangeEnd = rangeStart + step;
    return `${rangeStart}-${rangeEnd}`;
  };

  // 2D模式处理
  if (mode === '2d') {
    const groupedResult = data.reduce((acc, { item, count, percent }) => {
      const rangeKey = calculateRange(item);
      if (!acc[rangeKey]) {
        acc[rangeKey] = {
          item: rangeKey,
          count: 0,
          percent: 0,
        };
      }
      acc[rangeKey].count += count;
      acc[rangeKey].percent += percent;
      return acc;
    }, {} as Record<string, { item: string; count: number; percent: number }>);

    return Object.values(groupedResult).sort((a: any, b: any) => {
      const startA = parseInt(a.item.split('-')[0], 10);
      const startB = parseInt(b.item.split('-')[0], 10);
      return startA - startB;
    });
  }

  // 非2D模式处理
  const hashField = hashDimension?.caption;
  const tileField = tileDimension?.caption;
  const summaryField = summaryDimension?.caption ?? 'count';

  if (!hashField || !tileField || !summaryField) {
    throw new Error('缺少必要的维度配置');
  }

  const groupedResult = data.reduce((acc, item) => {
    const rangeKey = calculateRange(item[hashField]);

    const groupItem = {
      [hashField]: rangeKey,
      [tileField]: item[tileField] || 'undefined',
      [summaryField]: item[summaryField] || 0,
    };

    if (!acc[rangeKey]) {
      acc[rangeKey] = [];
    }

    acc[rangeKey].push(groupItem);
    return acc;
  }, {} as Record<string, any[]>);

  return Object.values(groupedResult)
    .flat()
    .sort((a: any, b: any) => {
      const startA = parseInt(a[hashField].split('-')[0], 10);
      const startB = parseInt(b[hashField].split('-')[0], 10);
      return startA - startB;
    });
};

/**
 * 根据日期分组
 * @param param0
 * @returns
 */
const groupDateByDimension = ({
  data,
  dimension = 'year',
  mode,
  hashDimension,
  tileDimension,
  summaryDimension,
}: GroupOptions) => {
  if (mode === '2d') {
    const groupMap = new Map<string, GroupedDateItem>();
    const totalCount = data.reduce((sum, item) => sum + item.count, 0);
    data.forEach((item) => {
      const date = new Date(item.item);
      const key = formatDate(date, dimension);
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          item: key,
          count: 0,
          percent: 0,
        });
      }
      const groupItem = groupMap.get(key)!;
      groupItem.count += item.count;
    });
    const result = Array.from(groupMap.values()).map((item) => ({
      ...item,
      percent: totalCount > 0 ? item.count / totalCount : 0,
    }));
    return result.sort((a, b) => a.item.localeCompare(b.item));
  } else {
    // 非2D模式处理
    const hashField: any = hashDimension?.caption;
    const tileField: any = tileDimension?.caption;
    const summaryField: any = summaryDimension?.caption ?? 'count';

    if (!hashField || !tileField || !summaryField) {
      throw new Error('缺少必要的维度配置');
    }
    // 创建分组映射
    const groupMap = new Map<string, any>();

    // 遍历数据进行分组
    data.forEach((item: any) => {
      // 解析日期并按指定维度提取键
      const date = new Date(item[hashField]);
      const dateKey = formatDate(date, dimension);
      const tileKey = item[tileField];

      // 创建唯一的分组键
      const groupKey = `${dateKey}-${tileKey}`;

      // 初始化分组项
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          [hashField]: dateKey,
          [tileField]: tileKey,
          [summaryField]: 0,
        });
      }
      // 累加汇总字段
      const groupItem = groupMap.get(groupKey)!;
      groupItem[summaryField] += item[summaryField];
    });
    // 转换为数组并排序
    return _.sortBy(Array.from(groupMap.values()), (item) =>
      moment(item[hashField], 'YYYY-MM-DD HH:mm:ss'),
    );
  }
};

/**
 * 将数据转换为适合显示的格式
 * @param data 数据源
 * @param mode 模式
 * @param hashDimension 散列纬度
 * @param tileDimension 平铺纬度
 * @param summaryDimension 汇总纬度
 * @param dimensionIndex 汇总指标
 * @returns
 */
export const transformDataForDisplay = async ({
  data,
  mode,
  hashDimension,
  tileDimension,
  summaryDimension,
  dimensionIndex,
  lookups,
}: any) => {
  if (!Array.isArray(data)) return [];
  const transformItem = async (item: any) => {
    const obj: any = {};
    // 处理散列维度
    const hashField = hashDimension.dataField;
    const tileField = tileDimension?.dataField;
    obj[mode === '2d' ? 'item' : hashDimension.caption] =
      hashField === 'code'
        ? item[hashField]
        : await lookupsFieldNameById(item[hashField], hashDimension, lookups);

    // 处理平铺维度
    if (tileDimension) {
      obj[tileDimension.caption] =
        tileField === 'code'
          ? item[tileField]
          : await lookupsFieldNameById(
              item[tileDimension.dataField],
              tileDimension,
              lookups,
            );
    }

    // 处理汇总维度
    const value = summaryDimension ? item[summaryDimension.dataField] : item.count;

    obj[mode === '2d' ? 'count' : summaryDimension?.caption || 'count'] = value;

    // 在 二维 模式下添加 percent 字段
    if (mode === '2d') {
      const overallTotal = data.reduce(
        (total, item) => total + (item[summaryDimension?.dataField ?? 'count'] || 0),
        0,
      );
      obj['percent'] = value / overallTotal;
    }
    return obj;
  };

  // 转换所有数据
  let newData = await Promise.all(data.map(transformItem));
  if (mode === '2d') {
    newData.sort((a, b) => b.count - a.count);
  }
  // 根据字段类型分组
  const groupData = () => {
    switch (hashDimension.fieldType) {
      case '日期型':
      case '时间型':
        return groupDateByDimension({
          data: newData,
          dimension: dimensionIndex,
          mode,
          hashDimension,
          tileDimension,
          summaryDimension,
        });

      case '数值型':
      case '货币型':
        return groupByStep({
          data: newData,
          step: dimensionIndex,
          mode,
          hashDimension,
          tileDimension,
          summaryDimension,
        });

      default:
        newData = _.orderBy(
          newData,
          [hashDimension?.caption ?? 'letter', 'count'],
          ['asc', 'desc'],
        );
        return newData;
    }
  };
  return groupData();
};

export const isArrayWithMinLength = (data: any, size: number = 30) => {
  if (Array.isArray(data) && data.length > size) {
    return true;
  }
  return false;
};

/**
 * 将 Base64 编码的图像下载为文件
 * @param {string} base64 - Base64 编码的图像字符串
 * @param {string} filename - 保存文件时的名称
 */
export function downloadBase64Image(base64: string, filename: string) {
  // 移除Base64字符串前缀（例如 data:image/png;base64,）
  const byteCharacters = atob(base64.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''));

  // 创建一个与Base64字符串等长的数组
  const byteNumbers = new Array(byteCharacters.length);

  // 将Base64解码的字符串转换为字节数组
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  // 创建一个新的Uint8Array（无符号8位整数数组）
  const byteArray = new Uint8Array(byteNumbers);

  // 创建一个Blob对象，文件类型设置为`undefined`
  const blob = new Blob([byteArray], { type: undefined });

  // 创建一个下载链接
  const aLink = document.createElement('a');
  aLink.download = `${filename}.jpg`; // 设置下载的文件名
  aLink.href = URL.createObjectURL(blob); // 为Blob创建一个对象URL
  aLink.click(); // 触发下载动作

  // 清除对象URL，防止内存泄漏
  URL.revokeObjectURL(aLink.href);
}

/**
 * 格式化数字
 * @param number
 * @returns
 */
export function simplifyNum(
  number: number,
  decimalPlaces: number = 2,
): { num: string; unit: string } | number {
  if (number === undefined || number === null) return number;

  const formatNumber = (
    num: number,
    divisor: number,
    unit: string,
  ): { num: string; unit: string } => {
    return {
      num: (num / divisor).toFixed(decimalPlaces),
      unit: unit,
    };
  };

  if (number >= 1e4 && number < 1e6) {
    return formatNumber(number, 1e4, '万');
  } else if (number >= 1e6 && number < 1e7) {
    return formatNumber(number, 1e6, '百万');
  } else if (number >= 1e7 && number < 1e8) {
    return formatNumber(number, 1e7, '千万');
  } else if (number >= 1e8 && number < 1e10) {
    return formatNumber(number, 1e8, '亿');
  } else if (number >= 1e10 && number < 1e11) {
    return formatNumber(number, 1e10, '百亿');
  } else if (number >= 1e11 && number < 1e12) {
    return formatNumber(number, 1e11, '千亿');
  } else if (number >= 1e12) {
    return formatNumber(number, 1e12, '万亿');
  } else {
    return number; // 一万以下
  }
}

export const isObject = (value: any) => {
  return value instanceof Object && value !== null;
};
