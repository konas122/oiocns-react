import { schema } from '@/ts/base';
import {
  ICompany,
  IDepartment,
  IPerson,
  TargetType,
  orgAuth,
  ITarget,
  ITeam,
  IView,
} from '@/ts/core';
export type DeptItemType = {
  key: string;
  id: string;
  label: string;
  item: schema.XEntity;
  parentId?: string;
  hasItems: boolean;
  children: DeptItemType[];
  disabled?: boolean;
  typeName: string;
};

// 获取树节点
const createTreeNode = <T>(
  data: schema.XEntity,
  children: ITeam[] = [],
  pid?: string,
): T => {
  return {
    //@ts-ignore
    key: `${pid ?? data?.key ?? '0'}_${data.id}`,
    id: data.id,
    parentId: pid,
    label: data.name,
    typeName: data.typeName,
    item: data,
    hasItems: children.length > 0,
    children: [],
  } as unknown as T;
};

// 递归加载部门数据
const loadDepartments = <T extends DeptItemType>(depts: IDepartment[], parent: T) => {
  depts.forEach((dept) => {
    const item = createTreeNode<T>(dept.metadata, dept.children, parent.key);
    if (item.hasItems) {
      loadDepartments(dept.children, item);
    }
    parent.children.push(item);
  });
};

// 查找树中满足条件的节点
const findInTree = <T extends { subTarget: T[] }>(
  data: T,
  predicate: (node: T) => boolean,
): T | undefined => {
  const queue: T[] = [data];

  while (queue.length) {
    const node = queue.shift()!;
    if (predicate(node)) {
      return node;
    }
    queue.push(...node.subTarget);
  }

  return undefined;
};

// 检查用户是否拥有团队权限
const hasTeamAuth = (user: IPerson, teamIds: string[]) => {
  const requiredAuths = [orgAuth.SuperAuthId, orgAuth.DataAuthId];
  return user.authenticate(teamIds, requiredAuths);
};

// 加载目标树
const loadTargetTree = <T extends DeptItemType>(target: ITeam): T => {
  const childrenItems =
    target.typeName === TargetType.Company
      ? (target as ICompany).departments
      : (target as IDepartment).children;

  const rootNode = createTreeNode<DeptItemType>(target.metadata, childrenItems);
  loadDepartments(childrenItems as IDepartment[], rootNode);
  return rootNode as T;
};

// 获取展示权限
export const getTreeDatas = async <T extends DeptItemType>(
  target: ITarget,
  form: IView,
): Promise<T[]> => {
  const treeNodes: T[] = [];
  //集群成员列表
  if (target.typeName === TargetType.Group) {
    await target.loadMembers();
    treeNodes.push(
      createTreeNode({
        id: target.directory.spaceId,
        key: 'company',
        name: '本单位',
        typeName: '单位',
      } as unknown as schema.XEntity),
      ...target.members.map((member) => createTreeNode<T>(member)),
    );
    return treeNodes;
  }

  const team = target as ICompany | IDepartment;
  const { person = '' } = form.metadata?.options?.viewDataRange ?? {};
  //默认权限
  if (person) {
    const fields = [
      ...form.fields,
      { id: 'createUser', code: 'createUser', valueType: '描述型', lookups: [] },
      { id: 'updateUser', code: 'updateUser', valueType: '描述型', lookups: [] },
      { id: 'belongId', code: 'belongId', valueType: '描述型', lookups: [] },
    ];
    const userField = fields.find((attr) => attr.code === person || attr.id === person);
    if (userField) {
      if (userField.valueType === '选择型') {
        const metadata = userField.lookups?.find(
          (item) => item.relevanceId === team.userId,
        );
        if (metadata) {
          treeNodes.push(
            createTreeNode({
              id: metadata.value,
              key: metadata.code,
              typeName: '人员',
              name: '本人',
            } as any),
          );
        }
      } else {
        treeNodes.push(createTreeNode({ ...team.user.metadata, name: '本人' }));
      }
    }
  }

  //超管权限
  if (hasTeamAuth(team.user, [team.belongId])) {
    treeNodes.push(loadTargetTree<T>(team));
  } else if (team.user.departments.length > 0) {
    const departments = team.user.departments.filter(
      (dept) => dept.belongId === team.directory.spaceId,
    );
    //部分部门管理员权限
    for (const depart of departments) {
      if (hasTeamAuth(team.user, [depart.id])) {
        const predicate = (node: ITarget) =>
          node.typeName === depart.typeName && node.id === depart.id;
        const foundNode = findInTree(team as ITarget, predicate);
        if (foundNode) {
          treeNodes.push(loadTargetTree<T>(foundNode));
        }
      }
    }
  }

  return treeNodes;
};
