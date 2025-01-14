import { MonacoEditor } from '@/components/Common/MonacoEditor';
import { model, schema } from '@/ts/base';
import { transform } from '@/utils/script';
import { getUuid } from '@/utils/tools';
import { Card, Modal, Space, message } from 'antd';
import { SelectBox, TextArea, TextBox } from 'devextreme-react';
import React, { useEffect, useState } from 'react';
import VariableMapping from './VariableMapping';
import { formDefs, codeDef } from '@/ts/scripting/core/functions';
import { createTsDefinition } from './createTsDefinition';
import { FieldSelect } from './FieldSelect';

interface IProps {
  primarys: schema.XForm[];
  details: schema.XForm[];
  current?: model.NodeCodeRule;
  onOk: (rule: model.NodeCodeRule) => void;
  onCancel: () => void;
}

const CodeRuleModal: React.FC<IProps> = (props) => {
  const [name, setName] = useState('');
  const [remark, setRemark] = useState('');
  const [formula, setFormula] = useState('');
  const [mappingData, setMappingData] = useState<model.MappingData[]>([]);
  const [target, setTarget] = useState<model.MappingData | undefined>(null!);
  const [isManual, setIsManual] = useState(false);
  const [triggerTiming, setTriggerTiming] = useState('default');
  const [triggers, setTriggers] = useState<model.MappingData[]>([]);
  const forms = [...props.primarys, ...props.details];

  const [argsDef, setArgsDef] = useState('');
  const [allDef, setAllDef] = useState<Dictionary<string>>({});

  useEffect(() => {
    setAllDef({
      'form-calc.d.ts': formDefs,
      'form-code.d.ts': codeDef,
      'variables.d.ts': argsDef,
    });
  }, [argsDef]);

  useEffect(() => {
    if (props.current) {
      setName(props.current.name);
      setRemark(props.current.remark);
      setTarget(props.current.target);
      setFormula(props.current.formula);
      setMappingData(props.current.mappingData || []);
      setIsManual(props.current.isManual ?? false);
      setTriggerTiming(props.current.triggerTiming ?? 'default');
      setArgsDef(
        createTsDefinition(
          (props.current.mappingData || []).filter((m) => m.typeName != '表单'),
        ),
      );
    }
  }, [props.current]);
  useEffect(() => {
    const tgs: model.MappingData[] = [];
    tgs.push(
      ...forms.map((a) => {
        return {
          id: a.id,
          formId: a.id,
          key: a.id,
          formName: a.name,
          typeName: '表单',
          trigger: a.id,
          code: a.code,
          name: `（整个表单）`,
        };
      }),
    );
    props.primarys.forEach((a, index) => {
      tgs.push(
        ...a.attributes.map((s) => {
          return {
            id: s.id,
            key: index.toString() + s.id,
            formId: a.id,
            formName: a.name,
            typeName: '属性',
            trigger: s.id,
            code: s.code,
            name: s.name,
          };
        }),
      );
    });
    setTriggers(tgs);
  }, [props.details, props.primarys]);

  const vaildDisable = () => {
    return name == undefined || formula == undefined;
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
  return (
    <Modal
      destroyOnClose
      title={'代码规则'}
      width={960}
      open={true}
      bodyStyle={{ border: 'none', padding: 0, marginLeft: '32px', marginRight: '32px' }}
      onOk={() => {
        try {
          transform(formula!);
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
        props.onOk.apply(this, [
          {
            id: props.current?.id ?? getUuid(),
            name: name!,
            remark: remark ?? '',
            target,
            trigger: [],
            type: 'code',
            formula: formula!,
            isManual: isManual,
            triggerTiming: triggerTiming,
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
              data={triggers.filter((a) => a.typeName == '表单')}
              forms={forms}
              disabled={mappingData}
              clearable
            />
          </div>
          <SelectBox
            width={'40%'}
            value={isManual}
            label="触发方式"
            showClearButton
            labelMode="floating"
            displayExpr="label"
            valueExpr="value"
            style={{ display: 'inline-block' }}
            dataSource={[
              { label: '自动', value: false },
              { label: '手动', value: true },
            ]}
            onSelectionChanged={(e) => {
              setIsManual(e.selectedItem['value']);
            }}
          />
          {isManual === true && (
            <SelectBox
              width={'40%'}
              value={triggerTiming}
              label="触发时机"
              showClearButton
              labelMode="floating"
              displayExpr="label"
              valueExpr="value"
              style={{ display: 'inline-block' }}
              dataSource={[
                { label: '默认', value: 'default' },
                { label: '提交时', value: 'submit' },
              ]}
              onSelectionChanged={(e) => {
                setTriggerTiming(e.selectedItem['value']);
              }}
            />
          )}
          <VariableMapping
            label="表单引用（只影响依赖关系）"
            mappingData={mappingData}
            forms={forms}
            onChange={(v, def) => {
              setMappingData(v);
              setArgsDef(def);
            }}
            triggers={triggers}
          />
          <Card
            style={{ width: '900px' }}
            bordered={false}
            bodyStyle={{ ...bodyBorderStyl, paddingTop: '12px' }}
            headStyle={modalHeadStyl}>
            <MonacoEditor
              value={formula}
              language="javascript"
              onChange={setFormula}
              style={{ height: '400px' }}
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
export default CodeRuleModal;
