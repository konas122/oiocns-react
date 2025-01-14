import { NodeType } from '@/ts/base/enum';
import { CalcRefGraph } from '../graph';
import { GraphNode } from '../graph/node';
import AttributeRefNode from '../graph/node/AttributeRefNode';
import CodeRuleNode from '../graph/node/CodeRuleNode';
import FormServiceBase from '../services/FormServiceBase';
import { DetailChangeEvent, FormChangeEvent } from '../types/rule';
import { IService } from '../types/service';
import { kernel } from '@/ts/base';
import { TaskContentType } from '@/ts/base/model';
import { message } from 'antd';
import { $confirm } from '@/utils/react/antd';
import ReportCellRefNode from '../graph/node/ReportCellRefNode';

export default class ExecutableHandler implements IService {
  readonly service: FormServiceBase;

  readonly graph: CalcRefGraph;
  readonly isSummary: boolean;

  constructor(service: FormServiceBase, allowEdit = true) {
    this.service = service;
    this.graph = new CalcRefGraph(service, allowEdit);

    if (!this.service.reception) {
      this.isSummary = false;
    } else if (this.service.reception.content.type != TaskContentType.Report) {
      this.isSummary = false;
    } else {
      this.isSummary =
        this.service.reception.content.treeNode.nodeType == NodeType.Summary;
    }
  }

  dispose() {
    this.graph.nodeList = {};
  }

  init() {
    try {
      this.graph.init();
      return true;
    } catch (error) {
      console.error(error);
      debugger
      (this as any).graph = new CalcRefGraph(this.service);
      return error as Error;
    }
  }

  /**
   * 全部计算
   * @returns 变更对象
   */
  async calculateAll() {
    let changes: FormChangeEvent[] = [];
    for (const node of this.graph) {
      const [_, change] = await this.calculateNode(node);
      changes.push(...change);
    }
    return changes;
  }



  async calculateNode(node: GraphNode) {
    let value: any;
    let changes: FormChangeEvent[] = [];

    const calculateExpression = (
      expression: string, 
      targetNode: AttributeRefNode | ReportCellRefNode, 
      accuracy?: number
    ) => {
      const ctx = {
        ...this.service.createContext(node, this.graph),
        ...this.service.createFormContext(),
      };
      value = this.service.evalExpression(expression, ctx);
      if (accuracy) {
        const factor: number = Math.pow(10, accuracy);
        value = Math.round(value * factor) / factor;
      }
      targetNode.value = value;

      changes.push({
        formId: targetNode.ref.formId,
        destId: targetNode.type == 'attr' ? targetNode.ref.attrId : targetNode.ref.cell,
        sheet: targetNode.type == 'report-cell' ? targetNode.sheet.code : undefined,
        value,
      });
    }

    if (node.type == 'calc') {
      let targetNode: AttributeRefNode | ReportCellRefNode;
      let accuracy: number | undefined;
      let isSummary: boolean | undefined;
      if (node.target.type == 'attribute') {
        targetNode = new AttributeRefNode(node.target, this.graph, this.service);
        accuracy = targetNode.attribute.options?.accuracy;
        isSummary = targetNode.attribute.options?.isSummary;
      } else {
        targetNode = new ReportCellRefNode(node.target, this.graph, this.service);
        accuracy = targetNode.cell.accuracy;
        isSummary = targetNode.cell.rule?.isSummary;
      }

      if (this.isSummary && isSummary) {
        // 汇总时不计算可汇总单元格
        value = node.value;
      } else {
        calculateExpression(node.rule.formula, targetNode, accuracy);
      }
    } else if (node.type == 'code') {
      value = await this.calculateCodeNode(node, changes);
    } else if (node.type == 'report-cell') {
      if (node.needCalculate) {
        if (this.isSummary && node.cell.rule?.isSummary) {
          // 汇总时不计算可汇总单元格
          value = node.value;
        } else {
          value = calculateExpression(node.expression, node, node.cell.accuracy);
        }
      } else {
        value = node.value;
      }
    } else {
      value = node.value;
    }
    this.checkValue(value);
    return [value, changes] as [any, FormChangeEvent[]];
  }

  private async calculateCodeNode(node: CodeRuleNode, changes: FormChangeEvent[] = []) {
    const tracker = (e: FormChangeEvent) => changes.push(e);
    const tracker2 = (e: DetailChangeEvent) => changes.push(e);
    const dispose = this.service.formProxy.onScoped('onSetField', tracker);
    const dispose2 = this.service.formProxy.onScoped('onSetDetail', tracker2);
    const ctx = {
      ...this.service.createContext(node, this.graph),
      ...this.service.createFormContext(),
      ...this.createCodeContext(),
    };
    try {
      const f = this.service.createFunction<any>(node.rule.formula, ctx, true);
      return await f();
    } finally {
      dispose();
      dispose2();
    }
  }

  private checkValue(value: any) {
    if (typeof value === 'function') {
      throw new TypeError(`计算结果错误返回函数，是否忘记调用？`);
    }
    if (typeof value === 'symbol') {
      throw new TypeError(`非法的计算结果`);
    }
  }

  protected createCodeContext() {
    return {
      api: kernel,
      loadThing: this.service.loadThing.bind(this.service),
      getFinancial: this.service.getFinancial.bind(this.service),
      message,
      confirm: $confirm,
    };
  }
}
