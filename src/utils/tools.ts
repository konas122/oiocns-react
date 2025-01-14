import { model, schema } from '@/ts/base';
import { FiledLookup } from '@/ts/base/model';
import moment from 'moment';
import { message } from 'antd';
import { formatDate } from '@/utils/index';
import {
  DataType,
  FieldInfo,
  MenuItemType,
  OperateMenuType,
  PageData,
} from 'typings/globelType';
import { pinyin } from 'pinyin-pro';
import { TargetType } from '@/ts/core/public/enums';
import { cloneDeep } from 'lodash';
import type { IForm, IView } from '@/ts/core';

const dateFormat: string = 'YYYY-MM-DD';

const showMessage = (response: any) => {
  if (response.success) {
    message.success('操作成功！');
  } else {
    message.error('操作失败！发生错误：  ' + response.msg);
  }
};

const debounce = (fun: any, delay?: number) => {
  let timer: any = '';
  let that = this;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(function () {
      fun.call(that, ...args);
    }, delay ?? 300);
  };
};

/**
 * @desc: 处理 翻页参数问题
 * @param {T} params
 * @return {*}
 */
const resetParams = (params: any) => {
  const { page, pageSize, filter, ...rest } = params;
  const num = (page - 1) * pageSize;

  return {
    offset: num >= 0 ? num : 0,
    limit: pageSize || 20,
    filter: filter,
    ...rest,
  };
};

/**
 * 后台响应 => 前端业务结果(分页)
 * @param res 后台分页响应
 * @returns
 */
export function toPageData<T extends DataType>(res: model.ResultType<T>): PageData<T> {
  if (res.success) {
    return {
      success: true,
      data: res.data?.result || [],
      total: res.data?.total || 0,
      msg: res.msg,
    };
  } else {
    return { success: false, data: [], total: 0, msg: res.msg };
  }
}

// m--n 之间的数字
const renderNum = (m: number, n: number) => {
  return Math.floor(Math.random() * (n + 1 - m) + m);
};

const validIsSocialCreditCode = (code: string) => {
  var numUpChar = '0123456789ABCDEFGHJKLMNPQRTUWXY';
  var reg = new RegExp('^[A-Z0-9]+$');
  if (!reg.test(code) || code.length != 18) {
    return false;
  }
  var wis = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28];
  var sum = 0;
  for (var i = 0; i < 17; i++) {
    sum += numUpChar.indexOf(code[i]) * wis[i];
  }
  var ret = 0;
  if (sum % 31 != 0) {
    ret = 31 - (sum % 31);
  }
  return numUpChar.indexOf(code[17]) == ret;
};

/**
 * @description: 聊天间隔时间
 * @param {moment} chatDate
 * @return {*}
 */
const showChatTime = (chatDate: moment.MomentInput) => {
  const cdate = moment(chatDate);
  const date = moment(cdate.format('yyyy-MM-DD'));
  const days = moment().diff(date, 'day');
  switch (days) {
    case 0:
      return cdate.format('H:mm:ss');
    case 1:
      return '昨天 ' + cdate.format('H:mm:ss');
    case 2:
      return '前天 ' + cdate.format('H:mm:ss');
  }
  const year = moment().diff(cdate, 'year');
  if (year == 0) {
    return cdate.format('M月D日 H:mm');
  }
  return cdate.format('yy年 M月D日 H:mm');
};

/**
 * @description: 时间处理
 * @param {string} timeStr
 * @return {*}
 */
const handleFormatDate = (timeStr: string) => {
  const nowTime = new Date().getTime();
  const showTime = new Date(timeStr).getTime();
  // 超过一天 展示 月/日
  if (nowTime - showTime > 3600 * 24 * 1000) {
    return formatDate(timeStr, 'M月d日');
  }
  // 不超过一天 展示 时/分
  return formatDate(timeStr, 'H:mm');
};

/**
 * 格式化时间
 * @param source 时间
 * @param format 格式化字符串
 * @returns 格式化后的时间信息
 */
const formatZhDate = (
  source: string | Date,
  format: string = 'YYYY年MM月DD日 HH:mm:ss.ms',
): string => {
  return moment(source).format(format);
};

