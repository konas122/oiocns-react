import _ from 'lodash';
import * as i from '../../impl';
import * as t from '../../type';
import { WithChildren, buildTree } from '@/ts/base/common/tree';
import { XReportTree } from '@/ts/base/schema';
import { ReportTreeTypes } from '@/ts/base/enum';
import {
  balanceNodeTypes,
  summaryNodeTypes,
} from '@/ts/core/thing/standard/reporttree/consts';

export class ReportTreeNodeSheet extends i.Sheet<t.ReportTreeNode> {
  constructor(directory: t.IDirectory) {
    super(
      t.generateUuid(),
      '报表树形节点',
      [
        {
          title: '节点编码',
          dataIndex: 'code',
          valueType: '描述型',
          options: {
            isRequired: true,
          },
        },
        {
          title: '上级节点编码',
          dataIndex: 'parentCode',
          valueType: '描述型',
        },
        {
          title: '节点名称',
          dataIndex: 'name',
          valueType: '描述型',
          options: {
            isRequired: true,
          },
        },
        {
          title: '节点类型',
          dataIndex: 'nodeTypeName',
          valueType: '描述型',
          options: {
            isRequired: true,
          },
        },
        {
          title: '归属组织信用代码',
          dataIndex: 'targetId',
          valueType: '用户型',
          widget: '单位搜索框',
          options: {
            isRequired: true,
          },
        },
      ],
      directory,
    );
  }
  get coll(): t.XCollection<t.schema.XReportTreeNode> {
    return this.dir.resource.reportTreeNodeColl;
  }

  tree: WithChildren<t.ReportTreeNode>[] = [];
}

export class ReportTreeNodeHandler extends i.SheetHandler<ReportTreeNodeSheet> {
  checkData(): t.Error[] {
    throw new Error('Method not supported.');
  }
  async operating(): Promise<void> {
    throw new Error('Method not supported.');
  }

  override onError(error: t.Error, data?: any): t.Error {
    if (data) {
      error.message += ` \n节点名称：${data.节点名称}`;
    }
    return error;
  }
  /**
   * 数据
   * @param excel 上下文
   * @returns
   */
  checkTreeData(tree: XReportTree) {
    const allErrors: t.Error[] = [];
    const distinct = _.unionBy(this.sheet.data, (n) => n.code);
    if (distinct.length < this.sheet.data.length) {
      allErrors.push(...this.assert([-1], [{ res: true, error: '存在节点编码重复' }]));
    }

    if (this.sheet.data.length == 0) {
      allErrors.push(...this.assert([-1], [{ res: true, error: '未读取到任何数据，请检查导入模板配置' }]));
      return allErrors;
    }

    const roots: t.ReportTreeNode[] = [];
    this.sheet.data.forEach((d, i) => {
      d.index = i;

      if (!d.parentCode || d.parentCode == '0') {
        roots.push(d);
      }

      // 检查树形和节点类型匹配
      if (tree.treeType !== ReportTreeTypes.Financial) {
        if (balanceNodeTypes.includes(d.nodeTypeName as any)) {
          allErrors.push(
            ...this.assert(i, [
              { res: true, error: '非财务合并树不能包含' + d.nodeTypeName },
            ]),
          );
          return;
        }
        if (tree.treeType === ReportTreeTypes.Normal) {
          if (summaryNodeTypes.includes(d.nodeTypeName as any)) {
            allErrors.push(
              ...this.assert(i, [
                { res: true, error: '普通树不能包含' + d.nodeTypeName },
              ]),
            );
            return;
          }
        }
      }
    });

    // 检查根节点
    if (roots.length == 0) {
      allErrors.push(...this.assert([-1], [{ res: true, error: '缺失根节点' }]));
    } else if (roots.length > 1) {
      allErrors.push(
        ...this.assert(
          roots.map((d) => d.index),
          [{ res: true, error: `存在 ${roots.length} 个根节点` }],
        ),
      );
    } else {
      // 检查树形组装
      const root = roots[0];
      root.parentCode = '';
      this.sheet.tree = buildTree(
        this.sheet.data,
        (n) => n.parentCode,
        (n) => n.code,
      );

      for (const node of this.sheet.tree) {
        if (node.id != root.id) {
          allErrors.push(
            ...this.assert(node.index, [
              { res: true, error: '未找到父节点：' + node.parentId! },
            ]),
          );
        }
      }
    }
    return allErrors;
  }
}
