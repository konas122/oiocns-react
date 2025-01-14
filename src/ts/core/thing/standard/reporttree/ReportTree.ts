import _ from 'lodash';
import { IDirectory } from '../../directory';
import {
  XDistribution,
  XReportTaskTree,
  XReportTree,
  XReportTreeNode,
} from '@/ts/base/schema';
import { ReportTaskTree } from '@/ts/core/work/assign/taskTree/ReportTaskTree';
import { ReportTreeBase } from '.';

export class ReportTree extends ReportTreeBase<XReportTree, XReportTreeNode> {
  constructor(_metadata: XReportTree, _directory: IDirectory) {
    super(_metadata, _directory, _directory.resource.reportTreeColl);
  }

  get nodeColl() {
    return this.directory.resource.reportTreeNodeColl;
  }

  async createTaskTree(
    dist: XDistribution,
    destination?: IDirectory,
  ): Promise<XReportTaskTree | undefined> {
    destination ||= this.directory;
    const newMetaData: XReportTaskTree = {
      ...(_.omit(this.metadata, [
        'id',
        'name',
        'code',
        'createUser',
        'createTime',
        'updateUser',
        'updateTime',
      ]) as any),
      taskId: dist.taskId,
      period: dist.period,
      distId: dist.id,
      code: this.metadata.code + dist.period.replace('-', ''),
      name: this.metadata.name + ' ' + dist.period,
    };
    newMetaData.id = 'snowId()';

    const treeColl = destination.resource.genTargetColl<XReportTaskTree>(
      ReportTaskTree.getCollName('报表树'),
    );

    const data = await treeColl.replace(newMetaData);
    if (!data) {
      return;
    }

    console.warn(data);

    // 递归克隆树节点
    await this.loadNodes(true);
    const root = this.nodes.find((n) => n.id == this.metadata.rootNodeId);
    if (!root) {
      return;
    }
    const tree = await this.loadSubTree(root);

    const newTree = new ReportTaskTree(data, destination);
    await newTree.cloneNodes(tree, this.nodes.length, () => {});

    // 设置根节点
    const [newRoot] = await newTree.nodeColl.loadSpace({
      options: {
        match: {
          treeId: newTree.id,
          _or_: [{ parentId: '' }, { parentId: null }, { parentId: { _exists_: false } }],
        },
      },
    });
    console.warn(newRoot);
    newTree.metadata.rootNodeId = newRoot?.id;
    await treeColl.replace(newTree.metadata);

    return newTree.metadata;
  }

  async createTaskTreeDirect(
    dist: XDistribution,
    destination?: IDirectory,
  ): Promise<boolean> {
    destination ||= this.directory;
    const newMetaData: XReportTaskTree = {
      ...(this.metadata as any),
      taskId: dist.taskId,
      period: dist.period,
      distId: dist.id,
      code: this.metadata.code + dist.period.replace('-', ''),
      name: this.metadata.name + ' ' + dist.period,
    };

    const treeColl = destination.resource.genTargetColl<XReportTaskTree>(
      ReportTaskTree.getCollName('报表树'),
    );

    const data = await treeColl.replace(newMetaData);
    if (!data) {
      return false;
    }

    console.warn(data);

    // 递归克隆树节点
    await this.loadNodes(true);

    const newTree = new ReportTaskTree(data, destination);
    await newTree.nodeColl.insertMany(this.nodes);

    return true;
  }
}