let count = 1;
// key: 当前填写字符,key0:记录初始字符, hasKeys:已存在的key数组
const getNewKeyWithString: any = (key: string, key0: string, hasKeys: string[]) => {
  if (hasKeys.includes(key)) {
    count++;
    return getNewKeyWithString(`${key0}(${count})`, key0, hasKeys);
  } else {
    count = 1;
    return key;
  }
};

const getUuid = () => {
  let s = [];
  let hexDigits: any = '0123456789abcdef';
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = '4'; // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = '-';

  let uuid = s.join('');
  return uuid;
};

const findAimObj = (isParent = false, id: string, topParentData?: any[]) => {
  let aimObjet: any = undefined;
  function findItem(id: string, parent: any) {
    const data = parent.children;
    if (aimObjet) {
      return aimObjet;
    }
    const AimObj = data.find((v: any) => {
      return v.id == id;
    });
    if (AimObj) {
      aimObjet = isParent ? parent : AimObj;
      return;
    } else {
      data.forEach((child: any) => {
        return findItem(id, child);
      });
    }
  }
  findItem(id, { children: topParentData });
  return aimObjet;
};

/**
 * 中英文混合按首字母排序
 */
const pySegSort = (arr: string[]) => {
  if (!String.prototype.localeCompare) {
    return null;
  }
  let pattern = new RegExp('[A-Za-z]+');
  let letters = '*abcdefghjklmnopqrstwxyz'.split('');
  let zh = '阿八嚓哒妸发旮哈讥咔垃痳拏噢妑七呥扨它穵夕丫帀'.split('');
  let segs: any[] = [];
  letters.forEach(function (item, i) {
    let curr: any = { letter: item, data: [] };
    arr.forEach(function (item2: string) {
      if (pattern.test(item2.split('')[0])) {
        if (
          (!letters[i] || letters[i].localeCompare(item2) <= 0) &&
          (item2.localeCompare(letters[i + 1]) == -1 || i == letters.length - 1)
        ) {
          curr.data.push(item2);
        }
      } else {
        if (
          (!zh[i - 1] || zh[i - 1].localeCompare(item2) <= 0) &&
          item2.localeCompare(zh[i]) == -1
        ) {
          curr.data.push(item2);
        }
      }
    });
    if (curr.data.length) {
      segs.push(curr);
      curr.data.sort(function (a: any, b: any) {
        return a.localeCompare(b);
      });
    }
  });
  return segs;
};
/**
 * 中英文混合按首字母排序  对象数组
 */
const pySegSortObj = (objArr: any[], field: string) => {
  if (!String.prototype.localeCompare) {
    return null;
  }
  let pattern = new RegExp('[A-Za-z]+');
  let letters = '*abcdefghjklmnopqrstwxyz'.split('');
  let zh = '阿八嚓哒妸发旮哈讥咔垃痳拏噢妑七呥扨它穵夕丫帀'.split('');
  let segs: any[] = [];
  letters.forEach(function (item, i) {
    let curr: any = { letter: item, data: [] };
    objArr.forEach(function (item2: any) {
      if (pattern.test(item2[field].split('')[0])) {
        if (
          (!letters[i] || letters[i].localeCompare(item2[field]) <= 0) &&
          (item2[field].localeCompare(letters[i + 1]) == -1 || i == letters.length - 1)
        ) {
          curr.data.push(item2);
        }
      } else {
        if (
          (!zh[i - 1] || zh[i - 1].localeCompare(item2[field]) <= 0) &&
          item2[field].localeCompare(zh[i]) == -1
        ) {
          curr.data.push(item2);
        }
      }
    });
    if (curr.data.length) {
      segs.push(curr);
      curr.data.sort(function (a: any, b: any) {
        return a[field].localeCompare(b[field]);
      });
    }
  });
  return segs;
};

const findMenuItemByKey = (item: MenuItemType, key: string): MenuItemType | undefined => {
  for (const node of item.children || []) {
    if (node.key === key) {
      node.parentMenu = item;
      return node;
    }
    const find = findMenuItemByKey(node, key);
    if (find != undefined) {
      return find;
    }
  }
  return undefined;
};

