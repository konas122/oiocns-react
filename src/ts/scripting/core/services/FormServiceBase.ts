import { Command, model } from '@/ts/base';
import { FieldModel, FiledLookup } from '@/ts/base/model';
import { XAttribute, XForm, XReception, XReport, XSheet, XThing } from '@/ts/base/schema';
import { FunctionProvider } from '../FunctionProvider';
import ScriptEnv from '../ScriptEnv';
import { RefGraph } from '../graph';
import { GraphNode } from '../graph/node';
import { FormContextData } from '../types/rule';
import { FormInfo, FormType, IFormDataHost, IService, XSheetInfo } from '../types/service';
import { FormDataProxy } from '../util/FormDataProxy';
import { IBelong, ITarget } from '@/ts/core';
import { formatDate } from '@/ts/base/common';
import ExecutableHandler from '../rule/ExecutableHandler';
import ValidateHandler from '../rule/ValidateHandler';
import RenderHandler from '../rule/RenderHandler';
import SplitHandler from '../rule/SplitHandler';
import { Form } from '@/ts/core/thing/standard/form';
import _ from 'lodash';
import { isReport, sheetToForm } from '../util/report';
import { Report } from '@/ts/core/thing/standard/report';
import ReportCellRefNode from '../graph/node/ReportCellRefNode';

