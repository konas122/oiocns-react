import { schema } from '@/utils/excel';
import { model } from '.';
import { WithChildren } from './common/tree';
import {
  XApplication,
  XAttributeProps,
  XAuthority,
  Xbase,
  XDirectory,
  XForm,
  XIdentity,
  XProperty,
  XSpecies,
  XStandard,
  XTarget,
  XThing,
  XTagFilter,
  XSequence,
  XReception,
  XReportTreeNode,
  XPrint,
  XReportTaskTreeNode,
  XDocumentTemplate,
  XWorkInstance,
  XWorkDefine,
  XValidation,
  XReport,
} from './schema';
import { NodeType as ReportTreeNodeType } from './enum';
import { IIdentity } from '../core';
// 请求类型定义
export type ReqestType = {
  // 模块
  module: string;
  // 方法
  action: string;
  // 参数
  params: any;
};
// 请求记录
export type RequestRecord = {
  req: DataProxyType;
  res: ResultType<any>;
  date: Date;
};
// 请求数据核类型定义
export type DataProxyType = {
  // 模块
  module: string;
  // 方法
  action: string;
  // 群Id
  targetId: string;
  // 归属
  belongId: string;
  // 抄送
  copyId?: string;
  // 参数
  params: any;
  // 关系举证(用户鉴权[user=>relations=>target],最大支持2级关系)
  relations: string[];
};
// 请求数据核类型定义
export type DataNotityType = {
  // 数据
  data: any;
  // 通知的对象
  targetId: string;
  // 通知的对象类型
  targetType: string;
  // 被操作方Id
  subTargetId?: string;
  // 是否忽略自己
  ignoreSelf: boolean;
  // 忽略的连接ID
  ignoreConnectionId?: string;
  // 标签
  flag: string;
  // 关系举证(用户鉴权[user=>relations=>target],最大支持2级关系)
  relations: string[];
  // 归属用户
  belongId: string;
  // 通知用户自身
  onlyTarget: boolean;
  // 仅通知在线用户
  onlineOnly: boolean;
};
// 代理请求类型定义
export type HttpRequestType = {
  // 目标地址
  uri: string;
  // 请求方法
  method: string;
  // 请求头
  header: {
    [key: string]: string;
  };
  // 请求体
  content: string;
};
// Http请求响应类型定义
export type HttpResponseType = {
  // 状态码
  status: number;
  // 响应类型
  contentType: string;
  // 响应头
  header: {
    [key: string]: string[];
  };
  // 响应体
  content: string;
};
// 返回类型定义
export type LoadResult<T> = {
  // 数据体
  data: T;
  // 分组数量
  groupCount: number;
  // 聚合运算结果
  summary: any[];
  // 总数
  totalCount: number;
  // 消息
  msg: string;
  // 结果
  success: boolean;
  // http代码
  code: number;
};
// 返回类型定义
export type ResultType<T> = {
  // http代码
  code: number;
  // 数据体
  data: T;
  // 消息
  msg: string;
  // 结果
  success: boolean;
};
/**
 * 服务端消息类型
 * @param {string} target 目标
 */
export type ReceiveType = {
  // 用户
  userId: string;
  // 对象
  target: string;
  // 数据
  data: any;
};
/** 在线信息 */
export type OnlineInfo = {
  // 用户Id
  userId: string;
  // 连接Id
  connectionId: string;
  // 远端地址
  remoteAddr: string;
  // 上线时间
  onlineTime: string;
  // 认证时间
  authTime: string;
  // 请求次数
  requestCount: string;
  // 连接数
  connectionNum: string;
  // 终端类型
  endPointType: string;
};
/** 在线信息查询接口 */
export type OnlineSet = {
  // 用户连接
  users: OnlineInfo[];
  // 存储连接
  storages: OnlineInfo[];
};
// 分页返回定义
export type PageResult<T> = {
  // 便宜量
  offset: number;
  // 最大数量
  limit: number;
  // 总数
  total: number;
  // 结果
  result: T[];
};

export type NoticeModel = {
  // 动态密码Id
  shareId: string;
  // 动态密码Id
  authId: string;
  // 账户(手机号)
  data: string;
  // 账户(手机号)
  type: string;
  // 平台入口
  platName: string;
};

export type DynamicCodeModel = {
  // 动态密码Id
  dynamicId: string;
  // 账户(手机号)
  account: string;
  // 平台入口
  platName: string;
};

export type LoginModel = {
  // 账户(手机号/账号)
  account: string;
  // 密码
  password?: string;
  // 动态密码Id
  dynamicId?: string;
  // 动态密码
  dynamicCode?: string;
};

export type RegisterModel = {
  // 账户(手机号)
  account: string;
  // 密码
  password: string;
  // 动态密码Id
  dynamicId: string;
  // 动态密码
  dynamicCode: string;
  // 名称
  name: string;
  // 描述
  remark: string;
};

export type ResetPwdModel = {
  // 账户(手机号/账号)
  account: string;
  // 私钥
  privateKey?: string;
  // 动态密码Id
  dynamicId?: string;
  // 动态密码
  dynamicCode?: string;
  // 新密码
  password: string;
};

//认证结果返回
export type TokenResultModel = {
  // 授权码
  accessToken: string;
  // 过期时间
  expiresIn: number;
  // 作者
  author: string;
  // 协议
  license: string;
  // 授权码类型
  tokenType: string;
  // 用户信息
  target: XTarget;
  // 私钥
  privateKey: string;
};

export type IdPair = {
  // 唯一ID
  id: string;
  value: string;
};

export type IdShareModel = {
  // 唯一ID
  id: string;
  // 共享组织
  shareId: string;
};

export type PageModel = {
  // 偏移量
  offset: number;
  // 最大数量
  limit: number;
  //过滤条件
  filter: string;
};

export type IdModel = {
  // 唯一ID
  id: string;
};

export type IdPageModel = {
  // 唯一ID
  id: string;
  // 分页
  page: PageModel | undefined;
};

export type IdBelongPageModel = {
  // 唯一ID
  id: string;
  // 归属组织ID
  belongId: string;
  // 共享组织ID
  shareId: string;
  // 分页
  page: PageModel | undefined;
};

export type IdArrayModel = {
  // 唯一ID数组
  ids: string[];
  // 分页
  page: PageModel | undefined;
};

export type EntityModel = {
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
  // 归属用户ID
  belongId: string;
  // 类型
  typeName: string;
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
};

