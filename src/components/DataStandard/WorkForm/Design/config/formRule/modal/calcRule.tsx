import VariableMapping from '@/components/Common/FlowDesign/Config/Components/Rule/modal/VariableMapping';
import { model, schema } from '@/ts/base';
import { getUuid } from '@/utils/tools';
import { Modal } from 'antd';
import { TextArea } from 'devextreme-react';
import React, { useEffect, useState } from 'react';

interface IProps {
  targetId: string;
  current?: model.NodeCalcRule;
  onOk: (rule: model.NodeCalcRule) => void;
  onCancel: () => void;
  form: schema.XForm;
}

const CalcRuleModal: React.FC<IProps> = (props) => {
  const [formula, setFormula] = useState<string>();
  const [mappingData, setMappingData] = useState<model.MappingData[]>([]);
  const [triggers, setTriggers] = useState<model.MappingData[]>([]);
  const [target, setTarget] = useState<model.MappingData>();

  useEffect(() => {
    if (props.current) {
      setFormula(props.current.formula);
      setMappingData(props.current.mappingData);
    }
  }, [props.current]);

  useEffect(() => {
    const tgs: model.MappingData[] = [];
    tgs.push(
      ...props.form.attributes.map((s) => {
        return {
          id: s.id,
          key: s.id,
          formName: props.form.name,
          formId: props.form.id,
          typeName: '对象',
          trigger: s.id,
          code: s.code,
          name: s.name,
        };
      }),
    );
    setTarget(tgs.find((a) => a.id === props.targetId));
    setTriggers(tgs.filter((a) => a.id != props.targetId));
  }, [props.current]);

  const vaildDisable = () => {
    return (
      name == undefined ||
      mappingData == undefined ||
      mappingData.length == 0 ||
      formula == undefined
    );
  };

  return (
    <Modal
      destroyOnClose
      title={'计算规则'}
      width={800}
      open={true}
      onOk={() => {
        if (target) {
          props.onOk.apply(this, [
            {
              name: '',
              remark: '',
              id: props.current?.id ?? getUuid(),
              target: target,
              type: 'calc',
              trigger: mappingData.map((a) => a.trigger),
              formula: formula!,
              mappingData,
            },
          ]);
        }
      }}
      onCancel={props.onCancel}
      okButtonProps={{
        disabled: vaildDisable(),
      }}>
      <VariableMapping
        mappingData={mappingData}
        onChange={(v, def) => {
          setMappingData(v);
          // setArgsDef(def);
        }}
        triggers={triggers}
      />
      <TextArea
        label="计算表达式*"
        labelMode="floating"
        value={formula}
        onValueChanged={(e) => {
          setFormula(e.value);
        }}></TextArea>
    </Modal>
  );
};
export default CalcRuleModal;
