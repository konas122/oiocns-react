import { model, schema } from '@/ts/base';
import { TreeView } from 'devextreme-react';
import DropDownBox, {
  IDropDownBoxOptions,
} from 'devextreme-react/drop-down-box';
import React, { createRef, useEffect, useState } from 'react';
import * as dev from 'devextreme-react';
import orgCtrl from '@/ts/controller';
import { ITarget } from '@/ts/core';
import { SelectionChangedEvent } from 'devextreme/ui/list';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';

interface MultiSelectProps extends IDropDownBoxOptions {
  field: model.FieldModel;
  teamId?: string;
}

export const MemberMultiSelectBox: React.FC<MultiSelectProps> = (props) => {
  const treeViewRef = createRef<TreeView<any>>();
  const [selectedItemKeys, setSelectedItemKeys] = useState([]);
  const [targets, setTargets] = useState<schema.XTarget[] | model.FiledLookup[]>([]);
  useEffect(() => {
    setSelectedItemKeys(props.value);
    let target: ITarget | undefined = undefined;
    if (props.teamId) {
      target = orgCtrl.targets.find((i) => i.id === props.teamId) ?? undefined;
    }
    // 接口请求优化后 存在lookups为空情况
    if (target && props.field.lookups?.length === 0) {
      target.loadMembers().then((members) => {
        let members_ = members.map((item) => {
          return { ...item, value: item.id, text: item.name };
        });
        setTargets(members_);
      });
    } else {
      setTargets(props.field.lookups ?? []);
    }
  }, [props]);
  const itemRender = (target?: any) => {
    const value = target ? `${target.name}(${target.code})` : '';
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 10,
          paddingTop: 8,
          paddingBottom: 8,
        }}>
        {target && <EntityIcon entity={target} />}
        <span style={{ paddingLeft: 8 }}>{value}</span>
      </div>
    );
  };
  const onSelectionChanged = (e: SelectionChangedEvent) => {
    const { addedItems, removedItems } = e;
    let oldData = props.value ? [...props.value] : [];
    if (addedItems.length) {
      oldData.push(addedItems[0].value);
    }
    if (removedItems.length) {
      oldData.splice(oldData.indexOf(removedItems[0].value), 1);
    }
    props.onValueChanged?.({ value: oldData } as any);
  };
  return (
    <DropDownBox
      {...props}
      displayExpr={'text'}
      valueExpr={'value'}
      dataSource={targets}
      showClearButton={true}
      onValueChanged={(e) => {
        props.onValueChanged?.apply(this, [
          {
            ...e,
            value: e.value,
          },
        ]);
        if (e.value === null) {
          treeViewRef.current?.instance.unselectAll();
        }
      }}
      contentComponent={() => {
        return (
          <dev.List
            dataSource={targets}
            height={'100%'}
            width={'100%'}
            pageLoadMode="scrollBottom"
            searchExpr={['text']}
            searchEnabled={true}
            keyExpr={'value'}
            selectionMode="multiple"
            selectedItemKeys={selectedItemKeys}
            showSelectionControls={true}
            onSelectionChanged={onSelectionChanged}
            itemRender={(data) => itemRender(data)}
            selectByClick></dev.List>
        );
      }}
    />
  );
};
