import DropDownBox from 'devextreme-react/drop-down-box';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { IDropDownBoxOptions } from 'devextreme-react/drop-down-box';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { TextBox } from 'devextreme-react';
import TreeView from 'devextreme-react/tree-view';
import { schema, model } from '@/ts/base';
import orgCtrl from '@/ts/controller';

interface ITreeSelect extends IDropDownBoxOptions {
  lookups: model.FiledLookup[];
}
interface ISelectTarget extends schema.XTarget {
  value: string;
}

const Associated = 'associated';
const Uncorrelated = 'uncorrelated';
const TreeSelect: React.FC<ITreeSelect> = (props) => {
  const [selectTarget, setSelectTarget] = useState<ISelectTarget>();

  useEffect(() => {
    if (props.value) {
      const regex = /^.*[\u4e00-\u9fa5]+.*$/;
      if (regex.test(props.value)) {
        setSelectTarget({
          id: props.value,
          name: props.value,
          code: '',
          value: props.value,
        } as ISelectTarget);
      } else if (props.value.length > 5) {
        setSelectValue(props.value);
      }
    } else {
      setSelectTarget(undefined);
    }
  }, [props.value]);

  const relevanceData = useMemo(() => {
    const foldData = [
      {
        id: Associated,
        text: '已关联系统人员',
        expanded: true,
        value: Associated,
      },
      {
        id: Uncorrelated,
        text: '未关联系统人员',
        expanded: true,
        value: Uncorrelated,
      },
    ];
    props.lookups?.forEach((item) => {
      if (item.relevanceId) {
        foldData.push({
          ...item,
          categoryId: Associated,
        } as any);
      } else {
        foldData.push({
          ...item,
          categoryId: Uncorrelated,
        } as any);
      }
    });
    return foldData;
  }, [props.lookups]);

  const setSelectValue = useCallback((value: string) => {
    const currentTarget = props.lookups.find(
      (a) => a.value === value || a.value.slice(1) === value,
    );
    currentTarget &&
      orgCtrl.user.findEntityAsync(currentTarget.relevanceId as string).then((a) => {
        setSelectTarget({
          ...currentTarget,
          name: currentTarget.text,
          typeName: a?.typeName,
          icon: a?.icon,
        } as any);
      });
  }, []);

  const treeViewItemSelectionChanged = useCallback(
    (e: { component: { getSelectedNodeKeys: () => any } }) => {
      const value = e.component.getSelectedNodeKeys()[0];
      if (value === Associated || value === Uncorrelated || !value) return;
      setSelectValue(value);
    },
    [],
  );

  const fieldRender = () => {
    if (selectTarget) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 10,
            paddingTop: 2,
          }}>
          {selectTarget.icon &&<EntityIcon entity={selectTarget} />}
          <TextBox value={`${selectTarget?.name}(${selectTarget?.code})`} />
        </div>
      );
    } else {
      return <TextBox />;
    }
  };

  const treeViewRender = useCallback(
    () => (
      <TreeView
        dataSource={relevanceData}
        searchEnabled
        searchMode="contains"
        searchExpr={'text'}
        dataStructure="plain"
        keyExpr="id"
        parentIdExpr="categoryId"
        selectionMode="single"
        selectByClick={true}
        onItemSelectionChanged={treeViewItemSelectionChanged}
        itemRender={(record) => {
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <EntityIcon entityId={record.relevanceId} />
              <div style={record.relevanceId ? { marginLeft: '10px' } : {}}>
                {record.text}
              </div>
              {record.relevanceId && <div>（{record.code}）</div>}
            </div>
          );
        }}
      />
    ),
    [treeViewItemSelectionChanged],
  );

  return (
    <DropDownBox
      {...props}
      value={selectTarget?.value}
      fieldRender={fieldRender}
      displayExpr={'text'}
      valueExpr="value"
      dataSource={relevanceData}
      contentRender={treeViewRender}
    />
  );
};

export default TreeSelect;
