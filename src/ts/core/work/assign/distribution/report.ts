import { ITreeHolder, TreeHolder } from '@/ts/core/work/assign/taskTree/TreeHolder';
import { Workbook } from 'exceljs';
import _ from 'lodash';
import { ISession } from '@/ts/core';
import { NodeType, ReceptionType } from '@/ts/base/enum';
import { PageAll } from '@/ts/core/public';
import { Person } from '@/ts/core/target/person';
import pLimit from 'p-limit';
import { Distribution, IDistribution } from '@/ts/core/work/assign/distribution/index';
import { IReceptionProvider } from '@/ts/core/work/assign/IReceptionProvider';
import { kernel, model, schema } from '@/ts/base';
import { IDistributionTask } from '@/ts/core/thing/standard/distributiontask';
import { getStatus, statusMap } from '@/ts/core/work/assign/reception/status';

export interface IReportDistribution
  extends IDistribution<model.ReportDistributionContent>,
    IReceptionProvider {
  /** 持有树 */
  holder: ITreeHolder;
  /** 接收任务 */
  receive(
    session: ISession,
    nodes: schema.XReportTreeNode[],
  ): Promise<schema.XReception[]>;
  /** 自动下发任务 */
  autoDistribution(session: ISession, nodes: schema.XReportTreeNode[]): void;
  /**
   * 获取根节点
   * @param belongId 当前单位id，不传查完整树
   */
  findReportRootNode(belongId?: string): Promise<schema.XReportTreeNode[]>;
  /** 导出上报状态 */
  exportReceptionStatus(): Promise<File>;
}