export type AuthorityModel = {
  // 唯一ID
  id: string;
  // 名称
  name: string;
  // 编号
  code: string;
  // 图标
  icon: string;
  // 是否公开
  public: boolean;
  // 父类别ID
  parentId: string;
  // 共享用户
  shareId: string;
  // 备注
  remark: string;
};

export type IdentityModel = {
  // 唯一ID
  id: string;
  // 名称
  name: string;
  // 编号
  code: string;
  // 职权Id
  authId: string;
  // 共享用户Id
  shareId: string;
  // 备注
  remark: string;
  // 拉入的人员
  givenTargets: XTarget[] | undefined;
};

export type TargetModel = {
  // 唯一ID
  id: string;
  // 名称
  name: string;
  // 编号
  code: string;
  // 类型名
  typeName: string;
  // 开放组织?
  public: boolean;
  // 图标
  icon: string;
  // 简介
  remark: string;
  // 归属用户Id
  belongId: string;
  // 团队名称
  teamName: string;
  // 团队代号
  teamCode: string;
  // 数据核
  storeId?: string;
};

export type GiveModel = {
  // 主ID
  id: string;
  // 子ID数组
  subIds: string[];
};

export type GainModel = {
  // 主ID
  id: string;
  // 子ID
  subId: string;
};

export type ApprovalModel = {
  // 唯一ID
  id: string;
  // 状态
  status: number;
};

export type SearchModel = {
  // 名称
  name: string;
  // 类型数组
  typeNames: string[];
  // 分页
  page: PageModel | undefined;
};

export type GetSubsModel = {
  // 唯一ID
  id: string;
  // 子节点类型
  subTypeNames: string[];
  // 分页
  page: PageModel | undefined;
};

export type GetJoinedModel = {
  // 唯一ID
  id: string;
  // 类型数组
  typeNames: string[];
  // 分页
  page: PageModel | undefined;
};

export type MsgSendModel = {
  // 接收方Id
  toId: string;
  // 归属用户ID
  belongId: string;
  // 消息类型
  msgType: string;
  // 消息体
  msgBody: string;
};

export type MsgTagModel = {
  // 会话ID
  id: string;
  // 会话归属用户ID
  belongId: string;
  // 消息ID
  ids: string[];
  // 标记
  tags: string[];
};

export type ChatMessageType = {
  // 代表组织Id
  designateId: string;
  // 发起方Id
  fromId: string;
  // 接收方Id
  toId: string;
  // 类型
  typeName: string;
  // 内容
  content: string;
  // 标签
  tags: string[];
  // 评注
  comments: CommentType[];
} & Xbase;

export type CommentType = {
  // 标签名称
  id: string;
  // 标签名称
  label: string;
  // 人员Id
  userId: string;
  // 时间
  time: string;
  // 代表组织Id
  designateId: string;
  // 回复某个人
  replyTo?: string;
};

export type PropertyModel = {
  // 唯一ID
  id: string;
  // 名称
  name: string;
  // 编号
  code: string;
  // 值类型
  valueType: string;
  // 计量单位
  unit: string;
  // 附加信息
  info: string;
  // 目录ID
  directoryId: string;
  // 分类标签ID
  speciesId: string;
  // 来源用户ID
  sourceId: string;
  // 备注
  remark: string;
};

export type DirectoryModel = {
  // 唯一ID
  id: string;
  // 名称
  name: string;
  // 编号
  code: string;
  // 图标
  icon: string;
  // 父目录ID
  parentId: string;
  // 共享用户ID
  shareId: string;
  // 备注
  remark: string;
};

export type SpeciesModel = {
  // 唯一ID
  id: string;
  // 名称
  name: string;
  // 编号
  code: string;
  // 类型
  typeName: string;
  // 图标
  icon: string;
  // 备注
  remark: string;
  // 来源用户ID
  sourceId: string;
  // 目录ID
  directoryId: string;
};

export type SpeciesItemModel = {
  // 唯一ID
  id: string;
  // 键
  name: string;
  // 编号
  code: string;
  // 图标
  icon: string;
  // 附加信息
  info: string;
  // 类型ID
  speciesId: string;
  // 父类目ID
  parentId: string;
  // 备注
  remark: string;
};

export type AttributeModel = {
  // 唯一ID
  id: string;
  // 名称
  name: string;
  // 编号
  code: string;
  // 编号
  rule: string;
  // 备注
  remark: string;
  // 属性Id
  propId: string;
  // 工作职权Id
  authId: string;
  // 单项Id
  formId: string;
};

export type FormModel = {
  // 唯一ID
  id: string;
  // 名称
  name: string;
  // 编号
  code: string;
  // 规则
  rule: string;
  // 图标
  icon: string;
  // 类型
  typeName: string;
  // 备注
  remark: string;
  // 目录ID
  directoryId: string;
};

export type ApplicationModel = {
  // 唯一ID
  id: string;
  // 名称
  name: string;
  // 编号
  code: string;
  // 图标
  icon: string;
  // 类型
  typeName: string;
  // 备注
  remark: string;
  // 目录ID
  directoryId: string;
  // 父级ID
  parentId: string;
  // 资源
  resource: string;
};

export type ThingModel = {
  // 唯一ID
  id: string;
  // 名称
  name: string;
  // 编号
  code: string;
  // 链上ID
  chainId: string;
  // 共享用户Id
  shareId: string;
  // 备注
  remark: string;
};

export type SetPropModel = {
  // 物的唯一ID
  id: string;
  // 特性数据
  data: IdPair[] | undefined;
};

export type GetDirectoryModel = {
  // 唯一ID
  id: string;
  // 是否向上递归用户
  upTeam: boolean;
  // 分页
  page: PageModel | undefined;
};

export type WorkDefineModel = {
  // 流程ID
  id: string;
  // 主Id
  primaryId: string;
  // 流程名称
  name: string;
  // 流程编号
  code: string;
  // 图标
  icon: string;
  // 备注
  remark: string;
  // 共享组织ID
  shareId: string;
  // 归属组织ID
  belongId: string;
  // 允许补充办事
  hasGateway: boolean;
  // 是否私有，不允许跨流程查看
  isPrivate: boolean;
  // 折旧计提后是否锁住不允许发起
  isDepreciationLock: boolean;
  // 是否允许短信催办
  canUrge: boolean;
  // 应用ID
  applicationId: string;
  // 发起权限
  applyAuth: string;
  // 办事打开类型
  applyType: string;
  // 是否允许直接办事
  allowInitiate: boolean;
  // 来源Id
  sourceId: string | undefined;
  // 流程节点
  node: WorkNodeModel | undefined;
  // 更新时间
  updateTime: string;
};

