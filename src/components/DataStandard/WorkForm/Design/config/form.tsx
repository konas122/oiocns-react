import { deepClone, Emitter } from '@/ts/base/common';
import { ICompany, IForm, IReport, TargetType } from '@/ts/core';
import { Form } from 'devextreme-react';
import { GroupItem, SimpleItem } from 'devextreme-react/form';
import React, { useEffect, useState } from 'react';
import CustomBuilder from './formRule/builder';
import { FieldInfo } from 'typings/globelType';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import Classify from './formRule/builder/classify';
import { fieldConvert, tryParseJson } from '@/utils/tools';
import { FullEntityColumns } from '@/config/column';
import { FieldModel } from '@/ts/base/model';
import SearchTargetItem from '@/components/DataStandard/ReportForm/Viewer/components/searchTarget';

interface IAttributeProps {
  current: IForm | IReport;
  notifyEmitter: Emitter;
  extraFields?: JSX.Element[];
}

const FormConfig: React.FC<IAttributeProps> = ({
  notifyEmitter,
  current,
  extraFields,
}) => {
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [speciesFields, setSpeciesFields] = useState<FieldModel[]>([]);
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
  const [redRowRule, setRedRowRule] = useState('[]');
  const [classifyDisplay, setClassifyDisplay] = useState(emptyData);
  const [authDisplay, setAuthDisplay] = useState('[]');
  const [groupDisplay, setGroupDisplay] = useState('[]');
  const [groupId, setGroupId] = useState('');
  const [clusterId, setClusterId] = useState('');

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

  const setFilterRedRow = (value: string, text: string) => {
    if (!current.metadata.options?.dataRange) {
      current.metadata.options!.dataRange = {};
    }
    if (tryParseJson(value)) {
      current.metadata.options!.dataRange!.filterRedRowExp = value;
      current.metadata.options!.dataRange!.filterRedRow = text;
    } else {
      current.metadata.options!.dataRange!.filterRedRowExp = undefined;
      current.metadata.options!.dataRange!.filterRedRow = undefined;
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
  const setGroupCondition = (value: string, text: string, groupId?: string) => {
    if (!current.metadata.options?.dataRange) {
      current.metadata.options!.dataRange = {};
    }
    if (groupId) {
      current.metadata.options!.dataRange!.groupId = groupId;
      return;
    } else if (tryParseJson(value)) {
      current.metadata.options!.dataRange!.groupExp = value;
      current.metadata.options!.dataRange!.groupDisplay = text;
    } else {
      current.metadata.options!.dataRange!.groupExp = undefined;
      current.metadata.options!.dataRange!.groupDisplay = undefined;
    }
  };

  const setDataClusterCondition = (id?: string) => {
    if (!current.metadata.options?.dataRange) {
      current.metadata.options!.dataRange = {};
    }
    if (id) {
      current.metadata.options!.dataRange!.clusterId = id;
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

  useEffect(() => {
    if (!current.metadata.options) {
      current.metadata.options = { itemWidth: 300 };
    }

    const filterDisplay = tryParseJson(current.metadata.options.dataRange?.filterDisplay);
    if (filterDisplay) {
      setConditionText(JSON.stringify(filterDisplay));
    }

    const filterRedRow = tryParseJson(current.metadata.options.dataRange?.filterRedRow);
    if (filterRedRow) {
      setRedRowRule(JSON.stringify(filterRedRow));
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
    const groupDisplay = tryParseJson(current.metadata.options.dataRange?.groupDisplay);
    if (groupDisplay) {
      setGroupDisplay(JSON.stringify(groupDisplay));
    }
    const groupId = current.metadata.options.dataRange?.groupId;
    if (groupId) {
      setGroupId(groupId);
    }

    const clusterId = current.metadata.options.dataRange?.clusterId;
    if (clusterId) {
      setClusterId(clusterId);
    }
  }, [current]);
  return (
    <>
      <Form
        scrollingEnabled
        height={'calc(100vh - 175px)'}
        formData={current.metadata}
        onFieldDataChanged={notityAttrChanged}>
        <GroupItem>
          <SimpleItem dataField="name" isRequired={true} label={{ text: '名称' }} />
          <SimpleItem dataField="code" isRequired={true} label={{ text: '代码' }} />
          {extraFields}
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
          <SimpleItem
            dataField="matchImport"
            editorType="dxSelectBox"
            label={{ text: '导入匹配设置' }}
            editorOptions={{
              items: fields.filter((item) => item.name !== 'id').map((i) => i.caption),
              searchEnabled: true
            }}
          />
          <SimpleItem
            dataField="isCopy"
            editorType="dxCheckBox"
            label={{ text: '是否允许复制', visible: true }}
          />
          <SimpleItem
            dataField="sort"
            editorType="dxSelectBox"
            label={{ text: '修改时间排序' }}
            editorOptions={{
              items: ['默认', '升序', '降序'],
            }}
          />
        </GroupItem>
        <GroupItem caption="查看设置">
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

          <SimpleItem
            label={{ text: '指定集群数据' }}
            helpText="用于查询集群公开数据集"
            render={() =>
              loaded && (
                <>
                  <SearchTargetItem
                    typeName={TargetType.Group}
                    defaultValue={clusterId}
                    onValueChanged={(e) => {
                      setDataClusterCondition(e.value);
                    }}
                  />
                </>
              )
            }
          />

          <SimpleItem
            label={{ text: '集群数据筛选' }}
            helpText="用于资产核销时，读取集群中资产状态，过滤单位本身资产"
            render={() =>
              loaded && (
                <>
                  <SearchTargetItem
                    typeName={TargetType.Group}
                    defaultValue={groupId}
                    onValueChanged={(e) => {
                      setGroupCondition('', '', e.value);
                    }}
                  />
                  <CustomBuilder
                    fields={fields}
                    displayText={groupDisplay}
                    onValueChanged={(value, text) => {
                      setGroupCondition(value, text);
                    }}
                  />
                </>
              )
            }
          />
          <SimpleItem
            label={{ text: '高亮提醒' }}
            render={() =>
              loaded && (
                <CustomBuilder
                  fields={fields}
                  displayText={redRowRule}
                  onValueChanged={(value, text) => {
                    setFilterRedRow(value, text);
                  }}
                />
              )
            }
          />
        </GroupItem>
      </Form>
    </>
  );
};

export default FormConfig;
