import { LoadOptions } from '@/ts/base/model';
import _ from 'lodash';
import { XForm, XReportTaskTreeNode } from '@/ts/base/schema';
import { IReport, ITarget, XCollection } from '@/ts/core';
import { nextTick } from '@/ts/base/common/timer';
import { WithChildren, getAllNodes } from '@/ts/base/common/tree';
import { NodeType } from '@/ts/base/enum';
import { IReception, Reception } from '@/ts/core/work/assign/reception/index';
import { ITreeHolder, TreeHolder } from '@/ts/core/work/assign/taskTree/TreeHolder';
import { model, schema } from '@/utils/excel';
import { IReceptionProvider } from '@/ts/core/work/assign/IReceptionProvider';
import { getStatus } from '@/ts/core/work/assign/reception/status';

export interface IReportReception
  extends IReception<model.ReportStatus>,
    IReceptionProvider {
  /** 树形持有 */
  holder: ITreeHolder;
  /** 全部汇总 */
  summaryAll(recursive?: boolean): Promise<Dictionary<Partial<schema.XEntity>>>;
  summaryAllV2(recursive?: boolean): Promise<Dictionary<Partial<schema.XEntity>>>;
  /** 直属下级汇总 */
  summaryDirectChildren(): Promise<Dictionary<Partial<schema.XEntity>>>;
  /** 返回一个查群公共集合的`IReceptionProvider` */
  getPublicProvider(): IReceptionProvider;
  /** 属性值穿透 */
  propertySummaryTree(
    attr: schema.XAttribute | model.FieldModel,
    form: XForm,
  ): Promise<model.ReportSummaryTreeNodeView>;
}

export function getSummaryNodes(
  nodes: model.ReportTaskTreeNodeView[],
): model.ReportTaskTreeNodeView[] {
  const ret: model.ReportTaskTreeNodeView[] = [];
  for (const node of nodes) {
    if (node.children.length > 0) {
      if (Object.keys(node.reception?.thingId ?? {}).length > 0) {
        ret.push(node);
      } else {
        ret.push(...getSummaryNodes(node.children));
      }
    } else {
      ret.push(node);
    }
  }
  return ret;
}

export function getLeafNodes(
  nodes: WithChildren<XReportTaskTreeNode>[],
): WithChildren<XReportTaskTreeNode>[] {
  const ret: WithChildren<XReportTaskTreeNode>[] = [];
  for (const node of nodes) {
    if (node.children.length > 0) {
      ret.push(...getLeafNodes(node.children));
    } else {
      ret.push(node);
    }
  }
  return ret;
}

