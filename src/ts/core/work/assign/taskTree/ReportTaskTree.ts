import { IDirectory, XCollection } from '@/ts/core';
import { ReportStatus, TaskSnapshotInfo } from '@/ts/base/model';
import { XReportTaskTree, XReportTaskTreeNode, XReportTreeNode } from '@/ts/base/schema';
import { IReportTree, ReportTreeBase } from '../../../thing/standard/reporttree';
import { model } from '@/ts/base';
import { getEmptySummary, getStatus, ReportTaskTreeSummary } from '../reception/status';
import { nextTick } from '@/ts/base/common/timer';
import { getAllNodes } from '@/ts/base/common/tree';
import { IReportDistribution } from '../distribution/report';
import { IReceptionProvider } from '@/ts/core/work/assign/IReceptionProvider';

export interface IReportTaskTree extends IReportTree {
  /** 加载任务分发树 */
  loadDistributionTree(
    rootNode: ReportStatus['treeNode'],
    dist: IReceptionProvider,
    onlyDirectChildren?: boolean,
  ): Promise<[model.ReportTaskTreeNodeView[], ReportTaskTreeSummary]>;
  /** 加载任务分发树根节点 */
  loadDistributionRootNode(
    rootNode: ReportStatus['treeNode'],
    dist: IReceptionProvider,
  ): Promise<[model.ReportTaskTreeNodeView[], ReportTaskTreeSummary]>;
  /** 加载完整的任务分发树 */
  loadFullDistributionTree(
    rootNode: ReportStatus['treeNode'],
    dist: IReportDistribution,
  ): Promise<[model.ReportTaskTreeNodeView[], ReportTaskTreeSummary]>;
  /** 加载子节点 */
  loadDistributionChildren(
    parentNodeId: string,
    dist: IReceptionProvider,
  ): Promise<model.ReportTaskTreeNodeView[]>;
  /** 加载任务状态数量 */
  loadDistributionSummary(nodeId: string): Promise<ReportTaskTreeSummary>;
}