export type SwitchWorkDefineModel = {
  // 目标版本Id
  id: string;
  // 共享组织Id
  shareId: string;
  // 应用Id
  applicationId: string;
  // 主Id
  primaryId: string;
};

export type WorkInstanceModel = {
  // 流程实例Id
  id: string;
  // 流程定义Id
  defineId: string;
  // 展示内容
  content: string;
  // 内容类型
  contentType: string;
  // 单数据内容
  data: string;
  // 标题
  title: string;
  // 回调地址
  hook: string;
  // 对应父流程实例节点任务Id
  taskId: string;
  // 发起用户ID
  applyId: string;
  // 办事组织ID
  shareId: string;
  // 集群模板 起始集群
  groupId: string;
  // 网关节点信息
  gateways: string;
};

export type WorkGatewayInfoModel = {
  // 节点ID
  nodeId: string;
  // 对象Id集合
  targetIds: string[];
};

export type InstanceDataModel = {
  /** 流程节点 */
  node: WorkNodeModel;
  /** 表单字段 */
  fields: {
    /** 表单id */
    [id: string]: FieldModel[];
  };
  /** 提交的表单数据 */
  data: {
    // 表单id
    [id: string]: FormEditData[];
  };
  /** 填写的主表信息 */
  primary: {
    /** 特性id */
    [id: string]: any;
  };
  rules: model.RenderRule[];
  /** 接收任务的信息 */
  reception?: XReception;
  /** 强审说明 */
  validation?: XValidation[];
  // 记录被更改数据
  changeItems?: string[];
};

interface XLookup extends FiledLookup {
  instance?: IIdentity;
}

export type FieldModel = {
  /** 允许通过索引签名读取 */
  [key: string]: any;
  /** 标识(特性标识) */
  id: string;
  /** 属性id */
  propId: string;
  /** 名称(特性名称) */
  name: string;
  /** 代码(属性代码) */
  code: string;
  /** 代码(原始特性代码) */
  info?: string;
  /** 类型(属性类型) */
  valueType: string;
  /** 规则(特性规则) */
  rule?: string;
  /** 组件 */
  widget?: string;
  /** 参数 */
  options?: XAttributeProps;
  /** 备注(特性描述) */
  remark: string;
  /** 字典(字典项/分类项) */
  lookups?: XLookup[];
  /** 计量单位 */
  unit?: string;
  /** 是否可记录 */
  isChangeTarget?: boolean;
  /** 是否变更源 */
  isChangeSource?: boolean;
  /** 是否可拆分或合并 */
  isCombination?: boolean;
  // 关联的分类ID
  speciesId?: string;
  /** 自由节点默认角色值 */
  defaultRoleIds?: string[];
};
export type HomeConfig = {
  tops: string[];
};

export type itemsProps = {
  //保存的单行表格数据
  data: {
    //数据区域
    type: any; //数据区域类型（必填）
    data: [
      {
        name?: any; //数据区域名称（选填）
        style?: object; //数据区域样式（选填）
        text?: [
          {
            name: string;
            style: object;
            dataSource: boolean;
          },
        ];
        dataSource: boolean;
        colNumber: number;
      },
    ]; //空单元格数据
    emptydata?: [
      {
        name: string;
      },
    ]; //空单元格
  };
};
export type qrcodeType = {
  style: any;
};
export type itemsTable = {
  style?: object;
  title: {
    name: string;
    style: object;
    flag: boolean;
  };
  data: itemsProps[];
  footer: {
    name: string;
    style: object;
    flag: boolean;
    dataSource: boolean;
    text?: [
      {
        name: string;
        style: object;
        dataSource: boolean;
      },
    ];
  };
  subtitle: {
    name: string;
    style: object;
    flag: boolean;
    dataSource: boolean;
    text?: [
      {
        name: string;
        style: object;
        dataSource: boolean;
      },
    ];
  };
  qrcode?: qrcodeType[];
};
export type TableModel = {
  style?: object;
  title: {
    name: string;
    style: object;
    flag: boolean;
  };
  data: itemsProps[];
  footer: {
    name: string;
    style: object;
    flag: boolean;
    dataSource: boolean;
    text?: [
      {
        name: string;
        style: object;
        dataSource: boolean;
      },
    ];
  };
  subtitle: {
    name: string;
    style: object;
    flag: boolean;
    dataSource: boolean;
    text?: [
      {
        name: string;
        style: object;
        dataSource: boolean;
      },
    ];
  };
  qrcode?: qrcodeType[];
};
export type FiledLookup = {
  /** 关联人员id */
  relevanceId?: string;
  /** 唯一标识(项标识) */
  id: string;
  /** 代码 */
  code: string;
  /** 分类项值 */
  info: string;
  /** 描述(项名称) */
  text: string;
  /** 值(项代码) */
  value: string;
  /** 父级Id(项的父级Id) */
  parentId?: string;
  /** 图标 */
  icon?: string;
};

export type FormEditData = {
  /** 操作前数据体 */
  before: XThing[];
  /** 操作后数据体 */
  after: XThing[];
  /** 流程节点Id */
  nodeId: string;
  /** 表单名称 */
  formName: string;
  /** 表单代码 */
  formCode?: string;
  /** 操作人 */
  creator: string;
  /** 操作时间 */
  createTime: string;
  /** 规则 */
  rules: RenderRule[];
};

interface WorkNodeForm {
  name: string;
  id: string;
  metadata: XForm;
}

export interface WorkNodeButton {
  code: string;
  name: string;
  type: 'rule' | 'executor' | 'getWorkData';
  icon?: string;
  /** 按钮排序 */
  order?: number;
  /** 代码或者校验规则ID */
  ruleId?: string;
  /** 执行器ID */
  executorId?: string;
  /** 业务场景 */
  scene?: string;
  /** 绑定的表单 */
  form?: WorkNodeForm;
  /** 执行器的值 */
  fieldChanges?: FieldChange[];
}

/* 节点网关 */
export type WorkGatewayModel = {
  // 网关节点ID
  primaryId: string;
  // 关联组织ID
  memberId: string;
  // 关联流程ID
  defineId: string;
  // 通知的角色ID
  identityId: string;
  // 关联流程名称
  defineName: string;
  // 流程共享组织ID
  defineShareId: string;
  // 节点共享组织ID
  shareId: string;
};

