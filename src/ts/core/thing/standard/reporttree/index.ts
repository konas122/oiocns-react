import _ from 'lodash';
import { ITarget, XCollection } from '../../..';
import { model } from '../../../../base';
import { WithChildren } from '../../../../base/common';
import { ReportTreeTypes } from '../../../../base/enum';
import { IDirectory } from '../../directory';
import { IStandardFileInfo, StandardFileInfo } from '../../fileinfo';
import { ReportTreeGenerator } from './ReportTreeGenerator';
import { getTreeNodeType, treeTypeNames } from './consts';
import { formatDate } from '@/utils';
import { XReportTree, XReportTreeNode } from '@/ts/base/schema';
import { ReportTree } from './ReportTree';

export interface IReportTree extends IStandardFileInfo<XReportTree> {
  /** 报表树节点 */
  nodes: XReportTreeNode[];
  /** 报表树类型 */
  treeType: ReportTreeTypes;
  readonly nodeColl: XCollection<XReportTreeNode>;
  /** 加载节点 */
  loadNodes(reload?: boolean): Promise<XReportTreeNode[]>;
  /** 加载特定节点 */
  loadNodeById(nodeIds: string[]): Promise<XReportTreeNode[]>;
  /** 根据归属加载节点 */
  loadNodeByBelongId(belongId: string): Promise<XReportTreeNode[]>;
  /** 新增节点 */
  createNode(data: XReportTreeNode): Promise<XReportTreeNode | undefined>;
  /** 删除节点 */
  deleteNode(node: XReportTreeNode): Promise<boolean>;
  /** 硬删除节点 */
  hardDeleteNode(node: XReportTreeNode, recursive?: boolean): Promise<boolean>;
  /** 清空所有节点 */
  clearAllNodes(): Promise<boolean>;
  /** 更新节点 */
  updateNode(prev: XReportTreeNode, next: XReportTreeNode): Promise<boolean>;
  /** 根据组织分类生成节点 */
  generateNodes(
    target: ITarget,
    progress?: (value: number | Error) => void,
  ): Promise<void>;
  /** 导入生成节点 */
  importNodes(
    data: WithChildren<model.ReportTreeNode>[],
    total: number,
    progress?: (value: number | Error) => void,
  ): Promise<void>;
  /** 克隆（可能是其它树的）节点 */
  cloneNodes(
    data: WithChildren<XReportTreeNode>[],
    total: number,
    progress?: (value: number | Error) => void,
  ): Promise<void>;
  /** 加载子树 */
  loadSubTree(rootNode: XReportTreeNode): Promise<model.ReportTreeNodeView[]>;
  /** 加载下一级节点 */
  loadChildren(parentId: string): Promise<XReportTreeNode[]>;
  /** 判断有没有下级 */
  hasChildren(node: XReportTreeNode): Promise<boolean>;
  /** 按需加载节点路径 */
  loadChildrenSelect(parentId: string): Promise<XReportTreeNode[]>;
  /** 遍历所有节点并更新路径 */
  updateAllNodePaths(): Promise<void>;
}

