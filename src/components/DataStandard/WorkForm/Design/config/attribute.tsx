import { Emitter } from '@/ts/base/common';
import { IForm, TargetType } from '@/ts/core';
import { Form, DropDownBox, TreeView } from 'devextreme-react';
import { GroupItem, SimpleItem } from 'devextreme-react/form';
import React, { useEffect, useState, createRef, useCallback } from 'react';
import { getWidget, loadwidgetOptions } from '../../Utils';
import { schema } from '@/ts/base';
import TreeSelectItem from '../../Viewer/customItem/treeItem';
import OpenFileDialog from '@/components/OpenFileDialog';
import AttributeSetting from './formRule/setting/attributeSetting';
import FormSettting from './formRule/setting/formSettting';
import { Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import CalcRuleModal from './formRule/modal/calcRule';
import { model } from '@/ts/base';
import { FieldInfo } from 'typings/globelType';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import AttrAutoGenerateVal from './formRule/setting/attrAutoGenerateVal';
import { DropDownBoxTypes } from 'devextreme-react/drop-down-box';
import { MemberFilter } from '@/ts/core/public/consts';
import { ValueChangedEvent } from 'devextreme/ui/text_box';
import { DisplayType, DistplayTypeItems } from '@/utils/work';
import SearchTargetItem from '../../Viewer/customItem/searchTarget';

interface IAttributeProps {
  index: number;
  current: IForm;
  notifyEmitter: Emitter;
}

const AttributeConfig: React.FC<IAttributeProps> = ({
  current,
  notifyEmitter,
  index,
}) => {
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [loaded] = useAsyncLoad(async () => {
    const resultFields = await current.loadFields();
    const ss = resultFields.map((a) => {
      switch (a.valueType) {
        case '数值型':
        case '货币型':
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            dataType: 'number',
            fieldType: a.valueType,
          };
        case '日期型':
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            dataType: 'date',
            fieldType: '日期型',
          };
        case '时间型':
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            dataType: 'datetime',
            fieldType: '时间型',
          };
        case '选择型':
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            fieldType: '选择型',
            dataType: 'string',
            lookup: {
              displayExpr: 'text',
              valueExpr: 'value',
              allowClearing: true,
              dataSource: a.lookups,
            },
          };
        case '分类型':
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            fieldType: '分类型',
            dataType: 'string',
            filterOperations: ['sequal', 'snotequal'],
            lookup: {
              displayExpr: 'text',
              valueExpr: 'value',
              allowClearing: true,
              dataSource: a.lookups,
            },
          };
        default:
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            dataType: 'string',
            fieldType: '未知',
          };
      }
    });
    ss.unshift();
    setFields([
      {
        id: 'name',
        name: 'name',
        dataField: 'name',
        caption: '名称',
        dataType: 'string',
      },
      ...(ss as FieldInfo[]),
    ]);
  }, [current]);
  const [openDialog, setOpenDialog] = useState(false);
  const [attribute, setAttribute] = useState(current.metadata.attributes[index]);
  const [items, setItems] = useState<schema.XSpeciesItem[]>([]);
  const [refForm, setRefForm] = useState<schema.XForm | null>(null);
  const [openType, setOpenType] = useState(0);
  const [select, setSelect] = useState<model.Rule>();
  const [queryRule, setQueryRule] = useState<model.Rule>();
  const [treeBoxValue, setTreeBoxValue] = useState<string[]>();
  const treeViewRef = createRef<TreeView<any>>();

  const [readOnlyConditions, setReadOnlyConditions] = useState(
    current.metadata.attributes[index].options!['readOnlyConditions'],
  );
  const [hideFieldConditions, setHideFieldConditions] = useState(
    current.metadata.attributes[index].options!['hideFieldConditions'],
  );
  const [isRequiredConditions, setIsRequiredConditions] = useState(
    current.metadata.attributes[index].options!['isRequiredConditions'],
  );

  const [asyncGeneateConditions, setAsyncGeneateConditions] = useState<model.Encode[]>();
  const [asyncSplitConditions, setAsyncSplitConditions] = useState<model.Encode[]>();

  const notityAttrChanged = () => {
    current.metadata.attributes[index] = attribute;
    notifyEmitter.changCallback('attr', attribute);
    if (
      attribute.property?.valueType === '用户型' ||
      attribute.property?.valueType === '选择型' ||
      attribute.property?.valueType === '报表型'
    ) {
      setAttribute({ ...attribute });
    }
  };

  async function loadAttributeResource() {
    if (!attribute.property) {
      return;
    }
    if (attribute.property.valueType == '引用型') {
      if (attribute.property.formId) {
        const data = await current.loadReferenceForm(attribute.property.formId);
        setRefForm(data);
      }
    } else {
      const speciesId = attribute.property.speciesId;
      if (speciesId && speciesId.length > 5) {
        const data = await current.loadItems([speciesId]);
        setItems(data);
      } else {
        setItems([]);
      }
    }
  }

  const updateAttribute = (value: any, field: string | number) => {
    const _attribute: any = { ...attribute };
    _attribute['options'][field] = value;
    setAttribute(_attribute);
  };

  useEffect(() => {
    loadAttributeResource();
    setSelect(JSON.parse(attribute?.rule ?? '{}'));
    setQueryRule(JSON.parse(attribute?.queryRule || '{}'));
    setReadOnlyConditions(attribute.options!['readOnlyConditions']);
    setHideFieldConditions(attribute.options!['hideFieldConditions']);
    setIsRequiredConditions(attribute.options!['isRequiredConditions']);
    setAsyncGeneateConditions(attribute.options!['asyncGeneateConditions']);
    setAsyncSplitConditions(attribute.options!['asyncSplitConditions']);
    if (attribute.widget === '多选框') {
      setTreeBoxValue(attribute.options!['defaultValue']);
    }
    if (attribute.widget === '多级选择框') {
      attribute.options!['displayType'] =
        attribute.options?.displayType || DisplayType.TREE;
    }
  }, [attribute]);

  useEffect(() => {
    setAttribute({
      ...current.metadata.attributes[index],
      widget: getWidget(
        current.metadata.attributes[index].property?.valueType,
        current.metadata.attributes[index].widget,
      ),
    });
  }, [index]);

  const syncTreeViewSelection = useCallback(
    (e: DropDownBoxTypes.ValueChangedEvent | any) => {
      const treeView =
        (e.component.selectItem && e.component) ||
        (treeViewRef.current && treeViewRef.current.instance);
      if (treeView) {
        if (e.value === null) {
          treeView.unselectAll();
          delete attribute.options!['defaultValue'];
        } else {
          const values = e.value || treeBoxValue;
          values &&
            values.forEach((value: any) => {
              treeView.selectItem(value);
            });
        }
      }
      if (e.value !== undefined) {
        setTreeBoxValue(e.value);
      }
    },
    [treeBoxValue],
  );

  const loadItemConfig = () => {
    const options = [];
    const disabledDefault = !attribute.options!['asyncGeneateConditions']?.length;
    switch (attribute.widget) {
      case '数字框':
        options.push(
          <SimpleItem
            dataField="options.isSummary"
            editorType="dxCheckBox"
            label={{ text: '计算汇总' }}
          />,
          <SimpleItem
            dataField="options.max"
            editorType="dxNumberBox"
            label={{ text: '最大值' }}
            editorOptions={{
              nullable: true,
            }}
          />,
          <SimpleItem
            dataField="options.min"
            editorType="dxNumberBox"
            label={{ text: '最小值' }}
            editorOptions={{
              nullable: true,
            }}
          />,
          <SimpleItem dataField="options.format" label={{ text: '显示格式' }} />,
          <SimpleItem
            dataField="options.defaultValue"
            editorType="dxNumberBox"
            label={{ text: '默认值' }}
          />,
        );
        break;
      case '文本框':
      case '多行文本框':
      case '富文本框':
        options.push(
          <SimpleItem
            dataField="options.maxLength"
            editorType="dxNumberBox"
            label={{ text: '最大长度' }}
          />,
          disabledDefault ? (
            <SimpleItem dataField="options.defaultValue" label={{ text: '默认值' }} />
          ) : undefined,
        );
        break;
      case '选择框':
      case '单选框':
        options.push(
          <SimpleItem
            dataField="options.searchEnabled"
            editorType="dxCheckBox"
            label={{ text: '是否允许搜索' }}
          />,
          <SimpleItem
            dataField="options.defaultValue"
            editorType="dxSelectBox"
            label={{ text: '默认值' }}
            editorOptions={{
              displayExpr: 'text',
              valueExpr: 'value',
              dataSource: items.map((i) => {
                return {
                  id: i.id,
                  text: i.name,
                  value: `S${i.id}`,
                  icon: i.icon,
                  parentId: i.parentId,
                };
              }),
            }}
          />,
        );
        break;
      case '多选框':
        options.push(
          <SimpleItem
            dataField="options.searchEnabled"
            editorType="dxCheckBox"
            label={{ text: '是否允许搜索' }}
          />,
          <SimpleItem
            label={{ text: '默认值' }}
            render={() => (
              <DropDownBox
                value={treeBoxValue}
                label="默认值"
                showMaskMode="always"
                labelMode="floating"
                valueExpr="id"
                displayExpr="name"
                showClearButton
                dataSource={items}
                onValueChanged={syncTreeViewSelection}
                contentRender={() => {
                  return (
                    <TreeView
                      ref={treeViewRef}
                      dataSource={items}
                      dataStructure="plain"
                      keyExpr="id"
                      selectionMode="multiple"
                      showCheckBoxesMode="normal"
                      selectNodesRecursive={false}
                      displayExpr="name"
                      selectByClick={true}
                      onContentReady={syncTreeViewSelection}
                      onItemSelectionChanged={(e) => {
                        const nodes = e.component.getSelectedNodes();
                        const keyArr = nodes.map((node) => node.key);
                        setTreeBoxValue(nodes.map((node) => node.key));
                        attribute.options!['defaultValue'] = keyArr;
                      }}
                    />
                  );
                }}
              />
            )}
          />,
        );
        break;
      case '引用选择框':
        options.push(
          <SimpleItem
            dataField="options.allowSetFieldsValue"
            editorType="dxCheckBox"
            label={{ text: '允许数据回填表单' }}
          />,
          <SimpleItem
            dataField="options.multiple"
            editorType="dxCheckBox"
            label={{ text: '支持多选' }}
          />,
          <SimpleItem
            dataField="options.nameAttribute"
            editorType="dxSelectBox"
            label={{ text: '展示名称的特性' }}
            editorOptions={{
              displayExpr: 'name',
              valueExpr: 'id',
              dataSource: (refForm?.attributes || []).filter((i) => {
                return i.property?.valueType == '描述型';
              }),
            }}
          />,
        );
        break;
      case '内部机构选择框':
        options.push(
          <SimpleItem
            dataField="options.searchEnabled"
            editorType="dxCheckBox"
            label={{ text: '是否允许搜索' }}
          />,
        );
        break;
      case '单位搜索框':
        options.push(
          <SimpleItem
            label={{ text: '默认值' }}
            render={() => (
              <SearchTargetItem
                typeName={TargetType.Company}
                label="默认值"
                value={attribute.options?.defaultValue}
                onValueChanged={(e) => {
                  attribute.options!['defaultValue'] = e.value;
                }}
              />
            )}
          />,
        );
        break;
      case '多级选择框':
        options.push(
          // <SimpleItem
          //   dataField="options.searchEnabled"
          //   editorType="dxCheckBox"
          //   label={{ text: '是否允许搜索' }}
          // />,
          <SimpleItem
            label={{ text: '默认值' }}
            render={() => (
              <TreeSelectItem
                label="默认值"
                flexWrap="wrap"
                showMaskMode="always"
                labelMode="floating"
                width={400}
                showClearButton
                isDefaultValue={true}
                defaultValue={attribute.options?.defaultValue}
                isSelectLastLevel={attribute.options?.isSelectLastLevel}
                bindNode={attribute.options?.bindNode}
                onValueChange={(value) => {
                  attribute.options!['defaultValue'] = value.value;
                  // notityAttrChanged();
                }}
                displayType={DisplayType.TREE}
                speciesItems={items.map((a) => {
                  return {
                    id: a.id,
                    text: a.name,
                    value: `S${a.id}`,
                    parentId: a.parentId,
                  } as model.FiledLookup;
                })}
              />
            )}
          />,
          <SimpleItem
            dataField="options.displayType"
            editorType="dxRadioGroup"
            label={{ text: '选择框展示类型' }}
            editorOptions={{
              dataSource: DistplayTypeItems,
              valueExpr: 'id',
              displayExpr: 'text',
              layout: 'horizontal',
              // value: attribute.options?.displayType || DisplayType.TREE,
              onValueChanged: (e: ValueChangedEvent) => {
                attribute.options!['displayType'] = e.value;
              },
            }}
          />,
          <SimpleItem
            dataField="options.isSelectLastLevel"
            editorType="dxCheckBox"
            label={{ text: '取消只能选择末级' }}
          />,
          <SimpleItem
            label={{ text: '绑定节点', visible: true }}
            render={() => (
              <TreeSelectItem
                label="绑定节点"
                flexWrap="wrap"
                showMaskMode="always"
                labelMode="floating"
                width={300}
                showClearButton
                isSelectLastLevel={attribute.options?.isSelectLastLevel}
                onValueChange={(value) => {
                  attribute.options!['bindNode'] = value.value;
                  // notityAttrChanged();
                }}
                value={attribute.options?.bindNode}
                displayType={DisplayType.TREE}
                isNoNeedFilterData={true}
                speciesItems={items.map((a) => {
                  return {
                    id: a.id,
                    text: a.name,
                    value: `S${a.id}`,
                    parentId: a.parentId,
                  } as model.FiledLookup;
                })}
              />
            )}
          />,
          <SimpleItem
            dataField="options.viewFilterKey"
            editorType="dxSelectBox"
            label={{ text: '视图分类筛选目标字段' }}
            editorOptions={{
              dataSource: fields,
              valueExpr: 'id',
              displayExpr: 'caption',
              layout: 'horizontal',
            }}
          />,
        );
        break;
      case '日期选择框':
        {
          const dateFormat =
            attribute.options && 'displayFormat' in attribute.options
              ? attribute.options['displayFormat']
              : 'yyyy年MM月dd日';
          options.push(
            <SimpleItem
              dataField="options.max"
              editorType="dxDateBox"
              label={{ text: '最大值' }}
              editorOptions={{
                type: 'date',
                displayFormat: dateFormat,
              }}
            />,
            <SimpleItem
              dataField="options.min"
              editorType="dxDateBox"
              label={{ text: '最小值' }}
              editorOptions={{
                type: 'date',
                displayFormat: dateFormat,
              }}
            />,
            <SimpleItem
              dataField="options.displayFormat"
              editorOptions={{ value: dateFormat }}
              label={{ text: '格式' }}
            />,
            <SimpleItem
              dataField="options.defaultType"
              editorType="dxSelectBox"
              label={{ text: '默认值类型' }}
              editorOptions={{
                displayExpr: 'name',
                valueExpr: 'id',
                dataSource: [
                  { id: 'currentPeriod', name: '当前账期' },
                  { id: 'currentTime', name: '当前时间' },
                ],
              }}
            />,
            <SimpleItem
              dataField="options.defaultValue"
              editorType="dxDateBox"
              label={{ text: '默认值' }}
              editorOptions={{
                type: 'date',
                displayFormat: dateFormat,
              }}
            />,
            <SimpleItem
              dataField="options.dateRange"
              editorType="dxSelectBox"
              label={{ text: '范围计算限定' }}
              editorOptions={{
                items: [
                  { key: 'default', text: '无' },
                  { key: 'before', text: '当日之前' },
                  { key: 'after', text: '当日之后' },
                ],
                displayExpr: 'text',
                valueExpr: 'key',
                value: attribute?.options?.dateRange || 'default',
              }}
            />,
          );
        }
        break;
      case '时间选择框':
        {
          const timeFormat =
            attribute.options && 'displayFormat' in attribute.options
              ? attribute.options['displayFormat']
              : 'yyyy年MM月dd日 HH:mm:ss';
          options.push(
            <SimpleItem
              dataField="options.max"
              editorType="dxDateBox"
              label={{ text: '最大值' }}
              editorOptions={{
                type: 'datetime',
                displayFormat: timeFormat,
              }}
            />,
            <SimpleItem
              dataField="options.min"
              editorType="dxDateBox"
              label={{ text: '最小值' }}
              editorOptions={{
                type: 'datetime',
                displayFormat: timeFormat,
              }}
            />,
            <SimpleItem
              dataField="options.displayFormat"
              editorOptions={{ value: timeFormat }}
              label={{ text: '格式' }}
            />,
            <SimpleItem
              dataField="options.defaultType"
              editorType="dxSelectBox"
              label={{ text: '默认值类型' }}
              editorOptions={{
                displayExpr: 'name',
                valueExpr: 'id',
                dataSource: [{ id: 'currentTime', name: '当前时间' }],
              }}
            />,
            <SimpleItem
              dataField="options.defaultValue"
              editorType="dxSelectBox"
              label={{ text: '默认值' }}
              editorOptions={{
                type: 'datetime',
                displayFormat: timeFormat,
              }}
            />,
          );
        }
        break;
      case '文件选择框':
        options.push(
          <SimpleItem
            dataField="options.maxLength"
            editorType="dxNumberBox"
            label={{ text: '最大文件数量' }}
          />,
        );
        break;
      default:
        break;
    }
    return options;
  };

  return (
    <Form
      key={index}
      height={'calc(100vh - 175px)'}
      scrollingEnabled
      labelMode="floating"
      formData={attribute}
      onFieldDataChanged={notityAttrChanged}>
      <GroupItem>
        <SimpleItem dataField="name" isRequired={true} label={{ text: '特性名称' }} />
        <SimpleItem dataField="code" isRequired={true} label={{ text: '特性代码' }} />
        <SimpleItem
          dataField="id"
          editorOptions={{ disabled: true }}
          isRequired={true}
          label={{ text: '特性ID' }}
        />
        <SimpleItem
          dataField="property.name"
          editorOptions={{ disabled: true }}
          isRequired={true}
          label={{ text: '属性名称' }}
        />
        <SimpleItem
          dataField="property.code"
          editorOptions={{ disabled: true }}
          isRequired={true}
          label={{ text: '属性代码' }}
        />
        <SimpleItem
          dataField="property.id"
          editorOptions={{ disabled: true }}
          isRequired={true}
          label={{ text: '属性ID' }}
        />
        <SimpleItem
          dataField="widget"
          editorType="dxSelectBox"
          label={{ text: '组件' }}
          editorOptions={{
            items: loadwidgetOptions(attribute),
          }}
        />
        {attribute.widget === '数字框' && (
          <SimpleItem
            dataField="options.accuracy"
            editorType="dxNumberBox"
            label={{ text: '精度' }}
            editorOptions={{
              min: 0,
              step: 1,
              format: '#',
              showClearButton: true,
              showSpinButtons: true,
            }}
          />
        )}
        <SimpleItem
          dataField="options.defaultWidth"
          editorType="dxNumberBox"
          label={{ text: '默认列宽' }}
          editorOptions={{
            min: 40,
            step: 10,
            format: '#(px)',
            showClearButton: true,
            showSpinButtons: true,
            defaultValue: 300,
          }}
        />
        <SimpleItem
          dataField="options.sortOrder"
          editorType="dxSelectBox"
          label={{ text: '排序' }}
          editorOptions={{
            items: [
              { key: 'asc', text: '升序' },
              { key: 'desc', text: '降序' },
            ],
            displayExpr: 'text',
            valueExpr: 'key',
          }}
        />
        {attribute.widget === '成员选择框' && (
          <SimpleItem
            dataField="options.teamId"
            editorType="dxSelectBox"
            label={{ text: '选择上级组织' }}
            editorOptions={{
              valueExpr: 'id',
              displayExpr: 'name',
              dataSource: [
                {
                  id: MemberFilter.id,
                  name: MemberFilter.label,
                },
                ...current.directory.target.space.targets,
              ],
            }}
          />
        )}
        {attribute.widget === '成员选择框' && (
          <SimpleItem
            dataField="options.isOperator"
            editorType="dxCheckBox"
            label={{ text: '限定为操作用户' }}
          />
        )}
        <SimpleItem
          dataField="remark"
          editorType="dxTextArea"
          isRequired={true}
          label={{ text: '描述' }}
          editorOptions={{
            height: 100,
          }}
        />
      </GroupItem>
      <GroupItem>
        <SimpleItem
          dataField="options.readOnly"
          // editorType="dxCheckBox"
          label={{ text: '只读特性', visible: true }}
          render={() =>
            loaded && (
              <AttributeSetting
                fields={fields}
                fieldName="readOnly"
                value={attribute.options!['readOnly']}
                // conditionConfig={attribute.options!['readOnlyConditions']}
                conditionConfig={readOnlyConditions}
                current={current}
                onValueChanged={(value: any, field: string) => {
                  updateAttribute(value, field);
                }}
                onConditionsChanged={(value: any, field: string) => {
                  updateAttribute(value, field);
                  setReadOnlyConditions(value);
                }}
                onConditionsDelete={(field: string) => {
                  updateAttribute(undefined, field);
                  setReadOnlyConditions(undefined);
                }}
              />
            )
          }
        />
        <SimpleItem
          dataField="options.hideField"
          // editorType="dxCheckBox"
          label={{ text: '隐藏特性', visible: true }}
          render={() =>
            loaded && (
              <AttributeSetting
                fields={fields}
                fieldName="hideField"
                value={attribute.options!['hideField']}
                // conditionConfig={attribute.options!['hideFieldConditions']}
                conditionConfig={hideFieldConditions}
                current={current}
                onValueChanged={(value: any, field: string) => {
                  updateAttribute(value, field);
                }}
                onConditionsChanged={(value: any, field: string) => {
                  updateAttribute(value, field);
                  setHideFieldConditions(value);
                }}
                onConditionsDelete={(field: string) => {
                  updateAttribute(undefined, field);
                  setHideFieldConditions(undefined);
                }}
              />
            )
          }
        />
        <SimpleItem
          dataField="options.isRequired"
          // editorType="dxCheckBox"
          label={{ text: '必填特性', visible: true }}
          render={() =>
            loaded && (
              <AttributeSetting
                fields={fields}
                fieldName="isRequired"
                value={attribute.options!['isRequired']}
                // conditionConfig={attribute.options!['isRequiredConditions']}
                conditionConfig={isRequiredConditions}
                current={current}
                onValueChanged={(value: any, field: string) => {
                  updateAttribute(value, field);
                }}
                onConditionsChanged={(value: any, field: string) => {
                  updateAttribute(value, field);
                  setIsRequiredConditions(value);
                }}
                onConditionsDelete={(field: string) => {
                  updateAttribute(undefined, field);
                  setIsRequiredConditions(undefined);
                }}
              />
            )
          }
        />
        <SimpleItem
          dataField="options.changeWithCodeField"
          editorType="dxCheckBox"
          label={{ text: '是否作为字段匹配依据' }}
        />
        <SimpleItem
          dataField="options.changeWithCode"
          label={{ text: '是否受其它表单值影响', visible: true }}
          render={() =>
            loaded && (
              <FormSettting
                current={current}
                value={attribute.options!['changeWithCode']}
                fieldName="changeWithCode"
                onValueChanged={(value: any, field: string) => {
                  updateAttribute(value, field);
                }}
                onConditionsDelete={(field: string) => {
                  updateAttribute(undefined, field);
                }}
              />
            )
          }
        />
        <SimpleItem
          dataField="options.allowNull"
          editorType="dxCheckBox"
          label={{ text: '是否可设置为空值' }}
        />
        <SimpleItem
          dataField="options.rulePrompt"
          editorType="dxTextBox"
          label={{ text: '规则提示语' }}
        />
        <SimpleItem
          dataField="options.showToRemark"
          editorType="dxCheckBox"
          label={{ text: '展示至摘要' }}
        />
        {~['文本框'].indexOf(attribute.widget || '') ? (
          <SimpleItem
            dataField="opitons.asyncVal"
            editorType="dxCheckBox"
            label={{ text: '编号设置', visible: true }}
            render={() =>
              loaded && (
                <AttrAutoGenerateVal
                  // fields={fields}
                  fieldName="asyncGeneateConditions"
                  value={!!attribute.options!['asyncGeneateConditions']}
                  conditionConfig={asyncGeneateConditions}
                  current={current}
                  onConditionsChanged={(value: any, field: string) => {
                    updateAttribute(value, field);
                    notityAttrChanged();
                    setAsyncGeneateConditions(value);
                  }}
                  onConditionsDelete={(field: string) => {
                    updateAttribute(undefined, field);
                    setAsyncGeneateConditions(undefined);
                  }}
                />
              )
            }
          />
        ) : null}
        {~['文本框'].indexOf(attribute.widget || '') ? (
          <SimpleItem
            dataField="options.autoSelectedFill"
            editorType="dxCheckBox"
            label={{ text: '是否选择时空值自动赋值' }}
          />
        ) : null}
        {loadItemConfig()}
        <SimpleItem
          // dataField="options.defaultValue"
          // editorType="dxNumberBox"
          label={{ text: '计算规则', visible: true }}
          render={() =>
            select?.id ? (
              <span>
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setSelect(JSON.parse(attribute?.rule ?? '{}'));
                    setOpenType(1);
                  }}>
                  编辑计算规则
                </Button>
                <Popconfirm
                  key={'delete'}
                  title="确定删除吗？"
                  onConfirm={() => {
                    setSelect(undefined);
                    const changed = current.metadata.attributes[index];
                    changed.rule = '{}';
                    notifyEmitter.changCallback('attr', changed);
                  }}>
                  <Button type="link" icon={<DeleteOutlined />} danger>
                    删除计算规则
                  </Button>
                </Popconfirm>
              </span>
            ) : (
              <Button
                type="link"
                onClick={() => {
                  setSelect(undefined);
                  setOpenType(1);
                }}>
                添加计算规则
              </Button>
            )
          }
        />
        {attribute?.property?.name == '虚拟列' && (
          <SimpleItem
            // dataField="options.defaultValue"
            // editorType="dxNumberBox"
            label={{ text: '虚拟列规则', visible: true }}
            render={() =>
              queryRule?.id ? (
                <span>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setSelect(JSON.parse(attribute?.queryRule ?? '{}'));
                      setOpenType(2);
                    }}>
                    编辑虚拟列规则
                  </Button>
                  <Popconfirm
                    key={'delete'}
                    title="确定删除吗？"
                    onConfirm={() => {
                      setSelect(undefined);
                      const changed = current.metadata.attributes[index];
                      changed.queryRule = '{}';
                      notifyEmitter.changCallback('attr', changed);
                    }}>
                    <Button type="link" icon={<DeleteOutlined />} danger>
                      删除虚拟列规则
                    </Button>
                  </Popconfirm>
                </span>
              ) : (
                <Button
                  type="link"
                  onClick={() => {
                    setSelect(JSON.parse(attribute?.queryRule ?? '{}'));
                    setOpenType(2);
                  }}>
                  添加虚拟列规则
                </Button>
              )
            }
          />
        )}
        <SimpleItem
          dataField="options.isComputed"
          editorType="dxCheckBox"
          label={{ text: '标记为受代码规则影响' }}
        />
      </GroupItem>
      <GroupItem caption="查看设置">
        <SimpleItem
          dataField="options.fixed"
          editorType="dxCheckBox"
          label={{ text: '固定列' }}
        />
        <SimpleItem
          dataField="options.visible"
          editorType="dxCheckBox"
          label={{ text: '默认显示列' }}
        />
        {attribute.property?.valueType === '用户型' ? (
          <SimpleItem
            dataField="options.showCode"
            editorType="dxCheckBox"
            label={{ text: '是否在列表显示编码' }}
          />
        ) : null}
        {attribute.property?.speciesId && (
          <SimpleItem
            dataField="options.species"
            editorType="dxCheckBox"
            label={{ text: '显示到类目树' }}
          />
        )}
      </GroupItem>
      {openDialog && (
        <OpenFileDialog
          multiple
          rootKey={current.spaceKey}
          accepts={['用户']}
          allowInherited
          maxCount={1}
          onCancel={() => setOpenDialog(false)}
          onOk={() => {}}
        />
      )}
      {openType >= 1 && loaded && (
        <CalcRuleModal
          form={current.metadata}
          onCancel={() => setOpenType(0)}
          current={(openType === 1 ? select : queryRule) as model.NodeCalcRule}
          targetId={attribute.id}
          onOk={(rule) => {
            setSelect(rule);
            const attributeKey = openType === 1 ? 'rule' : 'queryRule';
            setAttribute({
              ...attribute,
              [attributeKey]: JSON.stringify(rule),
            });
            const changed = current.metadata.attributes[index];
            changed[attributeKey] = JSON.stringify(rule);
            notifyEmitter.changCallback('attr', changed);
            setOpenType(0);
          }}
        />
      )}
    </Form>
  );
};

export default AttributeConfig;
