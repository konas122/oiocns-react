import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import { IViewHost } from '../../IViewHost';
import { SEntity } from '..';
import {
  AllTask,
  DocumentNodeMapping,
  DocumentPropertyMapping,
  FieldModel,
  FileItemShare,
  FiledLookup,
} from '@/ts/base/model';
import { getAllForms } from './util';
import { FormRef, SpeciesSummaryData } from './model';
import _ from 'lodash';
import { XAttributeProps, XThing, XWorkInstance, XWorkTask } from '@/ts/base/schema';
import { ShareIdSet } from '@/ts/core/public/entity';
import { formatDate, formatNumber } from '@/utils';
import { round } from '@/ts/scripting/core/functions/primitive';
import { WithChildren, buildTree } from '@/ts/base/common/tree';
import { WorkTaskInfo } from './model';
import { taskFields } from './fields';
import { getAllNodes } from '@/utils/work';
import { IWorkTask } from '@/ts/core';

interface AttrMapping extends DocumentPropertyMapping {
  attr: FieldModel;
}

function getRootSpeciesMap(tree: WithChildren<FiledLookup>[]) {
  const map: Dictionary<string> = {};

  function setLeaf(rootId: string, children: WithChildren<FiledLookup>[]) {
    for (const node of children) {
      map[node.id] = rootId;
      if (node.children.length > 0) {
        setLeaf(rootId, node.children);
      }
    }
  }

  for (const root of tree) {
    setLeaf(root.id, root.children);
  }

  return map;
}

function getPlainTasks(tasks: AllTask[]): XWorkTask[] {
  const ret: XWorkTask[] = tasks.map(t => _.omit(t, ['tasks']));
  for (const t of tasks) {
    ret.push(...getPlainTasks(t.tasks || []));
  }
  return ret;
}

export class DocumentDataset {
  readonly service: WorkFormService;
  readonly task?: IWorkTask;
  readonly host: IViewHost<'view'>;

  propertyRefs: AttrMapping[] = [];
  formRefs: FormRef[] = [];
  workPropertyRefs: DocumentNodeMapping[] = [];

  primaryNodeIdMap: Dictionary<string> = {};

  data: {
    [key: string]: any;
    [sumKey: `${string}Summary`]: Dictionary<number>;
    [sumKey: `${string}Classify`]: XThing[];
  } = {};
  taskData: WorkTaskInfo[] = [];
  taskDataMap: Dictionary<WorkTaskInfo> = {};

  constructor(host: IViewHost<'view'>, service: WorkFormService, instance?: IWorkTask) {
    this.host = host;
    this.service = service;
    this.task = instance;
    this.init();
  }

  init() {
    const config = this.service.model.node.documentConfig;
    if (!config) {
      return;
    }
    let propsRefs = _.cloneDeep(
      Object.values(config.propMapping).flat(1),
    ) as AttrMapping[];

    for (const map of propsRefs) {
      const fields = this.service.model.fields[map.formId] || [];
      map.attr = fields.find((f) => f.propId == map.propId)!;
    }

    this.propertyRefs = propsRefs;
    this.workPropertyRefs = _.cloneDeep(
      Object.values(config.nodeMapping || []).flat(1),
    );

    this.formRefs = getAllForms([this.host.page.rootElement]);
  }

  async loadData() {
    this.loadPrimaryData();
    this.loadDetailData();
    await this.loadTaskData();
  }

  private loadPrimaryData() {
    for (const p of this.propertyRefs) {
      const thing = this.service.formData.primary[p.formId] || {};
      if (!p.attr) {
        this.data[p.propId] = '未找到属性' + p.propId;
        console.warn('未找到属性', p);
        continue;
      }
      this.data[p.propId] = thing[p.attr.id];
      const [name, hasName] = this.getFieldName(this.data[p.propId], p.attr);
      if (hasName) {
        this.data[p.propId + 'Name'] = name;
      }
    }
  }

  private loadDetailData() {
    for (const form of this.formRefs) {
      const things = this.service.formData.detail[form.id] || {};
      this.data[form.id] = Object.values(things);
      const summary: Dictionary<number> = {};

      const fields = this.service.model.fields[form.id] || [];
      for (const field of fields) {
        for (const row of this.data[form.id]) {
          let value = row[field.id];
          const [name, hasName] = this.getFieldName(value, field);
          if (hasName) {
            row[field.id + 'Name'] = name;
          }
        }
        if (form.summary && field.options?.isSummary) {
          summary[field.id] = this.getFieldSummary(this.data[form.id], field);
        }
      }

      this.data[`${form.id}Summary`] = summary;

      if (form.speciesSummary?.classifyProp) {
        const classifyField = fields.find(
          (f) => f.propId == form.speciesSummary!.classifyProp!.id,
        );
        if (classifyField) {
          this.loadSpeciesSummary(form, classifyField, fields);
        } else {
          console.warn(`找不到表单 ${form.name} 的分类汇总字段 ${form.speciesSummary!.classifyProp.name}`);
        }
      }
    }
  }