/* 节点网关 */
export type GetWorkGatewaysModel = {
  // 流程ID
  defineId: string;
  // 流程共享组织
  shareId: string;
  // 组织ID
  targetId: string;
};

export type WorkNodeModel = {
  id: string;
  // 主Id
  primaryId: string;
  // 节点编号
  code: string;
  // 节点类型
  type: string;
  // 节点名称
  name: string;
  // 子节点
  children: WorkNodeModel | undefined;
  // 节点分支
  branches: Branche[] | undefined;
  // 节点审核数量
  num: number;
  // 节点审核目标类型
  destType: string;
  // 节点审核目标Id
  destId: string;
  // 节点目标名称
  destName: string;
  // 节点目标共享组织Id
  destShareId: string;
  // 节点归属组织
  belongId: string;
  // 节点归属定义Id
  defineId: string;
  // 资源
  resource: string;
  // 关联表单信息
  formRules: Rule[];
  // 拆分规则
  splitRules: Rule[];
  // 执行器
  executors: Executor[];
  // 关联表单信息
  forms: FormInfo[];
  // 主表
  primaryForms: (XForm | XReport)[];
  // 子表
  detailForms: XForm[];
  // 编码
  encodes: Encode[];
  //打印的html数据
  print: { id: string; name: string }[];
  //打印的数据源数据
  printData: { attributes: any[]; type: string };
  //审核的权限
  authoritys: (XAuthority & { count: number })[];
  // 汇流网关是否包含单位级
  containCompany: boolean;
  /** 自定义按钮 */
  buttons?: WorkNodeButton[];
  // 商城订单同步规则
  mallOrderSyncRules?: {
    [x: string]: any;
  };
  /** 默认选择角色 */
  defaultRoleIds?: string[];
} & IDocumentConfigHost;

export interface IDocumentConfigHost {
  documentConfig: WorkDocumentConfig;
}

export type RelationInstanceModel = {
  // 流程实例
  instance: XWorkInstance;
  // 流程定义
  define: XWorkDefine & { node: WorkNodeModel };
};

export type UrgeApprovalModel = {
  // 流程实例Id
  instanceId: string;
  // 平台名称
  platName: string;
  // 催办人员id
  targetIds: string[];
  // 催办短信内容
  message: string;
};

export interface DocumentPropertyMapping {
  propId: string;
  formId: string;
}
export interface DocumentNodeMapping {
  nodeId: string;
  nodeKey: string;
}

export interface WorkDocumentConfig {
  propMapping: {
    [templateId: string]: DocumentPropertyMapping[];
  };
  nodeMapping?: {
    [templateId: string]: DocumentNodeMapping[];
  };
  templates: XDocumentTemplate[];
}

export type FormInfo = {
  // 表单Id
  id: string;
  // 类型
  typeName: string;
  // 允许新增
  allowAdd: boolean;
  // 允许编辑
  allowEdit: boolean;
  // 允许选择
  allowSelect: boolean;
  // 自动带出数据
  autoFill?: boolean;
  // 允许选择文件
  allowSelectFile?: boolean;
  // 选择单位空间
  selectBelong?: boolean;
  // 允许新生成
  allowGenerate?: boolean;
  // 关闭业务锁
  closeLock?: boolean;
  // 仅显示变更数据
  allowShowChangeData?: boolean;
  // 显示变更数据
  showChangeData?: any[];
  // 子表操作按钮
  operationButton?: operationButtonInfo[];
  // 排序
  order?: number;
};

export type RuleType =
  | 'show'
  | 'calc'
  | 'executor'
  | 'attribute'
  | 'condition'
  | 'code'
  | 'encode'
  | 'validate'
  | 'combination'
  | 'assignment'
  | 'fieldAssignments';

export interface Rule<T extends RuleType = RuleType> {
  // 规则Id
  id: string;
  // 规则名称
  name: string;
  // 规则类型
  type: T;
  // 触发对象
  trigger: string[];
  // 备注
  remark: string;
  // 是否手动
  isManual?: boolean;
  // 手动规则触发时机
  triggerTiming: 'default' | 'submit';
  // 组合办事
  combination?: CombinationType;
  // 组合办事业务类型
  applyType?: string;
  // 赋值规则
  assignments?: {
    primary: MappingData;
    detail: MappingData;
  }[];
  // 字段赋值
  fieldAssignments?: {
    primary: MappingData;
    detail: MappingData;
    type: string;
  }[];
  // 配置限额规则
  quota?: QuotaRuleType;
  // 子表向子表赋值规则
  detailToDetail?: DetailToDetailRuleType;
  // 赋值规则类型
  ruleType?: string;
}

export type Encode = {
  [x: string]: any;
  configData: Encode[];
  targetParam: MappingData;
  // 编码Id
  id: string;
  encodeValue: string;
  // 取值/长度
  length: number | string;
  // 规则类型
  type: number;
  // 维度
  isDimension: boolean;
  // 顺序
  order: number;
  // 序列规则
  sequence: XSequence;
};

export type speciesListItem = {
  // 筛选分类Id
  id: string;
  // 筛选名称
  name: string;
  // 分类名称
  typeName: string;
  // 编码
  code: string;
  // 值
  value: string;
};

// 表单展示规则
export interface FormShowRule extends Rule<'show' | 'condition'> {
  // 渲染类型
  showType: RenderType;
  // 值
  value: boolean;
  // 目标对象
  target: string;
  // 条件
  condition: string;
  // 条件文本
  conditionText: string;
}

// 表单计算规则
export interface FormCalcRule extends Rule<'calc'> {
  // 键值对
  mappingData: MappingData[];
  // 目标对象
  target: string;
  // 表达式
  formula: string;
}

// 表单展示规则
export interface NodeShowRule extends Rule<'show'> {
  // 目标
  target: MappingData;
  // 渲染类型
  showType: RenderType;
  // 值
  value: boolean;
  // 条件
  condition: string;
}

// 组合办事规则
export interface NodeCombinationRule extends Rule<'combination'> {
  id: string;
  // 组合办事类型
  applyType: string;
  // 组合办事
  combination: CombinationType;
}

// 赋值规则
export interface NodeAssignmentRule extends Rule<'assignment'> {
  id: string;
  // 赋值规则 主子表键值对
  assignments?: {
    primary: MappingData;
    detail: MappingData;
  }[];
  // 字段赋值
  fieldAssignments?: {
    primary: MappingData;
    detail: MappingData;
    type: string;
  }[];
  ruleType: string;
  quota?: QuotaRuleType;
  detailToDetail?: DetailToDetailRuleType;
}

