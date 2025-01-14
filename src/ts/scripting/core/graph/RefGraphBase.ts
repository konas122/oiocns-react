import { GraphNode } from './node';
import { NodeRef } from './ref/refs';
import AttributeRefNode from './node/AttributeRefNode';
import FormServiceBase from '../services/FormServiceBase';
import CalcRuleNode from './node/CalcRuleNode';
import { RefGraph } from '.';
import FormRefNode from './node/FormRefNode';
import _ from 'lodash';
import { GLOBAL_FORM_ID } from './consts';
import ReportCellRefNode from './node/ReportCellRefNode';

export type GraphType = 'calc' | 'validate';
export default abstract class RefGraphBase<T extends GraphType> implements Iterable<GraphNode> {
  readonly service: FormServiceBase;
  readonly type: T;

  constructor(service: FormServiceBase, type: T) {
    this.service = service;
    this.type = type;
  }

  nodeList: {
    [formId: string]: {
      [name: string]: GraphNode;
    };
  } = {};

  abstract init(): void;

  getNodeByRef(ref: NodeRef): GraphNode {
    if (ref.type == 'report-cell') {
      return this.find(ref.cell, ref.sheet)!;
    }
    return this.find(ref.name, ref.formId)!;
  }

  protected createNodeByRef(ref: NodeRef): GraphNode | undefined {
    let child: GraphNode | undefined;
    switch (ref.type) {
      case 'attribute':
        child = new AttributeRefNode(ref, this as any as RefGraph, this.service);
        if (!this.nodeList[ref.formId]) {
          throw new ReferenceError(
            `变量 ${child.name} 所引用的表单 ${ref.formId} 不在当前办事中！`,
          );
        }
        this.nodeList[child.ref.formId][child.name] = child;
        break;
      case 'report-cell': {
        child = new ReportCellRefNode(ref, this as any as RefGraph, this.service);
        // 单元格可能被多次引用
        if (!this.nodeList[ref.sheet][child.name]) {
          this.nodeList[ref.sheet][child.name] = child;     
        } else {
          child = this.nodeList[ref.sheet][child.name];
        }
        break;  
      } 
      case 'calc-rule':
        child = new CalcRuleNode(ref.rule, ref.formId);
        this.nodeList[ref.formId][child.name] = child;
        break;
      case 'form':
        child = new FormRefNode(ref.formId, this as any as RefGraph, this.service);
        this.nodeList[ref.formId][child.name] = child;
        break;
      default:
        break;
    }
    return child;
  }

  protected buildNodeChildren(node: GraphNode) {
    for (const ref of node.refs) {
      const child = this.createNodeByRef(ref);
      if (!child) {
        continue;
      }

      if (child.type === 'form' ) {
        this.buildNodeChildren(child);
      } else if (child.type === 'report-cell') {
        // HACK: 按理来说不需要递归解析，但因为不明原因会随机丢失单元格，先临时处理一下
        // 如果存在循环引用会导致页面卡死
        this.buildNodeChildren(child);
      }
    }
  }

  protected clearAndGetAllNodes() {
    const fullList: GraphNode[] = [];
    const nodeList = _.orderBy(Object.entries(this.nodeList), ([formId, _]) => {
      // 将全局规则的优先级提到最前面
      if (formId == GLOBAL_FORM_ID) {
        return -99999;
      }
      return 0;
    });
    for (const [_, nodes] of nodeList) {
      for (const node of Object.values(nodes)) {
        node.isVisited = false;
        fullList.push(node);
      }
    }
    return fullList;
  }

  [Symbol.iterator]() {
    return this.traverse(this.clearAndGetAllNodes());
  }

  /**
   * 遍历指定节点及其依赖节点（子图）
   * @param node 节点
   */
  dependencyGraph(node: GraphNode) {
    this.clearAndGetAllNodes();
    return this.traverse([node]);
  }

  /**
   * 获取定节点的被依赖节点（仅一层直接依赖）
   * @param node 节点
   */
  *dependentNodes(node: GraphNode | NodeRef) {
    const allNodes = this.clearAndGetAllNodes();
    for (const parent of allNodes) {
      for (const ref of parent.refs) {
        const refNode = this.getNodeByRef(ref);
        if (refNode.formId == node.formId && refNode.name == node.name) {
          yield parent;
        }
      }
    }
  }

  buildRecursiveInfo(nodes: GraphNode[]) {
    if (nodes.length == 0) {
      return '';
    } else if (nodes.length == 1) {
      return nodes[0].label;
    }
    return nodes.map((n, i) => (i == 0 ? '  ' : '') + n.label).join('\n→ ');
  }

  private *traverse(list: GraphNode[], stack: GraphNode[] = []): Generator<GraphNode> {
    while (list.length > 0) {
      const node = list.shift()!;
      if (node.isVisited) {
        continue;
      }

      // 校验子节点合法性
      const childrenList: GraphNode[] = [];
      for (const childRef of node.refs) {
        const child = this.getNodeByRef(childRef);
        if (!child) {
          throw new Error(`找不到引用 ${childRef.formId} - ${childRef.name}`);
        }
        if (!child.isVisited) {
          if (stack.some((n) => n.name === child.name)) {
            throw new EvalError(
              '检测到循环引用，请检查表达式或者规则配置有无错误！\n' +
                this.buildRecursiveInfo([...stack, node, child]),
            );
          } else {
            childrenList.push(child);
          }
        }
      }
      // 将当前节点放进栈中并依次遍历子节点
      stack.push(node);
      for (const child of this.traverse(childrenList, stack)) {
        yield child;
        // console.debug(child.formId, child.name, child.type, child.value)
        child.isVisited = true;
      }

      // 遍历当前节点
      yield node;
      // console.debug(node.formId, node.name, node.type, node.value)
      node.isVisited = true;
      // 清除调用栈
      stack.pop();
    }
  }

  find(name: string, formId: string): GraphNode | undefined {
    return this.nodeList[formId]?.[name];
  }
}
