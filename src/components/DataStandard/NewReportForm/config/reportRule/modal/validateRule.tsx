import { model } from '@/ts/base';
import { ErrorLevel } from '@/ts/base/model';
import { getUuid } from '@/utils/tools';
import { Modal } from 'antd';
import { SelectBox, TextArea, TextBox } from 'devextreme-react';
import React, { useEffect, useState } from 'react';
import VariableMapping from '@/components/Common/FlowDesign/Config/Components/Rule/modal/VariableMapping';
import { createTsDefinition } from '@/components/Common/FlowDesign/Config/Components/Rule/modal/createTsDefinition';
import { XReport } from '@/ts/base/schema';

interface IProps {
  targetId: string;
  current?: model.NodeValidateRule;
  onOk: (rule: model.NodeValidateRule) => void;
  onCancel: () => void;
  reports: XReport[];
}

const ValidateRule: React.FC<IProps> = (props) => {
  const [name, setName] = useState<string>('');
  const [formula, setFormula] = useState<string>();
  const [message, setMessage] = useState<string>('校验失败');
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>('error');
  const [remark, setRemark] = useState<string>();
  const [triggers, setTriggers] = useState<model.MappingData[]>([]);
  const [mappingData, setMappingData] = useState<model.MappingData[]>([]);
  const [_argsDef, setArgsDef] = useState('');

  useEffect(() => {
    if (props.current) {
      setName(props.current.name);
      setMessage(props.current.message);
      setErrorLevel(props.current.errorLevel);
      setFormula(props.current.formula);
      setRemark(props.current.remark);
      setMappingData(props.current.mappingData);
      setArgsDef(createTsDefinition(props.current.mappingData));
      const tgs: model.MappingData[] = [];
      props.reports.forEach((a) => {
        tgs.push(
          ...a.attributes.map((s) => {
            return {
              id: s.id,
              key: a.id + s.id,
              formName: a.name,
              formId: a.id,
              typeName: '对象',
              trigger: s.id,
              code: s.code,
              name: s.name,
            };
          }),
        );
      });
      setTriggers(tgs);
    }
  }, [props.current]);

  useEffect(() => {
    const tgs: model.MappingData[] = [];
    props.reports.forEach((a) => {
      tgs.push(
        ...a.attributes.map((s) => {
          return {
            id: s.id,
            key: a.id + s.id,
            formName: a.name,
            formId: a.id,
            typeName: '对象',
            trigger: s.id,
            code: s.code,
            name: s.name,
          };
        }),
      );
    });
    setTriggers(tgs);
  }, [props.reports]);

  return (
    <Modal
      destroyOnClose
      title={'校验规则'}
      width={800}
      open={true}
      onOk={() => {
        if (props.targetId) {
          props.onOk.apply(this, [
            {
              name: name,
              remark: remark,
              id: props.current?.id ?? getUuid(),
              type: 'validate',
              message: message,
              errorLevel: errorLevel,
              trigger: [],
              formula: formula!,
              mappingData: mappingData!,
            },
          ]);
        }
      }}
      onCancel={props.onCancel}>
      <TextBox
        label="名称"
        labelMode="outside"
        value={name}
        onValueChange={(e) => {
          setName(e);
        }}
      />
      <TextArea
        label="校验提示信息"
        labelMode="outside"
        value={message}
        onValueChange={(e) => {
          setMessage(e);
        }}
      />
      <SelectBox
        valueExpr="value"
        label="校验错误类型"
        labelMode="outside"
        value={errorLevel}
        displayExpr="name"
        dataSource={[
          {
            name: '提示',
            value: 'info',
          },
          {
            name: '警告',
            value: 'warning',
          },
          {
            name: '错误',
            value: 'error',
          },
        ]}
        onSelectionChanged={(e) => {
          setErrorLevel(e.selectedItem.value);
        }}
      />
      <VariableMapping
        mappingData={mappingData}
        forms={props.reports}
        onChange={(v, def) => {
          setMappingData(v);
          setArgsDef(def);
        }}
        triggers={triggers}
      />
      <TextArea
        label="校验表达式*"
        labelMode="floating"
        value={formula}
        onValueChanged={(e) => {
          setFormula(e.value);
        }}></TextArea>
      <TextArea
        style={{ marginBottom: '12px' }}
        label="描述"
        labelMode="outside"
        onValueChanged={(e) => {
          setRemark(e.value);
        }}
        value={remark}
      />
    </Modal>
  );
};
export default ValidateRule;