// 表单计算规则
export interface NodeCalcRule extends Rule<'calc'> {
  // 键值对
  mappingData: MappingData[];
  // 目标
  target: MappingData;
  // 表达式
  formula: string;
}

// 表单计算规则
export interface NodeExecutorRule extends Rule<'executor'> {
  // 键值对
  keyMap: Map<string, MappingData>;
  // 方法
  function: string;
}

// 报表代码规则
export interface NodeCodeRule extends Rule<'code'> {
  // 表达式
  formula: string;
  // 引用对象
  mappingData?: MappingData[];
  // 作用表单
  target?: MappingData;
}

export type ErrorLevel = 'info' | 'warning' | 'error';

export interface NodeValidateRule extends Rule<'validate'> {
  // 键值对
  mappingData: MappingData[];
  /** 错误消息 */
  message: string;
  /** 错误级别 */
  errorLevel: ErrorLevel;
  // 表达式
  formula: string;
}

export interface ValidateErrorInfo {
  errorLevel: ErrorLevel;
  message: string;
  position?: string;
  errorCode: string;
}

export interface RuleValidateError extends ValidateErrorInfo {
  rule: Rule;
  formId?: string;
  expected?: any;
  actual?: any;
}

export interface RequiredValidateError extends ValidateErrorInfo {
  field: FieldModel;
  formId: string;
}

// 属性筛选
export interface AttributeFilterRule extends Rule<'attribute'> {
  // 条件
  condition: string;
  // 条件文本
  conditionText: string;
}

// 条件
export type conditionConfig = {
  // 条件Id
  id: string;
  // 条件
  condition: string;
  // 条件文本
  conditionText: string;
};

// 条件
export type speciesFilter = {
  // Id
  id: string;
  // 名称
  name: string;
  // 条件文本
  remark: string;
  // 分类数据
  speciesList: XTagFilter[];
};

export type MappingData = {
  key: string;
  id: string;
  code: string;
  name: string;
  formName: string;
  formId: string;
  typeName: string;
  trigger: string;
  widget?: string;
  valueType?: string;
};

// 组合办事 - 规则
export type CombinationType = {
  // 规则名称
  name: string;
  // 备注
  remark: string;
  // 当前操作的资产
  assetSource: model.MappingData;
  // 拆分目标
  splitTarget?: model.MappingData;
  // 拆分类型
  splitType?: model.MappingData;
  // 拆分条数
  splitNumber?: model.MappingData;
  // 资产合并-标记的核销表id
  verificationFormId?: string;
  // 子表id
  detailFormId?: string;
};

// 计算配置限额规则
export type QuotaRuleType = {
  // 可更新数计算截止日期
  quotaExpirationDate?: string;
  // 资产取得日期
  quotaAcquisitionDate?: model.MappingData;
  // 资产折旧/摊销年限
  quotaDeprecitionDate?: model.MappingData;
  // 资产配置限额可更新数
  quotaNumber?: model.MappingData;
  // 折旧摊销年限表
  quotaDeprecitionForm?: schema.XForm[];
};

// 子表向子表赋值规则
export type DetailToDetailRuleType = {
  // 被赋值的表单
  forms?: schema.XForm[];
  // 单据表字段
  billsField?: model.MappingData;
  // 明细表字段
  detailField?: model.MappingData;
};

export type RenderType = 'visible' | 'isRequired' | 'readOnly';

// 渲染规则，表单、办事渲染规则
export type RenderRule = {
  // 表单
  formId: string;
  // 特性
  destId: string;
  // 类型
  typeName: RenderType;
  // 值
  value: any;
};

export interface ExecutorBase<T extends string> {
  // ID
  id: string;
  // 执行器触发时机
  trigger: string;
  /** 执行器方法名称 */
  funcName: T;
  /** 是否展示执行内容 */
  visible?: boolean;
}

export interface AcquireExecutor extends ExecutorBase<'数据申领'> {
  // 数据源空间（数据申领）
  belongId: string;
  // 数据申领
  acquires: Acquire[];
}

export interface WebhookExecutor extends ExecutorBase<'Webhook'> {
  // 请求地址
  hookUrl: string;
}

export interface FieldsChangeExecutor extends ExecutorBase<'字段变更'> {
  // 字段变更
  changes: FormChange[];
}
export interface AcquireGroupExecutor extends ExecutorBase<'资产领用'> {
  // 不知道有什么字段
}

export interface ReceptionChangeExecutor extends ExecutorBase<'任务状态变更'> {
  //
}

export interface CopyFormExecutor extends ExecutorBase<'复制表到子表'> {
  // 表的数据复制
  copyForm: CopyForm[][];
}

export interface MallOrderSyncExecutor extends ExecutorBase<'商城订单同步'> {
  mallOrderSyncForm: {
    forms: any;
    identifier?: any;
    collName?: string;
  };
}

// 执行器
export type Executor =
  | AcquireExecutor
  | WebhookExecutor
  | FieldsChangeExecutor
  | AcquireGroupExecutor
  | ReceptionChangeExecutor
  | CopyFormExecutor
  | MallOrderSyncExecutor;

export type Acquire = {
  // 主键
  id: string;
  // 编码
  code: string;
  // 名称
  name: string;
  // 类型
  typeName: string;
  // 是否启用
  enable: boolean;
  // 集合
  collName?: string;
  // 是否自选
  selectable?: boolean;
};

export interface Acquiring extends Acquire, Xbase {
  // 当前操作日志
  operationId: String;
}

export type FormChange = {
  // 主键
  id: string;
  // 名称
  name: string;
  // 变动字段集合
  fieldChanges: FieldChange[];
};

export type CopyForm = {
  // 表单id
  id: string;
  // 表单名称
  name: string;
};

export type FieldChange = {
  // 变动字段
  id: string;
  // 字段名称
  name: string;
  // 字段类型
  valueType: string;
  // 变动前字段值
  before: any;
  // 变动前名称
  beforeName: string;
  // 要变更为的字段值
  after: any;
  // 变动后名称
  afterName: string;
  // 变动后默认值
  options?: XAttributeProps;
};

export type Branche = {
  conditions: Condition[] | undefined;
  children: WorkNodeModel | undefined;
};

