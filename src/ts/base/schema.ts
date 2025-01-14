import { model } from '.';
import {
  ReceptionStatus,
  ReportTaskTreeSummary,
} from '../core/work/assign/reception/status';
import {
  NodeType,
  PeriodType,
  ReceptionType,
  ReportTreeNodeTypes,
  ReportTreeTypes,
  ViewType,
} from './enum';
import { FileItemShare, ReceptionStatusModel, ValidateErrorInfo } from './model';

export type Xbase = {
  // 雪花ID
  id: string;
  // 状态
  status: number;
  // 创建人员ID
  createUser: string;
  // 更新人员ID
  updateUser: string;
  // 修改次数
  version: string;
  // 创建时间
  createTime: string;
  // 更新时间
  updateTime: string;
  // 共享用户ID
  shareId: string;
  // 归属用户ID
  belongId: string;
  // 关系
  extraReations?: any;
};

export type XCache = {
  // 完整的ID标识
  fullId: string;
  // 标签
  tags?: string[];
};

export type XEntity = {
  // 名称
  name: string;
  // 编号
  code: string;
  // 备注
  remark: string;
  // 图标
  icon: string;
  // 类型
  typeName: string;
  // 标签组
  labels?: string[];
  // 快捷方式目标
  sourceId?: string;
  // 创建类别标准的用户
  belong: XTarget | undefined;
} & Xbase;

//应用定义
export type XStandard = {
  // 目录ID
  directoryId: string;
  // 是否删除
  isDeleted: boolean;
  // 排序
  sort: string;
} & XEntity;

// 排序存储
export type Sort = {
  // 顺序
  sort: number;
  // id
  id: string;
};

/** 容器 */
export type XContainer = {
  // 排序
  sorts: Sort[] | undefined;
} & XStandard;

// 常用定义
export type XCommon = {
  // 唯一标识
  id: string;
  // 空间ID
  spaceId: string;
  // 用户ID
  targetId: string;
  // 目录ID
  directoryId: string;
  // 应用ID
  applicationId: string;
  // 文件类型
  typeName: string;
  // 分组信息
  groupName?: string;
};

//应用定义
export type XApplication = {
  // 父ID
  parentId: string;
  // 应用资源
  resource: string;
  // 应用下的办事
  defines: XWorkDefine[] | undefined;
  // 应用的结构
  parent: XApplication | undefined;
  // 应用的结构
  nodes: XApplication[] | undefined;
  // 应用的目录
  directory: XDirectory | undefined;
  // 应用的banners
  banners?: string | undefined;
  // 权限id
  applyAuths: string[];
} & XContainer;

//特性和属性的关系
export type XAttrLinkProp = {
  // 特性ID
  attrId: string;
  // 属性ID
  propId: string;
  // 归属用户ID
  belongId: string;
  // 关联的属性
  property: XProperty | undefined;
  // 关联的特性
  attribute: XAttribute | undefined;
} & Xbase;

//度量特性定义
export type XAttribute = {
  // 名称
  name: string;
  // 编号
  code: string;
  // 规则
  rule: string;
  // 备注
  remark: string;
  // 工作职权Id
  authId: string;
  // 属性Id
  propId: string;
  // 单Id
  formId: string;
  // 虚拟列规则
  queryRule: string;
  // 归属用户ID
  belongId: string;
  // 特性显示组件
  widget?: string;
  // 特性值类型
  valueType?: string;
  // 关联属性
  property: XProperty | undefined;
  // 配置参数
  options: XAttributeProps | undefined;
  // 关联的分类ID
  speciesId?: string;
} & Xbase;

