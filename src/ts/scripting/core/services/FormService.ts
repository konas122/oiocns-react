import { Command, kernel, model, schema } from '@/ts/base';
import { IBelong, IForm, ITarget } from '@/ts/core';
import { Form } from '@/ts/core/thing/standard/form';
import WorkFormService from './WorkFormService';
import { getAsyncTime } from '@/ts/base/common';
import { Sequence } from '@/ts/core/thing/standard/sequence';
import { XForm, XThing } from '@/ts/base/schema';
import { FormChangeEvent } from '../types/rule';
import { ConditionsType, CardConditionsType } from '@/executor/tools/uploadTemplate';
import dayjs from 'dayjs';

export async function setDefaultField(
  thing: schema.XThing,
  fields: model.FieldModel[],
  belong: IBelong,
  conditions: ConditionsType = 'allnew',
  cardconditions: CardConditionsType = 'allnew',
): Promise<Omit<FormChangeEvent, 'formId'>[]> {
  const changes: Omit<FormChangeEvent, 'formId'>[] = [];

  function onChange(destId: string, value: any) {
    changes.push({ destId, value });
  }

  for (const field of fields) {
    if (field.options?.changeWithCode && field.options?.changeWithCode.length > 0) {
      const changeWithCodeField = fields.find(
        (i) => i.options?.changeWithCodeField === true,
      );
      if (changeWithCodeField && thing[changeWithCodeField.id]) {
        const meta = field.options?.changeWithCode[0];
        const form = new Form(meta, belong.directory);
        let running = true;
        let loadOptions: any = {
          take: 20,
          skip: 0,
        };
        loadOptions.options = loadOptions.options || {};
        loadOptions.options.match = {
          [changeWithCodeField.code]: thing[changeWithCodeField.id],
        };
        while (running) {
          const formData = await form.loadThing(loadOptions);
          if (formData.data.length === 0) {
            running = false;
          } else {
            loadOptions.skip += loadOptions.take;
            if (formData.success) {
              thing[field.id] = formData.data[0][field.code];
              onChange(field.id, formData.data[0][field.code]);
            }
          }
        }
      }
    }

    switch (field.options?.defaultType) {
      case 'currentPeriod':
        await belong.financial.loadContent();
        thing[field.id] = belong?.financial.current;
        onChange(field.id, belong?.financial.current);
        break;
      case 'currentTime':
        {
          const format =
            field.valueType == '日期型' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm:ss';
          thing[field.id] = dayjs(new Date()).format(format);
          onChange(field.id, thing[field.id]);
        }
        break;
      default:
        if (field.options?.defaultValue || field.options?.defaultValue === 0) {
          thing[field.id] = field.options.defaultValue;
          onChange(field.id, field.options.defaultValue);
        }
        break;
    }
    switch (field.widget) {
      case '操作人':
        thing[field.id] = belong.userId;
        onChange(field.id, belong.userId);
        break;
      case '操作组织':
        thing[field.id] = belong.id;
        onChange(field.id, belong.id);
        break;
      case '文本框':
        switch (conditions) {
          case 'allnew': {
            if (field.name !== '卡片编号') {
              let result = await genCode(field, belong);
              if (result) {
                thing[field.id] = result;
                onChange(field.id, result);
              }
            }
            break;
          }
          case 'partnew':
            if (!thing[field.id]) {
              if (field.name !== '卡片编号') {
                let result = await genCode(field, belong);
                if (result) {
                  thing[field.id] = result;
                  onChange(field.id, result);
                }
              }
            }
            break;
          default:
            break;
        }
        switch (cardconditions) {
          case 'allnew': {
            switch (field.name) {
              case '卡片编号':
                let result = await genCode(field, belong);
                if (result) {
                  thing[field.id] = result;
                  onChange(field.id, result);
                }
            }
            break;
          }
          case 'partnew':
            if (!thing[field.id]) {
              switch (field.name) {
                case '卡片编号':
                  let result = await genCode(field, belong);
                  if (result) {
                    thing[field.id] = result;
                    onChange(field.id, result);
                  }
              }
            }
            break;
          default:
            break;
        }
        break;
    }
  }
  return changes;
}

