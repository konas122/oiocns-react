import { kernel, model, schema } from '@/ts/base';
import { getUuid } from './tools';
import message from '@/utils/message';
import { Executor, WorkNodeModel } from '@/ts/base/model';
import { ICompany, ITarget, IWorkApply, TargetType } from '@/ts/core';
import { TaskStatus } from '@/ts/core/public/enums';
import { PageAll } from '@/ts/core/public/consts';
export const executorNames: Executor['funcName'][] = [
  '数据申领',
  '资产领用',
  '字段变更',
  'Webhook',
  '任务状态变更',
  '复制表到子表',
  '商城订单同步',
];
// 类型 枚举
enum dataType {
  'STRING' = 'STRING',
  'NUMERIC' = 'NUMERIC',
  'DICT' = 'DICT',
  'DATE' = 'DATE',
  'BELONG' = 'BELONG',
}
/** 节点类型 */
enum AddNodeType {
  'CC' = '抄送',
  'ROOT' = '起始',
  'EMPTY' = '空节点',
  'APPROVAL' = '审批',
  'Confluence' = '汇流',
  'CUSTOM' = '自由节点',
  'CONDITION' = '条件',
  'CONCURRENTS' = '全部',
  'ORGANIZATIONA' = '组织',
  'GATEWAY' = '网关',
  'END' = '归档',
}
/** 多级选择框展示类型 */
enum DisplayType {
  'CASCADE' = 1,
  'TREE' = 2,
  'POPUP' = 3,
}
export const DistplayTypeItems = [
  { id: DisplayType.CASCADE, text: '级联式' },
  { id: DisplayType.TREE, text: '树形' },
  { id: DisplayType.POPUP, text: '弹窗式' },
];
export type ValidationInfo = {
  isPass: boolean;
  hasGateway: boolean;
};
export type FieldCondition = {
  label: string;
  value: string;
  type: dataType;
  dict?: {
    label: string;
    value: string;
  }[];
};
export type conditiondType = {
  pos: number;
  paramKey: string;
  paramLabel: string;
  key: string;
  label: string;
  type: dataType;
  val: string | undefined;
  valLabel?: string;
  display: string;
  dict?: any[];
};
export type WorkNodeDisplayModel = {
  task?: any;
  parentCode: string;
  type: AddNodeType;
  conditions: conditiondType[];
  branches: WorkNodeDisplayModel[];
  children: WorkNodeDisplayModel | undefined;
} & WorkNodeModel;
/** 生成节点编号 */
const createNodeCode = () => {
  return `node_${getUuid()}`;
};
export const isBranchNode = (type: AddNodeType) => {
  return [
    AddNodeType.CONDITION,
    AddNodeType.CONCURRENTS,
    AddNodeType.ORGANIZATIONA,
  ].includes(type);
};
export const getNewBranchNode = (
  node: WorkNodeDisplayModel,
  index: number,
  conditions?: any,
) => {
  return {
    code: createNodeCode(),
    parentCode: node.code,
    name: getNodeName(node.type) + index,
    conditions: conditions || [],
    type: node.type,
    children: {},
  };
};
export const getConditionKeys: (type: string) => any[] = (type: string) => {
  var keys: any[] = [];
  switch (type) {
    case 'NUMERIC':
      keys = [
        { value: 'EQ', label: '=' },
        { value: 'GT', label: '>' },
        { value: 'GTE', label: '≥' },
        { value: 'LT', label: '<' },
        { value: 'LTE', label: '≤' },
        { value: 'NEQ', label: '≠' },
      ];
      break;
    case 'STRING':
    case 'DICT':
      keys = [
        { value: 'EQ', label: '=' },
        { value: 'NEQ', label: '≠' },
      ];
      break;
  }
  return keys;
};