export type Condition = {
  key: string;
  paramKey: string;
  val: string;
  type: string;
  display: string;
};

export type QueryTaskReq = {
  // 流程定义Id
  defineId: string;
  // 任务类型 审核、抄送
  typeName: string;
};

export type ApprovalTaskReq = {
  // 任务Id
  id: string;
  // 状态
  status: number;
  // 评论
  comment: string;
  // 数据
  data: string;
  // 网关
  gateways: string;
  // 退回任务Id
  backId?: string;
  // 退回修改后是否跳回至该审核节点
  isSkip?: boolean;
};

export type TargetMessageModel = {
  // 内容
  data: string;
  // 是否剔除当前操作人
  excludeOperater: boolean;
  // 目标用户Id集合
  targetId: string;
  // 组织集群
  group: boolean;
};

export type IdentityMessageModel = {
  // 内容
  data: string;
  // 是否剔除当前操作人
  excludeOperater: boolean;
  // 身份Id
  identityId: string;
  // 岗位Id
  stationId: string;
  // 组织集群
  group: boolean;
};

export type TargetOperateModel = {
  // 操作方式
  operate: string;
  // 操作对象
  target: XTarget;
  // 被操作对象
  subTarget?: XTarget;
  // 操作人
  operater: XTarget;
};

export type IdentityOperateModel = {
  // 操作方式
  operate: string;
  // 操作人
  operater: XTarget;
  // 操作的身份
  identity: XIdentity;
  // 操作的组织对象
  subTarget?: XTarget;
};

export type AuthorityOperateModel = {
  // 操作方式
  operate: string;
  // 操作人
  operater: XTarget;
  // 操作的职权
  authority: XAuthority;
};
/**
 * 文件系统项分享数据
 */
export type ShareIcon = {
  /** 名称 */
  name: string;
  /** 类型 */
  typeName: string;
  /** 头像 */
  avatar?: FileItemShare;
};
/**
 * 文件系统项分享数据
 */
export type FileItemShare = {
  key?: string;
  /** 完整路径 */
  size: number;
  /** 名称 */
  name: string;
  /** 视频封面 */
  poster?: string;
  /** 文件类型 */
  contentType?: string;
  /** 共享链接 */
  shareLink?: string;
  /** 拓展名 */
  extension?: string;
  /** 缩略图 */
  thumbnail?: string;
};
/**
 * 文件系统项数据模型
 */
export type FileItemModel = {
  /** 完整路径 */
  key: string;
  /** 创建时间 */
  dateCreated: string;
  /** 修改时间 */
  dateModified: string;
  /** 是否是目录 */
  isDirectory: boolean;
  /** 是否包含子目录 */
  hasSubDirectories: boolean;
  /** 归属id */
  belongId: string;
  // /** 是否引用文件 */
  isLinkFile?: boolean;
} & FileItemShare;

/** 桶支持的操作 */
export enum BucketOpreates {
  'List' = 'List',
  'Create' = 'Create',
  'Rename' = 'Rename',
  'Move' = 'Move',
  'Copy' = 'Copy',
  'Delete' = 'Delete',
  'Upload' = 'Upload',
  'HslSplit' = 'HslSplit',
  'AbortUpload' = 'AbortUpload',
}

/** 桶操作携带的数据模型 */
export type BucketOperateModel = {
  /** 完整路径 */
  key: string;
  /** 名称 */
  name?: string;
  /** 目标 */
  destination?: string;
  /** 操作 */
  operate: BucketOpreates;
  /** 携带的分片数据 */
  fileItem?: FileChunkData;
};

/** 上传文件携带的数据 */
export type FileChunkData = {
  /** 分片索引 */
  index: number;
  /** 文件大小 */
  size: number;
  /** 上传的唯一ID */
  uploadId: string;
  /** 分片数据 */
  data: number[];
  /** 分片数据编码字符串 */
  dataUrl: string;
};

/** 任务模型 */
export type TaskModel = {
  name: string;
  size: number;
  finished: number;
  createTime: Date;
};

/** 操作命令模型 */
export type OperateModel = {
  cmd: string;
  sort: number;
  label: string;
  iconType: string;
  model?: string;
  menus?: OperateModel[];
};

/** 会话元数据 */
export type MsgChatData = {
  /** 消息类会话完整Id */
  fullId: string;
  /** 会话标签 */
  labels: string[];
  /** 会话名称 */
  chatName: string;
  /** 会话备注 */
  chatRemark: string;
  /** 是否置顶 */
  isToping: boolean;
  /** 会话未读消息数量 */
  noReadCount: number;
  /** 最后一次消息时间 */
  lastMsgTime: number;
  /** 最新消息 */
  lastMessage?: ChatMessageType;
  /** 提及我 */
  mentionMe: boolean;
  /** 常用会话 */
  recently: boolean;
};

// 动态
export type ActivityType = {
  // 类型
  typeName: string;
  // 内容
  content: string;
  // 资源
  resource: FileItemShare[];
  // 评注
  comments: CommentType[];
  // 点赞
  likes: string[];
  // 转发
  forward: string[];
  // 标签
  tags: string[];
  // 链接信息
  linkInfo: string;
} & Xbase;

export type RequiredValue<T> = Exclude<T, null | undefined>;

export interface QuerySelector<T> {
  // Comparison
  _eq_?: T;
  _gt_?: T;
  _gte_?: T;
  _in_?: RequiredValue<T>[];
  _lt_?: T;
  _lte_?: T;
  _ne_?: T;
  _nin_?: RequiredValue<T>[];
  // Logical
  _not_?: T extends string ? QuerySelector<T> | RegExp : QuerySelector<T>;
  // Element
  /**
   * When `true`, `$exists` matches the documents that contain the field,
   * including documents where the field value is null.
   */
  _exists_?: boolean;
  _type_?: string | number;
  // Evaluation
  _expr_?: any;
  _jsonSchema_?: any;
  _mod_?: T extends number ? [number, number] : never;
  _regex_?: T extends string ? RegExp | string : never;
  _options_?: T extends string ? string : never;
  // Geospatial
  // TODO: define better types for geo queries
  _geoIntersects_?: { $geometry: object };
  _geoWithin_?: object;
  _near_?: object;
  _nearSphere_?: object;
  _maxDistance_?: number;
  // Array
  // TODO: define better types for $all and $elemMatch
  _all_?: T extends any[] ? any[] : never;
  _elemMatch_?: T extends any[] ? object : never;
  _size_?: T extends any[] ? number : never;
  // Bitwise
  _bitsAllClear_?: number | number[];
  _bitsAllSet_?: number | number[];
  _bitsAnyClear_?: number | number[];
  _bitsAnySet_?: number | number[];
}

