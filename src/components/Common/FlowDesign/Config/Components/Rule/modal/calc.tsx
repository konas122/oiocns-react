import React, { useEffect, useState } from 'react';
import { Card, Modal, Space, message } from 'antd';
import { TextArea, TextBox } from 'devextreme-react';
import { model, schema } from '@/ts/base';
import { getUuid } from '@/utils/tools';
import VariableMapping from './VariableMapping';
import { transformExpression } from '@/utils/script';
import { MonacoEditor } from '@/components/Common/MonacoEditor';
import { formDefs } from '@/ts/scripting/core/functions';
import { createTsDefinition } from './createTsDefinition';
import { FieldSelect } from './FieldSelect';

interface IProps {
  primarys: schema.XForm[];
  details: schema.XForm[];
  current?: model.NodeCalcRule;
  onOk: (rule: model.NodeCalcRule) => void;
  onCancel: () => void;
}

const CalcRuleModal: React.FC<IProps> = (props) => {
  const [name, setName] = useState<string>();
  const forms = [...props.primarys, ...props.details];
  const [triggers, setTriggers] = useState<model.MappingData[]>([]);
  const [remark, setRemark] = useState<string>();
  const [formula, setFormula] = useState<string>();
  const [mappingData, setMappingData] = useState<model.MappingData[]>([]);
  const [target, setTarget] = useState<model.MappingData>();
  const [argsDef, setArgsDef] = useState('');
  const [allDef, setAllDef] = useState<Dictionary<string>>({});

  useEffect(() => {
    setAllDef({
      'form-calc.d.ts': formDefs,
      'variables.d.ts': argsDef,
    });
  }, [argsDef]);

  useEffect(() => {
    if (props.current) {
      setName(props.current.name);
      setRemark(props.current.remark);
      setTarget(props.current.target);
      setFormula(props.current.formula);
      setMappingData(props.current.mappingData);
      setArgsDef(createTsDefinition(props.current.mappingData));
    }
  }, [props.current]);

  useEffect(() => {
    const tgs: model.MappingData[] = [];
    props.primarys.forEach((a) => {
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
    props.details.forEach((a) => {
      tgs.push(
        ...a.attributes.map((s) => {
          return {
            id: s.id,
            formName: a.name,
            key: a.id + s.id,
            formId: a.id,
            typeName: '集合',
            trigger: a.id,
            code: s.code,
            name: s.name,
          };
        }),
      );
    });
    setTriggers(tgs);
  }, [props.details, props.primarys]);

  const vaildDisable = () => {
    return (
      name == undefined ||
      target == undefined ||
      formula == undefined ||
      mappingData.length <= 0
    );
  };
  const modalHeadStyl = {
    minHeight: '28px',
    paddingLeft: '0',
    paddingTop: '0',
    border: 'none',
  };
  const bodyBorderStyl = {
    border: '1px solid #eee',
  };

  const labelFontSize = {
    fontSize: '14px',
  };
  return (
    <Modal
      destroyOnClose
      title={'计算规则'}
      width={800}
      open={true}
      bodyStyle={{ border: 'none', padding: 0, marginLeft: '32px', marginRight: '32px' }}
      onOk={() => {
        try {
          transformExpression(formula!);
        } catch (error) {
          let msg = error instanceof Error ? error.message : String(error);
          message.error(
            <div>
              <div>计算代码错误</div>
              <pre style={{ textAlign: 'left' }}>
                <code>{msg}</code>
              </pre>
            </div>,
          );
          return;
        }

        if (mappingData!.some(m => m.formId == target!.formId && m.id == target!.id)) {
          message.error(`变量 ${target!.code} 存在自我依赖`);
          return;
        }

        const trigger: string[] = [];
        mappingData!.forEach((a) => trigger.push(a.trigger));
        props.onOk.apply(this, [
          {
            id: props.current?.id ?? getUuid(),
            name: name!,
            remark: remark ?? '',
            target: target!,
            type: 'calc',
            trigger: trigger!,
            formula: formula!,
            mappingData: mappingData!,
          },
        ]);
      }}
      onCancel={props.onCancel}
      okButtonProps={{
        disabled: vaildDisable(),
      }}>
      <>
        <Space direction="vertical" size={15} style={{ width: '100%' }}>
          <TextBox
            label="名称"
            labelMode="outside"
            value={name}
            onValueChange={(e) => {
              setName(e);
            }}
          />
          <div className="flex items-center">
            <div style={{ marginRight: '16px' }}>目标对象：</div>
            <FieldSelect
              style={{ flex: 'auto' }}
              value={target}
              onChange={setTarget}
              data={triggers.filter((a) => a.typeName == '对象')}
              forms={forms}
              disabled={mappingData}
            />
          </div>
          <VariableMapping
            mappingData={mappingData}
            forms={forms}
            onChange={(v, def) => {
              setMappingData(v);
              setArgsDef(def);
            }}
            triggers={triggers}
          />
          <Card
            title={<div style={{ ...labelFontSize }}>计算代码</div>}
            bordered={false}
            bodyStyle={{ ...bodyBorderStyl, paddingTop: '12px' }}
            headStyle={modalHeadStyl}>
            <MonacoEditor
              value={formula}
              language="javascript"
              onChange={setFormula}
              definitions={allDef}
            />
          </Card>
          <TextArea
            style={{ marginBottom: '12px' }}
            label="描述"
            labelMode="outside"
            onValueChanged={(e) => {
              setRemark(e.value);
            }}
            value={remark}
          />
        </Space>
      </>
    </Modal>
  );
};
export default CalcRuleModal;