// 度量特性配置参数
export type XAttributeProps = {
  /** 表单参数 */
  // 是否可设置空值
  allowNull?: boolean;
  // 是否只读
  readOnly?: boolean;
  // 是否只读条件
  readOnlyConditions?: model.conditionConfig;
  // 是否必填
  isRequired?: boolean;
  // 是否必填条件
  isRequiredConditions?: model.conditionConfig;
  // 隐藏特性
  hideField?: boolean;
  // 根据其它表单相同code值改变
  changeWithCode?: XForm[];
  // 字段匹配依据
  changeWithCodeField?: boolean;
  // 隐藏条件
  hideFieldConditions?: model.conditionConfig;
  // 默认值
  defaultValue?: any;
  // 成员的上级组织
  teamId?: string;
  // 是否限定为操作主体
  isOperator?: boolean;
  /** 表格参数 */
  // 是否可见
  visible?: boolean;
  // 是否显示在左侧分类列
  species?: boolean;
  // 是否固定列
  fixed?: boolean;
  // 是否展示至摘要
  showToRemark?: boolean;
  // 是否开启搜索
  searchEnabled?: boolean;
  // 是否自动生成值
  isAsyncVal?: boolean;
  // 是否选择时 空值自动生成值
  autoSelectedFill?: boolean;
  // 是否内置字段
  isNative?: boolean;
  // 自动生成值
  asyncGeneateConditions?: model.Encode[];
  // 资产拆分自动生成值
  asyncSplitConditions?: model.Encode[];
  // 展示格式(日期、时间等)
  displayFormat?: string;
  // 展示默认列宽
  defaultWidth?: number;
  // 是否汇总计算
  isSummary?: boolean;
  // 排序（升序、降序）
  sortOrder?: 'asc' | 'desc';
  // 数字型精度
  accuracy?: number;
  // 多级选择框展示类型
  displayType?: number | undefined;
  // 是否只能选择末级节点
  isSelectLastLevel?: boolean;
  // 规则提示语
  rulePrompt?: string;
  // 报表临时属性坐标
  reportTemporaryCoord?: string;
  // 默认类型
  defaultType?: string;
  /** 标记计算属性（用于报表单元格颜色） */
  isComputed?: boolean;
  // 用户型数据 是否在列表展示编码
  showCode?: boolean;
  // 筛选其他数据的属性
  viewFilterKey?: string;
  /** 最大值 */
  min?: any;
  /** 最小值 */
  max?: any;
  /** 范围 */
  dateRange?: any;
  /** 绑定节点 */
  bindNode?: string;
};

//权限定义
export type XAuthority = {
  // 公开的
  public: boolean;
  // 上级权限ID
  parentId: string;
  // 共享用户ID
  shareId: string;
  // 上下级权限
  parent: XAuthority | undefined;
  // 上下级权限
  nodes: XAuthority[] | undefined;
  // 权限对应的身份
  identitys: XIdentity[] | undefined;
  // 权限可操作的度量
  autAttrs: XAttribute[] | undefined;
} & XEntity;

//目录定义
export type XDirectory = {
  // 共享用户ID
  shareId: string;
  // 目录下的属性
  propertys: XProperty[] | undefined;
  // 目录下的单
  forms: XForm[] | undefined;
  // 目录下的分类
  species: XSpecies[] | undefined;
  // 目录下的应用
  applications: XApplication[] | undefined;
  // 目录的结构
  parent: XDirectory | undefined;
  // 目录的结构
  nodes: XDirectory[] | undefined;
  // 权限ids
  applyAuths: string[];
} & XContainer;
export interface XGroups {
  name: string;
  index: number;
  valueType: '分组型';
}
//表单定义
export type XForm = {
  [key: string]: any;
  // 表单布局
  rule: model.Rule[];
  // 配置参数
  options: XFormProps | undefined;
  // 表单的特性
  attributes: XAttribute[];
  // 报表的填报周期
  cycle?: string | undefined;
  // 报表的内容
  reportDatas: string;
  // 存储的集合名称
  collName: string | undefined;
  // 应用Id(应用内的表单)
  applicationId?: string;
  // 导入匹配
  matchImport?: string;
  // 分组展示
  groups?: XGroups[];
} & XStandard &
  model.IDocumentConfigHost;

//报表定义
export type XReport = {
  // 表单布局
  rule: model.Rule[];
  // 配置参数
  options: XFormProps | undefined;
  // 报表的属性
  attributes: XAttribute[];
  // 报表的内容
  sheets: {
    [key: string]: XSheet;
  };
  // 存储的集合名称
  collName: string | undefined;
  // 报表版本id
  reportId: string;
  // 应用Id(应用内的报表)
  applicationId?: string;
  // 变量集
  variables?: XVariables;
  // 发起权限
  applyAuths: string[];
} & XStandard &
  model.IDocumentConfigHost;

export type XVariables = {
  [key: string]: XVariable;
};

export type XVariable = {
  value?: {
    // 值类型
    type: string;
    // 值
    valueString: any;
  };
};

//报表sheets定义
export type XSheet = {
  cells: XSheetCells;
  // sheet页的名称
  name: string;
  // sheet页的code
  code: string;
  // sheet页属性id
  attributeId?: string;
  // sheet页的配置
  sheetConfig: XSheetConfig;
};

//报表sheet单元格配置
export type XSheetCells = {
  [key: string]: XCells;
};

export type XCells = {
  // 列的坐标
  col: number;
  // 行的坐标
  row: number;
  // 只读
  readOnly?: boolean;
  // 精度
  accuracy?: number;
  // 校验规则
  rule: XCellRule;
  // 单元格类型
  valueType?: string;
  // 单元格缓存值
  cacheValue?: string;
  // class样式
  class?: { [key: string]: string };
  // style样式
  style?: { [key: string]: string };
  // sheet表的code
  code?: string;
};

