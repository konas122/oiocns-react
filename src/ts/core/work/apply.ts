import { kernel, model, schema } from '../../base';
import { XCollection } from '../public/collection';
import { IForm } from '../thing/standard/form';
import { IPrint, IReport, ITarget } from '..';
import { XWorkInstance } from '@/ts/base/schema';

export type InvalidItem = {
  id: string;
  formId: string;
  name: string;
  invalidMsg: string;
  rulePrompt?: string;
};
export interface IWorkApply {
  /** 类型 */
  typeName: string;
  /** 打印模板 */
  primaryPrints: IPrint[];
  /** 主表 */
  primaryForms: (IForm | IReport)[];
  /** 子表 */
  detailForms: IForm[];
  /** 发起样式类型 */
  applyType: string;
  /** 办事空间 */
  target: ITarget;
  /** 元数据 */
  metadata: model.WorkInstanceModel;
  /** 实例携带的数据 */
  instanceData: model.InstanceDataModel;
  /** 办事元数据 */
  define: schema.XWorkDefine;
  /** 报表接收 */
  reception?: schema.XReception;
  /** 网关信息 */
  gatewayData: model.WorkGatewayInfoModel[];
  /** 发起申请 */
  createApply(
    applyId: string,
    content: string,
    gateways: Map<string, string[]>,
  ): Promise<XWorkInstance>;
  /** 暂存申请 */
  staggingApply(
    content: string,
    gateways: Map<string, string[]>,
    collection: XCollection<schema.XWorkInstance>,
    id?: string,
  ): Promise<schema.XWorkInstance | undefined>;
}

export class WorkApply implements IWorkApply {
  constructor(
    _metadata: model.WorkInstanceModel,
    _data: model.InstanceDataModel,
    _target: ITarget,
    _primaryPrints: IPrint[],
    _primaryForms: (IForm | IReport)[],
    _detailForms: IForm[],
    _applyType: string,
    _define: schema.XWorkDefine,
  ) {
    this.primaryPrints = _primaryPrints;
    this.primaryForms = _primaryForms;
    this.detailForms = _detailForms;
    this.metadata = _metadata;
    this.instanceData = _data;
    this.applyType = _applyType ?? '';
    this.target = _target;
    this.define = _define;
    this.gatewayData = [];
  }
  /** 类型 */
  get typeName(): string {
    return this.define.typeName;
  }
  primaryPrints: IPrint[];
  primaryForms: (IForm | IReport)[];
  detailForms: IForm[];
  applyType: string;
  target: ITarget;
  metadata: model.WorkInstanceModel;
  instanceData: model.InstanceDataModel;
  gatewayData: model.WorkGatewayInfoModel[];
  define: schema.XWorkDefine;
  get reception() {
    return this.instanceData.reception;
  }
  async createApply(
    applyId: string,
    content: string,
    gateways: Map<string, string[]>,
  ): Promise<XWorkInstance> {
    gateways.forEach((v, k) => {
      this.gatewayData.push({
        nodeId: k,
        targetIds: v,
      });
    });
    const hideFormIds = this.getHideForms();
    var mark = await this.getMarkInfo(hideFormIds);
    if (content.length > 0) {
      mark += `备注:${content}`;
    }
    hideFormIds.forEach((a) => {
      delete this.instanceData.data[a];
      delete this.instanceData.fields[a];
    });
    if (this.reception) {
      for (const index of Object.keys(this.instanceData.data)) {
        const forms = this.instanceData.data[index];
        for (const form of forms) {
          for (const item of form.after) {
            item.periodType = this.reception.periodType;
            item.period = this.reception.period;
            item.taskId = this.reception.taskId;
            item.distId = this.reception.distId;
            switch (this.reception.content?.type) {
              case '报表':
                item.nodeId = this.reception.content.treeNode.id;
                item.nodeType = this.reception.content.treeNode.nodeType;
                item.targetId = this.reception.content.treeNode.targetId;
                break;
            }
          }
        }
      }
    }
    const res = await kernel.createWorkInstance({
      ...this.metadata,
      applyId: applyId,
      content: mark,
      contentType: 'Text',
      data: JSON.stringify(this.instanceData),
      gateways: JSON.stringify(this.gatewayData),
    });
    return res.data;
  }
  async staggingApply(
    content: string,
    gateways: Map<string, string[]>,
    collection: XCollection<schema.XWorkInstance>,
    id: string = 'snowId()',
  ): Promise<schema.XWorkInstance | undefined> {
    gateways.forEach((v, k) => {
      this.gatewayData.push({
        nodeId: k,
        targetIds: v,
      });
    });
    const hideFormIds = this.getHideForms();
    hideFormIds.forEach((a) => {
      delete this.instanceData.data[a];
      delete this.instanceData.fields[a];
    });
    const res = await collection.replace({
      ...this.metadata,
      id: id,
      contentType: 'Text',
      remark: content,
      data: JSON.stringify(this.instanceData),
      gateways: JSON.stringify(this.gatewayData),
    } as unknown as schema.XWorkInstance);
    return res;
  }
  private getHideForms = () => {
    return this.instanceData.rules
      .filter((a) => a.typeName == 'visible' && !a.value && a.formId == a.destId)
      .map((a) => a.destId);
  };
  async getMarkInfo(hideFormIds: string[]): Promise<string> {
    const remarks: string[] = [];
    for (const primaryForm of this.instanceData.node.primaryForms.filter(
      (a) => !hideFormIds.includes(a.id),
    )) {
      const key = primaryForm.id;
      const data = this.instanceData.data[key];
      const fields = this.instanceData.fields[key];
      if (data && fields) {
        for (const field of fields.filter((a) => a.options && a.options.showToRemark)) {
          var value = data.at(-1)?.after[0][field.id];
          if (value) {
            switch (field.valueType) {
              case '用户型':
                value = (await this.target.user.findEntityAsync(value))?.name;
                break;
              case '选择型':
                if (Array.isArray(value)) {
                  value = field.lookups
                    ?.filter((a) => (value as string[]).includes(a.id))
                    .map((a) => a.text)
                    .join('、');
                } else {
                  value = field.lookups?.find(
                    (a) => a.id === (value as string).substring(1),
                  )?.text;
                }
                break;
              default:
                break;
            }
          }
          remarks.push(`${field.name}:${value}  `);
        }
      }
    }
    return remarks.join('');
  }
}