/** 根据节点类型获取名称 */
const getNodeName = (type: AddNodeType) => {
  switch (type) {
    case AddNodeType.APPROVAL:
      return '审批对象';
    case AddNodeType.CC:
      return '抄送对象';
    case AddNodeType.CONDITION:
      return '条件分支';
    case AddNodeType.CONCURRENTS:
      return '并行分支';
    case AddNodeType.ORGANIZATIONA:
      return '组织分支';
    case AddNodeType.GATEWAY:
      return '分流网关';
    case AddNodeType.CUSTOM:
      return '自由节点';
    case AddNodeType.Confluence:
      return '汇流网关';
    default:
      return '';
  }
};
/** 校验流程节点 */
const correctWorkNode = (node?: model.WorkNodeModel) => {
  if (node == undefined || node.code == undefined) {
    return {
      Id: 0,
      name: '归档',
      code: createNodeCode(),
      type: AddNodeType.END,
      num: 1,
      destType: '身份',
      primaryForms: [],
      detailForms: [],
      destId: 0,
      executors: [],
      formRules: [],
      forms: [],
      destName: '数据归档',
      children: undefined,
      branches: [],
      resource: JSON.stringify({
        forms: [],
        executors: [],
        formRules: [],
        printData: { attributes: [], type: '' },
        print: [],
      }),
    } as unknown as model.WorkNodeModel;
  }
  if (node.type == AddNodeType.END) {
    node.children = undefined;
  } else {
    node.children = correctWorkNode(node.children);
  }
  return node;
};