export type XCellRule = {
  // 是否必填
  isRequired?: boolean;
  // 是否计算汇总
  isSummary?: boolean;
  // 校验规则
  ruleString?: string;
  // 是否变量集取数
  isVariableData?: boolean;
  // 单元格值
  value?: {
    // 值类型
    type: string;
    // 值
    valueString: any;
  };
};

//报表sheet配置定义
export type XSheetConfig = {
  // 合并的单元格
  mergeCells?: any[];
  // sheet页行高
  row_h?: string[];
  // sheet页列宽
  col_w?: string[];
  // 浮动行设置
  floatRowsSetting?: XFloatRowsInfo[];
  // sheet页列数
  minCols?: number;
  // sheet页行数
  minRows?: number;
};

export type XFloatRowsInfo = {
  // 坐标
  coords: string;
  // 代码
  floatRowCode?: string;
  // 是否浮动行
  isFloatRows: boolean;
  // 浮动行起始行
  floatStartLine: number;
  // 浮动行数
  floatRowNumber: number;
  // 列字段
  rowsInfo: XRowsInfo[];
  // 起始列
  startColumn: number;
  // 需要合并的单元格
  mergeCells: any;
  // 子表的单元格宽度集合
  colWidths: any;
  // 浮动行对象型id
  attributeId?: string;
  // sheet表的code
  code?: string;
};

export type XRowsInfo = {
  // 字段名
  name: string;
  // 单元格列数
  index: number;
  // 单元格类型
  valueType?: string;
  // 校验规则
  rule: XCellRule;
  // 精度
  accuracy?: number;
  // 是否只读
  isOnlyRead?: boolean;
  // 行次
  isLineNumber?: boolean;
  // 起始行次
  startLineNumber?: number;
};

// 视图特性配置参数
export type XViewProps = {
  //是否允许集群成员查看
  allowMemberView?: boolean;
  // 图表类型
  chartType?: string;
  // 绑定表单
  formOptions?: XFormOptions[];
  // 绑定树
  treeInfo?: XTreeInfo;
  // 视图打开方式
  viewType?: 'work' | 'default';
  // 查询组织树
  organizationTree?: string;
} & XFormProps;

// 视图绑定表单信息
export type XFormOptions = {
  // 表单名称
  name: string;
  // 表单id
  id: string;
  // 表单信息
  metadata: any;
};

// 视图绑定树信息
export type XTreeInfo = {
  // 目录Id
  directoryId: string;
  // 应用Id
  applicationId: string;
  // 树Id
  id: string;
  // 查询key
  key: 'id' | 'sourceId' | 'or';
  // 树的名称
  name: string;
};

//视图定义
export type XView = {
  [key: string]: any;
  // 视图子类型
  subTypeName: ViewType;
  // 配置参数
  options: XViewProps;
  // 视图的特性
  attributes: XAttribute[];
  // 存储数据的集合名称
  collName: string | undefined;
  // 应用Id
  applicationId?: string;
} & XStandard;
//打印模块
export type XPrint = {
  [key: string]: any;
  // 应用内的打印模板id
  applicationId?: string;
  // 数据
  table?: model.TableModel[];
  //模版名称
  name: string;
} & XStandard;

export interface XDocumentTemplate extends XStandard {
  typeName: '文档模板';
  // 应用内的打印模板id
  applicationId?: string;
}

// 用户自定义集合
export type XDefinedColl = {
  // 别名
  alias: string;
} & Xbase;

export type XFormFilter = {
  filterRedRow?: string;
  filterRedRowExp?: string;
  filterExp?: string;
  filterDisplay?: string;
  classifyExp?: string;
  classifyDisplay?: string;
  authExp?: string;
  authDisplay?: string;
  groupExp?: string;
  groupDisplay?: string;
  groupId?: string;
  clusterId?: string; // 数据集群Id
};
export type XTagFilter = {
  id: string;
  typeName: string;
  name: string;
  code: string;
  value: string;
};

export type XSpeciesFilter = {
  id: string;
  name: string;
  remark: string;
  speciesList: model.speciesListItem[] | undefined;
  speciesName: string;
};

// 表单规则
/** @deprecated 旧版规则 */
export type XFormRule1 = {
  id: string;
  name: string;
  type: 'show' | 'calc';
  trigger: string[];
  target: string;
  remark: string;
};

// 表单展示规则
/** @deprecated 旧版规则 */
export type FormShowRule = {
  showType: string;
  value: boolean;
  condition: string;
} & XFormRule1;

// 表单计算规则
/** @deprecated 旧版规则 */
export type FormCalcRule = {
  formula: string;
} & XFormRule1;

