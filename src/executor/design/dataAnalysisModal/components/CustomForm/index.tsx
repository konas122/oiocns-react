import { IForm } from '@/ts/core';
import {
  DownloadOutlined,
  DownOutlined,
  FundProjectionScreenOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  UpOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Spin,
  Tooltip,
  Skeleton,
} from 'antd';
import React, { useMemo, useState, useEffect } from 'react';
import { FieldInfo } from 'typings/globelType';
import { chartType2D, chartType3D } from '../../config';
import { getFilterOperations, isObject } from '../../utils';
const { RangePicker } = DatePicker;
const { Option } = Select;

interface IProps {
  current: IForm;
  isCaptureContent: boolean;
  formData: any;
  loading: boolean;
  loaded: boolean;
  chart?: any;
  fields: FieldInfo[];
  onSave?: Function;
  onShowView: Function;
  onSetCaptureContent: Function;
  onUpdateFormData: Function;
  onResetFormData: Function;
  onUpdateChart: Function;
}

/**
 * 数据分析-自定义表单
 * @returns
 */
const CustomForm: React.FC<IProps> = ({
  isCaptureContent,
  formData,
  fields,
  loaded,
  chart,
  loading,
  onSave,
  onShowView,
  onSetCaptureContent,
  onUpdateFormData,
  onResetFormData,
  onUpdateChart,
}) => {
  // 用于存储每个字段的条件选项
  const [conditionsOptions, setConditionsOptions] = useState<any>({});
  // 散列纬度
  const [scatterDimensionRaw, setScatterDimensionRaw] = useState<any>(null);
  // 散列纬度指标
  const [scatterDimensionIndex, setScatterDimensionIndex] = useState<any>(null);
  // 平铺纬度
  const [flattenDimensionRaw, setFlattenDimensionRaw] = useState<any>(null);
  // 汇总纬度
  const [aggregateDimensionRaw, setAggregateDimensionRaw] = useState<any>(null);
  // 汇总纬度指标
  const [aggregateDimensionIndex, setAggregateDimensionIndex] =
    useState<any>('totalValue');
  const mode = formData['mode'];
  const [expand, setExpand] = useState(false);
  const [form] = Form.useForm();

  // 散列纬度-平铺纬度 数据源
  const scatterDimensionAndFlattenDimensionList = useMemo(() => {
    if (!Array.isArray(fields) || fields.length === 0) return [];
    return fields.filter(
      (item) => item.fieldType !== '附件型' && item.fieldType !== '引用型',
    );
  }, [fields]);

  // 汇总纬度
  const aggregateDimensionList = useMemo(() => {
    if (!Array.isArray(fields) || fields.length === 0) return [];
    return fields.filter(
      (item) => item.fieldType === '数值型' || item.fieldType === '货币型',
    );
  }, [fields]);

  useEffect(() => {
    if (formData) {
      const {
        mode,
        flattenDimension,
        flattenDimensionRaw,
        scatterDimension,
        scatterDimensionRaw,
        scatterDimensionIndex,
        aggregateDimension,
        aggregateDimensionRaw,
        aggregateDimensionIndex,
        conditions,
      } = formData;
      setScatterDimensionRaw(scatterDimensionRaw);
      setFlattenDimensionRaw(flattenDimensionRaw);
      setAggregateDimensionRaw(aggregateDimensionRaw);
      setAggregateDimensionIndex(aggregateDimensionIndex ?? 'totalValue');

      if (scatterDimensionIndex) {
        setScatterDimensionIndex(scatterDimensionIndex);
      } else {
        if (
          scatterDimensionRaw?.fieldType === '时间型' ||
          scatterDimensionRaw?.fieldType === '日期型'
        ) {
          setScatterDimensionIndex('year');
        } else {
          setScatterDimensionIndex(10);
        }
      }
      if (Array.isArray(conditions) && conditions.length > 0 && loaded) {
        let conditionsOptions: any = {};
        conditions.forEach((item, index) => {
          const itm = fields.filter((d) => d.dataField === item.attribute);
          const fieldType: any = itm.length > 0 ? itm[0]['fieldType'] : '';
          conditionsOptions[index] = {
            content: itm.length > 0 ? itm[0] : null,
            conditions: getFilterOperations(fieldType) || [], // 条件选项依据属性字段不同而变化
          };
        });
        setConditionsOptions(conditionsOptions);
      }
      form.setFieldsValue({
        mode,
        flattenDimension,
        scatterDimension,
        aggregateDimension,
        conditions,
      });
    }
  }, [formData, loaded]);

  // 自定义过滤组件
  const CustomFilter = () => {
    // 添加新条件时的处理函数
    const handleAddCondition = (formFields: any, add: Function) => {
      if (Array.isArray(fields) && fields.length > 0) {
        const item = fields[0];
        handleAttributeChange(formFields.length, item.id);
        add({
          attribute: item.id,
          condition: 'contains',
        });
      }
    };
    // 处理属性选择变化的函数
    const handleAttributeChange = (fieldName: number, value: any) => {
      const item = fields.filter((item) => item.dataField === value);
      const fieldType: any = item.length > 0 ? item[0]['fieldType'] : '';
      // 根据选中的属性更新条件选项
      setConditionsOptions({
        ...conditionsOptions,
        [fieldName]: {
          content: item.length > 0 ? item[0] : null,
          conditions: getFilterOperations(fieldType) || [], // 条件选项依据属性字段不同而变化
        },
      });
      resetField(fieldName, {
        condition: ['描述型', '引用型', '对象型', '办事流程'].includes(fieldType)
          ? 'contains'
          : '=',
        value: undefined,
      });
    };

    // 处理条件变化的函数
    const handleConditionsChange = (fieldName: any, value: any) => {
      try {
        // 根据选中的属性更新条件选项
        setConditionsOptions({
          ...conditionsOptions,
          [fieldName]: {
            ...conditionsOptions[fieldName],
            condition: value,
          },
        });
        resetField(fieldName, {
          value: undefined,
        });
      } catch (error) {
        console.log('error', error);
      }
    };

    // 重置某些字段
    const resetField = (fieldName: any, params: object) => {
      const tempConditions = form.getFieldValue('conditions');
      if (tempConditions) {
        // 清空相应的 condition 字段
        form.setFieldsValue({
          conditions: tempConditions.map((condition: any, index: number) => {
            if (index === fieldName) {
              return {
                ...condition,
                ...params,
              };
            }
            return condition;
          }),
        });
      }
    };

    const setConditionValue = (
      value: number | string,
      fieldKey: number,
      index: number,
    ) => {
      const conditions = form.getFieldValue('conditions');
      let fieldValues = conditions[fieldKey]['value'];
      if (fieldValues && Array.isArray(fieldValues)) {
        fieldValues[index] = value;
      } else {
        fieldValues = [value];
      }
      conditions[fieldKey]['value'] = fieldValues;
      form.setFieldsValue({
        conditions: conditions,
      });
    };

    // 根据属性类型和条件返回相应的元素
    const getValueDom = (field: any) => {
      try {
        const { fieldType, lookup } = conditionsOptions?.[field.name]?.['content'];
        const condition = conditionsOptions?.[field.name]?.['condition'];
        if (['描述型', '用户型', '引用型', '办事流程'].includes(fieldType)) {
          return <Input style={{ width: '100%' }} placeholder="<输入值>" />;
        } else if (fieldType === '时间型' || fieldType === '日期型') {
          const isShowTime = fieldType === '时间型' ? true : false;
          if (condition === 'between') {
            return <RangePicker style={{ width: '100%' }} showTime={isShowTime} />;
          } else {
            return <DatePicker style={{ width: '100%' }} showTime={isShowTime} />;
          }
        } else if (fieldType === '数值型' || fieldType === '货币型') {
          if (condition === 'between') {
            const conditions = form.getFieldValue('conditions');
            let fieldValues = conditions[field.fieldKey]['value'];
            const [minValue, maxValue] = Array.isArray(fieldValues) ? fieldValues : [];
            return (
              <Input.Group compact>
                <Input
                  style={{ width: 'calc(50% - 15px)', textAlign: 'center' }}
                  placeholder="最小值"
                  defaultValue={minValue}
                  onChange={(event) => {
                    const value = event.target.value;
                    setConditionValue(value, field.fieldKey, 0);
                  }}
                />
                <Input
                  className="site-input-split"
                  style={{
                    width: 30,
                    borderLeft: 0,
                    borderRight: 0,
                    pointerEvents: 'none',
                  }}
                  placeholder="~"
                  disabled
                />
                <Input
                  className="site-input-right"
                  style={{
                    width: 'calc(50% - 15px)',
                    textAlign: 'center',
                  }}
                  defaultValue={maxValue}
                  placeholder="最大值"
                  onChange={(event) => {
                    const value = event.target.value;
                    setConditionValue(value, field.fieldKey, 1);
                  }}
                />
              </Input.Group>
            );
          } else {
            return <InputNumber style={{ width: '100%' }} />;
          }
        } else if (fieldType === '选择型' || fieldType === '分类型') {
          if (lookup) {
            const dataSource = lookup?.dataSource;
            return (
              <Select style={{ width: '100%' }} placeholder="请选择">
                {Array.isArray(dataSource) && dataSource.length > 0 && (
                  <>
                    {dataSource.map((item) => (
                      <Option key={item.id} value={item.value}>
                        {item.text}
                      </Option>
                    ))}
                  </>
                )}
              </Select>
            );
          }
        }
      } catch (error) {
        console.log('error', error);
      }
    };

    return (
      <div
        style={{
          display: 'flex',
        }}>
        <div style={{ width: 72, color: 'rgba(0, 0, 0, 0.45)' }}>过滤条件：</div>
        <div style={{ flex: 1 }}>
          <Form.List
            name="conditions"
            rules={[
              {
                validator: async (_, names) => {
                  if (!names || names.length < 1) {
                    // return Promise.reject(new Error('至少添加一个过滤条件'));
                  }
                },
              },
            ]}>
            {(formFields, { add, remove }, { errors }) => (
              <>
                <Row gutter={24}>
                  {formFields.map(
                    (field, index) =>
                      (!expand || index < 1) && (
                        <Col
                          key={field.key}
                          span={8}
                          style={{
                            display: 'flex',
                            width: '100%',
                            height: 48,
                          }}>
                          <Form.Item
                            style={{
                              width: '100%',
                            }}>
                            <Row gutter={8}>
                              {/* 属性字段 */}
                              <Col span={8}>
                                <Form.Item
                                  name={[field.name, 'attribute']}
                                  rules={[{ required: true, message: '请选择属性' }]}>
                                  <Select
                                    placeholder="请选择属性"
                                    style={{ width: '100%' }}
                                    dropdownMatchSelectWidth={false}
                                    onChange={(value) =>
                                      handleAttributeChange(field.name, value)
                                    }>
                                    {fields.map((item) => (
                                      <Option
                                        key={item.id}
                                        value={item.dataField}
                                        style={{
                                          whiteSpace: 'normal',
                                          wordBreak: 'break-all',
                                        }}>
                                        {item.caption}
                                      </Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                              </Col>
                              {/* 条件字段 */}
                              <Col span={6}>
                                <Form.Item
                                  name={[field.name, 'condition']}
                                  rules={[{ required: true, message: '请选择条件' }]}>
                                  <Select
                                    placeholder="请选择条件"
                                    dropdownMatchSelectWidth={false}
                                    style={{
                                      width: '100%',
                                      whiteSpace: 'normal',
                                      textOverflow: 'clip', // 防止选中后文本显示省略号
                                      overflow: 'visible', // 允许溢出内容
                                    }}
                                    showArrow={false}
                                    onChange={(value) =>
                                      handleConditionsChange(field.name, value)
                                    }>
                                    {(
                                      conditionsOptions?.[field.name]?.['conditions'] ||
                                      []
                                    ).map((item: any) => (
                                      <Option
                                        key={item.id}
                                        value={item.value}
                                        style={{
                                          whiteSpace: 'normal',
                                          wordBreak: 'break-all',
                                        }}>
                                        {item.name}
                                      </Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                              </Col>

                              {/* 值字段 */}
                              <Col span={10}>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                  }}>
                                  <Form.Item
                                    name={[field.name, 'value']}
                                    rules={[{ required: true, message: '请输入值' }]}
                                    style={{ flex: 1 }}>
                                    {getValueDom(field)}
                                  </Form.Item>
                                  {/* 删除按钮 */}
                                  {!isCaptureContent && (
                                    <MinusCircleOutlined
                                      style={{
                                        fontSize: 18,
                                        marginTop: -24,
                                        marginLeft: 8,
                                      }}
                                      onClick={() => remove(field.name)}
                                    />
                                  )}
                                </div>
                              </Col>
                            </Row>
                          </Form.Item>
                        </Col>
                      ),
                  )}
                  {/* 添加按钮 */}
                  <Col span={4}>
                    {!isCaptureContent && (
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => handleAddCondition(formFields, add)}
                          style={{
                            width: 140,
                          }}
                          icon={<PlusOutlined />}>
                          添加过滤条件
                        </Button>
                        <Form.ErrorList errors={errors} />
                      </Form.Item>
                    )}
                  </Col>
                </Row>
              </>
            )}
          </Form.List>
        </div>
      </div>
    );
  };

  const handleReset = (mode?: string) => {
    setScatterDimensionRaw(null);
    setFlattenDimensionRaw(null);
    setAggregateDimensionRaw(null);
    onUpdateFormData({
      mode: mode ?? '2d',
      aggregateDimension: null,
      aggregateDimensionIndex: null,
      aggregateDimensionRaw: null,
      chartType: mode ? (mode === '2d' ? 'PieChart' : 'LineChart') : 'PieChart',
      conditions: null,
      scatterDimension: null,
      flattenDimension: null,
      flattenDimensionRaw: null,
      scatterDimensionIndex: null,
      scatterDimensionRaw: 'null',
      thumbnail: mode
        ? mode === '2d'
          ? chartType2D[0]['img']
          : chartType3D[0]['img']
        : chartType2D[0]['img'],
    });
    form.resetFields();
  };

  return (
    <>
      {loaded ? (
        <Form
          form={form}
          onFinish={(event) => {
            onUpdateChart &&
              onUpdateChart({
                scatterDimensionRaw,
                scatterDimensionIndex,
                flattenDimensionRaw,
                aggregateDimensionRaw,
                aggregateDimensionIndex,
                ...event,
              });
          }}
          onValuesChange={(event) => {
            if ('mode' in event) {
              const mode = event['mode'];
              handleReset(mode);
            }
          }}>
          <Row gutter={24}>
            <Col span={mode === '2d' ? 6 : 3}>
              <Form.Item
                name="mode"
                label="模式"
                rules={[{ required: false, message: '请选择纬度！' }]}>
                <Select placeholder="请选择" style={{ width: '100%' }}>
                  <Option value="2d">二维</Option>
                  <Option value="3d">三纬</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={mode === '2d' ? 6 : 5}>
              <Form.Item
                name="scatterDimension"
                label="散列纬度"
                rules={[{ required: false, message: '请选择散列纬度！' }]}>
                <Input.Group compact>
                  <Select
                    defaultValue={formData['scatterDimension'] || undefined}
                    placeholder="请选择"
                    style={{
                      width:
                        (isObject(scatterDimensionRaw) &&
                          scatterDimensionRaw?.fieldType === '时间型') ||
                        scatterDimensionRaw?.fieldType === '日期型' ||
                        scatterDimensionRaw?.fieldType === '数值型' ||
                        scatterDimensionRaw?.fieldType === '货币型'
                          ? '60%'
                          : '100%',
                    }}
                    onChange={(value) => {
                      const res = scatterDimensionAndFlattenDimensionList.filter(
                        (item) => item.dataField === value,
                      );
                      if (Array.isArray(res) && res.length > 0) {
                        const obj = res[0];
                        const fieldType = obj['fieldType'];
                        if (fieldType === '时间型' || fieldType === '日期型') {
                          setScatterDimensionIndex('year');
                        } else if (fieldType === '数值型' || fieldType === '货币型') {
                          setScatterDimensionIndex(10);
                        }
                        setScatterDimensionRaw(obj);
                      }
                      form && form.setFieldValue('scatterDimension', value);
                    }}>
                    {Array.isArray(scatterDimensionAndFlattenDimensionList) &&
                      scatterDimensionAndFlattenDimensionList.length > 0 &&
                      scatterDimensionAndFlattenDimensionList.map((item) => (
                        <Option key={item.id} value={item.dataField}>
                          {item.caption}
                        </Option>
                      ))}
                  </Select>

                  {isObject(scatterDimensionRaw) && (
                    <>
                      {(scatterDimensionRaw?.fieldType === '时间型' ||
                        scatterDimensionRaw?.fieldType === '日期型') && (
                        <Select
                          style={{ width: '40%' }}
                          value={scatterDimensionIndex}
                          onChange={(value: any) => {
                            setScatterDimensionIndex(value);
                          }}>
                          <Option value="year">年</Option>
                          <Option value="month">月</Option>
                          <Option value="day">日</Option>

                          {scatterDimensionRaw?.fieldType === '时间型' && (
                            <>
                              <Option value="hour">时</Option>
                              <Option value="minute">分</Option>
                              <Option value="second">秒</Option>
                            </>
                          )}
                        </Select>
                      )}

                      {/* 数值型 ｜ 货币型显示 步长设置 */}
                      {(scatterDimensionRaw?.fieldType === '数值型' ||
                        scatterDimensionRaw?.fieldType === '货币型') && (
                        <InputNumber
                          name="stepLength"
                          style={{ width: '40%' }}
                          min={1}
                          max={100000}
                          value={scatterDimensionIndex}
                          onChange={(value) => {
                            setScatterDimensionIndex(value);
                          }}
                        />
                      )}
                    </>
                  )}
                </Input.Group>
              </Form.Item>
            </Col>

            {/* 二维没有平铺纬度 */}
            {formData['mode'] === '3d' && (
              <Col span={mode === '2d' ? 6 : 5}>
                <Form.Item
                  name="flattenDimension"
                  label="平铺纬度"
                  rules={[{ required: false, message: '请选择平铺纬度！' }]}>
                  <Select
                    placeholder="请选择"
                    style={{
                      width: '100%',
                    }}
                    onChange={(value) => {
                      const res = scatterDimensionAndFlattenDimensionList.filter(
                        (item) => item.dataField === value,
                      );
                      if (Array.isArray(res) && res.length > 0) {
                        const obj = res[0];
                        setFlattenDimensionRaw(obj);
                      }
                    }}>
                    {Array.isArray(scatterDimensionAndFlattenDimensionList) &&
                      scatterDimensionAndFlattenDimensionList.length > 0 &&
                      scatterDimensionAndFlattenDimensionList.map((item) => (
                        <Option key={item.id} value={item.dataField}>
                          {item.caption}
                        </Option>
                      ))}
                  </Select>
                </Form.Item>
              </Col>
            )}

            <Col span={mode === '2d' ? 6 : 5}>
              <Form.Item
                name="aggregateDimension"
                label="汇总纬度"
                rules={[{ required: false, message: '请选择汇总纬度！' }]}>
                <Input.Group compact>
                  <Select
                    defaultValue={formData['aggregateDimension'] || undefined}
                    placeholder="请选择"
                    style={{
                      width: isObject(aggregateDimensionRaw) ? '60%' : '100%',
                    }}
                    onChange={(value) => {
                      if (value !== 'count') {
                        const res = aggregateDimensionList.filter(
                          (item) => item.dataField === value,
                        );
                        if (Array.isArray(res) && res.length > 0) {
                          const obj = res[0];
                          setAggregateDimensionRaw(obj);
                        }
                      } else {
                        setAggregateDimensionRaw(null);
                      }
                      form && form.setFieldValue('aggregateDimension', value);
                    }}>
                    <Option key="count" value="count">
                      数量
                    </Option>

                    {Array.isArray(aggregateDimensionList) &&
                      aggregateDimensionList.length > 0 &&
                      aggregateDimensionList.map((item) => (
                        <Option key={item.id} value={item.dataField}>
                          {item.caption}
                        </Option>
                      ))}
                  </Select>

                  {isObject(aggregateDimensionRaw) && (
                    <Select
                      style={{ width: '40%' }}
                      defaultValue={formData['aggregateDimensionIndex'] ?? 'totalValue'}
                      onChange={(value: any) => {
                        setAggregateDimensionIndex(value);
                      }}>
                      <Option value="totalValue">汇总值</Option>
                      <Option value="averageValue">平均值</Option>
                      <Option value="maxValue">最大值</Option>
                      <Option value="minValue">最小值</Option>
                    </Select>
                  )}
                </Input.Group>
              </Form.Item>
            </Col>

            {!isCaptureContent && (
              <Col
                span={6}
                style={{
                  display: 'flex',
                }}>
                <Button loading={loading} type="primary" htmlType="submit">
                  生成图表
                </Button>

                <Button
                  style={{ margin: '0 8px' }}
                  onClick={() => {
                    setConditionsOptions(null);
                    onResetFormData && onResetFormData();
                    handleReset();
                  }}>
                  重置
                </Button>
                {chart && (
                  <Button
                    style={{ marginRight: 8 }}
                    loading={loading}
                    type="primary"
                    ghost
                    onClick={() => onSave && onSave()}>
                    保存
                  </Button>
                )}
                <div style={{ fontSize: 12, marginTop: 8 }}>
                  <a
                    onClick={() => {
                      setExpand(!expand);
                    }}>
                    {expand ? <UpOutlined /> : <DownOutlined />}{' '}
                    {expand ? '展开面板' : '收起面板'}
                  </a>

                  {!chart && (
                    <>
                      <Divider type="vertical" />
                      <Tooltip title="推送到模板">
                        <FundProjectionScreenOutlined
                          onClick={() => {
                            onShowView && onShowView();
                          }}
                        />
                      </Tooltip>
                      <Divider type="vertical" />
                      <Tooltip title="导出成图片">
                        <DownloadOutlined
                          onClick={() => {
                            setExpand(false);
                            onSetCaptureContent && onSetCaptureContent();
                          }}
                        />
                      </Tooltip>
                    </>
                  )}
                </div>
              </Col>
            )}

            {!expand && fields && (
              <Col span={24}>
                <CustomFilter />
              </Col>
            )}
          </Row>
        </Form>
      ) : (
        <Spin tip="Loading...">
          <Skeleton />
        </Spin>
      )}
    </>
  );
};
export default CustomForm;