const getEndNode = (node: model.WorkNodeModel | undefined): model.WorkNodeModel => {
  if (node == undefined) {
    return {
      name: '归档',
      code: createNodeCode(),
      type: AddNodeType.END,
      num: 1,
      destType: '身份',
      primaryForms: [],
      detailForms: [],
      destId: 0,
      executors: [],
      formRules: [],
      forms: [],
      destName: '数据归档',
      children: undefined,
      branches: [],
      resource: JSON.stringify({
        forms: [],
        executors: [],
        formRules: [],
      }),
    } as unknown as model.WorkNodeModel;
  }
  if (node.type === AddNodeType.END) {
    return node;
  } else {
    return getEndNode(node.children);
  }
};
/** 根据节点id获取节点信息 */
const getNodeByNodeId = (
  id: string,
  node: model.WorkNodeModel | undefined,
): model.WorkNodeModel | undefined => {
  if (node) {
    if (id === node.id) return node;
    const find = getNodeByNodeId(id, node.children);
    if (find) return find;
    for (const subNode of node?.branches ?? []) {
      const find = getNodeByNodeId(id, subNode.children);
      if (find) return find;
    }
  }
};
export function getAllNodes(node: model.WorkNodeModel): model.WorkNodeModel[] {
  const nodes: model.WorkNodeModel[] = [];
  function recursive(parent: model.WorkNodeModel) {
    nodes.push(parent);
    if (parent.children) {
      recursive(parent.children);
    }
    for (const subNode of parent.branches || []) {
      if (subNode.children) {
        recursive(subNode.children);
      }
    }
  }
  recursive(node);
  return nodes;
}
const isHasApprovalNode = (node: model.WorkNodeModel | undefined): boolean => {
  if (node) {
    if (
      [
        AddNodeType.APPROVAL,
        AddNodeType.CUSTOM,
        AddNodeType.GATEWAY,
        AddNodeType.Confluence,
      ].includes(node.type as AddNodeType) ||
      isHasApprovalNode(node.children)
    ) {
      return true;
    }
    for (const subNode of node?.branches ?? []) {
      if (isHasApprovalNode(subNode.children)) {
        return true;
      }
    }
  }
  return false;
};
const convertNode = (
  resource: WorkNodeDisplayModel | undefined,
  validation: ValidationInfo,
): any => {
  if (resource && resource.code) {
    if (resource.type == AddNodeType.EMPTY) {
      return convertNode(resource.children, validation);
    }
    switch (resource.type) {
      case AddNodeType.ROOT:
        if (resource.primaryForms.length == 0 && resource.detailForms.length == 0) {
          message.warn('ROOT节点未绑定表单');
          validation.isPass = false;
        }
        break;
      case AddNodeType.GATEWAY:
        validation.hasGateway = true;
        break;
      case AddNodeType.CUSTOM:
        resource.destType = resource.destType ?? '人员';
        break;
      case AddNodeType.Confluence:
        break;
      case AddNodeType.CC:
      case AddNodeType.APPROVAL:
        if (!resource.destId || resource.destId == '') {
          message.warn(`${resource.name}节点缺少审核对象`);
          validation.isPass = false;
        }
        break;
      case AddNodeType.CONDITION:
      case AddNodeType.CONCURRENTS:
      case AddNodeType.ORGANIZATIONA:
        if (
          resource.branches == undefined ||
          resource.branches.length == 0 ||
          resource.branches.some(
            (a) => a.children == undefined || a.children.code == undefined,
          )
        ) {
          message.warn(`${resource.name}节点缺少分支信息`);
          validation.isPass = false;
        } else if (
          resource.type == AddNodeType.CONDITION &&
          resource.branches.some(
            (a) =>
              a.conditions == undefined ||
              a.conditions.length == 0 ||
              a.conditions.find(
                (a) => a.val == undefined || a.val == '' || a.val == 'null',
              ),
          )
        ) {
          message.warn(`${resource.name}条件不可为空`);
          validation.isPass = false;
        }
    }
    return {
      id: resource.id,
      code: resource.code,
      type: resource.type,
      name: resource.name,
      num: resource.num ?? 1,
      primaryId: resource.primaryId,
      destType: resource.destType ?? '身份',
      forms: resource.forms ?? [],
      primaryForms: resource.primaryForms ?? [],
      detailForms: resource.detailForms ?? [],
      destId: resource.destId,
      destShareId: resource.destShareId,
      executors: resource.executors,
      encodes: resource.encodes,
      formRules: resource.formRules,
      destName: resource.destName,
      children: convertNode(resource.children, validation),
      branches: resource.branches?.map((a) => convertBranch(a, validation)),
      resource: JSON.stringify({
        executors: resource.executors ?? [],
        formRules: resource.formRules ?? [],
        printData: resource.printData ?? {},
        print: resource.print ?? [],
        buttons: resource.buttons ?? [],
        documentConfig: resource.documentConfig || {
          propMapping: {},
          nodeMapping: {},
          templates: [],
        },
        authoritys: resource.authoritys ?? [],
        containCompany: resource.containCompany,
        forms: resource.forms ?? [],
        mallOrderSyncRules: resource?.mallOrderSyncRules ?? {},
        defaultRoleIds: resource.defaultRoleIds
      }),
    };
  }
};
const convertBranch = (resource: any, validation: ValidationInfo) => {
  return {
    conditions: resource.conditions
      ? resource.conditions.map((item: any) => {
        return {
          paramKey: item.paramKey,
          key: item.key,
          type: item.type,
          val: item.val != undefined ? String(item.val) : undefined,
          display: item.display,
        };
      })
      : [],
    children: convertNode(resource.children, validation),
  };
};
const loadBranch = (resource: any, parentCode: string, parentType: string) => {
  if (resource) {
    let code = createNodeCode();
    return {
      id: createNodeCode(),
      code: code,
      parentCode: parentCode,
      name: resource.name,
      type: parentType as AddNodeType,
      conditions: resource.conditions
        ? resource.conditions.map((item: any, index: number) => {
          return {
            paramKey: item.paramKey,
            key: item.key,
            type: item.type,
            val: item.val != undefined ? String(item.val) : undefined,
            pos: index,
            display: item.display,
          };
        })
        : [],
      children: loadResource(resource.children, code),
    };
  }
};
const loadResource = (resource: any, parentCode: string = ''): any => {
  let code = createNodeCode();
  if (resource) {
    var nodeResource = JSON.parse(resource.resource ?? '{}');
    return {
      id: resource.id,
      code: resource.code,
      parentCode: parentCode,
      primaryId: resource.primaryId,
      name: resource.name,
      num: resource.num ?? 0,
      forms: resource.forms || [],
      destId: resource.destId,
      destType: resource.destType,
      destShareId: resource.destShareId,
      destName: resource.destName,
      type: resource.type as AddNodeType,
      primaryForms: nodeResource.primaryForms ?? resource.primaryForms ?? [],
      detailForms: nodeResource.detailForms ?? resource.detailForms ?? [],
      executors: nodeResource.executors ?? [],
      formRules: nodeResource.formRules ?? [],
      printData: nodeResource.printData ?? {
        attributes: [],
        type: '',
      },
      buttons: nodeResource.buttons,
      mallOrderSyncRules: nodeResource?.mallOrderSyncRules ?? {},
      defaultRoleIds: nodeResource.defaultRoleIds || [],
      documentConfig: nodeResource.documentConfig || {
        propMapping: {},
        templates: [],
      },
      print: nodeResource.print ?? [],
      primaryPrints: nodeResource.primaryPrints ?? [],
      authoritys: nodeResource.authoritys ?? [],
      containCompany: nodeResource.containCompany,
      belongId: resource.belongId,
      branches:
        resource.branches?.map((item: any) => {
          return loadBranch(item, resource.code, resource.type);
        }) || [],
      children: isBranchNode(resource.type)
        ? {
          code: code,
          parentCode: parentCode,
          type: AddNodeType.EMPTY,
          children: loadResource(resource.children, code),
        }
        : loadResource(resource.children, resource.code),
    };
  }
};
const loadNilResouce = () => {
  var rootCode = createNodeCode();
  return {
    code: rootCode,
    parentCode: '',
    type: AddNodeType.ROOT,
    name: '办事发起',
    num: 1,
    children: {
      code: createNodeCode(),
      parentCode: rootCode,
      type: AddNodeType.END,
      name: '归档',
      num: 1,
      children: {},
      forms: [],
      executors: [],
      formRules: [],
      primaryForms: [],
      detailForms: [],
      printData: { attributes: [], type: '' },
      print: [],
    },
    forms: [],
    executors: [],
    formRules: [],
    primaryForms: [],
    detailForms: [],
    printData: { attributes: [], type: '' },
    print: [],
    documentConfig: {
      propMapping: {},
      templates: [],
    },
  };
};