// 度量特性配置参数
export type XFormProps = {
  // 常规项宽度
  itemWidth: number;
  // 数据范围限制
  dataRange?: XFormFilter;
  // 办事数据范围限制
  workDataRange?: XFormFilter;
  //视图权限过滤参数
  viewDataRange?: { company: string; department: string; person: string };
  // // 属性过滤
  // attributeFilter?: string
  // 业务类型
  businessType?: string;
  //是否允许集群成员查看
  allowMemberView?: boolean;
};

/**
 * 表单规则类型
 * @deprecated 旧版规则
 */
export type XFormRule = {
  id: string;
  /* 规则名称 */
  name: string;
  /* 规则类型 */
  ruleType: 'method' | 'formula';
  /* 触发方式 初始化-修改时-提交时 */
  trigger: 'Start' | 'Running' | 'Submit';
  /* 规则支持的数据类型 */
  accept: string[];
  /* 规则关联特性 */
  linkAttrs: any[];
  /* 关联项最大数量 */
  max?: number;
  /* 规则是否可扩展关联项 */
  isExtend: boolean;
  /* 错误提示 */
  errorMsg: string;
  /* 规则执行函数构造器 */
  creatFun?: string;
  /* 规则执行函数 */
  content: Function;
  /* 备注 */
  remark: string;
};
/**
 * 表单规则类型
 * @deprecated 旧版规则
 */
export type FormRuleType = {
  /* 规则数据 */
  list: XFormRule[];
  /* 设计展示数据 */
  schema: any;
};
/**
 * 表单特性规则类型
 * @deprecated 旧版规则
 */
export type AttrRuleType = {
  /* 标题 */
  name: string;
  /* 编号 */
  code: string;
  /* 字段是否显示在输入区域 */
  hidden?: boolean;
  /* 字段是否只读 */
  readonly?: boolean;
  /*是否必填 */
  required?: boolean;
  allowClear?: boolean;
  maxLength?: number;
  minLength?: number;
  /* 数值类型 最小值 */
  min?: number;
  /* 数值类型 最大值 */
  max?: number;
  /* 展示组件类型 */
  widget?: string;
  /* 输入提示 */
  placeholder?: string;
  /* 管理权限 */
  authId?: string;
  /* 特性定义 */
  remark?: string;
  /* 正则校验 */
  rules: string;
  /* 规则数据 */
  list?: XFormRule[];
  /*  设计展示数据 */
  schema: any;
};

//身份证明
export type XIdProof = {
  // 身份ID
  identityId: string;
  // 对象ID
  targetId: string;
  // 岗位Id
  teamId: string;
  // 身份证明证明的用户
  target: XTarget | undefined;
  // 身份证明证明的身份
  identity: XIdentity | undefined;
} & Xbase;

//身份
export type XIdentity = {
  // 职权Id
  authId: string;
  // 共享用户ID
  shareId: string;
  // 身份证明
  idProofs: XIdProof[] | undefined;
  // 身份集关系
  identityTeams: XTeamIdentity[] | undefined;
  // 赋予身份的用户
  givenTargets: XTarget[] | undefined;
  // 身份集对于组织
  teams: XTeam[] | undefined;
  // 身份的类别
  authority: XAuthority | undefined;
  // 共享用户
  share: XTarget | undefined;
} & XEntity;

//属性定义
export type XProperty = {
  // 值类型
  valueType: string;
  // 附加信息
  info: string;
  // 计量单位
  unit: string;
  // 标签ID
  speciesId: string;
  // 表单id
  formId?: string;
  // 来源用户ID
  sourceId: string;
  // 给物的度量标准
  linkAttributes: XAttribute[] | undefined;
  // 特性关系
  links: XAttrLinkProp[] | undefined;
  // 创建的特性集
  attributes: XAttribute[] | undefined;
  // 附加过属性的物
  things: XThing[] | undefined;
  // 属性的物的度量
  propThingValues: XThingProp[] | undefined;
  // 属性的目录
  directory: XDirectory | undefined;
  // 字典类型
  species: XSpecies | undefined;
  // 序列类型
  sequence?: XSequence | undefined;
  // 变更目标
  isChangeTarget: boolean;
  // 变更源
  isChangeSource: boolean;
  // 标记拆分或合并
  isCombination: boolean;
} & XStandard;

//用户关系
export type XRelation = {
  // 对象ID
  targetId: string;
  // 组织ID
  teamId: string;
  // 关联的组织团队
  team: XTeam | undefined;
  // 关联的组织实体
  target: XTarget | undefined;
} & Xbase;

//分类标签
export type XSpecies = {
  // 来源用户ID
  sourceId: string;
  // 组织 ID
  generateTargetId: string;
  // 分类的标签
  tags: '应用分类' | '组织分类' | '';
  // 分类的类目
  speciesItems: XSpeciesItem[] | undefined;
  // 使用该分类的度量属性
  speciesProps: XProperty[] | undefined;
  // 分类的目录
  directory: XDirectory | undefined;
  // 字典 | 人员分类
  isPersonnel?: boolean;
} & XStandard;