export async function genCode(field: model.FieldModel, belong: IBelong) {
  if (field.options?.asyncGeneateConditions?.length) {
    let ret = '';
    for (const rule of field.options.asyncGeneateConditions.sort(
      (pre: { order: any }, next: { order: any }) =>
        Number(pre.order) - Number(next.order),
    )) {
      switch (rule.encodeType.label) {
        case '常量':
          ret += rule.encodeValue;
          break;
        case '时间':
          ret += getAsyncTime(rule.dimensionalAccuracy.label);
          break;
        case '流水':
          var se = await new Sequence(rule.sequence, belong.directory).genValue();
          if (se == '') {
            console.error('生成序号失败!');
          }
          ret += se;
          break;
        default:
          break;
      }
    }
    return ret;
  }
}

export default class FormService {
  static fromIForm(form: IForm) {
    return new FormService(
      form.metadata,
      WorkFormService.createStandalone(
        form.directory.target.space,
        form.metadata,
        form.fields,
      ),
    );
  }

  constructor(form: XForm, work: WorkFormService) {
    this.target = work.target;
    this.belong = work.belong;
    this.form = form;
    this.formData = work.getFormData(this.form, work.model.node.id, '主表');
    this.fields = work.model.fields[form.id];
    this.fieldMap = {};
    this.fields.forEach((field) => (this.fieldMap[field.code] = field));
    this.work = work;
  }
  target: ITarget;
  belong: IBelong;
  form: schema.XForm;
  fields: model.FieldModel[];
  fieldMap: { [key: string]: model.FieldModel };
  get command(): Command {
    return this.work.command;
  }
  formData: model.FormEditData;
  work: WorkFormService;

  async createThing(): Promise<schema.XThing | undefined> {
    const res = await kernel.createThing(this.belong.id, [], this.form.name);
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      let data = res.data[0];
      this.formData.after[0] = data;
      await setDefaultField(data, this.fields, this.belong);
      this.work.updatePrimaryData(this.form.id, data);
      this.initRules(data);
      return data;
    }
  }

  initRules(thing: schema.XThing) {
    const rules = this.work.render.runFormRules(this.form.id, (params) => {
      switch (params.type) {
        case 'attribute':
          return thing[params.field];
        case 'property':
          if (this.fieldMap[params.field]) {
            return thing[this.fieldMap[params.field].id];
          }
      }
    });
    for (const ans of rules) {
      this.formData.rules.push(ans);
    }
  }

  async onFormDataChange(field: string, value: any, data: XThing) {
    if (this.work.model && this.work.allowEdit && data && this.formData) {
      const model = this.work.model;
      if (value === undefined || value === null) {
        delete model.primary[field];
      } else {
        model.primary[field] = value;
      }
      this.formData.after = [data];

      const formId = this.form.id;
      if (model.data[formId]) {
        const temp = model.data[formId].filter(
          (a) => a.nodeId != this.work.model.node.id,
        );
        model.data[formId] = [...temp, this.formData];
      } else {
        model.data[formId] = [this.formData];
      }
      this.work.onPrimaryFieldChanged(this.form.id, field);
    }
  }

  onValueChange = (fieldId: string, value: any, data: any) => {
    if (data) {
      const field = this.fields.find((field) => field.id == fieldId);
      if (value === undefined || value === null) {
        if (['用户型', '分类型', '选择型'].includes(field?.valueType ?? '')) {
          data[fieldId] && (data[fieldId] = '');
        } else {
          delete data[fieldId];
        }
      } else {
        data[fieldId] = value;
      }
      const accuracy: number | undefined = field?.options?.accuracy;
      let fieldValue = data[fieldId];
      if (accuracy) {
        const factor: number = Math.pow(10, accuracy);
        fieldValue = Math.round(value * factor) / factor;
      }
      const result = {
        formId: this.form.id,
        destId: fieldId,
        value: fieldValue,
      };
      this.command.emitter('change', 'result', result);

      this.runRuleEffects(data);

      this.onFormDataChange(fieldId, value, data);
    }
  };

  runRuleEffects(data: any) {
    const rules = this.work.render.runFormRules(this.form.id, (params) => {
      switch (params.type) {
        case 'attribute':
          return data[params.field];
        case 'property':
          if (this.fieldMap[params.field]) {
            return data[this.fieldMap[params.field].id];
          }
      }
    });
    for (const rule of rules) {
      if (this.formData) {
        const index = this.formData.rules.findIndex((item) => {
          return item.formId != rule.formId && item.destId != rule.destId;
        });
        if (index != -1) {
          this.formData.rules[index] = rule;
        } else {
          this.formData.rules.push(rule);
        }
      }
      this.command.emitter('change', rule.typeName, rule);
    }
  }

  setFieldsValue(data: any) {
    if (data) {
      for (const fieldId of Object.keys(data)) {
        this.onValueChange?.(fieldId, data[fieldId], data);
      }
    }
  }
}
