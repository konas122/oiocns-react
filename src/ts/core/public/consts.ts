import { ViewType } from '../../base/enum';
import { PageModel } from '../../base/model';
import { TargetType, ValueType } from './enums';
import { personJoins, targetOperates } from './operates';

/** 资产共享云模块权限Id */
export const orgAuth = {
  // 超管权限
  SuperAuthId: '361356410044420096',
  // 关系管理权限
  RelationAuthId: '361356410623234048',
  // 数据管理权限
  DataAuthId: '361356410698731520',
};
/** 支持的单位类型 */
export const companyTypes = [TargetType.Company];
/** 支持的单位类型 */
export const departmentTypes = [
  TargetType.Department,
  TargetType.College,
  TargetType.Office,
  TargetType.Section,
  TargetType.Major,
  TargetType.Working,
  TargetType.Research,
  TargetType.Laboratory,
];
/** 支持的值类型 */
export const valueTypes = [
  ValueType.Number,
  ValueType.Currency,
  ValueType.Remark,
  ValueType.Select,
  ValueType.Species,
  ValueType.Time,
  ValueType.Target,
  ValueType.Date,
  ValueType.File,
  ValueType.Reference,
  ValueType.Map,
  ValueType.Object,
];
/** 表单弹框支持的类型 */
export const formModalType = {
  New: 'New',
  Edit: 'Edit',
  View: 'View',
};
/** 用于获取全部的分页模型 */
export const PageAll: PageModel = {
  offset: 0,
  limit: (2 << 15) - 1, //ushort.max
  filter: '',
};

/** 通用状态信息Map */
export const StatusMap = new Map([
  [
    1,
    {
      color: 'blue',
      text: '待处理',
    },
  ],
  [
    100,
    {
      color: 'green',
      text: '已同意',
    },
  ],
  [
    200,
    {
      color: 'red',
      text: '已拒绝',
    },
  ],
  [
    102,
    {
      color: 'green',
      text: '已发货',
    },
  ],
  [
    220,
    {
      color: 'gold',
      text: '买方取消订单',
    },
  ],
  [
    221,
    {
      color: 'volcano',
      text: '卖方取消订单',
    },
  ],
  [
    222,
    {
      color: 'default',
      text: '已退货',
    },
  ],
  [
    240,
    {
      color: 'red',
      text: '已取消',
    },
  ],
]);

/** 成员选择框-办事过滤条件 */
export const MemberFilter = {
  id: 'unit/cluster',
  label: '本单位/本集群',
};

// 门户的个人快捷操作
export const PersonQuickOperate = [
  targetOperates.NewStorage,
  targetOperates.JoinStorage,
  targetOperates.JoinFriend,
  targetOperates.NewCohort,
  personJoins.menus[1],
  targetOperates.NewCompany,
  personJoins.menus[2],
];

export const CompanyQuickOperate = [
  targetOperates.JoinStorage,
  targetOperates.NewDepartment,
  targetOperates.JoinDepartment,
  targetOperates.NewGroup,
  targetOperates.JoinGroup,
  targetOperates.NewCohort,
];
/** 支持的视图类型 */
export const ViewTypes = [
  ViewType.Form,
  ViewType.Report,
  ViewType.Chart,
  ViewType.Total,
  ViewType.Summary,
];

/** 配置限额规则 - 关联查询集合 - 常量字段 */
export const deprecitionForm = 'DEPRECITIONFORM';

/** 配置限额规则 - 关联查询集合 - 计算月差值常量字段 */
export const monthsDifference = 'MONTHSDIFFERENCE';

/** 配置限额规则 - 校验可更新数值  */
export const validForDepreciation = 'VALIDFORDEPRECIATION';

/** 支持设置权限的应用  */
export const AuthApps = ['目录','应用', '模块', '办事', '表单', '视图', '报表']
