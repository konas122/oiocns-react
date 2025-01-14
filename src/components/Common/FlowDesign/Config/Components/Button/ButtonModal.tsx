import OpenFileDialog from '@/components/OpenFileDialog';
import { model } from '@/ts/base';
import { Executor, Rule, WorkNodeButton } from '@/ts/base/model';
import { IWork } from '@/ts/core';
import { Button, Form, Input, Modal, Radio, Select } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { FieldChangeTable } from '@/components/Common/ExecutorShowComp';
import { FullEntityColumns } from '@/config/column';

interface IProps {
  current: WorkNodeButton;
  onOk: (row: WorkNodeButton) => void;
  onCancel: () => void;
  rules: Rule[];
  executors: Executor[];
  work: IWork;
}

const ButtonModal: React.FC<IProps> = (props) => {
  const [form] = Form.useForm();
  const [center, setCenter] = useState(<></>);
  const [formName, setFormName] = useState(props.current.form?.name);
  const [fields, setFields] = useState<model.FieldModel[]>(
    FullEntityColumns(
      (props.current.form?.metadata.attributes as model.FieldModel[]) || [],
    ),
  );
  const [fieldChanges, setFieldChanges] = useState<model.FieldChange[]>(
    props.current?.fieldChanges || [],
  );
  const [scene, setScene] = useState(props.current.scene);

  const rules = useMemo(() => {
    return props.rules.filter((r) => r.isManual && r.triggerTiming !== 'submit');
  }, [props.rules]);

  const executors = useMemo(() => {
    return props.executors.filter((r) => r.trigger == 'manual');
  }, [props.executors]);

  const [type, setType] = useState(props.current.type);
  useEffect(() => {
    form.setFieldsValue(props.current);
  }, [props.current]);

  const getFormFields = () => {
    const formInfo = form.getFieldValue('form');
    if (formInfo) {
      setFields(FullEntityColumns(formInfo.metadata.attributes ?? []));
    }
  };

  return (
    <Modal
      destroyOnClose
      title="按钮配置"
      width={480}
      open={true}
      bodyStyle={{ border: 'none', padding: 0, marginLeft: '32px', marginRight: '32px' }}
      onOk={() => {
        Object.assign(props.current, form.getFieldsValue());
        props.onOk(props.current);
      }}
      onCancel={props.onCancel}>
      <Form preserve={false} layout="vertical" form={form}>
        <Form.Item label="标识" name="code" required>
          <Input />
        </Form.Item>
        <Form.Item label="按钮文字" name="name" required>
          <Input />
        </Form.Item>
        <Form.Item
          name="scene"
          label="业务场景"
          rules={[{ required: true, message: '请选择业务场景' }]}>
          <Radio.Group defaultValue="pc" onChange={(e) => setScene(e.target.value)}>
            <Radio value="pc">PC端</Radio>
            <Radio value="mobile">移动端</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label="绑定表单"
          name="form"
          rules={[{ required: true, message: '请选择要绑定的表单' }]}>
          <div>
            <Button
              type="primary"
              style={{ marginRight: '5px' }}
              onClick={() => {
                setCenter(
                  <OpenFileDialog
                    title={`选择表单`}
                    rootKey={props.work?.directory?.spaceKey}
                    currentKey={props.work?.directory?.spaceKey}
                    accepts={['表单']}
                    excludeIds={[]}
                    rightShow={false}
                    onCancel={() => setCenter(<></>)}
                    onOk={(files) => {
                      form.setFieldValue('form', {
                        name: files[0].name,
                        id: files[0].id,
                        metadata: files[0].metadata,
                      });
                      getFormFields();
                      setFormName(files[0].name);
                      form.validateFields(['form']);
                      setCenter(<></>);
                    }}
                  />,
                );
              }}>
              选择表单
            </Button>
            {formName}
          </div>
        </Form.Item>
        {formName && scene === 'mobile' ? (
          <>
            <Form.Item
              label="关联表单字段"
              name="correlationCode"
              rules={[{ required: true, message: '请选择关联表单字段' }]}
              tooltip="业务需要关联已选表单中的字段,可咨询开发">
              <Select>
                {fields.map((option: any, index: number) => (
                  <Select.Option key={index} value={option.id}>
                    {option.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label={'字段变更-' + formName}
              name="fieldChanges"
              rules={[{ required: true, message: '请选择要变更的字段' }]}>
              已设置变更字段{fieldChanges?.length}个
              <Button
                type="link"
                size="small"
                onClick={() =>
                  setCenter(
                    <FieldChangeTable
                      work={props.work}
                      finished={(e: model.FieldChange[]) => {
                        setFieldChanges(e);
                        if (fieldChanges.length) {
                          form.setFieldValue('fieldChanges', fieldChanges);
                        } else {
                          form.setFieldValue('fieldChanges', undefined);
                        }
                        form.validateFields(['fieldChanges']);
                        setCenter(<></>);
                      }}
                      formChange={{
                        ...form.getFieldValue('form'),
                        fieldChanges: fieldChanges,
                      }}
                    />,
                  )
                }>
                编辑变更字段
              </Button>
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item label="操作目标" name="type" required>
              <Select
                options={[
                  { label: '手动规则', value: 'rule' },
                  { label: '手动执行器', value: 'executor' },
                  { label: '获取业务数据', value: 'getWorkData' },
                ]}
                onSelect={setType}
              />
            </Form.Item>
            {type === 'rule' ? (
              <Form.Item label="规则" name="ruleId" required>
                <Select
                  options={rules.map((r) => ({
                    label: r.name,
                    value: r.id,
                  }))}
                />
              </Form.Item>
            ) : type === 'executor' ? (
              <Form.Item label="执行器" name="executorId" required>
                <Select
                  options={executors.map((e) => ({
                    label: e.funcName,
                    value: e.id,
                  }))}
                />
              </Form.Item>
            ) : null}
          </>
        )}
      </Form>
      {center}
    </Modal>
  );
};
export default ButtonModal;