const DealGatewayFields = (apply: IWorkApply): model.FieldModel[] => {
  var nodes = searchChildNodes(apply.instanceData.node, [], [AddNodeType.GATEWAY]);
  if (apply.instanceData.node.type === AddNodeType.ROOT) {
    nodes.push(...loadRootGatewayNodes(apply.instanceData.node));
  }
  var result: model.FieldModel[] = [];
  if (
    'groups' in apply.target.space &&
    apply.typeName == '集群模板' &&
    (apply.metadata.taskId == '0' || apply.metadata.id != '0')
  ) {
    var groups = apply.target.targets.filter((a) =>
      (apply.target.space as ICompany).groups.some((s) => s.id == a.id),
    );
    if (groups.length == 1) {
      apply.metadata.groupId = groups[0].id;
    } else {
      result.push({
        id: '1',
        propId: '1',
        code: 'groupId',
        name: '选择发起集群',
        valueType: '选择型',
        widget: '单选框',
        remark: '',
        lookups: groups.map((a) => {
          return {
            id: a.id,
            text: a.name,
            code: a.code,
            info: a.remark,
            value: a.id,
          };
        }),
      });
    }
  }
  apply.gatewayData = [];
  for (const node of nodes) {
    if (node.destId != '') {
      var value = apply.instanceData.primary[node.destId];
      if (value) {
        if (AddNodeType.GATEWAY == (node.type as AddNodeType)) {
          apply.gatewayData.push({
            nodeId: node.primaryId,
            targetIds: Array.isArray(value) ? value : [value],
          });
        } else {
          apply.gatewayData.push({
            nodeId: node.id,
            targetIds: Array.isArray(value) ? value : [value],
          });
        }
        continue;
      }
    }
    if (AddNodeType.GATEWAY == (node.type as AddNodeType)) {
      result.push(
        convertToFields(
          {
            ...node,
            nodeType: node.type,
            id: node.primaryId,
          } as unknown as schema.XWorkNode,
          apply.target,
        ),
      );
    } else {
      result.push(
        convertToFields(
          { ...node, nodeType: node.type } as unknown as schema.XWorkNode,
          apply.target,
        ),
      );
    }
  }
  return result;
};
const searchChildNodes = (
  node: model.WorkNodeModel,
  memberNodes: model.WorkNodeModel[],
  nodeTypes: AddNodeType[],
) => {
  if (nodeTypes.includes(node.type as AddNodeType)) {
    memberNodes.push(node);
  }
  if (node.children) {
    memberNodes = searchChildNodes(node.children, memberNodes, nodeTypes);
  }
  for (const branch of node.branches ?? []) {
    if (branch.children) {
      memberNodes = searchChildNodes(branch.children, memberNodes, nodeTypes);
    }
  }
  return memberNodes;
};
const loadRootGatewayNodes = (node: model.WorkNodeModel) => {
  var nodes: model.WorkNodeModel[] = [];
  if (node.branches) {
    for (const branch of node.branches ?? []) {
      if (
        branch.children &&
        [AddNodeType.CUSTOM, AddNodeType.Confluence].includes(
          branch.children.type as AddNodeType,
        )
      ) {
        nodes.push(branch.children);
      }
    }
  } else if (
    node.children &&
    [AddNodeType.CUSTOM, AddNodeType.Confluence].includes(
      node.children?.type as AddNodeType,
    )
  ) {
    nodes.push(node.children);
  }
  return nodes;
};
/** 加载组织身份树 */
const _deepTreeItems = (
  node: schema.XWorkNode,
  targets: ITarget[],
  isChildren?: boolean,
  pid?: string,
): model.FiledLookup[] => {
  const result: any[] = [];
  for (const item of targets) {
    if (item.id === node.destId || isChildren) {
      isChildren = true;
      //插入节点
      result.push({
        id: item.id,
        text: item.name,
        parentId: item.id === node.destId ? undefined : pid,
        value: item.id,
        disabled: true, //禁用选择
        expanded: true, //打开子集
      });
      //插入节点下的身份
      if (item.identitys.length > 0) {
        result.push(
          ...item.identitys.map((v) => {
            return {
              id: v.id,
              text: `${v.name}(身份)`,
              parentId: item.id,
              value: v.id,
              instance: v
            }
          })
        );
      }
    }
    if (item.subTarget) {
      result.push(..._deepTreeItems(node, item.subTarget, isChildren, item.id));
    }
  }
  return result;
};
const convertToFields = (node: schema.XWorkNode, target: ITarget): model.FieldModel => {
  let field: model.FieldModel = {
    id: node.id,
    propId: node.id,
    code: node.code,
    name: node.name + `-${node.destType}`,
    nodeType: node.nodeType,
    valueType: '用户型',
    widget: '人员搜索框',
    remark: '',
  };
  var team = target;
  switch (node.nodeType) {
    case AddNodeType.CUSTOM:
      switch (node.destType) {
        case '角色':
          field.valueType = '用户型';
          field.widget = '内部机构选择框';
          field.options = {
            teamId: team.id,
          };
          break;
        case '身份':
          const resource = JSON.parse(node.resource ?? '{}');
          field.valueType = '描述型';
          field.widget = '多选框';
          field.options = {
            teamId: node.destId,
          };
          field.lookups = _deepTreeItems(node, [target]);
          field.defaultRoleIds = resource.defaultRoleIds || []
          break;
        default:
          if (TargetType.Group === target.typeName) {
            team = target.space;
          }
          field.valueType = '用户型';
          field.widget = '多选框';
          field.options = {
            teamId: team.id,
            searchEnabled: true,
          };
          field.lookups = target.members.map((menber) => ({
            ...menber,
            id: menber.id,
            value: menber.id,
            text: menber.name,
          })) as any;
          if (field.lookups?.length === 1) {
            field.options.defaultValue = [field.lookups[0].value];
          }
          break;
      }
      break;
    case AddNodeType.GATEWAY:
      field.valueType = '用户型';
      field.widget = '成员选择框';
      field.options = {
        teamId: team.id,
      };
      if (node.destId != '') {
      }
      break;
    case AddNodeType.Confluence:
      field.valueType = '用户型';
      field.widget = '内部机构选择框';
      field.options = {
        teamId: team.id,
      };
      break;
    default:
      break;
  }
  return field;
};