//分类类目
export type XSpeciesItem = {
  // 附加信息
  info: string;
  // 父类目ID
  parentId: string;
  // 分类ID
  speciesId: string;
  // 字典类型
  species: XSpecies | undefined;
  // 类目的结构
  parent: XSpeciesItem | undefined;
  // 类目的结构
  nodes: XSpeciesItem[] | undefined;
  // 关联id
  relevanceId?: string;
} & XEntity;

//用户
export type XTarget = {
  // 雪花ID
  id: string;
  // 名称
  name: string;
  // 编号
  code: string;
  // 备注
  remark: string;
  // 图标
  icon: string;
  // 类型
  typeName: string;
  // 归属用户ID
  belongId: string;
  // 开放组织
  public: boolean;
  // 存储
  storeId: string;
  // 状态
  status: number;
  // 创建人员ID
  createUser: string;
  // 更新人员ID
  updateUser: string;
  // 修改次数
  version: string;
  // 创建时间
  createTime: string;
  // 更新时间
  updateTime: string;
  // 创建类别标准的用户
  belong: XTarget | undefined;
  // 身份证明
  idProofs: XIdProof[] | undefined;
  // 组织的身份
  shareIdentitys: XIdentity[] | undefined;
  // 归属的身份
  identitys: XIdentity[] | undefined;
  // 加入团队的关系
  relations: XRelation[] | undefined;
  // 作为团队的影子
  team: XTeam | undefined;
  // 该用户创建的职权标准
  authority: XAuthority[] | undefined;
  // 加入的团队
  relTeams: XTeam[] | undefined;
  // 赋予该用户创建的身份
  givenIdentitys: XIdentity[] | undefined;
  // 该组织或个人所属的用户
  targets: XTarget[] | undefined;
} & XEntity;

export type XDeveloper = {
  // 研发
  dev: number;
  // 开发者目录
  devId: string;
} & XTarget &
  XContainer;

//虚拟组织
export type XTeam = {
  // 名称
  name: string;
  // 编号
  code: string;
  // 实体
  targetId: string;
  // 加入团队的用户
  relTargets: XTarget[] | undefined;
  // 组织身份集关系
  teamIdentitys: XTeamIdentity[] | undefined;
  // 加入团队的用户的关系
  relations: XRelation[] | undefined;
  // 团队的实体
  target: XTarget | undefined;
  // 组织的身份集
  identitys: XIdentity[] | undefined;
} & Xbase;

//用户身份
export type XTeamIdentity = {
  // 身份ID
  identityId: string;
  // 用户ID
  teamId: string;
  // 身份加入的组织
  team: XTeam | undefined;
  // 组织包含的身份
  identity: XIdentity | undefined;
} & Xbase;

//(物/存在)
export type XThing = {
  // 链上ID
  chainId: string;
  // 名称
  name: string;
  // 编号
  code: string;
  // 共享容器ID
  shareId: string;
  // 归属用户ID
  belongId: string;
  // 备注
  remark: string;
  /** 标签集 */
  [property: string]: any;
  /** 归档集 */
  archives: {
    [time: string]: XWorkInstance;
  };
  // 物的属性集
  thingPropValues: XThingProp[] | undefined;
  // 物作为管理对象的映射
  target: XTarget | undefined;
  // 给物的度量标准
  givenPropertys: XProperty[] | undefined;
  // 物的归属
  belong: XTarget | undefined;
  // 标签
  labels: string[];
  // 业务锁
  locks?: Locks;
  // 点击量
  clicksCount?: number;
} & Xbase;
// 点击量
export interface clicksCount extends Xbase {
  count: number;
}
// 锁对象
export interface Locks {
  // 全局锁
  exclusion: Business;
  // 自定义锁
  [lock: string]: Business;
}

// 导致锁住的实例业务
export interface Business {
  // 实例 ID
  id: string;
  // 类型
  type: string;
  // 实例名称
  name: string;
}

//物的属性值
export type XThingProp = {
  // 属性ID
  propId: string;
  // 元数据ID
  thingId: string;
  // 值
  value: string;
  // 度量的标准
  property: XProperty | undefined;
  // 度量的物
  thing: XThing | undefined;
} & Xbase;

//办事定义
export type XWorkDefine = {
  // 规则
  rule: string;
  // 主办事ID
  masterId: string;
  // 共享用户ID
  shareId: string;
  // 允许补充办事
  hasGateway: boolean;
  // 发起权限
  applyAuth: string;
  // 应用ID
  applicationId: string;
  // 来源Id
  sourceId: string;
  // 办事定义节点
  nodes: XWorkNode[] | undefined;
  // 办事的实例
  instances: XWorkInstance[] | undefined;
  // 应用
  application: XApplication | undefined;
  // 归属用户
  target: XTarget | undefined;
  // 办事打开类型
  applyType: string;
  // 是否允许直接办事
  allowInitiate: boolean;
  // 是否私有，不允许跨流程查看
  isPrivate: boolean;
  // 是否允许短信催办
  canUrge: boolean;
  // 主Id
  primaryId: string;
} & XStandard;

