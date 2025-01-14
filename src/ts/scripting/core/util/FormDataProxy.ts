import { XAttribute, Xbase } from '@/ts/base/schema';
import _ from 'lodash';
import { FormChangeEvent, DetailChangeEvent } from '../types/rule';
import { IFormDataHost } from '../types/service';
import EventEmitter, { EventListener } from './EventEmitter';
import { FiledLookup } from '@/ts/base/model';

function getAttrSpeciesId(s: string | XAttribute) {
  if (typeof s === 'string') {
    return s;
  }
  return s?.property?.speciesId ?? '';
}

type FiledLookupNode = {
  children: FiledLookupNode;
} & FiledLookup;

export class FormDataProxy extends EventEmitter<{
  onSetField: EventListener<FormChangeEvent>;
  onSetDetail: EventListener<DetailChangeEvent>;
}> {
  readonly model: IFormDataHost;
  speciesTreeMap: Dictionary<FiledLookupNode>;

  constructor(model: IFormDataHost) {
    super();
    this.model = model;
    this.speciesTreeMap = {};
  }

  /**
   * 根据表单ID获取只读的数据副本
   * @param formId
   */
  getRawData(formId: string) {
    const info = this.model.formInfo[formId];
    if (!info) {
      throw new ReferenceError(`找不到表单 ${formId}`);
    }

    if (info.isPrimaryForm) {
      return this.model.formData.primary[formId] || {};
    } else {
      return Object.values(this.model.formData.detail[formId]);
    }
  }

  getForm(formCode: string): Dictionary<any> {
    const formId = this.model.formCodeMap[formCode];
    if (!formId) {
      throw new ReferenceError(`找不到表单 ${formCode}`);
    }

    const formInfo = this.model.formInfo[formId];
    if (formInfo.typeName == '工作表') {
      throw new ReferenceError(`不支持引用表 ${formCode}`);
    }

    const { form, isPrimaryForm } = formInfo;
    const $self: FormDataProxy = this;
    if (!isPrimaryForm) {
      return new Proxy(this.model.formData.detail[formId], {
        get(target, key: string, receiver) {
          return Reflect.get(target, key, receiver);
        },
        set(target, key: string, val, receiver) {
          /* 可监听到新增的key */
          const ownKeys = Reflect.ownKeys(target);
          if (ownKeys.includes(key)) {
            $self.dispatchEvent('onSetDetail', {
              type: 'update',
              formId,
              destId: key,
              value: val,
            });
          } else {
            $self.dispatchEvent('onSetDetail', {
              type: 'add',
              formId,
              destId: key,
              value: val,
            });
          }
          const result = Reflect.set(target, key, val, receiver);
          return result;
        },
        deleteProperty(target, key: string) {
          const result = Reflect.deleteProperty(target, key);
          $self.dispatchEvent('onSetDetail', {
            type: 'remove',
            formId,
            destId: key,
            value: null,
          });
          return result;
        },
      });
    } else {
      const attrMap = form.attributes.reduce<Dictionary<string>>((a, v) => {
        a[v.code] = v.id;
        return a;
      }, {});
      const formData = () => $self.model.formData.primary[formId] || {};
      const proxy = Object.defineProperties(
        {
          ..._.pick(formData(), [
            'id',
            'status',
            'version',
            'createUser',
            'createTime',
            'updateUser',
            'updateTime',
            'belongId',
            'shareId',
          ]),
          mainId: formId,
        } as unknown as Dictionary<any> & Xbase,
        Object.fromEntries(
          Object.entries(attrMap).map(([code, id]) => {
            return [
              code,
              {
                get() {
                  return formData()[id];
                },
                set(v: any) {
                  formData()[id] = v;
                  $self.dispatchEvent('onSetField', {
                    formId,
                    destId: id,
                    value: v,
                  });
                },
              } as PropertyDescriptor,
            ];
          }),
        ),
      );

      return proxy;
    }
  }

  getAttribute(formCode: string, code: string) {
    const formId = this.model.formCodeMap[formCode];
    if (!formId) {
      throw new ReferenceError(`找不到表单 ${formId}`);
    }

    const formInfo = this.model.formInfo[formId];
    if (formInfo.typeName == '工作表') {
      console.warn('sheet里没有特性');
      return;
    }
    return formInfo.form.attributes.find((a) => a.code == code);
  }

  getSpeciesCode(speciesId: string | XAttribute, id: string) {
    if (!id) {
      return;
    }
    if (id.startsWith('S')) {
      id = id.slice(1);
    }

    speciesId = getAttrSpeciesId(speciesId);
    const item = (this.model.speciesMap[speciesId] || []).find((s) => s.id == id);
    if (item) {
      return item.info;
    }
  }

  getSpeciesId(speciesId: string | XAttribute, code: string) {
    if (!code) {
      return;
    }

    speciesId = getAttrSpeciesId(speciesId);
    const item = (this.model.speciesMap[speciesId] || []).find((s) => s.info == code);
    if (item) {
      return `S` + item.id;
    }
  }

  isInSpeciesTree(
    speciesId: string | XAttribute,
    parentValues: string,
    currentValue: string,
  ) {
    if (!parentValues || !currentValue) {
      return;
    }

    let flag = false;
    speciesId = getAttrSpeciesId(speciesId);
    const speciesMap = this.model.speciesMap[speciesId] || [];
    const currentItem = speciesMap.find((s) => 'S' + s.id == currentValue);
    //获取指定项自身到上级的对象集合
    function buildParents(id: string, speciesMap: FiledLookup[]): FiledLookup[] {
      let buildArr: FiledLookup[] = [];
      let findItem = speciesMap.find((s) => s.id == id);
      if (findItem) {
        buildArr.push(findItem);
        if (findItem.parentId) {
          buildArr = [...buildArr, ...buildParents(findItem.parentId, speciesMap)];
        }
      }
      return buildArr;
    }

    if (currentItem) {
      const parentArr = buildParents(currentItem.id, speciesMap);
      flag = parentArr.some((item) => {
        if ('S' + item.id === parentValues) {
          return true;
        }
      });
    }

    return flag;
  }
}