export abstract class ReportTreeBase<T extends XReportTree, N extends XReportTreeNode>
  extends StandardFileInfo<T>
  implements IReportTree
{
  constructor(_metadata: T, _directory: IDirectory, coll: XCollection<T>) {
    super(
      {
        ..._metadata,
        typeName: '报表树',
      },
      _directory,
      coll,
    );
  }

  canDesign = true;
  nodes: N[] = [];
  protected _itemLoaded: boolean = false;
  get cacheFlag(): string {
    return 'reporttrees';
  }
  get treeType() {
    return this.metadata.treeType;
  }

  abstract get nodeColl(): XCollection<N>;

  get groupTags(): string[] {
    const tags = [...super.groupTags];
    const treeTypeName = treeTypeNames[this.metadata.treeType];
    if (treeTypeName) {
      tags.push(treeTypeName);
    } else {
      tags.push(`未知类型 ${this.metadata.treeType || ''} 树`);
    }
    return tags;
  }
  async loadContent(reload: boolean = false): Promise<boolean> {
    await this.loadNodes(reload);
    return true;
  }

  async loadNodeById(nodeIds: string[]): Promise<N[]> {
    try {
      const data = await this.nodeColl.find(nodeIds);
      this.nodes = Array.isArray(data) ? data : [];
      return this.nodes;
    } catch (error) {
      this.nodes = [];
      return this.nodes;
    }
  }

  async loadNodeByBelongId(belongId: string): Promise<N[]> {
    try {
      const data = await this.nodeColl.loadSpace({
        options: {
          match: {
            treeId: this.id,
            belongId: belongId,
          },
          sort: {
            code: 1,
          },
        },
      });
      this.nodes = Array.isArray(data) ? data : [];
      return this.nodes;
    } catch (error) {
      this.nodes = [];
      return this.nodes;
    }
  }

  async loadNodes(reload: boolean = false): Promise<N[]> {
    if (!this._itemLoaded || reload) {
      const res: N[] = [];
      while (true) {
        const data = await this.nodeColl.loadSpace({
          options: {
            match: {
              treeId: this.id,
            },
            sort: {
              code: 1,
            },
          },
          skip: res.length,
          take: 5000,
        } as model.LoadOptions<XReportTreeNode>);
        if (data.length == 0) {
          break;
        }
        res.push(...data);
      }
      this._itemLoaded = true;
      this.nodes = res || [];
    }
    return this.nodes;
  }
  async createNode(data: N): Promise<N | undefined> {
    data = _.omit(data, ['parent', 'children']) as any;
    const res = await this.nodeColl.insert({
      ...data,
      treeId: this.id,
      typeName: '报表树节点',
      nodeType: getTreeNodeType(data.nodeTypeName),
    });
    if (res) {
      await this.recorder.creating({
        coll: this.nodeColl,
        next: res,
      });
      this.nodes.push(res);
    }
    return res;
  }
  async deleteNode(node: N): Promise<boolean> {
    const success = await this.nodeColl.delete(node);
    if (success) {
      await this.recorder.updating({
        coll: this.nodeColl,
        prev: node,
        next: { ...node, isDeleted: true } as any,
      });
      this.nodes = this.nodes.filter((i) => i.id != node.id);
    }
    return success;
  }
  async hardDeleteNode(node: N, recursive = false): Promise<boolean> {
    const recursiveDelete = async (nodes: WithChildren<N>[]) => {
      let count = nodes.length;
      await this.nodeColl.removeMany(nodes);
      for (const node of nodes) {
        await recursiveDelete(node.children);
        count += node.children.length;
      }
      return count;
    };

    if (recursive) {
      const tree = await this.loadSubTree(node);
      const count = await recursiveDelete(tree);
      await this.loadNodes(true);
      return count > 0;
    } else {
      const success = await this.nodeColl.remove(node);
      if (success) {
        await this.recorder.deleting({
          coll: this.nodeColl,
          next: node,
          notify: true,
        });
        this.nodes = this.nodes.filter((i) => i.id != node.id);
      }
      return success;
    }
  }

  async clearAllNodes() {
    const nodes = await this.loadNodes(true);
    const success = await this.directory.resource.reportTreeNodeColl.removeMatch({
      treeId: this.id,
    });
    if (success) {
      await this.recorder.batchDeleting({
        coll: this.nodeColl,
        next: nodes,
        notify: true,
      });
      this.nodes = [];
    }
    return success;
  }
  async updateNode(prev: N, next: N): Promise<boolean> {
    next = _.omit(next, ['parent', 'children']) as any;
    next.nodeType = getTreeNodeType(next.nodeTypeName);
    const res = await this.nodeColl.replace({
      ...next,
      treeId: this.id,
    });
    if (res) {
      await this.recorder.updating({ coll: this.nodeColl, prev: prev, next: res });
      const index = this.nodes.findIndex((i) => i.id === next.id);
      if (index > -1) {
        this.nodes[index] = res;
      }
      return true;
    }
    return false;
  }

  override async copy(destination: IDirectory): Promise<boolean> {
    if (this.isSameBelong(destination)) {
      const newMetaData = {
        ...this.metadata,
        directoryId: destination.id,
        sourceId: this.metadata.sourceId || this.id,
      };

      const uuid = formatDate(new Date(), 'yyyyMM');
      newMetaData.name = this.metadata.name + `-${uuid}`;
      newMetaData.code = this.metadata.code + uuid;
      return await this.duplicate(newMetaData, destination);
    }
    await super.copyTo(
      destination.id,
      destination.resource.reportTreeColl as XCollection<T>,
    );
    const items = await this.nodeColl.loadSpace({
      options: {
        match: {
          treeId: this.id,
        },
      },
    } as model.LoadOptions<XReportTreeNode>);
    await destination.resource.reportTreeNodeColl.replaceMany(items);
    return true;
  }

  async duplicate(newMetaData: T, destination: IDirectory): Promise<boolean> {
    newMetaData.id = 'snowId()';

    const data = await destination.resource.reportTreeColl.replace(newMetaData);
    if (!data) {
      return false;
    }

    // 递归克隆树节点
    await this.loadNodes(true);
    const root = this.nodes.find((n) => n.id == this.metadata.rootNodeId);
    if (!root) {
      return false;
    }
    const tree = await this.loadSubTree(root);

    const newTree = new ReportTree(data, destination);
    await newTree.cloneNodes(tree, this.nodes.length, () => {});

    // 设置根节点
    const [newRoot] = await destination.resource.reportTreeNodeColl.loadSpace({
      options: {
        match: {
          treeId: newTree.id,
          _or_: [{ parentId: '' }, { parentId: null }, { parentId: { _exists_: false } }],
        },
      },
    });
    newTree.metadata.rootNodeId = newRoot?.id;
    await destination.resource.reportTreeColl.replace(newTree.metadata);

    return await destination.resource.reportTreeColl.notity({
      data: newTree.metadata,
      operate: 'insert',
    });
  }


  override async move(destination: IDirectory): Promise<boolean> {
    if (this.allowMove(destination)) {
      return await super.moveTo(
        destination,
        destination.resource.reportTreeColl as XCollection<T>,
      );
    }
    return false;
  }

  async generateNodes(target: ITarget, progress?: (value: number | Error) => void) {
    const g = new ReportTreeGenerator(this);
    const rootNodeId = await g.generateByTarget(target, progress);
    if (rootNodeId) {
      const tree = { ...this.metadata };
      tree.rootNodeId = rootNodeId;
      await this.update(tree);
    }
  }

  async importNodes(
    data: WithChildren<model.ReportTreeNode>[],
    total: number,
    progress?: (value: number | Error) => void,
  ) {
    const g = new ReportTreeGenerator(this);
    const rootNodeId = await g.importNodes(data, total, progress);
    if (rootNodeId) {
      const tree = { ...this.metadata };
      tree.rootNodeId = rootNodeId;
      await this.update(tree);
    }
  }
  async cloneNodes(
    data: WithChildren<XReportTreeNode>[],
    total: number,
    progress?: (value: number | Error) => void,
  ) {
    const g = new ReportTreeGenerator(this);
    await g.cloneNodes(data, total, progress);
  }

  async loadSubTree(node: N): Promise<WithChildren<N>[]> {
    const nodes = await this.loadNodes();
    const nodeMap = nodes.reduce<Dictionary<WithChildren<N>>>((a, v) => {
      a[v.id] = { ...v, children: [] };
      return a;
    }, {});

    const root = nodeMap[node.id];
    if (!root) {
      console.warn(`找不到节点 ${node.id}(${node.name})`);
      return [];
    }

    const pool = Object.values(nodeMap);
    for (const node of pool) {
      const parent = nodeMap[node.parentId!];
      if (!parent) {
        continue;
      }
      parent.children.push(node);
    }
    return [root];
  }
  async hardDelete(notify?: boolean): Promise<boolean> {
    await this.clearAllNodes();
    return await super.hardDelete(notify);
  }

  async loadChildrenSelect(parentId: string): Promise<N[]> {
    // 动态加载父节点数据
    const getParentNode = async (nodeId: string): Promise<N | undefined> => {
      let parentNode = this.nodes.find((n) => n.id === nodeId);

      // 如果父节点不存在，动态加载它
      if (!parentNode) {
        const loadedParents = await this.nodeColl.loadSpace({
          options: { match: { id: nodeId } },
        } as model.LoadOptions<XReportTreeNode>);

        if (loadedParents.length > 0) {
          parentNode = loadedParents[0];
          this.nodes.push(parentNode); // 将父节点添加到缓存
        }
      }

      return parentNode;
    };

    // 递归获取父节点路径
    const getFullPath = async (nodeId: string): Promise<string> => {
      const parentNode = await getParentNode(nodeId);
      if (!parentNode) return ''; // 父节点未找到，返回空路径
      // 如果父节点有路径，直接返回
      if (parentNode.nodePath) return parentNode.nodePath;
      // 向上递归获取父节点路径
      const parentPath = await getFullPath(parentNode.parentId || '');
      parentNode.nodePath = parentPath ? `${parentPath}/${parentNode.id}` : parentNode.id;
      return parentNode.nodePath;
    };
    // 获取当前父节点路径
    const fullPath = await getFullPath(parentId);
    // 从后端加载子节点
    const children = await this.nodeColl.loadSpace({
      options: { match: { parentId } },
    } as model.LoadOptions<XReportTreeNode>);
    // 更新子节点的路径
    const updatedChildren = children.map((child) => ({
      ...child,
      nodePath: `${fullPath}/${child.id}`,
    }));
    //将 nodePath 更新到数据库中**
    await Promise.all(
      updatedChildren.map(async (child) => {
        await this.nodeColl.replace({ ...child }); // 更新到数据库
      }),
    );
    // 更新本地 nodes 缓存
    this.nodes = this.nodes.map((node) =>
      node.id === parentId ? { ...node, children: updatedChildren } : node,
    );
    return updatedChildren;
  }
  async loadChildren(parentId: string): Promise<N[]> {
    return await this.nodeColl.loadSpace({
      options: {
        match: { parentId },
      },
    } as model.LoadOptions<XReportTreeNode>);
  }
  async updateAllNodePaths(): Promise<void> {
    // 加载所有节点
    await this.loadNodes(true);
    // 构建节点映射，便于快速查找每个节点
    const nodeMap = this.nodes.reduce<Dictionary<N>>((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {});

    const rootNodes: N[] = [];
    const updatedNodes: N[] = [];

    // 找到所有根节点
    for (const node of this.nodes) {
      if (!node.parentId || !nodeMap[node.parentId]) {
        node.nodePath = node.id; // 根节点路径为自身ID
        rootNodes.push(node);
      }
    }

    // 批量处理路径更新
    const processBatch = async (batchNodes: N[]) => {
      // 每次更新批量节点的路径
      if (batchNodes.length > 0) {
        await this.nodeColl.replaceMany(batchNodes);
      }
    };

    // 深度优先遍历
    const stack: N[] = [...rootNodes];
    while (stack.length > 0) {
      const currentNode = stack.pop()!;
      updatedNodes.push(currentNode); // 添加到更新列表

      // 查找子节点并更新路径
      const children = this.nodes.filter((n) => n.parentId === currentNode.id);
      for (const child of children) {
        child.nodePath = `${currentNode.nodePath}/${child.id}`; // 更新路径
        stack.push(child); // 将子节点推入栈
      }

      // 更新的节点800，写入数据库
      if (updatedNodes.length >= 800) {
        await processBatch(updatedNodes); // 批量写入
        updatedNodes.length = 0; // 清空更新列表
      }
    }
    await processBatch(updatedNodes);
    console.log('所有节点路径已成功更新');
  }

  async hasChildren(node: N): Promise<boolean> {
    const count = await this.nodeColl.count({
      options: {
        match: { parentId: node.id },
      },
    } as model.LoadOptions<XReportTreeNode>);
    return count > 0;
  }
}