//节点网关
export type XWorkGateway = {
  // 网关节点Id
  nodeId: string;
  // 关联办事Id
  defineId: string;
  // 关联办事Id
  defineName: string;
  // 关联办事ShareId
  defineShareId: string;
  // 组织Id
  targetId: string;
  // 关联的办事
  define: XWorkDefine | undefined;
  // 关联的办事
  identity: XIdentity | undefined;
} & Xbase;

//办事实例
export type XWorkInstance = {
  // 标题
  title: string;
  // 办事定义Id
  defineId: string;
  // 展示内容类型
  contentType: string;
  // 对应父流程实例的节点任务
  taskId: string;
  // 展示内容
  content: string;
  // 携带的数据
  data: string;
  // 回调钩子
  hook: string;
  // 申请用户ID
  applyId: string;
  // 共享用户ID
  shareId: string;
  // 归属用户ID
  belongId: string;
  // 备注
  remark: string;
  // 网关信息
  gateways: string;
  // 办事定义的共享用户ID
  defineShareId: string;
  // 办事任务
  tasks: XWorkTask[] | undefined;
  // 办事的定义
  define: XWorkDefine | undefined;
  // 归属用户
  target: XTarget | undefined;
} & Xbase;

//办事定义节点
export type XWorkNode = {
  // 节点规则
  rule: string;
  // 节点编号
  code: string;
  // 节点名称
  name: string;
  // 审核人数
  count: number;
  // 办事定义Id
  defineId: string;
  // 节点分配目标Id
  destId: string;
  // 节点分配目标名称
  destName: string;
  // 兄弟节点Id集合
  brotherIds: string;
  // 分支Id
  branchId: string;
  // 分支类型
  branchType: number;
  // 备注
  remark: string;
  // destType
  destType: string;
  // 节点类型
  nodeType: string;
  // 办事实例任务
  tasks: XWorkTask[] | undefined;
  // 赋予身份的用户
  bindFroms: XForm[] | undefined;
  // 办事的定义
  define: XWorkDefine | undefined;
} & Xbase;

//办事节点绑定
export type XWorkNodeRelation = {
  // 单类型
  fromType: string;
  // 办事节点
  nodeId: string;
  // 单设计
  formId: string;
} & Xbase;

//办事节点数据
export type XWorkRecord = {
  // 节点任务
  taskId: string;
  // 评论
  comment: string;
  // 内容
  data: string;
  // 是否过去
  isPast: boolean;
  // 办事的定义
  task: XWorkTask | undefined;
} & Xbase;

//办事任务
export type XWorkTask = {
  // 任务标题
  title: string;
  // 审核类型
  approveType: string;
  // 任务类型
  taskType: string;
  // 审核人数
  count: number;
  // 审核身份Id
  identityId: string;
  // 办事定义节点id
  nodeId: string;
  // 办事实例id
  instanceId: string;
  // 流程定义Id
  defineId: string;
  // 流程定义组织Id
  defineShareId: string;
  // 任务的用户Id
  shareId: string;
  // 归属用户ID
  belongId: string;
  // 申请用户ID
  applyId: string;
  // 内容
  content: string;
  // 备注
  remark: string;
  //
  resource: string;
  // 办事节点记录
  records: XWorkRecord[] | undefined;
  // 办事节点
  node: XWorkNode | undefined;
  // 办事的定义
  instance: XWorkInstance | undefined;
} & Xbase;

export type IOpenMode = 'horiz' | 'vertical' | 'map';

// 页面模板
export interface XPageTemplate<T = any> extends XStandard {
  // 页面配置
  config?: any;
  // 是否发布至门户
  public: boolean;
  // 是否公开
  open: boolean;
  // 模板类型
  template?: string;
  // 模板类型
  kind?: string;
  // 自定义参数;
  params: T;
  // 模版模式 共享 | 交易
  mode?: 'sharing' | 'trading';
  // 打开方式
  openMode: IOpenMode;
}
// 商城模板
export interface XMallTemplate extends XPageTemplate<MallContent> {}

// 绑定信息
export type Binding = {
  // 文件 ID
  id: string;
  // 文件名称
  name: string;
  // 文件目录
  directoryId: string;
  // 文件应用
  applicationId: string;
  // 文件类型
  typeName: string;
};

// 商城内容
export type MallContent = {
  // 商品表单
  form?: Binding;
  // 热度表单
  hot?: Binding;
  // 申领办事
  work?: Binding;
  // 借用办事
  borrow?: Binding;
  // 商品点击量
  clicksCount?: Binding;
};