export type RootQuerySelector = {
  _and_?: Array<FilterQuery<any>>;
  _nor_?: Array<FilterQuery<any>>;
  _or_?: Array<FilterQuery<any>>;
};

export type QueryCondition<T> = T | T[] | QuerySelector<T> | Dictionary<any>;

export type FilterQuery<T> = {
  [P in keyof T]?: QueryCondition<T[P]>;
};

export interface QueryOptions<T> {
  match?: FilterQuery<T> & RootQuerySelector & Dictionary<any>;
  project?: {
    [P in keyof T]?: number | string;
  } & Dictionary<string | number>;
  group?: any;
  sort?: {
    [P in keyof T]?: number;
  };
  skip?: number;
  limit?: number;
  lookup?: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
  };
  replaceroot?: any;
  replacewith?: any;
  unwind?: string;
}

type SortOptions = {
  selector: string;
  desc: boolean;
};

// 加载请求类型
export interface LoadOptions<T extends {} = Dictionary<any>> {
  belongId?: string;
  collName?: string;
  filter?: string[];
  group?: any;
  options?: QueryOptions<T> | any;
  userData?: string[];
  skip?: number;
  take?: number;
  formId?: string;
  requireTotalCount?: boolean;
  isCountQuery?: boolean;
  sort?: SortOptions[];
  extraReations?: string;
  isExporting?: boolean;
  clusterId?: string;
}

export interface SummaryOptions<T extends {} = Dictionary<any>> {
  collName: string;
  match?: FilterQuery<T> & RootQuerySelector & Dictionary<any>;
  fields: string[];
  ids?: string[];
  chunkSize?: number;
}

export type DirectoryContent = {
  forms: XForm[];
  specieses: XSpecies[];
  propertys: XProperty[];
  applications: XApplication[];
  directorys: XDirectory[];
};

/** 请求失败 */
export const badRequest = (
  msg: string = '请求失败',
  code: number = 400,
): ResultType<any> => {
  return { success: false, msg: msg, code: code, data: false };
};

// 节点
export type Node = {
  // 主键
  id: string;
  // 编码
  code: string;
  // 名称
  name: string;
  // 类型
  typeName: NodeType;
  // 前置脚本
  preScript?: string;
  // 后置脚本
  postScript?: string;
  // 状态
  status?: NStatus;
};

// 边
export type Edge = {
  // 主键
  id: string;
  // 开始
  start: string;
  // 结束
  end: string;
};

// 请求
export type Request = {
  data: HttpRequestType;
} & Node;

// 表格
export type Tables = {
  formIds: string[];
  file?: FileItemModel;
} & Node;

// 页
export type Sheet<T> = {
  // 主键
  id: string;
  // 名称
  name: string;
  // 列信息
  columns: Column[];
  // 数据
  data: T[];
};

/**
 * 列字段
 */
export interface Column<T = any> {
  // 字段名称
  title: string;
  // 标识符
  dataIndex: string;
  // 类型
  valueType?: string;
  // 映射
  lookups?: FiledLookup[];
  // 子表头
  children?: Column[];
  // 组件
  widget?: string;
  // 隐藏
  hidden?: boolean;
  /** 参数 */
  options?: XAttributeProps;
  // 格式化
  format?: (value: T) => any;
  // 渲染
  render?: (value: T) => any;
  // 表头
  header?: any;
  // excel 打印样式
  style?: ExcelStyle;
}

export interface ExcelStyle {
  // 内容位置
  align?: any;
  // 列宽度
  width?: number;
}

// 映射
export type Mapping = {
  // 源
  source?: string;
  // 目标
  target?: string;
  // 原 Id 字段名称
  idName: string;
  // 映射类型
  mappingType: MappingType;
  // 映射
  mappings: SubMapping[];
} & Node;

// 子映射
export type SubMapping = {
  // 源对象
  source: string;
  // 目标对象
  target: string;
  // 类型
  typeName?: string;
  // 子映射
  mappings?: SubMapping[];
};

// 存储
export type Store = {
  // 应用
  applicationId?: string;
  // 办事
  workId?: string;
} & Node;

// 子配置
export type SubTransfer = {
  // 子配置 ID
  transferId?: string;
  // 是否自循环
  isSelfCirculation: boolean;
  // 退出循环脚本
  judge?: string;
} & Node;

// 表单
export type Form = {
  // 表单 ID
  formId?: string;
} & Node;
// 打印模板
export type Print = {
  // 表单 ID
  printId?: string;
} & Node;

// 选择
export type Selection = {
  // 类型
  type: 'checkbox' | 'radio';
  // 关键字
  key: string;
  // 表单 ID
  formId: string;
} & Node;

// 环境
export type Environment = {
  id: string;
  name: string;
  params: KeyValue;
};

// 脚本
export type Script = {
  id: string;
  name: string;
  code: string;
  coder: string;
};

// 图状态
export type GStatus = 'Editable' | 'Viewable' | 'Running' | 'Error';

// 图事件
export type GEvent = 'Prepare' | 'Run' | 'Complete' | 'Edit' | 'Throw' | 'Recover';

// 节点状态
export type NStatus = 'Stop' | 'Running' | 'Error' | 'Completed';

// 节点事件
export type NEvent = 'Start' | 'Throw' | 'Complete';

// 节点类型
export type NodeType = '表单' | '表格' | '请求' | '子图' | '映射' | '存储' | '打印模板';

// 脚本位置
export type Pos = 'pre' | 'post';

// 映射类型（外部系统 => 内部系统，外部系统 => 外部系统，内部系统 => 外部系统，内部系统 => 内部系统）
export type MappingType = 'OToI' | 'OToO' | 'IToO' | 'IToI';

// 键值对
export type KeyValue = { [key: string]: string | undefined };

// 状态转移
export type Shift<T, S> = {
  // 开始
  start: S;
  // 事件
  event: T;
  // 结束
  end: S;
};

// 迁移配置
export type Transfer = {
  // 目录
  directoryId: string;
  // 环境集合
  envs: Environment[];
  // 当前环境
  curEnv?: string;
  // 节点集合
  nodes: Node[];
  // 边集合
  edges: Edge[];
  // 图数据
  graph: any;
} & XStandard;

