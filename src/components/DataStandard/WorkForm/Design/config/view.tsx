import { deepClone, Emitter } from '@/ts/base/common';
import { ICompany, IForm, TargetType } from '@/ts/core';
import { CheckBox, Form } from 'devextreme-react';
import { GroupItem, SimpleItem } from 'devextreme-react/form';
import React, { useEffect, useState } from 'react';
import CustomBuilder from './formRule/builder';
import { FieldInfo } from 'typings/globelType';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import Classify from './formRule/builder/classify';
import { fieldConvert, tryParseJson } from '@/utils/tools';
import { FullEntityColumns } from '@/config/column';
import { FieldModel } from '@/ts/base/model';
import { schema } from '@/ts/base';
interface IAttributeProps {
  current: IForm;
  notifyEmitter: Emitter;
}

const ViewConfig: React.FC<IAttributeProps> = ({ notifyEmitter, current }) => {
  const isGroupView = current.directory.target.typeName == TargetType.Group;
  const [organizationalTree, setOrganizationalTree] = useState<schema.XReportTree[]>([]);
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [speciesFields, setSpeciesFields] = useState<FieldModel[]>([]);
  useEffect(() => {
    gerOrganizationalTree();
  }, []);
  const gerOrganizationalTree = async () => {
    const treeData = (await current.directory.target.resource.reportTreeColl.all()) ?? [];
    setOrganizationalTree(treeData);
  };
  const [loaded] = useAsyncLoad(async () => {
    const resultFields = FullEntityColumns(await current.loadFields());
    setFields(fieldConvert(resultFields as FieldModel[]));
    setSpeciesFields(
      resultFields.filter((i) => i.valueType === '分类型') as FieldModel[],
    );
  }, [current]);
  const emptyData: any = {
    type: 'condition',
    relation: '_all_',
    value: [],
    _tempId: '1',
    parentId: null,
  };
  const [conditionText, setConditionText] = useState('[]');
  const [classifyDisplay, setClassifyDisplay] = useState(emptyData);
  const [authDisplay, setAuthDisplay] = useState('[]');
  const notityAttrChanged = () => {
    notifyEmitter.changCallback('form');
  };

  const setFilterCondition = (value: string, text: string) => {
    if (!current.metadata.options?.dataRange) {
      current.metadata.options!.dataRange = {};
    }
    if (tryParseJson(value)) {
      current.metadata.options!.dataRange!.filterExp = value;
      current.metadata.options!.dataRange!.filterDisplay = text;
    } else {
      current.metadata.options!.dataRange!.filterExp = undefined;
      current.metadata.options!.dataRange!.filterDisplay = undefined;
    }
  };

  const onClassifyChange = (result: any) => {
    if (!current.metadata.options?.dataRange) {
      current.metadata.options!.dataRange = {};
    }
    if (Object.keys(result?.value)?.length > 0) {
      current.metadata.options!.dataRange!.classifyExp = JSON.stringify(result.value);
      current.metadata.options!.dataRange!.classifyDisplay = JSON.stringify(result.data);
    } else {
      current.metadata.options!.dataRange!.classifyExp = undefined;
      current.metadata.options!.dataRange!.classifyDisplay = undefined;
    }
  };

  const setAuthCondition = (value: string, text: string) => {
    if (!current.metadata.options?.dataRange) {
      current.metadata.options!.dataRange = {};
    }
    if (tryParseJson(value)) {
      current.metadata.options!.dataRange!.authExp = value;
      current.metadata.options!.dataRange!.authDisplay = text;
    } else {
      current.metadata.options!.dataRange!.authExp = undefined;
      current.metadata.options!.dataRange!.authDisplay = undefined;
    }
  };
  useEffect(() => {
    if (!current.metadata.options) {
      current.metadata.options = { itemWidth: 300 };
    }

    const filterDisplay = tryParseJson(current.metadata.options.dataRange?.filterDisplay);
    if (filterDisplay) {
      setConditionText(JSON.stringify(filterDisplay));
    }

    const classifyDisplay = tryParseJson(
      current.metadata.options.dataRange?.classifyDisplay,
    );
    if (classifyDisplay) {
      setClassifyDisplay(classifyDisplay);
    }

    const authDisplay = tryParseJson(current.metadata.options.dataRange?.authDisplay);
    if (authDisplay) {
      setAuthDisplay(JSON.stringify(authDisplay));
    }
  }, [current]);
  return (
    <>
      <Form
        scrollingEnabled
        height={'calc(100vh - 175px)'}
        formData={current.metadata}
        onFieldDataChanged={notityAttrChanged}>
        <GroupItem itemType="group">
          <SimpleItem dataField="name" isRequired={true} label={{ text: '名称' }} />
          <SimpleItem dataField="code" isRequired={true} label={{ text: '代码' }} />
          <SimpleItem
            dataField="options.itemWidth"
            editorType="dxNumberBox"
            label={{ text: '特性宽度' }}
            editorOptions={{
              min: 200,
              max: 800,
              step: 10,
              format: '#(px)',
              defaultValue: 300,
              showClearButton: true,
              showSpinButtons: true,
            }}
          />
          <SimpleItem
            dataField="remark"
            editorType="dxTextArea"
            isRequired={true}
            label={{ text: '表单描述' }}
            editorOptions={{
              height: 100,
            }}
          />
        </GroupItem>
        <GroupItem caption="查看设置">
          <SimpleItem
            dataField="options.viewType"
            editorType="dxSelectBox"
            label={{ text: '视图类型' }}
            editorOptions={{
              displayExpr: 'label',
              valueExpr: 'value',
              items: [
                { label: '默认', value: 'default' },
                { label: '系统办事', value: 'work' },
              ],
              defaultValue: 'default',
              showClearButton: true,
              showSpinButtons: true,
            }}
          />
          <SimpleItem
            label={{ text: '值筛选' }}
            render={() =>
              loaded && (
                <CustomBuilder
                  fields={fields}
                  displayText={conditionText}
                  onValueChanged={(value, text) => {
                    setFilterCondition(value, text);
                  }}
                />
              )
            }
          />
          <SimpleItem
            label={{ text: '类筛选' }}
            render={() =>
              loaded && (
                <Classify
                  current={current.directory.target.space as ICompany}
                  speciesFields={speciesFields}
                  classifyTreeData={classifyDisplay}
                  onChange={onClassifyChange}
                />
              )
            }
          />
          <SimpleItem
            label={{ text: '权限筛选' }}
            render={() =>
              loaded && (
                <CustomBuilder
                  fields={deepClone(fields).filter((field: any) => {
                    field.lookup = field.lookupAuth;
                    return field.fieldType === '用户型';
                  })}
                  displayText={authDisplay}
                  onValueChanged={(value, text) => {
                    setAuthCondition(value, text);
                  }}
                />
              )
            }
          />
          <GroupItem caption="单位设置" itemType="group" visible={!isGroupView}>
            <SimpleItem
              dataField="options.viewDataRange.department"
              editorType="dxSelectBox"
              label={{ text: '部门筛选字段' }}
              editorOptions={{
                displayExpr: 'caption',
                valueExpr: 'id',
                items: fields.filter((item) => item.name !== 'id'),
                showClearButton: true,
              }}
            />
            <SimpleItem
              dataField="options.viewDataRange.person"
              editorType="dxSelectBox"
              label={{ text: '个人筛选字段' }}
              editorOptions={{
                displayExpr: 'caption',
                valueExpr: 'name',
                items: fields.filter((item) => item.name !== 'id'),
                showClearButton: true,
              }}
            />
          </GroupItem>
          <GroupItem caption="集群设置" itemType="group" visible={isGroupView}>
            <SimpleItem
              dataField="options.allowMemberView"
              editorType="dxCheckBox"
              label={{ text: '是否允许集群成员查看' }}
            />
            <SimpleItem
              dataField="options.createCompanyTree"
              editorType="dxCheckBox"
              label={{ text: '是否构建集群组织树' }}
              render={() => (
                <CheckBox
                  name="createDeptTree"
                  onValueChanged={(e) => {
                    console.log('是否构建单位组织树', e.value);
                  }}
                />
              )}
            />
            <SimpleItem
              dataField="options.organizationTree"
              editorType="dxSelectBox"
              label={{ text: '查询组织树' }}
              editorOptions={{
                displayExpr: 'name',
                valueExpr: 'id',
                items: organizationalTree.filter((item) => item.name !== 'id'),
                defaultValue: 'belongId',
                showClearButton: true,
                showSpinButtons: true,
              }}
            />
            <SimpleItem
              dataField="options.viewDataRange.company"
              editorType="dxSelectBox"
              label={{ text: '单位筛选字段' }}
              editorOptions={{
                displayExpr: 'caption',
                valueExpr: 'id',
                items: fields.filter((item) => item.name !== 'id'),
                defaultValue: 'belongId',
                showClearButton: true,
                showSpinButtons: true,
              }}
            />
          </GroupItem>
        </GroupItem>
      </Form>
    </>
  );
};

export default ViewConfig;