const loadWorkStatus = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.ApplyStart:
      return {
        className: 'timelineSuccess',
        img: '/svg/dot/begin.svg',
        text: '已发起',
        statusClassName: 'statusSuccess',
      };
    case TaskStatus.InApproval:
      return {
        className: 'timelineReview',
        img: '/svg/dot/review.svg',
        text: '审核中',
        statusClassName: 'statusReview',
      };
    case TaskStatus.ApprovalStart:
      return {
        className: 'timelineSuccess',
        img: '/svg/dot/success.svg',
        text: '已通过',
        statusClassName: 'statusSuccess',
      };
    case TaskStatus.RefuseStart:
      return {
        className: 'timelineRefuse',
        img: '/svg/dot/refuse.svg',
        text: '已拒绝',
        statusClassName: 'statusRefuse',
      };
    case TaskStatus.BackStartStatus:
      return {
        className: 'timelineRefuse',
        img: '/svg/dot/refuse.svg',
        text: '已驳回',
        statusClassName: 'statusRefuse',
      };
    case TaskStatus.ResetStartStatus:
      return {
        className: 'timelineRefuse',
        img: '/svg/dot/refuse.svg',
        text: '被重置',
        statusClassName: 'statusRefuse',
      };
    case TaskStatus.CancelStartStatus:
      return {
        className: 'timelineRefuse',
        img: '/svg/dot/refuse.svg',
        text: '被取消',
        statusClassName: 'statusRefuse',
      };
    case TaskStatus.BrotherDownStatus:
      return {
        className: 'timelineRefuse',
        img: '/svg/dot/refuse.svg',
        text: '分支已审核',
        statusClassName: 'statusRefuse',
      };
    case TaskStatus.NodeMissStatus:
      return {
        className: 'timelineRefuse',
        img: '/svg/dot/refuse.svg',
        text: '节点丢失',
        statusClassName: 'statusRefuse',
      };
    case TaskStatus.DefineMissStatus:
      return {
        className: 'timelineRefuse',
        img: '/svg/dot/refuse.svg',
        text: '定义丢失',
        statusClassName: 'statusRefuse',
      };
    case TaskStatus.InstanceMissStatus:
      return {
        className: 'timelineRefuse',
        img: '/svg/dot/refuse.svg',
        text: '实例丢失',
        statusClassName: 'statusRefuse',
      };
    default:
      return {
        className: 'timelineReview',
        img: '/svg/dot/review.svg',
        text: '未定义状态',
        statusClassName: 'statusReview',
      };
  }
};