export class ReportDistribution
  extends Distribution<model.ReportDistributionContent>
  implements IReportDistribution
{
  constructor(task: IDistributionTask, metadata: schema.XDistribution) {
    super(task, metadata);
    this.holder = new TreeHolder(this.data.treeId, metadata, this.target.directory);
  }
  holder: ITreeHolder;
  get data() {
    return this.metadata.content as model.ReportDistributionContent;
  }

  async autoDistribution(session: ISession, nodes: schema.XReportTreeNode[]) {
    const work = await this.findWorkAuto(session);
    const limit = pLimit(20);
    const publicColl = this.target.resource.publicTaskReceptionColl;
    // 批量查询 belongId
    const belongIds = nodes.map((node) => node.belongId);
    const uniqueBelongIds = Array.from(new Set(belongIds)); // 去重
    // 批量查询所属单位信息
    const result = await kernel.queryTargetById({
      ids: uniqueBelongIds,
      page: PageAll,
    });
    const personMap: Map<string, Person> = new Map();
    if (result.success && Array.isArray(result.data?.result)) {
      result.data.result.forEach((item) => {
        const person = new Person(item);
        personMap.set(item.id, person);
      });
    }
    // 使用 map 来处理多个请求，并且控制并发数量
    const promises = nodes.map((node) =>
      limit(async () => {
        let autoUserId: string = '';
        try {
          if (this.metadata.content.autoDistributionAuthCode) {
            const person = personMap.get(node.belongId); // 从缓存中获取对应的 Person 实例
            if (person) {
              const superAuth = await person.loadSuperAuth();
              if (superAuth) {
                let find = superAuth?.children.find(
                  (auth) => auth.code === this.metadata.content.autoDistributionAuthCode,
                );
                if (find) {
                  const res = await kernel.queryAuthorityTargets({
                    id: find.id,
                    subId: node.belongId,
                  });
                  if (res.success && res.data.result) {
                    autoUserId = res.data.result[0].id;
                  }
                }
              }
            }
          }
          // 准备任务匹配信息
          const match = {
            taskId: this.task.id,
            period: this.period,
          } as schema.XReception;
          await publicColl.insert({
            ...match,
            sessionId: work.metadata.shareId,
            belongId: node.belongId,
            periodType: this.periodType,
            distId: this.id,
            typeName: ReceptionType.FillOut,
            name: `[${node.name}] - ${this.metadata.name}`,
            receiveUserId: autoUserId,
            content: {
              type: model.TaskContentType.Report,
              directoryId: work.application.directory.directoryId,
              workId: work.metadata.primaryId ?? work.metadata.id,
              treeNode: {
                name: node.name,
                id: node.id,
                treeId: node.treeId,
                nodeType: node.nodeType,
                targetId: node.targetId,
                belongId: node.belongId,
              },
            },
          });
        } catch (error) {
          console.error('Error during async operation for node', node.id, error);
        }
      }),
    );
    // 等待所有操作完成
    await Promise.all(promises);
  }

  async receive(session: ISession, nodes: schema.XReportTreeNode[]) {
    const receptions: schema.XReception[] = [];
    const work = await this.findWorkAuto(session);
    for (const node of nodes) {
      let match = {
        taskId: this.task.id,
        period: this.period,
      } as schema.XReception;
      const receptionColl = this.target.resource.publicTaskReceptionColl;
      let result = await receptionColl.loadSpace({
        options: {
          match: { ...match, 'content.treeNode.id': node.id, isDeleted: false },
        },
      });
      if (result.length > 1) {
        await receptionColl.deleteMany(result);
        result = [];
      }
      if (result.length > 0) {
        const userId = result[0].receiveUserId;
        if (userId != this.target.userId) {
          const user = this.target.user.user!.findShareById(userId)?.name || userId;
          console.warn(`节点 ${node.name} 的任务已被用户 ${user} 接收`);
          result[0].receiveUserId = this.target.userId;
          result[0].content.treeNode.nodeType = node.nodeType;
          result[0].content.treeNode.targetId = node.targetId;
          result[0].content.treeNode.belongId = node.belongId;
          result[0].instanceId = undefined;
          result[0].previousInstanceId = undefined;
          result[0].draftId = undefined;
          const newVar = await receptionColl.replace(result[0]);
          if (newVar) {
            receptions.push(newVar);
          }
        } else {
          receptions.push(...result)
          console.warn(`任务接收 ${this.task.name} ${this.period} 已存在`);
        }
      } else {
        await receptionColl.replace({
          ...match,
          sessionId: work.metadata.shareId,
          belongId: node.belongId,
          periodType: this.periodType,
          distId: this.id,
          typeName: ReceptionType.FillOut,
          name: `[${node.name}] - ${this.metadata.name}`,
          receiveUserId: this.target.userId,
          content: {
            type: model.TaskContentType.Report,
            directoryId: work.application.directory.directoryId,
            workId: work.metadata.primaryId ?? work.metadata.id,
            treeNode: {
              id: node.id,
              name: node.name,
              treeId: node.treeId,
              nodeType: node.nodeType,
              targetId: node.targetId,
              belongId: node.belongId,
            },
          },
        });
      }
    }
    return receptions as schema.XReception[];
  }

  async findReportRootNode(belongId?: string): Promise<schema.XReportTreeNode[]> {
    const allows = [model.TaskContentType.Report, model.TaskContentType.Closing];
    if (!allows.includes(this.metadata.content.type)) {
      return [];
    }
    const options: model.LoadOptions<schema.XReportTreeNode> = {
      options: {
        match: {
          treeId: this.treeId,
        },
      },
    };
    if (!belongId) {
      Object.assign(options.options!.match!, {
        _or_: [
          // 找出parentId不存在的视为根节点
          { parentId: '' },
          { parentId: null },
          { parentId: { _exists_: false } },
        ],
      });
    } else {
      Object.assign(options.options!.match!, {
        belongId,
      });
    }
    await this.holder.loadTree();
    if (!this.holder.tree) {
      return [];
    }
    const roots = await this.holder.tree.nodeColl.loadSpace(options);
    if (roots.length == 0) {
      console.warn(`${belongId} 不在当前树形中`);
      return [];
    }
    // 尝试找出最顶级的那个汇总节点（如果有汇总）
    let root = roots[0];
    let summaryNodes = roots.filter((n) => n.nodeType == NodeType.Summary);
    if (summaryNodes.length > 0) {
      let find = summaryNodes.find((node) => {
        return node.id === this.holder.tree?.metadata.rootNodeId;
      });
      if (find) {
        root = find;
      } else {
        root = summaryNodes[0];
      }
      const others = summaryNodes.slice(1);
      for (const other of others) {
        if (root.parentId == other.id) {
          root = other;
        }
      }
    }

    return [root];
  }

  async findReportReceptions(
    nodeIds: string[],
  ): Promise<Dictionary<schema.XReception | null>> {
    if (this.metadata.content.type !== model.TaskContentType.Report) {
      return {};
    }
    const ret: Dictionary<schema.XReception | null> = {};
    const coll = this.target.resource.publicTaskReceptionColl;
    // 将nodeIds分成批次进行查询
    const chunks = _.chunk(nodeIds, 5000);
    const receptionPromises = chunks.map((chunk) =>
      coll.loadSpace({
        options: {
          match: {
            'content.treeNode.id': {
              _in_: chunk,
            },
            period: this.metadata.period,
            taskId: this.metadata.taskId,
            status: 1,
          },
        },
      }),
    );
    // 等待所有请求完成
    const results = await Promise.all(receptionPromises);
    // 将所有查询结果合并
    const res = results.flat();
    // 创建一个 Map 来存储已找到的节点 ID，避免多次查找
    const foundNodeIds = new Set<string>();
    // 处理每个接收对象
    for (const reception of res) {
      const nodeId = (reception.content as model.ReportStatus).treeNode.id;
      ret[nodeId] = reception;
      foundNodeIds.add(nodeId);
    }
    // 对于未找到的节点，填充 null
    for (const nodeId of nodeIds) {
      if (!foundNodeIds.has(nodeId)) {
        ret[nodeId] = null;
      }
    }
    return ret;
  }

  async exportReceptionStatus(belongId?: string): Promise<File> {
    const roots = await this.findReportRootNode(belongId);
    if (roots.length === 0) {
      throw new Error('找不到树根节点！');
    }
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('上报状态');
    sheet.addRow(['节点名称', '节点类型', '上报状态']);
    // 批量加载树结构并进行遍历
    const t = await this.holder.loadTree();
    if (t) {
      const [tree] = await t.loadDistributionTree(roots[0], this);
      const stack: { node: model.ReportTaskTreeNodeView; level: number }[] = tree.map(
        (node) => ({ node, level: 0 }),
      );
      const rows: (string | number)[][] = [];
      while (stack.length > 0) {
        const { node, level } = stack.pop()!;
        const indent = level > 0 ? _.repeat('　', level) : '';
        let row = [indent + node.name, node.nodeTypeName, '未接收'];
        const status = getStatus(node.reception);
        row[2] = statusMap[status].label;
        rows.push(row);
        for (const child of node.children.reverse()) {
          stack.push({ node: child, level: level + 1 });
        }
      }
      sheet.addRows(rows);
    }
    // 生成并返回文件
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `${this.metadata.period} ${this.task.name}上报状态.xlsx`;
    return new File([buffer], fileName, { type: 'application/octet-stream' });
  }
}
