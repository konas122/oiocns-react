import { XReportTreeNode } from '@/ts/base/schema';
import type { IReportTree } from '.';
import { getTreeNodeType } from './consts';
import { balanceNodeTypes } from './consts';
import { summaryNodeTypes } from './consts';
import { ITarget } from '@/ts/core';
import { schema } from '@/ts/base';
import { ReportTreeNodeTypes, ReportTreeTypes } from '@/ts/base/enum';
import { ReportTreeNode } from '@/utils/excel';
import _ from 'lodash';
import { WithChildren } from '@/ts/base/common/tree';

export class ReportTreeGenerator {
  private target: ITarget = null!;
  private readonly tree: IReportTree;

  progress: (value: number | Error) => void = () => {};

  constructor(tree: IReportTree) {
    this.tree = tree;
  }

  //#region 根据Target生成

  async generateByTarget(target: ITarget, progress?: (value: number | Error) => void) {
    this.target = target;
    let total = this.target.targets.reduce((_, cur) => 1 + cur.members.length, 0);
    let current = 0;
    let rootNodeId = '';
    try {
      for await (const nodes of this.traverse(this.target)) {
        if (!rootNodeId && nodes[0] && !nodes[0].parentId) {
          rootNodeId = nodes[0].id!;
        }
        current += nodes.length;
        progress?.((current / total) * 100);
      }
    } catch (error: any) {
      progress?.(error);
    }
    return rootNodeId;
  }

  private async *traverse(
    item: ITarget,
    nodeParentId?: string,
  ): AsyncGenerator<XReportTreeNode[]> {
    // 生成当前组织分类
    let currentNode: XReportTreeNode;
    if (this.target.members.length == 0 || this.tree.treeType == ReportTreeTypes.Normal) {
      currentNode = this.createTreeNode(
        item.metadata,
        ReportTreeNodeTypes.Normal,
        nodeParentId,
      );
    } else {
      currentNode = this.createTreeNode(
        item.metadata,
        ReportTreeNodeTypes.Merge,
        nodeParentId,
      );
    }
    currentNode = await this.save(currentNode);
    yield [currentNode];

    // 生成下级的本级和差额
    let specialNodes: XReportTreeNode[] = [];
    let belongMember = item.members.find((member) => member.id == item.belongId);
    if (belongMember && this.tree.treeType != ReportTreeTypes.Normal) {
      specialNodes.push(
        this.createTreeNode(belongMember, ReportTreeNodeTypes.Normal, currentNode.id),
      );
      if (this.tree.treeType == ReportTreeTypes.Financial) {
        specialNodes.push(
          this.createTreeNode(belongMember, ReportTreeNodeTypes.Balance, currentNode.id),
        );
      }
    }
    if (specialNodes.length > 0) {
      specialNodes = await this.saveBatch(specialNodes);
      yield specialNodes;
    }

    // 生成组织成员
    const members = item.members
      .filter((member) => {
        if (this.tree.treeType == ReportTreeTypes.Normal) {
          return true;
        }
        return member.id != item.belongId;
      })
      .map((item) => {
        return this.createTreeNode(item, ReportTreeNodeTypes.Normal, currentNode.id);
      });
    if (members.length > 0) {
      yield await this.saveBatch(members);
    }

    // 生成下级节点
    for (const child of item.subTarget) {
      yield* this.traverse(child, currentNode.id);
    }
  }

  private createTreeNode(
    item: schema.XTarget,
    nodeTypeName: ReportTreeNodeTypes,
    parentId?: string,
  ): XReportTreeNode {
    let name = item.name;
    if (summaryNodeTypes.includes(nodeTypeName)) {
      name += this.tree.treeType == ReportTreeTypes.Financial ? '（合并）' : '（汇总）';
    } else if (balanceNodeTypes.includes(nodeTypeName)) {
      name += '（差额）';
    }
    return {
      treeId: this.tree.id,
      typeName: '报表树节点',
      code: item.code,
      name: name,
      parentId,
      remark: item.remark,
      belongId: item.belongId,
      targetId: item.id,
      nodeTypeName,
      nodeType: getTreeNodeType(nodeTypeName),
    } as XReportTreeNode;
  }

  //#endregion

  //#region 导入节点

  async importNodes(
    data: WithChildren<ReportTreeNode>[],
    total: number,
    progress?: (value: number | Error) => void,
  ) {
    let current = 0;
    let rootNodeId = '';
    try {
      for await (const nodes of this.recursiveImport(data)) {
        if (!rootNodeId && nodes[0] && !nodes[0].parentId) {
          rootNodeId = nodes[0].id!;
        }
        current += nodes.length;
        progress?.((current / total) * 100);
      }
    } catch (error: any) {
      progress?.(error);
    }
    return rootNodeId;
  }

  async cloneNodes(
    data: WithChildren<XReportTreeNode>[],
    total: number,
    progress?: (value: number | Error) => void,
  ) {
    let current = 0;
    try {
      for await (const nodes of this.recursiveClone(data)) {
        current += nodes.length;
        progress?.((current / total) * 100);
      }
    } catch (error: any) {
      progress?.(error);
    }
  }

  private async *recursiveImport(
    data: WithChildren<ReportTreeNode>[],
    nodeParentId?: string,
  ): AsyncGenerator<XReportTreeNode[]> {
    let [map, nodes] = data.reduce<
      [Dictionary<WithChildren<ReportTreeNode>>, XReportTreeNode[]]
    >(
      (a, v) => {
        a[0][v.code] = v;
        a[1].push(this.updateTreeNodeInfo(v, nodeParentId));
        return a;
      },
      [{}, []],
    );
    nodes = await this.saveBatch(nodes);
    yield nodes;

    for (const node of nodes) {
      const origin = map[node.code];
      if (origin.children.length == 0) {
        continue;
      }
      yield* this.recursiveImport(origin.children, node.id);
    }
  }

  private async *recursiveClone(
    data: WithChildren<XReportTreeNode>[],
    nodeParentId?: string,
  ): AsyncGenerator<XReportTreeNode[]> {
    let [map, nodes] = data.reduce<
      [Dictionary<WithChildren<XReportTreeNode>>, XReportTreeNode[]]
    >(
      (a, v) => {
        a[0][v.code] = v;

        const newNode: any = {
          ..._.omit(v, [
            'id',
            'children',
            'createTime',
            'updateTime',
            'createUser',
            'updateUser',
          ]),
          treeId: this.tree.id,
        };
        if (nodeParentId) {
          newNode.parentId = nodeParentId;
        }

        a[1].push(newNode);
        return a;
      },
      [{}, []],
    );
    nodes = await this.saveBatch(nodes);
    yield nodes;

    for (const node of nodes) {
      const origin = map[node.code];
      if (origin.children.length == 0) {
        continue;
      }
      yield* this.recursiveClone(origin.children, node.id);
    }
  }

  private updateTreeNodeInfo(node: ReportTreeNode, parentId?: string): XReportTreeNode {
    let ret = _.omit(node, ['id', 'parentCode', 'index', 'children']) as XReportTreeNode;
    ret = Object.assign(ret, {
      treeId: this.tree.id,
      typeName: '报表树节点',
      parentId,
      belongId: node.targetId,
      nodeType: getTreeNodeType(node.nodeTypeName),
    } as XReportTreeNode);
    return ret;
  }

  //#endregion

  private async save(node: XReportTreeNode) {
    return (await this.tree.nodeColl.insert(node))!;
  }

  private async saveBatch(nodes: XReportTreeNode[]) {
    return await this.tree.nodeColl.insertMany(nodes);
  }
}