export class ReportTaskTree
  extends ReportTreeBase<XReportTaskTree, XReportTaskTreeNode>
  implements IReportTaskTree
{
  static getCollName(typeName: '报表树节点' | '报表树') {
    if (typeName == '报表树节点') {
      return 'work-report-task-tree-node';
    } else {
      return 'work-report-task-tree';
    }
  }

  constructor(_metadata: XReportTaskTree, _directory: IDirectory) {
    const treeColl = _directory.resource.genTargetColl<XReportTaskTree>(
      ReportTaskTree.getCollName('报表树'),
    );
    super(_metadata, _directory, treeColl);
    this._nodeColl = _directory.resource.genTargetColl<XReportTaskTreeNode>(
      ReportTaskTree.getCollName('报表树节点'),
    );
    this.info = {
      taskId: _metadata.taskId,
      period: _metadata.period,
    };
  }

  readonly info: TaskSnapshotInfo;
  private readonly _nodeColl: XCollection<XReportTaskTreeNode>;
  get nodeColl() {
    return this._nodeColl;
  }

  async loadDistributionTree(
    parentNode: ReportStatus['treeNode'],
    dist: IReceptionProvider,
    onlyDirectChildren = false,
  ): Promise<[model.ReportTaskTreeNodeView[], ReportTaskTreeSummary]> {
    const summary: ReportTaskTreeSummary = getEmptySummary();

    let nodes: XReportTaskTreeNode[] = await this.nodeColl.loadSpace({
      options: {
        match: { parentId: parentNode.id },
      },
    } as model.LoadOptions<XReportTreeNode>);

    if (!onlyDirectChildren && nodes.length > 0) {
      nodes = await this.loadNodes();
    } else {
      const [rootNode] = await this.nodeColl.find([parentNode.id]);
      if (!rootNode) {
        console.warn(`找不到节点 ${parentNode.id}`);
      }
      nodes.unshift(
        rootNode ?? {
          ...parentNode,
          name: '（已删除节点）',
        },
      );
    }

    const nodeMap = nodes.reduce<Dictionary<model.ReportTaskTreeNodeView>>((a, v) => {
      a[v.id] = {
        ...v,
        children: [],
        count: 0,
        isLeaf: true,
      };
      return a;
    }, {});

    const root = nodeMap[parentNode.id];
    const nodeIds = nodes.map((n) => n.id);
    const receptionMap = await dist.findReportReceptions(nodeIds);

    const pool = Object.values(nodeMap);
    for (const node of pool) {
      node.reception = receptionMap[node.id];
      const parent = nodeMap[node.parentId!];
      if (!parent) {
        continue;
      }
      parent.children.push(node);
    }
    await nextTick();
    // 筛选子树的情况
    const subNodes = getAllNodes([root]);
    for (const node of subNodes) {
      node.isLeaf = node.children.length == 0;
      summary.total++;
      const status = getStatus(node.reception);
      summary[status]++;
    }
    return [[root], summary];
  }

  async loadDistributionRootNode(
    parentNode: ReportStatus['treeNode'],
    dist: IReceptionProvider,
  ): Promise<[model.ReportTaskTreeNodeView[], ReportTaskTreeSummary]> {
    const summary: ReportTaskTreeSummary = getEmptySummary();
    const nodes = [parentNode as model.ReportTaskTreeNodeView];
    const nodeMap = nodes.reduce<Dictionary<model.ReportTaskTreeNodeView>>((a, v) => {
      a[v.id] = {
        ...v,
        children: [],
        count: 0,
        isLeaf: false,
      };
      return a;
    }, {});

    const root = nodeMap[parentNode.id];
    const nodeIds = nodes.map((n) => n.id);
    const receptionMap = await dist.findReportReceptions(nodeIds);

    const pool = Object.values(nodeMap);
    for (const node of pool) {
      node.reception = receptionMap[node.id];
      const parent = nodeMap[node.parentId!];
      if (!parent) {
        continue;
      }
      parent.children.push(node);
    }
    await nextTick();
    return [[root], root.summary ?? summary];
  }

  async loadDistributionChildren(
    parentId: string,
    dist: IReceptionProvider,
  ): Promise<model.ReportTaskTreeNodeView[]> {
    let childrenNodes: model.ReportTaskTreeNodeView[] = [];
    let nodes: XReportTaskTreeNode[] = await this.nodeColl.loadSpace({
      options: {
        match: { parentId: parentId },
      },
    } as model.LoadOptions<XReportTreeNode>);
    const nodeMap = nodes.reduce<Dictionary<model.ReportTaskTreeNodeView>>((a, v) => {
      a[v.id] = {
        ...v,
        children: [],
        count: 0,
        isLeaf: false,
      };
      return a;
    }, {});
    const nodeIds = nodes.map((n) => n.id);
    const receptionMap = await dist.findReportReceptions(nodeIds);

    const pool = Object.values(nodeMap);
    for (const node of pool) {
      node.reception = receptionMap[node.id];
      childrenNodes.push(node);
    }
    await nextTick();
    return childrenNodes;
  }

  loadFullDistributionTree(
    parentNode: ReportStatus['treeNode'],
    dist: IReportDistribution,
  ): Promise<[model.ReportTaskTreeNodeView[], ReportTaskTreeSummary]> {
    const p: IReceptionProvider = {
      findReportReceptions: async (nodeIds) => {
        return await dist.findReportReceptions(nodeIds);
      },
    };
    return this.loadDistributionTree(parentNode, p);
  }

  async loadDistributionSummary(nodeId: string): Promise<ReportTaskTreeSummary> {
    let summary: ReportTaskTreeSummary = getEmptySummary();
    const promise = await this.nodeColl.loadAggregate([
      {
        match: { treeId: this.metadata.id, nodePath: { _regex_: nodeId } },
      },
      {
        group: {
          key: ['taskStatus'],
          count: { _sum_: 1 },
        },
      },
      { limit: 10 },
    ]);
    for (let i = 0; i < promise.length; i++) {
      if (promise[i].taskStatus) {
        // @ts-ignore
        summary[promise[i].taskStatus] += promise[i].count;
      } else {
        summary.empty += promise[i].count;
      }
      summary.total += promise[i].count;
    }
    return summary;
  }
}