  private loadSpeciesSummary(
    form: FormRef,
    classifyField: FieldModel,
    fields: FieldModel[],
  ) {
    const data: SpeciesSummaryData[] = this.data[form.id];
    const speciesSummary: XThing[] = [];


    const summaryFields = fields.filter((f) => f.options?.isSummary);

    const tree = buildTree(classifyField.lookups || []);
    const rootMap: Dictionary<string> = form.speciesSummary!.treeRoot
      ? getRootSpeciesMap(tree)
      : {};

    const speciesMap =  (classifyField.lookups || []).reduce<Dictionary<FiledLookup>>((a, v) => {
      a[v.value] = v;
      return a;
    }, {});

    // 设置分类合计id
    for (const row of data) {
      let speciesValue = row[classifyField.id] || '';
      const item = speciesMap[speciesValue];
      let speciesId = item?.id || speciesValue;
      if (form.speciesSummary!.treeRoot) {
        const rootSpeciesId = rootMap[speciesId];
        if (!rootSpeciesId) {
          console.warn(`找不到分类 ${speciesId} 的根分类`);
        } else {
          speciesId = rootSpeciesId;
        }
      }
      row.classifyId = speciesId;
    }

    // 分组合计
    const group = _.groupBy(data, (d) => d.classifyId);

    for (const [classifyId, groupData] of Object.entries(group)) {
      const item = (classifyField.lookups || []).find((i) => i.id === classifyId);
      const row = {
        id: classifyId,
        name: item?.text || classifyId,
      } as XThing;

      for (const field of summaryFields) {
        row[field.id] = this.getFieldSummary(groupData, field);
      }

      speciesSummary.push(row);
    }

    this.data[`${form.id}Classify`] = speciesSummary;


    const summary: Dictionary<number> = {};
    for (const field of summaryFields) {
      if (form.summary) {
        summary[field.id] = this.getFieldSummary(speciesSummary, field);
      }
    }
    this.data[`${form.id}ClassifySummary`] = summary;
  }

  async loadTaskData() {
    this.taskData = [];

    if (!this.task) {
      return;
    }

    const nodes = getAllNodes(this.task.instanceData!.node);
    for (const node of nodes) {
      this.primaryNodeIdMap[node.id] = node.primaryId;
    }

    const allTask = await this.task.loadTasksData();
    const records = this.task.getSortedRecords(allTask);

    const instanceMap = _.groupBy(getPlainTasks(allTask), t => t.instanceId);

    
    for (const [instanceId, tasks] of Object.entries(instanceMap)) {
      let instance = this.task.instance!.id == instanceId ? this.task.instance! : null;

      const taskMap = tasks.reduce<Dictionary<AllTask>>((a, v) => {
        a[v.id] = v;
        return a;
      }, {});

      const taskIds = Object.keys(taskMap);
      const currentRecords = records.filter((r) => taskIds.includes(r.taskId));

      for (const record of currentRecords) {
        const task = taskMap[record.taskId];
        let taskData: WorkTaskInfo = {
          belongId: instance?.belongId || '',
          applyId: instance?.applyId || '',

          id: record.taskId,
          title: record.destName || task?.title || '',
          nodeId: task?.nodeId,
          isApproved: false,
        };

        const taskDataRecord = _.cloneDeep(taskData);
        Object.assign(
          taskDataRecord,
          _.pick(record, ['comment', 'createUser', 'createTime', 'status']),
        );
        this.taskData.push(taskDataRecord);

        const primaryNodeId = this.primaryNodeIdMap[task.nodeId];
        if (!primaryNodeId) {
          console.warn(`找不到任务 ${task.title} 的节点 ${task.nodeId} 对应的主节点ID`);
        } else {
          const ref = this.workPropertyRefs.find((p) => p.nodeId == primaryNodeId);
          if (ref) {
            this.taskDataMap[ref.nodeKey] = taskDataRecord;
          } else {
            // 模板没引用，跳过
          }
        }
      }      
    }


    for (const field of taskFields) {
      for (const row of this.taskData) {
        let value = (row as any)[field.id];
        const [name, hasName] = this.getFieldName(value, field);
        if (hasName) {
          (row as any)[field.id + 'Name'] = name;
        }
      }
    }
    console.warn(this)
  }

  private getFieldSummary(data: XThing[], field: FieldModel) {
    const sum = _.sumBy(data, (d) => d[field.id] || 0);
    return field.options?.accuracy != null ? round(sum, field.options.accuracy) : sum;
  }

  getFieldName(value: any, field: FieldModel): [string, boolean] {
    if (value == null || value == '') {
      return ['', false];
    }

    switch (field.valueType) {
      case '选择型':
      case '分类型':
        const item = (field.lookups || []).find((i) => i.value === value);
        return [item?.text || value, true];
      case '用户型':
        const target = ShareIdSet.get(value);
        return [target?.name || value, true];
      case '附件型':
      case '引用型':
        const data: XThing[] | FileItemShare[] = JSON.parse(value);
        return [data.map((d) => d.name).join(','), true];
      default:
        break;
    }

    return ['', false];
  }

  getSpeciesItems(propId: string) {
    let fieldIds = this.propertyRefs.find((e) => e.propId == propId);
    return fieldIds?.attr?.lookups || [];
  }

  getSummary(formId: string) {
    return this.data[`${formId}Summary`] || {};
  }

  getSpeciesSummary(formId: string) {
    return this.data[`${formId}Classify`] || [];
  }

  formatFieldValue(v: any, fieldOrPropId: FieldModel | string, extraOptions: XAttributeProps = {}): string {
    let attr = fieldOrPropId;
    if (typeof attr === 'string') {
      attr = this.propertyRefs.find((e) => e.propId == attr)?.attr!;
    }

    if (v === null || v === '') {
      return '';
    }
    if (!attr) {
      return v;
    }

    let options = attr.options || {};
    for (const [key, value] of Object.entries(extraOptions)) {
      if (value != null && value != '') {
        (options as any)[key] = value;
      }
    }

    switch (attr.valueType) {
      case '数值型':
      case '货币型':
        if (options.accuracy != null) {
          v = formatNumber(v, options.accuracy);
        }
        break;

      case '日期型':
      case '时间型':
        if (options.displayFormat && !!v) {
          v = formatDate(v, options.displayFormat);
        }
        break;
      default:
        break;
    }
    return v;
  }
}
