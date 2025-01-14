import OpenFileDialog from '@/components/OpenFileDialog';
import { schema } from '@/ts/base';
import { IFile, IFinancial } from '@/ts/core';
import { Form as AntForm, Card, FormInstance, Select, Space, Tag, Tooltip } from 'antd';
import FormItem from 'antd/lib/form/FormItem';
import React, { useEffect, useState } from 'react';
import { FullScreen } from '..';
import cls from '../index.module.less';

interface TemplateProps {
  financial: IFinancial;
  onFinished?: () => void;
  onSaved?: () => void;
  onCancel?: () => void;
}

export const DepreciationTemplate: React.FC<TemplateProps> = (props) => {
  const [center, setCenter] = useState(<></>);
  const [form] = AntForm.useForm<schema.XConfiguration>();
  const [methodItems, setMethodItems] = useState<schema.XSpeciesItem[]>([]);
  const [statusItems, setStatusItems] = useState<schema.XSpeciesItem[]>([]);
  const loadSpeciesItems = async (
    prop: schema.XProperty,
    setter: (items: schema.XSpeciesItem[]) => void,
  ) => {
    const species = await props.financial.loadSpecies([prop]);
    const item = species['T' + prop.id];
    if (item) {
      setter(item.speciesItems);
    }
  };
  const onSelect = (key: string, type: string = '数值型') => {
    setCenter(
      <OpenFileDialog
        accepts={[type]}
        rootKey={props.financial.space.directory.key}
        onOk={(files: IFile[]) => {
          if (files.length > 0) {
            form.setFieldValue(key, files[0].metadata);
          }
          setCenter(<></>);
        }}
        onCancel={() => {
          setCenter(<></>);
        }}
      />,
    );
  };
  const onMethodSelected = (key: string, multiple: boolean) => {
    setCenter(
      <OpenFileDialog
        accepts={key == 'dimensions' ? ['变更源'] : ['选择型', '分类型']}
        rootKey={props.financial.space.directory.key}
        multiple={multiple}
        onOk={(files: IFile[]) => {
          if (files.length > 0) {
            if (multiple) {
              const fields = files.map((item) => item.metadata);
              form.setFieldValue(key, fields);
            } else {
              const property = files[0].metadata as schema.XProperty;
              form.setFieldValue(key, property);
              if (property.speciesId) {
                switch (key) {
                  case 'depreciationMethod':
                    loadSpeciesItems(property, setMethodItems);
                    break;
                  case 'depreciationStatus':
                    loadSpeciesItems(property, setStatusItems);
                    break;
                }
              }
            }
          }
          setCenter(<></>);
        }}
        onCancel={function (): void {
          setCenter(<></>);
        }}
      />,
    );
  };
  useEffect(() => {
    const method = props.financial.configuration.metadata?.depreciationMethod;
    const status = props.financial.configuration.metadata?.depreciationStatus;
    if (method && method.speciesId) {
      loadSpeciesItems(method, setMethodItems);
    }
    if (status && status.speciesId) {
      loadSpeciesItems(status, setStatusItems);
    }
  }, []);
  return (
    <FullScreen
      title={'折旧模板配置'}
      onFinished={props.onFinished}
      onCancel={props.onCancel}
      onSave={async () => {
        const validated = await form.validateFields();
        await props.financial.configuration.setMetadata(validated);
        if (props.onSaved) {
          props.onSaved();
        } else {
          props.onFinished?.();
        }
      }}>
      <AntForm<schema.XConfiguration>
        form={form}
        initialValues={props.financial.configuration.metadata}>
        <Card title="平均年限法">
          <Card title={'公式定义'}>
            <Space direction="vertical">
              <Space>
                <ValueText value={'统计维度'} />
                <SymbolText value="=" />
                <FormItem
                  name="dimensions"
                  rules={[{ required: true, message: '请选择统计维度！' }]}>
                  <FieldText
                    field="dimensions"
                    label={form
                      .getFieldValue('dimensions')
                      ?.map((item: any) => item.name)
                      .join(',')}
                    onSelect={(key) => onMethodSelected(key, true)}
                    form={form}
                  />
                </FormItem>
              </Space>
              <Space>
                <FormItem
                  name="depreciationMethod"
                  rules={[{ required: true, message: '请绑定折旧方式！' }]}>
                  <FieldText
                    field="depreciationMethod"
                    label="折旧方式"
                    onSelect={(key) => onMethodSelected(key, false)}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <FormItem
                  name="yearAverageMethod"
                  rules={[{ required: true, message: '请绑定折旧方法！' }]}>
                  <Select
                    allowClear
                    style={{ width: 200 }}
                    placeholder="选择平均年限法"
                    options={methodItems.map((item) => {
                      return {
                        label: item.name,
                        value: item.id,
                      };
                    })}
                  />
                </FormItem>
              </Space>
              <Space>
                <FormItem
                  name="depreciationStatus"
                  rules={[{ required: true, message: '请选择折旧状态！' }]}>
                  <FieldText
                    field="depreciationStatus"
                    label="折旧状态"
                    onSelect={(key) => onMethodSelected(key, false)}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <FormItem
                  name="accruingStatus"
                  rules={[{ required: true, message: '请选择计提状态中状态！' }]}>
                  <Select
                    allowClear
                    style={{ width: 200 }}
                    placeholder="计提中状态"
                    options={statusItems.map((item) => {
                      return {
                        label: item.name,
                        value: item.id,
                      };
                    })}
                  />
                </FormItem>
                <SymbolText value="|" />
                <FormItem
                  name="accruedStatus"
                  rules={[{ required: true, message: '请选择计提完成状态！' }]}>
                  <Select
                    allowClear
                    style={{ width: 200 }}
                    placeholder="完成计提状态"
                    options={statusItems.map((item) => {
                      return {
                        label: item.name,
                        value: item.id,
                      };
                    })}
                  />
                </FormItem>
              </Space>
              <Space>
                <FormItem
                  name="netWorth"
                  rules={[{ required: true, message: '请绑定净值！' }]}>
                  <FieldText
                    field="netWorth"
                    label="净值"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <FormItem
                  name="originalValue"
                  rules={[{ required: true, message: '请绑定原值！' }]}>
                  <FieldText
                    field="originalValue"
                    label="原值"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="-" />
                <FormItem
                  name="accumulatedDepreciation"
                  rules={[{ required: true, message: '请绑定累计折旧！' }]}>
                  <FieldText
                    field="accumulatedDepreciation"
                    label="累计折旧"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
              </Space>
              <Space>
                <FormItem
                  name="monthlyDepreciationAmount"
                  rules={[{ required: true, message: '请绑定月折旧额！' }]}>
                  <FieldText
                    field="monthlyDepreciationAmount"
                    label="月折旧额"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <FormItem
                  name="originalValue"
                  rules={[{ required: true, message: '请绑定原值！' }]}>
                  <FieldText
                    field="originalValue"
                    label="原值"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="/" />
                <FormItem
                  name="usefulLife"
                  rules={[{ required: true, message: '请绑定使用年限！' }]}>
                  <FieldText
                    field="usefulLife"
                    label="使用年限"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
              </Space>
              <Space>
                <FormItem
                  name="accumulatedDepreciation"
                  rules={[{ required: true, message: '请绑定累计折旧！' }]}>
                  <FieldText
                    field="accumulatedDepreciation"
                    label="累计折旧"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <FormItem
                  name="accumulatedDepreciation"
                  rules={[{ required: true, message: '请绑定累计折旧！' }]}>
                  <FieldText
                    field="accumulatedDepreciation"
                    label="累计折旧"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="+" />
                <FormItem
                  name="monthlyDepreciationAmount"
                  rules={[{ required: true, message: '请绑定月折旧额！' }]}>
                  <FieldText
                    field="monthlyDepreciationAmount"
                    label="月折旧额"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
              </Space>
              <Space>
                <FormItem
                  name="accruedMonths"
                  rules={[{ required: true, message: '请绑定已计提月份！' }]}>
                  <FieldText
                    field="accruedMonths"
                    label="已计提月份"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <ValueText value={'当前业务日期'} />
                <SymbolText value="-" />
                <FormItem
                  name="startDate"
                  rules={[{ required: true, message: '请绑定开始计算日期！' }]}>
                  <FieldText
                    field="startDate"
                    label="开始计算日期"
                    onSelect={(key) => onSelect(key, '日期型')}
                    form={form}
                  />
                </FormItem>
              </Space>
            </Space>
          </Card>
        </Card>
        <Card title="平均年限法（二）">
          <Card title={'公式定义'}>
            <Space direction="vertical">
              <Space>
                <ValueText value={'统计维度'} />
                <SymbolText value="=" />
                <FormItem
                  name="dimensions"
                  rules={[{ required: true, message: '请选择统计维度！' }]}>
                  <FieldText
                    field="dimensions"
                    label={form
                      .getFieldValue('dimensions')
                      ?.map((item: any) => item.name)
                      .join(',')}
                    onSelect={(key) => onMethodSelected(key, true)}
                    form={form}
                  />
                </FormItem>
              </Space>
              <Space>
                <FormItem
                  name="depreciationMethod"
                  rules={[{ required: true, message: '请绑定折旧方式！' }]}>
                  <FieldText
                    field="depreciationMethod"
                    label="折旧方式"
                    onSelect={(key) => onMethodSelected(key, false)}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <FormItem
                  name="yearAverageMethod2"
                  rules={[{ required: true, message: '请绑定折旧方法！' }]}>
                  <Select
                    allowClear
                    style={{ width: 200 }}
                    placeholder="选择平均年限法"
                    options={methodItems.map((item) => {
                      return {
                        label: item.name,
                        value: item.id,
                      };
                    })}
                  />
                </FormItem>
              </Space>
              <Space>
                <FormItem
                  name="depreciationStatus"
                  rules={[{ required: true, message: '请选择折旧状态！' }]}>
                  <FieldText
                    field="depreciationStatus"
                    label="折旧状态"
                    onSelect={(key) => onMethodSelected(key, false)}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <FormItem
                  name="accruingStatus"
                  rules={[{ required: true, message: '请选择计提状态中状态！' }]}>
                  <Select
                    allowClear
                    style={{ width: 200 }}
                    placeholder="计提中状态"
                    options={statusItems.map((item) => {
                      return {
                        label: item.name,
                        value: item.id,
                      };
                    })}
                  />
                </FormItem>
                <SymbolText value="|" />
                <FormItem
                  name="accruedStatus"
                  rules={[{ required: true, message: '请选择计提完成状态！' }]}>
                  <Select
                    allowClear
                    style={{ width: 200 }}
                    placeholder="完成计提状态"
                    options={statusItems.map((item) => {
                      return {
                        label: item.name,
                        value: item.id,
                      };
                    })}
                  />
                </FormItem>
              </Space>
              <Space>
                <FormItem
                  name="netWorth"
                  rules={[{ required: true, message: '请绑定净值！' }]}>
                  <FieldText
                    field="netWorth"
                    label="净值"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <FormItem
                  name="originalValue"
                  rules={[{ required: true, message: '请绑定原值！' }]}>
                  <FieldText
                    field="originalValue"
                    label="原值"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="-" />
                <FormItem
                  name="accumulatedDepreciation"
                  rules={[{ required: true, message: '请绑定累计折旧！' }]}>
                  <FieldText
                    field="accumulatedDepreciation"
                    label="累计折旧"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
              </Space>
              <Space>
                <FormItem
                  name="monthlyDepreciationAmount"
                  rules={[{ required: true, message: '请绑定月折旧额！' }]}>
                  <FieldText
                    field="monthlyDepreciationAmount"
                    label="月折旧额"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <SymbolText value="(" />
                <FormItem
                  name="netWorth"
                  rules={[{ required: true, message: '请绑定净值！' }]}>
                  <FieldText
                    field="netWorth"
                    label="净值"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="-" />
                <FormItem
                  name="residualVal"
                  rules={[{ required: true, message: '请绑定净残值！' }]}>
                  <FieldText
                    field="residualVal"
                    label="净残值"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value=")" />
                <SymbolText value="/" />
                <SymbolText value="[" />
                <FormItem
                  name="usefulLife"
                  rules={[{ required: true, message: '请绑定使用年限！' }]}>
                  <FieldText
                    field="usefulLife"
                    label="使用年限"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="-" />
                <SymbolText value="(" />
                <ValueText value={'当前业务日期'} />
                <SymbolText value="-" />
                <FormItem
                  name="startDate"
                  rules={[{ required: true, message: '请绑定开始计算日期！' }]}>
                  <FieldText
                    field="startDate"
                    label="开始计算日期"
                    onSelect={(key) => onSelect(key, '日期型')}
                    form={form}
                  />
                </FormItem>
                <SymbolText value=")" />
                <SymbolText value="]" />
              </Space>
              <Space>
                <FormItem
                  name="accumulatedDepreciation"
                  rules={[{ required: true, message: '请绑定累计折旧！' }]}>
                  <FieldText
                    field="accumulatedDepreciation"
                    label="累计折旧"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <FormItem
                  name="accumulatedDepreciation"
                  rules={[{ required: true, message: '请绑定累计折旧！' }]}>
                  <FieldText
                    field="accumulatedDepreciation"
                    label="累计折旧"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="+" />
                <FormItem
                  name="monthlyDepreciationAmount"
                  rules={[{ required: true, message: '请绑定月折旧额！' }]}>
                  <FieldText
                    field="monthlyDepreciationAmount"
                    label="月折旧额"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
              </Space>
              <Space>
                <FormItem
                  name="accruedMonths"
                  rules={[{ required: true, message: '请绑定已计提月份！' }]}>
                  <FieldText
                    field="accruedMonths"
                    label="已计提月份"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <ValueText value={'当前业务日期'} />
                <SymbolText value="-" />
                <FormItem
                  name="startDate"
                  rules={[{ required: true, message: '请绑定开始计算日期！' }]}>
                  <FieldText
                    field="startDate"
                    label="开始计算日期"
                    onSelect={(key) => onSelect(key, '日期型')}
                    form={form}
                  />
                </FormItem>
              </Space>
              <Space>
                <FormItem
                  name="residualVal"
                  rules={[{ required: true, message: '请绑定净残值！' }]}>
                  <FieldText
                    field="residualVal"
                    label="净残值"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <FormItem
                  name="originalValue"
                  rules={[{ required: true, message: '请绑定原值！' }]}>
                  <FieldText
                    field="originalValue"
                    label="原值"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="*" />
                <FormItem
                  name="residualRate"
                  rules={[{ required: true, message: '请绑定净残值率！' }]}>
                  <FieldText
                    field="residualRate"
                    label="净残值率"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
              </Space>
            </Space>
          </Card>
        </Card>
      </AntForm>
      {center}
    </FullScreen>
  );
};

interface DesignProps {
  field: keyof schema.XConfiguration;
  label: string;
  form: FormInstance<schema.XConfiguration>;
  onSelect: (key: string) => void;
}

export const FieldText: React.FC<DesignProps> = (props) => {
  return (
    <Tooltip title={props.label}>
      <div
        style={{ width: 200 }}
        className={cls.designText}
        onClick={() => props.onSelect(props.field)}>
        <div className={cls.textOverflow}>{props.label}</div>
        {props.form.getFieldValue(props.field) ? (
          <Tag color="green">已绑定</Tag>
        ) : (
          <Tag color="red">未绑定</Tag>
        )}
      </div>
    </Tooltip>
  );
};

export const ValueText: React.FC<{ value: any }> = (props) => {
  return (
    <Tooltip>
      <div style={{ width: 200 }} className={cls.designText}>
        <div className={cls.textOverflow}>{props.value}</div>
      </div>
    </Tooltip>
  );
};

export const SymbolText: React.FC<{ value: string }> = (props) => {
  return <div style={{ width: 10, textAlign: 'center' }}>{props.value}</div>;
};