const findNodeByKey = (obj: any, value: string, key: string = 'id'): any | null => {
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findNodeByKey(item, value, key);
      if (found) return found;
    }
    return null;
  }
  if (typeof obj === 'object' && obj !== null) {
    if (obj[key] === value) {
      return obj;
    }
    if (obj.children) {
      return findNodeByKey(obj.children, value, key);
    }
  }
  return null;
};

const cleanMenus = (items?: OperateMenuType[]): OperateMenuType[] | undefined => {
  const newItems = items?.map((i) => {
    return {
      key: i.key,
      label: i.label,
      icon: i.icon,
      model: i.model,
      children: cleanMenus(i.children),
    } as OperateMenuType;
  });
  if (newItems && newItems.length > 0) {
    return newItems;
  }
  return undefined;
};
/** url下载 */
const downloadByUrl = (url: string) => {
  if (!url) {
    return message.error('资源路径不存在，请重试！');
  }
  const DownA = document.createElement('a'); // 创建a标签
  DownA.setAttribute('download', url); // download属性(为下载的文件起个名)
  DownA.setAttribute('href', url); // href链接（文件的url地址）（如果是下载图片需要使用代理，不然图片不会是下载而是打开）
  DownA.click(); // 自执行点击事件
};

const truncateString = (str: string, maxLength: number) => {
  if (str.length > maxLength) {
    return str.slice(0, maxLength - 3) + '...';
  }
  return str;
};

/** 获取文件的实际地址 */
const shareOpenLink = (link: string | undefined, download: boolean = false) => {
  if (link?.startsWith('/orginone/kernel/load/')) {
    return download ? `${link}?download=1` : link;
  }
  return `/orginone/kernel/load/${link}${download ? '?download=1' : ''}`;
};

/** 获取html文本中的字符串 */
const parseHtmlToText = (html: string) => {
  var text = html.replace(/\s*/g, ''); //去掉空格
  text = text.replace(/<[^>]+>/g, ''); //去掉所有的html标记
  text = text.replace(/&nbsp;/g, ''); //去掉&nbsp空格符号
  text = text.replace(/↵/g, ''); //去掉所有的↵符号
  return text.replace(/[\r\n]/g, ''); //去掉回车换行
};

/** 将链接转化为超链接 */
const parseTolink = (val: string) => {
  return val
    .replace(/(https?:\/\/[^\s]+)/g, '<a target=_blank href="$1">$1</a>')
    .replace(/\n/g, '<br/>');
};

/** 是否为纯链接 */
const isURL = (text: string) => {
  return /^(https?:\/\/)([\w-]+(\.[\w-]+)+)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/.test(
    text,
  );
};
const jsonParse = (val: any, defaultVal = null) => {
  if (!val || typeof val !== 'string') {
    return defaultVal;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    return defaultVal;
  }
};

const tryParseJson = (json: string | undefined) => {
  if (json) {
    const data = jsonParse(json);
    if (data && Object.keys(data).length > 0) {
      return data;
    }
  }
  return undefined;
};

const generateCodeByInitials = (str: string) => {
  return pinyin(str, { pattern: 'first' }).toUpperCase().replace(/\s*/g, '');
};

// 人员分类型添加本人选项
const formatPeople = (lookups?: FiledLookup[]) => {
  if (!lookups?.length) return [];
  const isSavePerson = cloneDeep(lookups)?.filter((a) => {
    return a.text === '本人';
  });
  isSavePerson.length ||
    lookups?.unshift({
      text: '本人',
      id: 'person',
      value: 'person',
    } as FiledLookup);
  return lookups;
};

