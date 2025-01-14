import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { IBelong } from '@/ts/core';
import { Tabs } from 'antd';
import { XSheet } from '@/ts/base/schema';
import { model, schema } from '@/ts/base';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { getAggregationDate } from '../Utils/index';

const HotTableView = lazy(() => import('./hotTable'));

interface IProps {
  data: { [key: string]: any };
  allowEdit: boolean;
  belong: IBelong;
  form: schema.XReport;
  info?: model.FormInfo;
  readonly?: boolean;
  showTitle?: boolean;
  fields: model.FieldModel[];
  rules: model.RenderRule[];
  formData?: model.FormEditData;
  primary: {
    [id: string]: any;
  };
  onValuesChange?: (fieldId: string, value: any, data: any, coord?: any) => void;
  activeTabKey?: string;
  height?: string;
  service: WorkFormService;
}

const WorkReportViewer: React.FC<IProps> = (props) => {
  const [sheetList, setSheetList] = useState<XSheet[]>([]);
  const [activeKey, setActiveKey] = useState<string>();
  const [variablesData, setVariablesData] = useState<any>();

  useEffect(() => {
    const sheetListData: XSheet[] = Object.values(props.form?.sheets || {});
    setSheetList(sheetListData);
    if (sheetListData.length > 0) {
      setActiveKey(sheetListData[0]?.code);
    }
  }, [props.form]);

  const [loaded] = useAsyncLoad(async () => {
    let datas: any = {};
    if (!props.readonly) {
      const variables = props.form.variables ?? {};
      const promises = Object.keys(variables).map(async (key) => {
        if (variables[key].value?.type === '取数型') {
          const result = await getAggregationDate(
            variables[key].value.valueString,
            props.belong,
          );
          datas[key] = result;
        }
      });
      await Promise.all(promises);
    }
    setVariablesData(datas);
  }, [props.form]);

  const tabItems = useMemo(() => {
    return sheetList
      .filter((sheet) => sheet.code !== 'variableSheet')
      .map((sheet) => ({
        key: sheet.code,
        label: sheet.name,
        forceRender: true,
        children: (
          <Suspense fallback={<div>Loading...</div>}>
            <HotTableView {...props} sheet={sheet} variablesData={variablesData} />
          </Suspense>
        ),
      }));
  }, [sheetList, variablesData, props]);

  if (!loaded) return null;

  return (
    <div>
      <Tabs
        tabPosition="bottom"
        items={tabItems}
        activeKey={activeKey}
        onChange={setActiveKey}
      />
    </div>
  );
};

export default WorkReportViewer;
