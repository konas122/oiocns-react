// import { round } from '@/ts/scripting/core/functions/primitive';
import Decimal from "decimal.js";
/* eslint-disable no-useless-escape */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-unused-vars */
/* --------------------------------------------公共方法--------------------------------- */
// 获取URL参数
const getQueryString = (name: string) => {
  const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
  const r = window.location.search.substr(1).match(reg);
  if (r !== null) return decodeURI(r[2]);
  return null;
};

/**
 * Date 转化为指定格式的String<br>
 * 月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q)可以用 1-2 个占位符<br>
 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 *
 * @param {string | number} date string支持形式：20160126 12:00:00，2016-01-26 12:00:00，2016.01.26 12:00:00，20160126，2016-01-26 12:00:00.0
 * @param {string} fmt
 * @returns {string}
 * @example
 *
 * formatDate(Date.now(), 'yyyy-MM-dd hh:mm:ss.S');
 * // => 2006-07-02 08:09:04.423
 *
 * formatDate(Date.now(), 'yyyy-MM-dd E HH:mm:ss');
 * // => 2009-03-10 二 20:09:04
 *
 * formatDate(Date.now(), 'yyyy-MM-dd EE hh:mm:ss');
 * // => 2009-03-10 周二 08:09:04
 *
 * formatDate(Date.now(), 'yyyy-MM-dd EEE hh:mm:ss');
 * // => 2009-03-10 星期二 08:09:04
 *
 * formatDate(Date.now(), 'yyyy-M-d h:m:s.S')
 * // => 2006-7-2 8:9:4.18
 */
const formatDate = (date?: any, fmt?: string) => {
  if (date === void 0) date = new Date();
  if (fmt === void 0) fmt = 'yyyy-MM-dd HH:mm:ss';

  if (typeof date === 'string') {
    date = new Date(date);
  } else if (typeof date === 'number') {
    date = new Date(date);
  }
  let o: any = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours() % 12 === 0 ? 12 : date.getHours() % 12, // 小时
    'H+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds(), // 毫秒
  };
  let week: any = {
    '0': '\u65e5',
    '1': '\u4e00',
    '2': '\u4e8c',
    '3': '\u4e09',
    '4': '\u56db',
    '5': '\u4e94',
    '6': '\u516d',
  };

  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  }

  if (/(E+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (RegExp.$1.length > 1 ? (RegExp.$1.length > 2 ? '\u661f\u671f' : '\u5468') : '') +
        week[date.getDay() + ''],
    );
  }

  for (let k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length),
      );
    }
  }

  return fmt;
};

export function getWeek(date: Date): Map<string, string | number> {
  var one_day = 86400000;
  var day = date.getDay();
  // 设置时间为当天的0点
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  1;
  date.setMilliseconds(0);
  var week_start_time = date.getTime() - (day - 1) * one_day;
  var week_end_time = date.getTime() + (7 - day) * one_day;
  var last = week_start_time - 2 * 24 * 60 * 60 * 1000;
  var next = week_end_time + 24 * 60 * 60 * 1000;
  var tomorrow = date.getTime() + 86400000;
  var month1: string | number = new Date(week_start_time).getMonth() + 1;
  var month2: string | number = new Date(week_end_time).getMonth() + 1;
  var day1: string | number = new Date(week_start_time).getDate();
  var day2: string | number = new Date(week_end_time).getDate();
  if (month1 < 10) {
    month1 = '0' + month1;
  }
  if (month2 < 10) {
    month2 = '0' + month2;
  }
  if (day1 < 10) {
    day1 = '0' + day1;
  }
  if (day2 < 10) {
    day2 = '0' + day2;
  }
  var time1 = month1 + '.' + day1;
  var time2 = month2 + '.' + day2;
  var map = new Map<string, string | number>();
  map.set('stime', week_start_time); // 当前周周一零点的毫秒数
  map.set('etime', week_end_time); // 当前周周日零点的毫秒数
  map.set('stext', time1); // 当前周 周一的日期 mm.dd 如 03.14
  map.set('etext', time2); // 当前周周一零点的毫秒数
  map.set('last', last); // 上一周 周六零点的毫秒数
  map.set('next', next); // 下一周  周一零点的毫秒数
  map.set('text', time1 + '-' + time2); // 上一周 周六零点的毫秒数
  map.set('tomorrow', tomorrow); // 明天 零点的毫秒数
  return map;
}

