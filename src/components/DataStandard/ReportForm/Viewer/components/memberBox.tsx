import { schema } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { ISelectBoxOptions } from 'devextreme-react/select-box';
import React, { useEffect, useState, createRef } from 'react';
import { MemberFilter } from '@/ts/core/public/consts';
import { ITarget } from '@/ts/core';
import { TreeView } from 'devextreme-react';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';

interface memberBoxProps extends ISelectBoxOptions {
  teamId?: string;
  isOperator?: boolean;
  target: schema.XTarget;
  selectValue: string;
}

const MemberItem: React.FC<memberBoxProps> = (props) => {
  const [dataSourceArray, setDataSourceArray] = useState<schema.XTarget[]>([]);
  const treeViewRef = createRef<TreeView<any>>();

  useEffect(() => {
    if (!props.readOnly) {
      if (props.isOperator) {
        setDataSourceArray([props.target]);
      } else if (props.teamId) {
        let target: ITarget | undefined = undefined;
        if (props.teamId === MemberFilter.id) {
          target = orgCtrl.targets.find((i) => i.id === props.target.id);
        } else {
          target = orgCtrl.targets.find((i) => i.id === props.teamId);
        }
        if (target) {
          target.loadMembers().then((members) => {
            setDataSourceArray(members);
          });
        }
      }
    }
  }, [props]);

  const itemRender = (target?: schema.XTarget) => {
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

export default MemberItem;