export type DashboardContent = {};

export type XFileLink = {
  // 文件目录id
  directoryId: string;
} & model.FileItemModel &
  Xbase;

// 财务
export interface XFinancial extends Xbase {
  /** 初始化结账月 */
  initialized?: string;
  /** 当前账期 */
  current?: string;
  /** 当前查询 */
  query?: string;
  /** 查看物的表单 */
  form?: string;
  /** 查看负债表的表单 */
  balance?: string;
  /** 填写负债表的应用 */
  application?: string;
  /** 填写负债表的办事 */
  work?: string;
  /** 上报集群 */
  reports?: RelationParam[];
}

// 关系参数
export interface RelationParam {
  /** 名称 */
  name: string;
  /** 共享 ID */
  targetId: string;
  /** 归属 ID */
  belongId: string;
  /** 关系 */
  relations: string[];
  /** 写入集合 */
  collName: string;
}

// 账期
export type XPeriod = {
  // 账期时间
  period: string;
  // 是否已折旧
  depreciated: boolean;
  // 是否已结账
  closed: boolean;
  // 操作日志
  operationId: string;
  // 是否已删除
  isDeleted: boolean;
} & XEntity;

// 报表树节点
export interface XReportTreeNode extends XEntity {
  typeName: '报表树节点';
  // 报表树外键
  treeId: string;
  // 节点类型
  nodeType: NodeType;
  // 节点名称
  nodeTypeName: ReportTreeNodeTypes | (string & {});
  // 关联组织
  targetId: string;
  // 关联组织名称（针对自建组织分类）
  targetName?: string;
  // 上级ID
  parentId?: string;
  //归属组织
  belongId: string;
  // 下级节点
  children?: XReportTreeNode[];
  // 是否叶子节点
  isLeaf?: boolean;
  //节点路径
  nodePath?: string;
}

/** 报表任务树节点 */
export interface XReportTaskTreeNode extends XReportTreeNode {
  taskStatus?: ReceptionStatus;
  summary?: ReportTaskTreeSummary;
}

export interface XReportTree extends XStandard {
  typeName: '报表树';
  /** 报表树根节点 */
  rootNodeId: string;
  /** 树类型 */
  treeType: ReportTreeTypes;
}

export interface XReportTaskTree extends XReportTree {
  taskId: string;
  period: string;
  distId: string;
}

// 任务
export interface XDistributionTask extends XStandard {
  // 任务类型
  typeName: '任务';
  // 任务周期
  periodType: PeriodType;
  // 分发内容
  content: model.TaskContent;
}

// 分发
export interface XDistribution extends XEntity {
  typeName: '分发任务';
  /** 任务ID */
  taskId: string;
  /** 任务周期 */
  periodType: PeriodType;
  /** 数据时期 */
  period: string;
  /** 分发内容 */
  content: model.TaskContent;
}

// 接收
export interface XReception extends XEntity, ReceptionStatusModel {
  typeName: ReceptionType;
  /** 储存任务文件的群，不一定是接收的群 */
  sessionId: string;
  /** 任务 */
  taskId: string;
  /** 分发ID */
  distId: string;
  /** 任务周期 */
  periodType: PeriodType;
  /** 数据时期 */
  period: string;
  /** 接收内容 */
  content: model.ReceptionContentBase<model.TaskContentType>;
  /** 草稿 */
  draftId?: string;
  /** 分发树当前根节点ID */
  taskTreeCurRootNodeId?: string;
}

/** 卡片快照 */
export interface XSnapshot extends XThing {
  // 办事实例 ID
  instanceId: string;
  // 事件名称
  title: string;
  // 物 ID
  thingId: string;
}

/** 变更详情 */
export interface XChange extends Xbase {
  // 流程实例
  instanceId: string;
  // 办事名称
  name: string;
  // 业务账期
  changeTime: string;
  // 物 ID
  thingId: string;
  // 物数据
  thing?: XThing;
  // 变动属性
  propId: string;
  // 变动前
  before: number;
  // 变动后
  after: number;
  // 变更值
  change: number;
  // 符号
  symbol: number;
  // 快照 ID
  snapshotId: string;
  // 快照数据
  snapshot?: XSnapshot;
  // 维度 ID
  [dimension: string]: any;
}