export default abstract class FormServiceBase
  extends ScriptEnv
  implements IFormDataHost, IService
{
  readonly belong: IBelong;
  readonly target: ITarget;
  readonly model: model.InstanceDataModel;
  readonly allowEdit: boolean;
  readonly reception?: XReception;

  readonly formCodeMap: Dictionary<string> = {};

  formData: FormContextData = {
    primary: {},
    detail: {},
  };
  readonly formInfo: Dictionary<FormInfo> = {};

  readonly speciesMap: Dictionary<FiledLookup[]> = {};

  readonly executable: ExecutableHandler;
  readonly validate: ValidateHandler;
  readonly render: RenderHandler;
  readonly split: SplitHandler;

  formProxy: FormDataProxy;

  isCreate: boolean = true;

  private _isInit = false;

  readonly command = new Command();

  get ruleHandlers(): IService[] {
    return [this.executable, this.validate, this.render];
  }
  get hasReport() {
    return this.model.node.primaryForms.some((f) => f.typeName === '报表' || f.typeName === '表格');
  }

  constructor(
    belong: ITarget,
    model: model.InstanceDataModel,
    allowEdit = true,
    reception?: XReception,
    functionProvider?: FunctionProvider,
  ) {
    super(functionProvider);
    this.belong = belong.space;
    this.target = belong;
    this.model = model;
    this.allowEdit = allowEdit;
    this.reception = reception;

    this.complete(this.model.node);
    this.executable = new ExecutableHandler(this, allowEdit);
    this.validate = new ValidateHandler(this, allowEdit);
    this.render = new RenderHandler(this);
    this.split = new SplitHandler(this);
    this.formProxy = new FormDataProxy(this);
  }

  private complete(node: model.WorkNodeModel) {
    node.forms = node.forms ?? [];
    node.formRules = node.formRules ?? [];
    node.executors = node.executors ?? [];
    node.buttons = node.buttons ?? [];
    node.primaryForms = node.primaryForms ?? [];
    node.detailForms = node.detailForms ?? [];
    node.primaryForms.forEach((form) => {
      form.rule = form.rule ?? [];
    });
    node.detailForms.forEach((form) => {
      form.rule = form.rule ?? [];
    });
    if (node.children) {
      this.complete(node.children);
    }
    if (node.branches) {
      for (const branch of node.branches) {
        if (branch.children) {
          this.complete(branch.children);
        }
      }
    }
  }

  public init() {
    if (this._isInit) {
      return false;
    }
    for (const form of this.model.node.primaryForms) {
      this.formCodeMap[form.code] = form.id;
      this.formInfo[form.id] = {
        id: form.id,
        code: form.code,
        typeName: form.typeName,
        isPrimaryForm: true,
        form,
      } as FormInfo;    

      if (isReport(form)) {
        for (const sheet of Object.values(form.sheets)) {
          this.formCodeMap[sheet.code] = sheet.code;
          this.formInfo[sheet.code] = {
            id: sheet.code,
            code: sheet.code,
            typeName: '工作表',
            isPrimaryForm: true,
            reportId: form.id,
            form: sheet,
          }; 
        }
      }
    }

    for (const form of this.model.node.detailForms) {
      this.formCodeMap[form.code] = form.id;
      this.formInfo[form.id] = {
        id: form.id,
        code: form.code,
        typeName: form.typeName,
        isPrimaryForm: false,
        form,
      } as FormInfo;
    }

    this.initSpecies(Object.values(this.model.fields).flat(1));

    let errors: Error[] = [];
    for (const handler of this.ruleHandlers) {
      const ret = handler.init();
      if (ret instanceof Error) {
        errors.push(ret);
      }
    }
    if (errors.length > 0) {
      const e = new Error('规则初始化失败！', { cause: errors });
      console.error(e);
      return e;
    }

    this._isInit = true;
    console.warn(this)
    return errors.length > 0;
  }

  dispose() {
    for (const handler of this.ruleHandlers) {
      handler.dispose();
    }
  }

  initSpecies(fields: FieldModel[]) {
    for (const field of fields) {
      if (field.speciesId && field.lookups) {
        this.speciesMap[field.speciesId] = field.lookups;
      }
    }
  }

  updatePrimaryData(formId: string, form: XThing) {
    if (!form) {
      console.error(
        `尝试给表单 ${this.formInfo[formId]?.form.name || formId} 赋值空数据！`,
      );
    }
    this.formData.primary[formId] = form;
  }

  updateDetailData(formId: string, forms: XThing[]) {
    this.formData.detail[formId] = (forms || []).reduce<Dictionary<XThing>>((a, v) => {
      a[v.id] = v;
      return a;
    }, {});
  }

  getPrimaryData(formId: string) {
    return this.formData.primary[formId];
  }

  getDetailData(formId: string) {
    return Object.values(this.formData.detail[formId]);
  }

  createContext(node: GraphNode, graph: RefGraph) {
    const ctx: Dictionary<any> = {};
    for (const ref of node.refs) {
      const child = graph.getNodeByRef(ref)!;
      if (child.type === 'form') {
        continue;
      }
      if (child.type == 'report-cell') {
        if (node.type == 'report-cell' && node.sheet.code != child.sheet.code) {
          ctx[child.sheet.code] = this.createSheetContext(child, ctx);
        }
      }
      ctx[ref.name] = child.value;
    }
    return ctx;
  }

  createSheetContext(node: ReportCellRefNode, ctx: Dictionary<any>) {
    const form = this.formData.primary[node.ref.formId] || {};

    let sheet = ctx[node.sheet.code];
    if (!sheet) {
      sheet = _.cloneDeep(form[node.sheetKey] || {});
    }
    
    if (node.cell.rule.value?.type == '属性型') {
      const attr = node.cell.rule.value.valueString as XAttribute;
      // 创建一个单元格名称的计算属性指向实际的特性值
      Object.defineProperty(sheet, node.ref.cell, {
        enumerable: false,
        configurable: true,
        get() {
          return form[attr.id];
        },
        set(v) {
          console.warn('无法在计算表达式里赋值');
        }
      });
    }

    return sheet;
  }

  createFormContext() {
    const proxy = this.formProxy;
    return {
      form: proxy.getForm.bind(proxy),
      attr: proxy.getAttribute.bind(proxy),
      speciesCode: proxy.getSpeciesCode.bind(proxy),
      speciesValue: proxy.getSpeciesId.bind(proxy),
      isInSpeciesTree: proxy.isInSpeciesTree.bind(proxy),
      belong: this.belong.metadata,
      reception: this.reception,
      emit: (type: string, cmd: string, args: model.RenderRule) =>
        this.command.emitter(type, cmd, args),
    };
  }

  getFormData(form: XForm, nodeId: string, type: FormType): model.FormEditData {
    var rule: model.RenderRule[] = [];
    const source: XThing[] = [];
    let beforeSource: XThing[] = [];
    if (this.model.data && this.model.data[form.id]) {
      const beforeData = this.model.data[form.id];
      if (beforeData.length > 0) {
        if (!this.allowEdit) {
          source.push(...beforeData.at(-1)!.after);
          const nodeData = beforeData.filter((i) => i.nodeId === nodeId);
          if (nodeData && nodeData.length > 0) {
            return nodeData.at(-1)!;
          }
        } else {
          source.push(...beforeData.at(-1)!.after);
          rule = beforeData.at(-1)!.rules ?? [];
        }
        beforeSource = beforeData.at(-1)!.before;
      }
    }

    if (type == '主表') {
      this.updatePrimaryData(form.id, source[0]);
    } else {
      this.updateDetailData(form.id, source);
    }

    const sourceJson = JSON.stringify(source);
    const beforeSourceJson = JSON.stringify(beforeSource);
    return {
      rules: rule,
      before: JSON.parse(beforeSourceJson),
      after: JSON.parse(sourceJson),
      nodeId: nodeId,
      formName: form.name,
      formCode: form.code,
      creator: this.belong.userId,
      createTime: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss.S'),
    };
  }

  async loadThing(formCode: string, match: Dictionary<any>): Promise<XThing[]> {
    const formInfo = this.formInfo[this.formCodeMap[formCode]];
    if (!formInfo) {
      throw new Error(`找不到表单 ${formCode}`);
    }    

    if (formInfo.typeName == '工作表') {
      throw new Error(`不支持对单个表 ${formCode} 查询数据`);
    }

    let form = formInfo.typeName == '表格' 
      ? new Report(formInfo.form, this.target.directory)
      : new Form(formInfo.form, this.target.directory);
    const res = await form.loadThing({
      options: {
        match,
      },
    });
    return res.data;
  }
  async getFinancial(): Promise<string> {
    await this.formProxy.model.belong.space.financial.loadContent();
    return this.formProxy.model.belong.space.financial.current || '';
  }
}