const loadParentApprovalNode = (nodeId: string, parentNode: WorkNodeDisplayModel) => {
  var nodes: WorkNodeDisplayModel[] = [];
  if (parentNode.id == nodeId) {
    nodes.push(parentNode);
    return nodes;
  }
  for (const children of [parentNode.children, ...(parentNode.branches ?? [])]) {
    if (children) {
      var childNodes = loadParentApprovalNode(nodeId, children);
      if (childNodes.length > 0) {
        nodes.push(...childNodes);
        break;
      }
    }
  }
  if (nodes.length > 0) {
    if (
      [
        AddNodeType.Confluence,
        AddNodeType.GATEWAY,
        AddNodeType.APPROVAL,
        AddNodeType.CUSTOM,
        AddNodeType.ROOT,
      ].includes(parentNode.type)
    ) {
      nodes.unshift(parentNode);
    }
  }
  return nodes;
};

const uniqueFunc = (arr: schema.XTarget[]) => {
  const res = new Map();
  return arr.filter((item) => !res.has(item.id) && res.set(item.id, 1));
};

// 加载身份下的成员
const loadMembers = async (identityIds: string[]) => {
  const res = await Promise.all(identityIds.map(async identityId => {
    const res = await kernel.queryIdentityTargets({
      id: identityId,
      page: PageAll,
    })
    if (res.success && res.data.result) {
      return res.data.result;
    }
    return []
  }))
  const members = res.flat(1)
  if (members?.length) {
    return uniqueFunc(members)
  }
  return []
};

export {
  AddNodeType,
  convertNode,
  convertToFields,
  correctWorkNode,
  dataType,
  DealGatewayFields,
  DisplayType,
  getEndNode,
  getNodeByNodeId,
  createNodeCode as getNodeCode,
  getNodeName,
  isHasApprovalNode,
  loadNilResouce,
  loadParentApprovalNode,
  loadMembers,
  loadResource,
  loadWorkStatus,
  searchChildNodes,
};