const fieldConvert = (resultFields: model.FieldModel[]) => {
  const valueFields: FieldInfo[] = [];
  for (const item of resultFields) {
    var field = {
      id: item.id,
      name: item.code,
      dataField: item.code,
      caption: item.name,
      propId: item?.propId,
      speciesId: item?.speciesId,
    };
    switch (item.valueType) {
      case '数值型':
      case '货币型':
        valueFields.push({ ...field, dataType: 'number', fieldType: item.valueType });
        break;
      case '日期型':
        valueFields.push({ ...field, dataType: 'date', fieldType: '日期型' });
        break;
      case '时间型':
        valueFields.push({ ...field, dataType: 'datetime', fieldType: '时间型' });
        break;
      case '办事流程':
        valueFields.push({ ...field, dataType: 'string', fieldType: '办事流程' });
        break;
      case '选择型':
      case '分类型':
        valueFields.push({
          ...field,
          dataType: 'string',
          fieldType: '选择型',
          lookup: {
            displayExpr: 'text',
            valueExpr: 'value',
            allowClearing: true,
            dataSource: formatPeople(item.lookups),
          },
        });
        break;
      case '描述型':
      case '引用型':
        valueFields.push({ ...field, dataType: 'string', fieldType: item.valueType });
        break;
      case '用户型':
        valueFields.push({
          ...field,
          dataType: 'string',
          fieldType: '用户型',
          lookupAuth: {
            displayExpr: 'text',
            valueExpr: 'value',
            allowClearing: true,
            dataSource: [
              {
                id: 'person',
                text: '本人',
                value: 'person',
              },
              {
                id: 'company',
                text: '本单位',
                value: 'company',
              },
              {
                id: 'dept',
                text: '本部门',
                value: 'dept',
              },
            ],
          },
        } as FieldInfo);
        break;
    }
  }
  return valueFields;
};

/** 将HTML字符串中的外部资源链接修改为空链接 */
const disableExternalResources = (html: string) => {
  // |href
  const modifiedHtml = html.replace(
    /(src|action|data|poster|cite|codebase|manifest)="([^"]*)"/g,
    '$1=""',
  );
  return modifiedHtml;
};

/** 解析网站预览信息 */
const extractPreviewData = (html: string) => {
  const newHtml = disableExternalResources(html);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = newHtml;
  /** 获取标题 */
  const title =
    tempDiv.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    tempDiv.querySelector('title')?.textContent ||
    '';
  /** 获取网站描述信息 */
  const metaDescription =
    tempDiv.querySelector('meta[property="og:description"]') ||
    tempDiv.querySelector('meta[name="description"]');
  const description = metaDescription?.getAttribute('content') || '';

  /** 获取icon */
  const linkIcon =
    tempDiv.querySelector('meta[property="og:image"]') ||
    tempDiv.querySelector('link[rel="shortcut icon"]');
  const favicon =
    linkIcon?.getAttribute('content') || linkIcon?.getAttribute('href') || '';

  return {
    title,
    description,
    favicon,
  };
};

/** 表单用户型筛选转换成id */
const userFormatFilter = async (filter: any, form: IForm | IView) => {
  if (!filter) return;
  let filters = Array.isArray(filter[0]) ? filter : [filter];
  const extraFilters: any = [];
  const fields = form.fields.filter((i) => i.valueType === '用户型').map((i) => i.code);
  fields.push('createUser', 'updateUser');
  let searchValues = filters.filter((item: model.FieldModel) => {
    return fields.includes(item[0]);
  });
  if (!searchValues.length || !searchValues[0][2]) return filters;
  searchValues = searchValues.map((i: model.FieldModel) => i[2]);
  let res = await Promise.all(
    [...new Set(searchValues)].map(async (val) => {
      const res = (await form.directory.target.space.getPartMembers(
        0,
        undefined,
        [TargetType.Person, TargetType.Department],
        val,
      )) as model.PageResult<schema.XTarget>;
      return res.result?.length
        ? res.result.map((i) => {
            return { name: val, id: i.id };
          })
        : [];
    }),
  );
  const ids = res.flat(1);
  filters.forEach((item: any, index: number) => {
    if (Array.isArray(item) && fields.includes(item[0])) {
      if (ids.length) {
        ids.forEach((i: any, idx: number) => {
          if (i.name === item[2]) {
            if (idx > 0) {
              const filter: any = cloneDeep(item);
              filter[2] = i.id;
              filter.filterValue = i.id;
              filters.splice(index, 0, filter);
              extraFilters.push('or', filter);
            } else {
              item[2] = i.id;
              item.filterValue = i.id;
            }
          }
        });
      }
    }
    return true;
  });
  return filters;
};

