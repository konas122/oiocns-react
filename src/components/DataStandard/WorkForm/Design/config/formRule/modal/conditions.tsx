import React, { useState } from 'react';
import { Modal } from 'antd';
import { model } from '@/ts/base';
import { getUuid } from '@/utils/tools';
import CustomBuilder from '../builder';
import { FieldInfo } from 'typings/globelType';
import { IForm } from '@/ts/core';

interface IProps {
  fields: FieldInfo[];
  title: string;
  current: IForm;
  conditionConfig?: model.conditionConfig;
  onOk: (rule: model.conditionConfig) => void;
  onCancel: () => void;
}

const ConditionsModal: React.FC<IProps> = (props) => {
  const [condition, setCondition] = useState<string>(
    props.conditionConfig?.condition ?? '[]',
  );
  const [conditionText, setConditionText] = useState<string>(
    props.conditionConfig?.conditionText ?? '{}',
  );
  const vaildDisable = () => {
    return condition == undefined || condition.length < 1;
  };
  return (
    <Modal
      destroyOnClose
      title={props.title}
      open={true}
      onOk={() => {
        props.onOk.apply(this, [
          {
            id: props.current?.id ?? getUuid(),
            condition: condition,
            conditionText: conditionText,
          },
        ]);
      }}
      onCancel={props.onCancel}
      okButtonProps={{
        disabled: vaildDisable(),
      }}>
      <div style={{ padding: 5 }}>
        <span>条件*：</span>
        <CustomBuilder
          fields={props.fields}
          displayText={conditionText}
          onValueChanged={(value, text) => {
            setCondition(value);
            setConditionText(text);
          }}
        />
      </div>
    </Modal>
  );
};
export default ConditionsModal;
