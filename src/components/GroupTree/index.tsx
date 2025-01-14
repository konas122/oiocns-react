import { TreeSelect } from 'antd';
import React from 'react';
import { departmentTypes, ICompany, IGroup, ITarget, TargetType } from '@/ts/core';
interface IProps {
  accept: TargetType[];
  resultType?: 'id' | 'file';
  rootDisable?: boolean;
  orgId?: string;
  onChange: any;
  value?: string;
  target: ITarget;
}
let cacheTree: Map<string, any> = new Map<string, any>();
const GroupTree: React.FC<IProps> = (props: IProps) => {
  if (props.value == '0') return <div>其他组织</div>;
  /** 加载组织树 */
  const buildTargetTree = (
    targets: ICompany[] | IGroup[],
    isChild: boolean,
    level: number,
  ) => {
    const result: any[] = [];

    if (targets.length > 0) {
      for (const item of targets) {
        cacheTree.set(item.id, item);
        const itemChildren: any[] = [];
        if (props.accept.includes(TargetType.Group)) {
          if (item.typeName === TargetType.Company) {
            itemChildren.push(...((item as ICompany).groups ?? []));
          } else {
            itemChildren.push(...((item as IGroup).children ?? []));
          }
        }
        if (props.accept.some((type) => departmentTypes.includes(type))) {
          itemChildren.push(...(item.subTarget || []));
        }
        result.push({
          label: item.name,
          value: item.id,
          disabled: props.rootDisable && level == 0,
          children: buildTargetTree(itemChildren, isChild, level + 1),
        });
      }
    }
    return result;
  };
  return (
    <TreeSelect
      showSearch
      value={props.value}
      style={{ width: '100%' }}
      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
      placeholder="请选择组织"
      treeDefaultExpandAll
      onChange={(value: string) => {
        props.onChange(props.resultType == 'file' ? cacheTree.get(value) : value);
      }}
      treeData={buildTargetTree([props.target as ICompany], false, 0)}
    />
  );
};

export default GroupTree;