/**  根据域名获取平台名 */
const getPlatFormName = (): string => {
  const names = window.location.hostname.split('.');
  let platName: string;
  switch (names[0]) {
    case 'anxinwu':
      platName = '安心屋';
      break;
    case 'gongyicang':
      platName = '公益仓';
      break;
    case 'asset':
      platName = '资产共享云';
      break;
    case 'assetcloud':
      platName = '资产共享云';
      break;
    case 'dataexp':
      platName = '数据资产治理实验平台';
      break;
    case 'ocia':
      platName = '资产云开放协同创新中心';
      break;
    case 'apparatus':
      platName = '大型科研仪器共享平台';
      break;
    case 'company':
      platName = '校企监管平台';
      break;
    case 'healthcloud':
      platName = '健康云';
      break;
    default:
      platName = '奥集能';
      break;
  }
  return platName;
};

/**  商城模板获取默认图 */
const getDefaultImg = (product: schema.XProduct, species: model.FieldModel[]) => {
  let img = '';
  species.forEach((specie) => {
    if (product[specie.code]) {
      const lookup = specie.lookups?.find(
        (lookup) => lookup.value === product[specie.code],
      );
      if (lookup) {
        switch (lookup.text) {
          case '房屋和构筑物':
            img = 'img/mallTemplate/horse.png';
            break;
          case '家具和用具':
            img = 'img/mallTemplate/furniture.png';
            break;
          case '流动资产':
            img = 'img/mallTemplate/assets.png';
            break;
          case '设备':
          case '打印':
            img = 'img/mallTemplate/equipment.png';
            break;
          case '特种动植物':
            img = 'img/mallTemplate/flora.png';
            break;
          case '图书和档案':
            img = 'img/mallTemplate/books.png';
            break;
          case '文物和陈列品':
            img = 'img/mallTemplate/cultural.png';
            break;
          case '无形资产':
            img = 'img/mallTemplate/intangibleAssets.png';
            break;
          case '物资':
            img = 'img/mallTemplate/materials.png';
            break;
          case '长期股权投资':
            img = 'img/mallTemplate/investment.png';
            break;
          case '笔记本':
            img = 'img/mallTemplate/notebook.png';
            break;
          case '耳机':
            img = 'img/mallTemplate/earphone.png';
            break;
          case '键盘':
            img = 'img/mallTemplate/keyboard.png';
            break;
          case '空调':
            img = 'img/mallTemplate/airConditioner.png';
            break;
          case '立体空调':
            img = 'img/mallTemplate/stereoAirConditioner.png';
            break;
          case '平板':
            img = 'img/mallTemplate/slab.png';
            break;
          case '手表':
            img = 'img/mallTemplate/watches.png';
            break;
          case '手机':
            img = 'img/mallTemplate/phone.png';
            break;
          case '鼠标':
            img = 'img/mallTemplate/mouse.png';
            break;
          case '台式机':
            img = 'img/mallTemplate/desktop.png';
            break;
          case '相机':
            img = 'img/mallTemplate/camera.png';
            break;
          case '椅子':
            img = 'img/mallTemplate/chair.png';
            break;
          case '桌子':
            img = 'img/mallTemplate/desk.png';
            break;
        }
      }
    }
  });
  if (img) {
    return img;
  }
  return '/img/mallTemplate/default.png';
};

export {
  cleanMenus,
  dateFormat,
  debounce,
  downloadByUrl,
  extractPreviewData,
  fieldConvert,
  findAimObj,
  findMenuItemByKey,
  findNodeByKey,
  formatZhDate,
  generateCodeByInitials,
  getDefaultImg,
  getNewKeyWithString,
  getPlatFormName,
  getUuid,
  handleFormatDate,
  isURL,
  jsonParse,
  parseHtmlToText,
  parseTolink,
  pySegSort,
  pySegSortObj,
  renderNum,
  resetParams,
  shareOpenLink,
  showChatTime,
  showMessage,
  truncateString,
  tryParseJson,
  userFormatFilter,
  validIsSocialCreditCode,
};
