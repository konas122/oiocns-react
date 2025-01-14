/**
 * 根据表单编码获取表单数据
 * @param formCode 表单编码
 * @returns 可读写的表单数据对象，其中键是每个特性的编码，值是字段值
 */
declare function form(formCode: string): {
  [attributeCode: string]: any;
};

type XProperty = {
  /** 值类型 */
  valueType: string;
  /** 附加信息 */
  info: string;
  /** 计量单位 */
  unit: string;
  /** 标签ID */
  speciesId: string;
  /** 表单id */
  formId?: string;
  /** 来源用户ID */
  sourceId: string;
  /** 变更目标 */
  isChangeTarget: boolean;
  /** 变更源 */
  isChangeSource: boolean;
  /** 可拆分或合并 */
  isCombination: boolean;
};

type XAttribute = {
  /** 名称 */
  name: string;
  /** 编号 */
  code: string;
  /** 规则 */
  rule: string;
  /** 备注 */
  remark: string;
  /** 工作职权Id */
  authId: string;
  /** 属性Id */
  propId: string;
  /** 表单Id */
  formId: string;
  /** 归属用户ID */
  belongId: string;
  /** 特性显示组件 */
  widget?: string;
  /** 特性值类型 */
  valueType?: string;
  /** 关联属性 */
  property: XProperty;
  /** 配置参数 */
  options?: Record<string, any>;
};

/**
 * 获取表单特性详情
 * @param formCode 表单编码
 * @param code 特性编码
 * @returns 特性详情
 */
declare function attr(formCode: string, code: string): XAttribute | undefined;

/**
 * 根据分类项值获取编码
 * @param speciesId 分类id
 * @param value 分类项值（字符`S` + 分类项id）
 * @returns 分类项编码
 */
declare function speciesCode(speciesId: string, value?: `S${string}`): string | undefined;
/**
 * 根据特性获取编码
 * @param attr 特性
 * @param value 分类项值（字符`S` + 分类项id）
 * @returns 分类项编码
 */
declare function speciesCode(attr: XAttribute, value?: `S${string}`): string | undefined;

/**
 * 根据分类项编码获取分类型值
 * @param speciesId 分类id
 * @param code 分类项编码
 * @returns 分类项值（字符`S` + 分类项id）
 */
declare function speciesValue(speciesId: string, code?: string): `S${string}` | undefined;
/**
 * 根据特性获取分类型值
 * @param attr 特性
 * @param code 分类项编码
 * @returns 分类项值（字符`S` + 分类项id）
 */
declare function speciesValue(attr: XAttribute, code?: string): `S${string}` | undefined;

/**
 * 判断第二项分类项值是否存在第一项分类项值的子树（包含第一项分类项值)里
 * @param speciesId 分类id
 * @param parentValues 第一项分类项值
 * @param currentValue 第二项分类项值
 * @returns 第二项分类项值是否存在第一项分类项值的子树（包含第一项分类项值)里(布尔值)
 */
declare function isInSpeciesTree(
  speciesId: string,
  parentValues: string,
  currentValue: string,
): boolean;
/**
 * 判断第二项分类项值是否存在第一项分类项值的子树（包含第一项分类项值)里
 * @param speciesId 分类id
 * @param parentValues 第一项分类项值
 * @param currentValue 第二项分类项值
 * @returns 第二项分类项值是否存在第一项分类项值的子树（包含第一项分类项值)里(布尔值)
 */
declare function isInSpeciesTree(
  attr: XAttribute,
  parentValues: string,
  currentValue: string,
): boolean;
/**
 * 弹出渲染指令
 * @param type 渲染类型（'change' | 'valid',
 * @param cmd 渲染指令（'result' | 'visible' | 'readOnly' | 'isRequired'
 * @args 渲染参数 （{formId: string; destId: string; typeName?: any; value: any;}）
 */
declare function emit(
  type: 'change' | 'valid',
  cmd: 'result' | 'visible' | 'readOnly' | 'isRequired',
  args: {
    formId: string;
    destId: string;
    typeName?: any;
    value: any;
  },
): void;