function formatTimeByPattern(val: any) {
  // 2016-05-23 13:58:02.0
  if (val.length > 19) {
    val = val.substring(0, 19);
  }

  let pattern = /-|\./g;
  let year;
  let month;
  let day;
  let reset;

  if (pattern.test(val)) {
    return val.replace(pattern, '/');
  } else {
    // 若无’-‘，则不处理
    if (!~val.indexOf('-')) {
      year = val.slice(0, 4);
      month = val.slice(4, 6);
      day = val.slice(6, 8);
      reset = val.slice(8);
      return year + '/' + month + '/' + day + reset;
    }
  }
}

/**
 * 将时间转化为几天前,几小时前，几分钟前
 *
 * @param {number} ms
 * @returns {*}
 * @example
 *
 * formatTimeAgo(1505232000000);
 * // => 1天前
 */
function formatTimeAgo(ms: any) {
  ms = parseInt(ms);

  let timeNow = Date.now();
  let diff = (timeNow - ms) / 1000;
  let date = new Date();
  // 向下取整更精确些
  let days = Math.floor(diff / (24 * 60 * 60));
  let hours = Math.floor(diff / (60 * 60));
  let minutes = Math.floor(diff / 60);
  let second = Math.floor(diff);

  if (days > 0 && days < 2) {
    return days + '天前';
  } else if (days <= 0 && hours > 0) {
    return hours + '小时前';
  } else if (hours <= 0 && minutes > 0) {
    return minutes + '分钟前';
  } else if (minutes <= 0 && second >= 0) {
    return '刚刚';
  } else {
    date.setTime(ms);

    return (
      date.getFullYear() +
      '-' +
      f(date.getMonth() + 1) +
      '-' +
      f(date.getDate()) +
      ' ' +
      f(date.getHours()) +
      ':' +
      f(date.getMinutes())
    );
  }

  function f(n: any) {
    return n < 10 ? '0' + n : n;
  }
}

/**
 * 数字格式化
 * @param number 要格式化的数字或者字符串形式的数字
 * @param decimalPlaces 保留小数位，默认2，传入`null`不处理
 * @param showThousandSeparator 是否显示千分位分隔符
 * @param asPercentage 是否作为百分比输出（乘以100并增加百分号）
 * @returns 格式化的数字
 */