// 平均年限法
export interface XConfiguration extends Xbase {
  // 折旧维度（统计）
  dimensions: XProperty[];
  // 当前统计维度
  curDimension: XProperty;
  // 折旧方式
  depreciationMethod: XProperty;
  //折旧方式二
  depreciationMethod2: XProperty;
  // 平均年限法
  yearAverageMethod: string;
  // 计提状态
  depreciationStatus: XProperty;
  // 计提中状态
  accruingStatus: string;
  // 完成计提状态
  accruedStatus: string;
  // 原值
  originalValue: XProperty;
  // 累计折旧
  accumulatedDepreciation: XProperty;
  // 月折旧额
  monthlyDepreciationAmount: XProperty;
  // 净值
  netWorth: XProperty;
  // 已计提月份
  accruedMonths: XProperty;
  // 使用年限
  usefulLife: XProperty;
  // 会计科目字段
  accounting: XProperty;
  // 开始计算日期
  startDate: XProperty;
  // 过滤条件配置
  filterExp: { [key: string]: string };
  // 排除影响维度
  excludes: XProperty[];
  // 新增字段
  customFields: XProperty[];
  //净残值
  residualVal: XProperty;
  //净残值率
  residualRate: XProperty;
}

// 抽取配置的属性字段
export type XProperties = {
  [k in keyof XConfiguration]: XConfiguration[k] extends XProperty ? k : never;
}[keyof XConfiguration];

// 结账科目配置
export interface XClosingOption extends XEntity {
  // 会计科目值
  accountingValue: string;
  // 金额字段（原值、累计折旧）
  amount: XProperty;
  // 资产负债表字段
  financial: XProperty;
}

// 结账科目
export interface XClosing extends XClosingOption {
  // 期数主键
  periodId: string;
  // 期初资产账
  assetStartAmount: number;
  // 增加资产账
  assetAddAmount: number;
  // 减少资产账
  assetSubAmount: number;
  // 期末资产账
  assetEndAmount: number;
  // 期末财务账
  financialAmount: number;
  // 资产状态
  assetBalanced: boolean;
  // 对账状态
  balanced: boolean;
}

// 汇总方案
export interface XSummary {
  // 分类维度
  species: XProperty;
  // 统计维度
  dimensions: XProperty[];
  // 统计字段
  fields: XProperty[];
  // 不受影响的字段
  excludes: XProperty[];
}

// 查询方案
export interface XQuery<M = any> extends XEntity, XSummary {
  // 过滤方案
  matches: M;
}

// 操作日志
export interface XOperationLog<T = any> extends Xbase {
  // 办事实例
  instanceId: string;
  // 进度
  progress: number;
  // 操作类型
  typeName: string;
  // 数据
  params: T;
  // 异常
  error?: string;
}
//
export type XSequence = {
  //应用ID
  applicationId: string;
  // 初始值
  initValue: number;
  // 递增值
  increament: number;
  // 循环选项
  circleOpt?: string;
  // 循环条件
  conditionOpt?: string;
  // 条件值
  conditionValue: number;
  // 刷新时间
  resetTime: string;
  // 是否缓存
  isCache: boolean;
  // 当前值
  value: number;
  // 长度
  length: number;
} & XStandard;

// 历史流程
export interface XHistoryFlow extends Xbase {
  // 老办事实例 ID
  oldInstanceId: string;
  // 审核人（中文）
  approveUser: string;
  // 审核状态
  approveStatus: string;
  // 审核节点
  approveNode: string;
  // 审核时间
  approveTime: string;
  // 评论
  approveComment: string;
}

// 历史附件
export interface XHistoryFile extends Xbase, model.FileItemShare {
  // 老办事实例 ID
  oldInstanceId: string;
}

// 变更历史
export interface XRevision<T extends XEntity> extends XEntity {
  // 操作
  operate: string;
  // 所在集合
  collName: string;
  // 变更数据
  data: T;
}

export interface XSyncing extends XEntity {
  // 最新同步时间
  syncTime: string;
}

// 同步
export interface XSubscription extends XSyncing {
  // 类型
  typeName: string;
  // 发布用户
  target: XTarget;
  // 关系
  relations: string[];
  // 是否取消了
  canceled: boolean;
}

// 商品
export type XProduct = {
  // 交易、共享
  mode: string;
  // 商城 ID
  mallId: string;
  // 商品类型
  typeName: string;
  // 图标
  icons?: string;
  // 价格
  price?: number;
  // 数量
  number?: number;
  // 缩略图
  images?: string;
  // 品牌
  brand?: string;
  //规格型号
  specModel?: string;
  // 点击量
  clicksCount?: number;
} & XThing;

// 订单
export type XOrder = {
  // 平台方
  platform: string;
  // 卖方
  seller: string;
  // 买方
  buyer: string;
  // 商品总价
  totalPrice: number;
  // 商品集合
  products: XProduct[];
} & XEntity;

export interface XValidation extends XThing, ValidateErrorInfo {
  typeName: '校验信息';
  formId?: string;
  /** 流程实例ID */
  instanceId: string;
  /** 强审理由 */
  reason: string;
  /** 附件 */
  files?: FileItemShare[];
}
