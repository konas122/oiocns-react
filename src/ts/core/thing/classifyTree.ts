import {
  IPerson,
  ICompany,
  IDepartment,
  IApplication,
  IDirectory,
  IBelong,
} from '@/ts/core';
import { FieldModel, FiledLookup, TreeNodeType, ClassifyTabType } from '@/ts/base/model';
import type { DataNode } from 'antd/es/tree';
import { is } from '@/ts/base/common/lang/type';
import { schema, model } from '@/ts/base';

export class ClassifyTree {
  benlong: IBelong;
  constructor(target: IBelong) {
    this.benlong = target;
  }

  // 当前表单分类树
  recursionSpecies = (lookups: FiledLookup[], tabKey: string) => {
    const nodeMap = new Map<string, FiledLookup>();
    const rootNodes: (FiledLookup & DataNode)[] = [];
    lookups.forEach((item) => {
      nodeMap.set(
        item.id,
        Object.assign(item, { key: item.id, title: item.text, tabKey }),
      );
    });
    lookups.forEach((item: FiledLookup) => {
      if (item.parentId) {
        const parent: any = nodeMap.get(item.parentId);
        if (parent) {
          (parent['children'] || (parent['children'] = [])).push(item);
        }
      } else {
        rootNodes.push(item);
      }
    });
    return rootNodes;
  };

  createSpeciesTree(speciesFields: FieldModel[]): ClassifyTabType[] {
    const result = speciesFields.map((it: FieldModel) => {
      const tree = this.recursionSpecies(it.lookups ?? [], it.id);
      return { label: it.name, key: it.id, data: tree };
    });
    return result;
  }

  createNodeData(
    item: TreeNodeType,
    parentId: string,
    disabled: boolean,
    disableCheckbox: boolean,
    tabKey: string,
  ) {
    let value = item.id;
    if (item.typeName == '表单' || item.typeName == '报表') {
      value = 'F' + item.id;
    }
    return {
      id: item.id,
      value,
      text: item.name,
      key: item.id,
      title: item.name + '【' + item.typeName + '】',
      typeName: item.typeName,
      parentId,
      disabled,
      disableCheckbox,
      tabKey,
    };
  }

  // 目录树
  recursionDirectory(
    item: IBelong | IApplication | IDirectory,
    extendTags: string[],
    parentId: string,
    tabKey: string,
  ) {
    let result: TreeNodeType = this.createNodeData(item, parentId, false, true, tabKey);
    const contents =
      item.typeName == '单位' || item.typeName == '组织群'
        ? item.directory.content()
        : item.content();
    if (contents.length > 0) {
      result['children'] = [];
    }
    item.loadContent();
    item.directory.content();
    contents.forEach((it: any) => {
      if (extendTags.includes(it.typeName)) {
        result.children!.push(this.createNodeData(it, result.id, false, false, tabKey));
      }
      if (['应用', '模块', '目录'].includes(it.typeName)) {
        if (['应用', '模块'].includes(it.typeName)) {
          it.loadForms();
        }
        result.children!.push(this.recursionDirectory(it, extendTags, result.id, tabKey));
      }
    });
    return result;
  }

  createFormTree(extendTags: string[], tabKey: string) {
    let result = this.recursionDirectory(this.benlong, extendTags, '', tabKey);
    return result.children ?? [];
  }

  // 用户树
  recursionDepartment(
    item: IDepartment,
    extendTags: string[],
    parentId: string,
    tabKey: string,
  ) {
    let result: TreeNodeType = this.createNodeData(
      item,
      parentId,
      false,
      !extendTags.includes(item.typeName),
      tabKey,
    );
    result['children'] = [];

    const persons = item.memberDirectory.content();
    persons.forEach((it) => {
      result['children']!.push(
        this.createNodeData(
          it,
          result.id,
          false,
          !extendTags.includes(it.typeName),
          tabKey,
        ),
      );
    });

    const contents = item.content().filter((i) => i.typeName === '部门');
    contents.forEach((it: any) => {
      result['children']!.push(
        this.recursionDepartment(it, extendTags, result.id, tabKey),
      );
    });
    return result;
  }

  createDepartmentPersonsTree(extendTags: string[], tabKey: string) {
    let result: TreeNodeType[] = [];
    let space = this.benlong.space as ICompany | IPerson;
    if (is<IPerson>(space, this.benlong.filterTags.includes('本人'))) {
      this.benlong.memberDirectory.content().map((it) => {
        result.push(this.createNodeData(it, '', false, false, tabKey));
      });
    } else {
      const departments: IDepartment[] = space.departments;
      departments.forEach((it: IDepartment) => {
        result.push(this.recursionDepartment(it, extendTags, '', tabKey));
      });
    }
    return result;
  }

  resetSpeciesData(arr: (schema.XSpeciesItem | model.FiledLookup)[]) {
    const map = arr.reduce<Dictionary<schema.XSpeciesItem | model.FiledLookup>>(
      (a, v) => {
        a[v.id] = v;
        return a;
      },
      {},
    );
    const result = arr.map((item: any) => {
      let parentIds = [];
      let currentItem = item;
      while (currentItem.parentId) {
        parentIds.unshift('S' + currentItem.parentId);
        currentItem = map[currentItem.parentId];
      }
      if (!item.value) item['value'] = 'S' + item.id;
      item['valueList'] = [...parentIds, item.value];
      return item;
    });
    return result;
  }

  filterDataByIdOrValue(
    key: string,
    value: string,
    arr: (schema.XSpeciesItem | model.FiledLookup)[],
  ) {
    let result = [];
    let queue = [];
    let target = arr.find((item: any) => item[key] === value);
    if (target) queue.push(target);
    while (queue.length > 0) {
      let node = queue.shift();
      if (node) result.push(node);
      let children: any = arr.filter((item: any) => {
        const parentId = key === 'value' ? 'S' + item.parentId : item.parentId;
        return parentId === node[key];
      });
      queue.push(...(children ?? []));
    }
    return result;
  }
}