export function formatNumber(
  number: string | number | null | undefined,
  decimalPlaces: number | null = 2,
  showThousandSeparator = false,
  asPercentage = false,
) {
  if (number === null || number === undefined || number === '') {
    return '';
  }

  number = Number(number);
  if (isNaN(number)) {
    return 'NaN';
  }

  if (asPercentage) {
    number *= 100;
  }

  let formatted = String(number);

  if (typeof decimalPlaces === 'number') {
    let t = new Decimal(number);
    formatted =  t.toFixed(decimalPlaces, Decimal.ROUND_HALF_UP)
  }

  if (showThousandSeparator) {
    if (formatted.includes('.')) {
      formatted = formatted.replace(/\B(?=(\d{3})+(?=\.))/g, ',');
    } else {
      formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  }

  if (asPercentage) {
    formatted += '%';
  }

  return formatted;
}

/**
 * 检查是否是emoji表情
 * @param {*} value 正则校验变量
 * @return {boolean} 正则校验结果 true: 是emoji表情 false: 不是emoji表情
 */
function isEmoji(value: any) {
  let arr = ['\ud83c[\udf00-\udfff]', '\ud83d[\udc00-\ude4f]', '\ud83d[\ude80-\udeff]'];

  return new RegExp(arr.join('|'), 'g').test(value);
}

/**
 * 检查是否为特殊字符
 * @param {string} value 正则校验的变量
 * @returns {boolean} 正则校验结果 true: 是特殊字符 false: 不是特殊字符
 */
function isSpecialChar(value: any) {
  let regEn = /[`~!@#$%^&*()_+<>?:"{},.\/;'[\]\s]/im;
  let regCn = /[·！#￥（——）：；“”‘、，|《。》？、【】[\]\s]/im;

  return regEn.test(value) || regCn.test(value);
}

/**
 * 过滤对象中为空的属性
 *
 * @param obj
 * @returns {*}
 * @example
 *
 * filterEmptyPropObj({name: 'foo', sex: ''})
 * // => {name: 'foo'}
 */
function filterEmptyPropObj(obj: any) {
  if (!(typeof obj == 'object')) {
    return;
  }

  for (let key in obj) {
    if (
      obj.hasOwnProperty(key) &&
      (obj[key] == null || obj[key] == undefined || obj[key] === '')
    ) {
      delete obj[key];
    }
  }
  return obj;
}

/**
 * 递归访问整个树
 */
function visitTree(
  tree: any[],
  cb: (item: any, parent: any, deep: number) => void,
  options?: {
    /** 子项名，默认：`'children'` */
    childrenMapName?: string;
  },
) {
  options = {
    childrenMapName: 'children',
    ...options,
  };
  const inFn = (data: any[], parent: any, deep: number) => {
    for (const item of data) {
      cb(item, parent, deep);
      const childrenVal = item[options!.childrenMapName!];
      if (childrenVal && childrenVal.length > 0) {
        inFn(childrenVal, item, deep + 1);
      }
    }
  };
  inFn(tree, null, 1);
}

/**
 *  处理表格组件，添加字段展示宽度，文本溢出省略显示
 * @param propsColumns 传入的表头
 * @returns
 */
function getScrollX(propsColumns: { [key: string]: any }[]) {
  let scrollx = 0 as number;
  const columnsRes = propsColumns.map((item) => {
    const { dataIndex, title, width, key, fixed } = item;
    const type = Object.prototype.toString.call(title);
    let _width = 0 as number;
    if (!width) {
      switch (type) {
        case '[object Object]':
          _width = title.props.title.length * 14 + 20;
          break;
        case '[object String]':
          _width = title.length * 14 + 20;
          break;
        default:
          _width = width;
      }
    } else {
      _width = width;
    }
    scrollx += _width;
    return {
      ...item,
      key: key || dataIndex,
      width: _width,
      ellipsis: !fixed,
    };
  });
  return { columnsRes, scrollx };
}

function getJsonText(fileUrl: string): Promise<string> {
  return new Promise((ok, error) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', fileUrl);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          // 获取响应数据的原始文本内容
          const rawText = xhr.responseText;
          ok(rawText);
        } else {
          error('请求失败');
        }
      }
    };
    xhr.send();
  });
}

const ellipsisText = (text: string, length: number) => {
  if (text.length > length) {
    return text.substring(0, length) + '...';
  }
  return text;
};

/**
 * 根据传入keys顺序，对传入obj对象键值对排序
 * @param obj
 * @param sortedKeys
 */
function sortObjByKeys<T extends object>(obj: T, sortedKeys: string[]): T {
  const sortedObj: Partial<T> = {};
  sortedKeys.forEach((key) => {
    if (obj?.hasOwnProperty(key)) {
      sortedObj[key as keyof T] = obj[key as keyof T];
    }
  });
  // 将原对象的其他键值对复制到排序后的对象中
  for (const key in obj) {
    if (!sortedObj.hasOwnProperty(key)) sortedObj[key] = obj[key];
  }
  return sortedObj as T;
}

/**
 * 赋给新对象中没有的老对象的值
 * @param old
 */
function assignment(oldObj: { [key: string]: any }, newObj: { [key: string]: any }) {
  Object.keys(oldObj).forEach((key) => {
    if (!(key in newObj)) {
      newObj[key] = oldObj[key];
    }
  });
}

/**
 * 对象数组中 根据key,进行除重
 * @param arr 数据源
 * @param key 过滤凭证
 */
function uniqueArrayBy<T>(arr: T[], key: keyof T): T[] {
  const uniqueValues = new Set<T[keyof T]>();
  const result: T[] = [];

  for (const item of arr) {
    const findValue = uniqueValues.has(item[key]);
    if (!findValue) {
      uniqueValues.add(item[key]);
      result.push(item);
    }
  }
  return result;
}

function isLoadOptions(obj: any): {
  success: boolean;
  msg: string;
} {
  if (typeof obj !== 'object' || obj === null) {
    console.log('不是对象', obj);
    return {
      success: false,
      msg: '不是一个对象或空',
    };
  }
  const allowedProperties = [
    'belongId',
    'collName',
    'filter',
    'group',
    'options',
    'userData',
    'skip',
    'take',
    'formId',
    'requireTotalCount',
    'isCountQuery',
    'sort',
    'extraReations',
    'isExporting',
    'clusterId',
  ];

  for (const key in obj) {
    if (!allowedProperties.includes(key)) {
      return {
        success: false,
        msg: `查询语句不符合规范。属性${key}是非法的`,
      };
    }
  }
  return {
    success: true,
    msg: '',
  };
}
export {
  assignment,
  ellipsisText,
  filterEmptyPropObj,
  formatDate,
  formatTimeAgo,
  getJsonText,
  getQueryString,
  getScrollX,
  isEmoji,
  isSpecialChar,
  sortObjByKeys,
  uniqueArrayBy,
  visitTree,
  isLoadOptions,
};
