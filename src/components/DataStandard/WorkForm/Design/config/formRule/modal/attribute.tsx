import React, { useEffect, useState } from 'react';
import { Modal, Space } from 'antd';
import { TextArea, TextBox } from 'devextreme-react';
import { model } from '@/ts/base';
import { getUuid } from '@/utils/tools';
import CustomBuilder from '../builder';
import { FieldInfo } from 'typings/globelType';

interface IProps {
  fields: FieldInfo[];
  current?: model.AttributeFilterRule;
  onOk: (rule: model.AttributeFilterRule) => void;
  onCancel: () => void;
}

const ShowAttributeModal: React.FC<IProps> = (props) => {
  const [name, setName] = useState<string>();
  const [remark, setRemark] = useState<string>();
  const [condition, setCondition] = useState<string>(props.current?.condition ?? '[]');
  const [conditionText, setConditionText] = useState<string>(
    props.current?.conditionText ?? '{}',
  );
  useEffect(() => {
    if (props.current) {
      setName(props.current.name);
      setRemark(props.current.remark);
    }
  }, [props.current]);
  const vaildDisable = () => {
    return condition == undefined || condition.length < 1;
  };
  return (
    <Modal
      destroyOnClose
      title={<div style={{ margin: '20px 12px 4px' }}>属性筛选</div>}
      open={true}
      onOk={() => {
        const getString = (datas: any[]) => {
          const ret: string[] = [];
          for (const data of datas) {
            if (typeof data == 'string') {
              ret.push(data.replace('T', ''));
            } else if (Array.isArray(data)) {
              ret.push(...getString(data));
            }
          }
          return ret;
        };
        props.onOk.apply(this, [
          {
            id: props.current?.id ?? getUuid(),
            name: name!,
            remark: remark ?? '',
            condition: condition,
            conditionText: conditionText,
            type: 'attribute',
            trigger: getString(JSON.parse(condition)),
          },
        ]);
      }}
      onCancel={props.onCancel}
      okButtonProps={{
        disabled: vaildDisable(),
      }}>
      <Space direction="vertical" size={12} style={{ display: 'flex' }}>
        <TextBox
          label="规则名称*"
          labelMode="outside"
          value={name}
          onValueChange={(e) => {
            setName(e);
          }}
        />
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
        <TextArea
          label="备注"
          labelMode="outside"
          onValueChanged={(e) => {
            setRemark(e.value);
          }}
          value={remark}
        />
      </Space>
    </Modal>
  );
};
export default ShowAttributeModal;
