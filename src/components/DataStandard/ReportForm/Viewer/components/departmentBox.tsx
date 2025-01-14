import { schema } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { IDepartment } from '@/ts/core';
import { ISelectBoxOptions } from 'devextreme-react/select-box';
import React, { useEffect, useState, createRef } from 'react';
import { organizeData } from './utils';
import { TreeView } from 'devextreme-react';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';

interface DepartmentBoxProps extends ISelectBoxOptions {
  teamId?: string;
  isOperator?: boolean;
  target: schema.XTarget;
  selectValue: string;
}
type DTarget = schema.XTarget & { parentId?: string };

const DepartmentItem: React.FC<DepartmentBoxProps> = (props) => {
  const [dataSourceArray, setDataSourceArray] = useState<DTarget[]>([]);
  const treeViewRef = createRef<TreeView<any>>();

  useEffect(() => {
    if (props.readOnly) {
      if (props.defaultValue && props.defaultValue.length > 5) {
        orgCtrl.user.findEntityAsync(props.defaultValue).then((_value) => {});
      }
    } else {
      const company = orgCtrl.user.companys.find((i) => i.id === props.target.id);
      if (company) {
        setDataSourceArray(organizeData(loadDepartments(company.departments, undefined)));
      }
    }
  }, [props]);

  const loadDepartments = (departments: IDepartment[], parentId?: string) => {
    const departs: DTarget[] = [];
    for (const department of departments) {
      if (department.children && department.children.length > 0) {
        departs.push(...loadDepartments(department.children, department.id));
      }
      departs.push({ ...department.metadata, parentId: parentId });
    }
    return departs;
  };

  const itemRender = (target?: DTarget) => {
    const value = target ? `${target.name}(${target.code})` : '';
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 10,
          paddingTop: 2,
        }}>
        {target && <EntityIcon entity={target} />}
        <span style={{ paddingLeft: 8 }}>{value}</span>
      </div>
    );
  };

  return (
    <div>
      <TreeView
        ref={treeViewRef}
        dataSource={dataSourceArray}
        keyExpr="id"
        selectionMode="single"
        displayExpr="name"
        itemsExpr="children"
        searchEnabled
        searchExpr="name"
        expandAllEnabled={false}
        itemRender={itemRender}
        onItemClick={(e) => {
          const value = e.itemData?.id;
          const title = e.itemData?.name;
          props.onValueChanged?.apply(this, [{ value, title } as any]);
        }}
      />
    </div>
  );
};

export default DepartmentItem;
