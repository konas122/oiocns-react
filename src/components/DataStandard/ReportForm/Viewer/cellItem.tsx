import { model } from '@/ts/base';
import { IBelong, TargetType } from '@/ts/core';
import { formatDate } from '@/utils';
import { Modal } from 'antd';
import { DateBox } from 'devextreme-react';
import React, { useState } from 'react';
import { useEffectOnce } from 'react-use';
import { getWidget } from '../../../DataStandard/WorkForm/Utils';
import DepartmentItem from './components/departmentBox';
import MemberItem from './components/memberBox';
import SearchTargetItem from './components/searchTarget';
import TreeTargetItem from './components/treeTarget';

interface ICellItemProps {
  data: any;
  belong: IBelong;
  rules: model.RenderRule[];
  readonly?: boolean;
  field: model.FieldModel;
  type: string;
  selectValue: string;
  onValuesChange?: (field: string, value: any) => void;
  onCancel: () => void;
  writeData: (text: string, fieldId: string) => void;
}

const CellItem: React.FC<ICellItemProps> = (props) => {
  const [value, setValue] = useState<any>();
  const [title, setTitle] = useState<any>();

  useEffectOnce(() => {
    if (props.data[props.field.id] == undefined && props.field.options?.defaultValue) {
      props.onValuesChange?.apply(this, [
        props.field.id,
        props.field.options?.defaultValue,
      ]);
    }
  });

  const mixOptions: any = {
    key: props.field.id,
    name: props.field.id,
    showClearButton: true,
    label: props.field.name,
    hint: props.field.remark,
    showMaskMode: 'always',
    labelMode: 'floating',
    labelLocation: 'left',
    ...props.field.options,
    visible: props.field.options?.hideField != true,
    isRequired: props.field.options?.isRequired == true,
    defaultValue: props.data[props.field.id] ?? props.field.options?.defaultValue,
    selectValue: props.selectValue,
    onValueChanged: (e: any) => {
      if (e.value !== props.data[props.field.id]) {
        setValue(e.value);
        setTitle(e.title ? e.title : e.value);
        // props.writeData(e.title ? e.title : e.value, props.field.id);
      }
    },
  };

  const getComonpent = () => {
    switch (getWidget(props.field.valueType, props.field.widget)) {
      case '选择框':
      case '单选框':
      case '多级选择框':
        return <TreeTargetItem {...mixOptions} speciesItems={props.field.lookups} />;
      case '成员选择框':
        return <MemberItem {...mixOptions} target={props.belong.metadata} />;
      case '内部机构选择框':
        return <DepartmentItem {...mixOptions} target={props.belong.metadata} />;
      case '人员搜索框':
        return <SearchTargetItem {...mixOptions} typeName={TargetType.Person} />;
      case '单位搜索框':
        return <SearchTargetItem {...mixOptions} typeName={TargetType.Company} />;
      case '群组搜索框':
        return <SearchTargetItem {...mixOptions} typeName={TargetType.Cohort} />;
      case '组织群搜索框':
        return <SearchTargetItem {...mixOptions} typeName={TargetType.Group} />;
      case '日期选择框':
        return (
          <DateBox
            {...mixOptions}
            type={'date'}
            displayFormat={'yyyy年MM月dd日'}
            onValueChanged={(e) => {
              mixOptions.onValueChanged.apply(this, [
                {
                  ...e,
                  value: e.value ? formatDate(e.value, 'yyyy-MM-dd') : undefined,
                },
              ]);
            }}
          />
        );
      case '时间选择框':
        return (
          <DateBox
            {...mixOptions}
            type={'datetime'}
            displayFormat={'yyyy年MM月dd日 HH:mm:ss'}
            onValueChanged={(e) => {
              mixOptions.onValueChanged.apply(this, [
                {
                  ...e,
                  value: e.value ? formatDate(e.value, 'yyyy-MM-dd HH:mm:ss') : undefined,
                },
              ]);
            }}
          />
        );
      case '引用选择框':
      default:
        return '';
    }
  };

  return (
    <Modal
      destroyOnClose
      title={'选择框'}
      open={true}
      onOk={() => {
        if (props.type === 'primary') {
          props.onValuesChange?.apply(this, [props.field.id, value]);
          props.writeData(title, props.field.id);
        } else {
          props.writeData(title, props.field.id);
          props.writeData(value, props.field.id + '_code');
        }
        props.onCancel();
      }}
      onCancel={props.onCancel}>
      <div style={{ height: 400 }}>{getComonpent()}</div>
    </Modal>
  );
};

export default CellItem;
