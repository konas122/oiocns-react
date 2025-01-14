import { IForm } from '@/ts/core';
import React, { useState } from 'react';
import { Button, Popconfirm } from 'antd';
import { CheckBox } from 'devextreme-react/check-box';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import ConditionsModal from '../modal/conditions';
import { model } from '@/ts/base';

import { FieldInfo } from 'typings/globelType';

interface IAttributeSetting {
  fields: FieldInfo[];
  fieldName: string;
  value?: any;
  conditionConfig?: model.conditionConfig;
  current: IForm;
  onValueChanged: Function;
  onConditionsChanged: Function;
  onConditionsDelete: Function;
}

const AttributeSetting: React.FC<IAttributeSetting> = (props) => {
  const [val, setVal] = useState<any>(props.value);
  const [openType, setOpenType] = useState(0);
  const [modalTitle, setModalTitle] = useState('条件');
  return (
    <div>
      <CheckBox
        value={val}
        onValueChanged={(e) => {
          setVal(e.value);
          props.onValueChanged(e.value, props.fieldName);
        }}
      />
      {props.conditionConfig ? (
        <span>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setModalTitle('编辑条件');
              setOpenType(1);
            }}>
            编辑条件
          </Button>
          <Popconfirm
            key={'delete'}
            title="确定删除吗？"
            onConfirm={() => {
              props.onConditionsDelete(props.fieldName + 'Conditions');
            }}>
            <Button type="link" icon={<DeleteOutlined />} danger>
              删除条件
            </Button>
          </Popconfirm>
        </span>
      ) : (
        <Button
          type="link"
          onClick={() => {
            setModalTitle('新增条件');
            setOpenType(1);
          }}>
          添加条件
        </Button>
      )}
      {openType == 1 && (
        <ConditionsModal
          fields={props.fields}
          title={modalTitle}
          current={props.current}
          conditionConfig={props?.conditionConfig as model.conditionConfig}
          onCancel={() => setOpenType(0)}
          onOk={(data) => {
            props.onConditionsChanged(data, props.fieldName + 'Conditions');
            setOpenType(0);
          }}
        />
      )}
    </div>
  );
};

export default AttributeSetting;