// 任务
export type Task = {
  // 唯一标识
  id: string;
  // 当前状态
  status: GStatus;
  // 环境
  env?: Environment;
  // 节点
  nodes: Node[];
  // 边
  edges: Edge[];
  // 图数据
  graph: any;
  // 开始时间
  startTime: Date;
  // 结束时间
  endTime?: Date;
};

export type SettingWidget = {
  /** 按钮生成的 schema 的 key 值 */
  name: string;
  /** 在左侧栏按钮展示文案 */
  text: string;
  /** 在左侧栏按钮展示图标 */
  icon?: string;
  /** 如果是基本组件，这个字段注明它对应的 widgets */
  widget?: string;
  /** 组件对应的 schema 片段 */
  schema?: any;
  /** 组件的配置信息，使用 form-render 的 schema 来描述 */
  setting?: any;
};

export type Setting = {
  /** 最外层的分组名称 */
  title: string;
  /** 每个组件的配置，在左侧栏是一个按钮 */
  widgets: SettingWidget[];
  show?: boolean;
  useCommon?: boolean;
};

export type SchemaType = {
  displayType: 'row' | 'column';
  type: 'object';
  labelWidth: number | string;
  properties: Record<string, object>;
  column: 1 | 2 | 3;
};

export type DiskInfoType = {
  // 状态
  ok: number;
  // 对象数量
  objects: number;
  // 集合数量
  collections: number;
  // 文件数量
  filesCount: number;
  // 文件的总大小
  filesSize: number;
  // 数据的总大小
  dataSize: number;
  // 数据占用磁盘的总大小
  totalSize: number;
  // 文件系统挂载磁盘已使用大小
  fsUsedSize: number;
  // 文件系统挂载磁盘的总大小
  fsTotalSize: number;
  // 查询时间
  getTime: string;
};

export type ClassifyTreeType = {
  // 节点类型
  type: string;
  // 关系
  relation: string;
  // 自己节点
  children: ClassifyTreeType[];
  // 选中的分类集合
  value?: FiledLookup[];
  // 是否顶级节点
  isTop?: boolean;
  // 临时ID
  _tempId: string;
  // 父级ID
  parentId: string | null | undefined;
};

// 类筛选分类树节点类型
export type TreeNodeType = {
  id: string;
  text?: string;
  name?: string;
  typeName?: string;
  value?: string;
  info?: string;
  parentId?: string;
  key?: string;
  title?: string;
  tabKey?: string | number;
  children?: TreeNodeType[];
};

export type ClassifyTabType = {
  label: string;
  key: string;
  data: FiledLookup[];
};

export enum TaskContentType {
  Report = '报表',
  Closing = '月结',
  Questionnaire = '问卷',
  Notice = '通知公告',
  Alert = '预警',
  Regulation = '政策法规',
  Financial = '加载财务数据',
}

export interface TaskContentBase<T extends TaskContentType> {
  type: T;
  [key: string]: any;
}

export interface ReportContent extends TaskContentBase<TaskContentType.Report> {
  /** 报表树id */
  treeId: string;
  /** 目录id */
  directoryId: string;
  /** 办事id */
  workId?: string;
  /** 办事名称 */
  workName?: string;
  /** 自动下发权限 */
  autoDistributionAuthCode?: string;
}

export interface NoticeContent extends TaskContentBase<TaskContentType.Notice> {
  /** 通知内容 */
  message: string;
}

export interface ClosingContent extends TaskContentBase<TaskContentType.Closing> {}

export type TaskContent = ReportContent | NoticeContent | ClosingContent;

export interface ReportDistributionContent extends ReportContent {
  /** 开始日期 */
  startDate?: string;
  /** 截止日期 */
  endDate?: string;
}

export type DistributionContent = ReportDistributionContent;

export interface ReceptionContentBase<T extends TaskContentType> {
  type: T;
  [key: string]: any;
}

/**
 * (period, workId, treeNode.id) 为唯一标识
 *
 * 在`treeNode.speciesItemId`存在的情况下，
 * (period, workId, treeNode.speciesItemId, treeNode.nodeType)也可作为唯一标识
 */
export interface ReportStatus extends ReceptionContentBase<TaskContentType.Report> {
  /** 关联目录 */
  directoryId: string;
  /** 关联办事 */
  workId: string;
  /** 树节点 */
  treeNode: {
    id: string;
    treeId: string;
    nodeType: ReportTreeNodeType;
    targetId: string;
  };
}

export interface FinancialContent
  extends ReceptionContentBase<TaskContentType.Financial> {}

export type ReceptionContent = ReportStatus | FinancialContent;

export interface TaskSnapshotInfo {
  taskId: string;
  period: string;
}

export interface ReceptionStatusModel {
  /** 接收用户ID */
  receiveUserId: string;
  /** 办事实例ID */
  instanceId?: string;
  /** 变更前的 */
  previousInstanceId?: string;
  /** 是否被驳回 */
  isReject?: boolean;
  /** 数据的ID */
  thingId?: {
    [formId: string]: string[];
  };
  /** 是否自动补全 */
  isAutoFill?: boolean;
}

// 命令
export interface Command<T = any> {
  // 命令类型
  type: string;
  // 执行
  cmd: string;
  // 参数
  params: T;
}
// 报表树子节点

export type ReportTreeNodeView = WithChildren<XReportTreeNode>;
export interface ReportTaskTreeNodeView extends XReportTaskTreeNode {
  children: ReportTaskTreeNodeView[];
  count: number;
  isLeaf: boolean;
  reception?: XReception | null;
  directionChildrenComplete?: boolean;
}
export interface ReportSummaryTreeNodeView extends XReportTreeNode {
  // 子节点
  children: ReportSummaryTreeNodeView[];
  reception?: XReception | null;
  value?: number | null;
}

export interface ReportTreeNode extends XReportTreeNode {
  parentCode: string;
  index: number;
}

export type operationButtonInfo = {
  // 按钮名称
  name: string;
  // 按钮编码
  code: string;
  // 按钮类型
  type: string;
  // 绑定的表单
  form?: {
    // 表单名称
    name: string;
    // 表单id
    id: string;
    // 表单信息
    metadata: any;
  };
  // 绑定场景
  scene?: string;
};

export interface AllTask extends schema.XWorkTask {
  tasks?: AllTask[];
  private?: string;
}

export interface WorkRecordView extends schema.XWorkRecord {
  destName?: string;
  approveType?: string;
}