export class ReportReception
  extends Reception<model.ReportStatus>
  implements IReportReception
{
  constructor(metadata: schema.XReception, target: ITarget, holder?: ITreeHolder) {
    super(metadata, target);
    this.holder =
      holder ?? new TreeHolder(this.treeId, metadata, this.group?.directory ?? target);
  }
  holder: ITreeHolder;

  get treeId() {
    return this.data.treeNode.treeId;
  }
  get directoryId() {
    return this.data.directoryId;
  }

  private async findReportReceptionsByColl(
    nodeIds: string[],
    coll: XCollection<schema.XReception>,
  ) {
    if (this.metadata.content.type != model.TaskContentType.Report) {
      return {};
    }

    const ret: Dictionary<schema.XReception | null> = {};

    let res: schema.XReception[] = [];
    const chunks = _.chunk(nodeIds, 5000);
    for (const chunk of chunks) {
      res = res.concat(
        await coll.loadSpace({
          options: {
            match: {
              'content.treeNode.id': {
                _in_: chunk,
              },
              period: this.metadata.period,
              taskId: this.metadata.taskId,
            },
          },
        }),
      );
      await nextTick();
    }
    let ids = [...nodeIds];
    for (const reception of res) {
      const nodeId = (reception.content as model.ReportStatus).treeNode.id;
      ids.splice(ids.indexOf(nodeId), 1);
      ret[nodeId] = reception;
    }
    for (const nodeId of ids) {
      ret[nodeId] = null;
    }
    return ret;
  }

  /** 群公共集合 */
  async findReportReceptions(
    nodeIds: string[],
  ): Promise<Dictionary<schema.XReception | null>> {
    return this.findReportReceptionsByColl(nodeIds, this.publicReceptionColl!);
  }

  /** 群公共集合 */
  getPublicProvider(): IReceptionProvider {
    return {
      findReportReceptions: (nodeIds) => {
        return this.findReportReceptionsByColl(nodeIds, this.publicReceptionColl!);
      },
    };
  }
  async summaryDirectChildren(): Promise<Dictionary<Partial<schema.XEntity>>> {
    if (this.data.treeNode.nodeType != NodeType.Summary) {
      throw new Error('当前节点不可汇总');
    }
    const result: Dictionary<Partial<schema.XEntity>> = {};
    await this.holder.loadTree();
    if (this.work && this.holder.tree) {
      // 获取直属子树
      const [subTrees] = await this.holder.tree.loadDistributionTree(
        this.data.treeNode,
        this.getPublicProvider(),
        true,
      );
      if (subTrees.length == 0) {
        return result;
      }
      const children = subTrees[0].children;
      const forms = [...this.work.primaryForms, ...this.work.detailForms];
      for (const form of forms) {
        const ids = children.flatMap((item) => {
          const status = getStatus(item.reception);
          let id = item.reception?.thingId?.[form.id] || [];
          // 跳过未完结的任务
          if (status != 'finished' && status != 'changed') {
            id = [];
          }
          return id;
        });
        if (ids.length <= 0) {
          return result;
        }
        let summary: { [p: string]: number | object } | undefined = {};
        const item: any = {};
        if (form.metadata.typeName == '表格') {
          const reportForm = form as IReport;
          summary = await reportForm.loadSheetSummary({ ids });
          for (const field of reportForm.objectFields) {
            if (summary) {
              item[field.id] = summary[field.code];
            }
          }
        } else {
          summary = await form.loadSummary({ ids });
          for (const field of form.summaryFields) {
            if (summary) {
              item[field.id] = summary[field.code];
            }
          }
        }
        if (!summary) {
          throw new Error(`汇总 ${form.name} 失败`);
        }
        result[form.id] = item;
      }
    }
    return result;
  }

  async summaryAll(
    recursive = false,
    forceFullSummary = false,
  ): Promise<Dictionary<Partial<schema.XEntity>>> {
    if (this.data.treeNode.nodeType != NodeType.Summary) {
      throw new Error('当前节点不可汇总');
    }
    const result: Dictionary<Partial<schema.XEntity>> = {};
    await this.holder.loadTree();
    if (this.work && this.holder.tree) {
      const [subTrees] = await this.holder.tree.loadDistributionTree(
        this.data.treeNode,
        this.getPublicProvider(),
        !recursive,
      );
      if (subTrees.length == 0) {
        return result;
      }
      const children = recursive
        ? forceFullSummary
          ? getAllNodes(subTrees[0].children)
          : getSummaryNodes(subTrees[0].children)
        : subTrees[0].children;
      const forms = [...this.work.primaryForms, ...this.work.detailForms];
      for (const form of forms) {
        const ids = children.flatMap((item) => {
          let id = item.reception?.thingId?.[form.id] || [];
          // 逐级汇总时跳过汇总节点
          if (recursive && item.nodeType == NodeType.Summary) {
            id = [];
          }
          return id;
        }, 1);

        // HACK: 当ids为空时，mongodb会错误地查全表
        if (ids.length == 0) {
          result[form.id] = {};
          continue;
        }

        const summary = await form.loadSummary({ ids });
        if (!summary) {
          throw new Error(`汇总 ${form.name} 失败`);
        }

        const item: any = {};
        for (const field of form.summaryFields) {
          item[field.id] = summary[field.code];
        }
        result[form.id] = item;
      }
    }
    return result;
  }

  async summaryAllV2(recursive = false): Promise<Dictionary<Partial<schema.XEntity>>> {
    if (this.data.treeNode.nodeType != NodeType.Summary) {
      throw new Error('当前节点不可汇总');
    }
    const result: Dictionary<Partial<schema.XEntity>> = {};
    await this.holder.loadTree();
    if (this.work && this.holder.tree) {
      const subTrees = await this.holder.tree.loadSubTree(this.data.treeNode as any);
      if (subTrees.length == 0) {
        return result;
      }
      const children = recursive
        ? getLeafNodes(subTrees[0].children)
        : subTrees[0].children;
      const forms = [...this.work.primaryForms, ...this.work.detailForms];
      for (const form of forms) {
        const ids = children.map((i) => i.id);

        const loadOptions: LoadOptions<schema.XThing> = {
          options: {
            match: {
              taskId: this.metadata.taskId,
              period: this.period,
              distId: this.metadata.distId,
              nodeId: {
                _in_: ids,
              },
              isDeleted: false,
            },
          },
          userData: ['F' + form.id],
        };

        const summary = await form.loadSummary(loadOptions);
        if (!summary) {
          throw new Error(`汇总 ${form.name} 失败`);
        }

        const item: any = {};
        for (const field of form.summaryFields) {
          item[field.id] = summary[field.code];
        }
        result[form.id] = item;
      }
    }
    return result;
  }

  async propertySummaryTree(
    attr: schema.XAttribute | model.FieldModel,
    form: XForm,
  ): Promise<model.ReportSummaryTreeNodeView> {
    if (this.data.treeNode.nodeType != NodeType.Summary) {
      throw new Error('当前节点不可汇总');
    }

    await this.holder.loadTree();
    if (this.work && this.holder.tree) {
      const [root] = await this.holder.tree.nodeColl.find([this.data.treeNode.id]);
      let result: model.ReportSummaryTreeNodeView = {
        ...root,
        children: [],
        value: 0,
      };

      const children = (await this.holder.tree.loadChildren(
        root.id,
      )) as XReportTaskTreeNode[];
      if (children.length == 0) {
        return result;
      }

      const loadOptions: LoadOptions<schema.XThing> = {
        options: {
          match: {
            taskId: this.metadata.taskId,
            period: this.period,
            distId: this.metadata.distId,
            nodeId: {
              _in_: children.map((i) => i.id),
            },
            isDeleted: false,
          },
        },
        userData: ['F' + form.id],
      };

      const thingColl = form.collName
        ? this.work.directory.resource.genColl<schema.XThing>(form.collName)
        : this.work.directory.resource.thingColl;
      const list = await thingColl.loadSpace(loadOptions);

      const detailMap = list.reduce<Dictionary<schema.XThing>>((map, row) => {
        map[row.nodeId] = row;
        return map;
      }, {});

      for (const child of children) {
        const childWithValue: model.ReportSummaryTreeNodeView = {
          ...child,
          children: [],
          value: null,
        };
        const data = detailMap[child.id] || {};
        childWithValue.value = data['T' + attr.propId];
        result.children.push(childWithValue);
      }
      result.value = _.sumBy(result.children, (c) => c.value || 0);

      return result;
    } else {
      throw new Error('找不到树形');
    }
  }
}
