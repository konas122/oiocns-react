import NewWorkReportViewer from '@/components/DataStandard/NewReportForm/Viewer';
import WorkReportViewer from '@/components/DataStandard/ReportForm/Viewer';
import WorkFormViewer from '@/components/DataStandard/WorkForm/Viewer';
import FormService from '@/ts/scripting/core/services/FormService';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import { Empty, Tabs } from 'antd';
import React, { useRef, useState } from 'react';
import { model, schema } from '../../../ts/base';
import { useRefInit } from '@/hooks/useRefInit';
import type { TabBarExtraContent } from 'rc-tabs/lib/interface';

interface PrimaryFormType {
  allowEdit: boolean;
  form: schema.XForm;
  info: model.FormInfo;
  service: WorkFormService;
  node: model.WorkNodeModel;
  instanceData?: model.InstanceDataModel;
}

export const PrimaryForm: React.FC<PrimaryFormType> = (props) => {
  const service = useRefInit(() => new FormService(props.form, props.service));

  function findDifferentValues(obj1: schema.XThing, obj2: schema.XThing) {
    const result: any[] = [];
    const numericKeysObj1 = Object.keys(obj1).filter((key) => !isNaN(parseInt(key, 10)));
    const numericKeysObj2 = Object.keys(obj2).filter((key) => !isNaN(parseInt(key, 10)));
    const allNumericKeys = new Set([...numericKeysObj1, ...numericKeysObj2]);

    allNumericKeys.forEach((key) => {
      if (obj1[key] !== obj2[key]) {
        result.push({
          id: key,
          value: obj2[key],
        });
      }
    });

    return result;
  }
  const getData = () => {
    let d: schema.XThing | undefined;
    if (props.instanceData) {
      const res = findDifferentValues(
        service.current.formData.after.at(-1)!,
        props.instanceData.data[props.instanceData.node.primaryForms[0].id][0].after.at(
          -1,
        )!,
      );
      res.forEach((item) => {
        service.current.onValueChange(
          item.id,
          item.value,
          service.current.formData.after.at(-1),
        );
      });
    } else {
      d = service.current.formData.after.at(-1);
      if (d) {
        props.service.updatePrimaryData(props.form.id, d);
        service.current.initRules(d);
      }
    }
    return d;
  };
  const data = useRef(getData());
  if (!data.current) {
    return <Empty>数据加载失败</Empty>;
  }
  switch (props.form.typeName) {
    case '表单':
    case '主表':
      return (
        <WorkFormViewer
          allowEdit={props.allowEdit}
          info={props.info}
          data={data.current}
          service={service.current}
        />
      );
    case '报表':
      return (
        <WorkReportViewer
          allowEdit={props.allowEdit}
          form={props.form}
          info={props.info}
          fields={service.current.fields}
          data={data.current}
          formData={service.current.formData}
          rules={props.service.model.rules}
          belong={service.current.belong}
          readonly={!props.allowEdit}
          service={props.service}
          onValuesChange={(field, value) => {
            service.current.onValueChange(field, value, data.current);
          }}
        />
      );
    case '表格':
      return (
        <NewWorkReportViewer
          allowEdit={props.allowEdit}
          form={props.form}
          info={props.info}
          fields={service.current.fields}
          data={data.current}
          formData={service.current.formData}
          rules={props.service.model.rules}
          belong={service.current.belong}
          readonly={!props.allowEdit}
          service={props.service}
          onValuesChange={(field, value) => {
            service.current.onValueChange(field, value, data.current);
          }}
        />
      );
    default:
      return <>未维护该类型表单打开方式</>;
  }
};

interface IProps {
  service: WorkFormService;
  node: model.WorkNodeModel;
  tabBarExtraContent?: TabBarExtraContent;
  instanceData?: model.InstanceDataModel;
}

const PrimaryForms: React.FC<IProps> = (props) => {
  if (props.node.primaryForms.length < 1) return <></>;
  const [activeTabKey, setActiveTabKey] = useState(props.node.primaryForms[0].id);
  const loadItems = () => {
    const items = [];
    for (const form of props.node.primaryForms) {
      let info =
        props.node.forms.find((item) => item.id == form.id) ?? ({} as model.FormInfo);
      if (
        props.service.model.rules?.find(
          (a) => a.destId == form.id && a.typeName == 'visible' && !a.value,
        )
      ) {
        continue;
      }
      items.push({
        key: form.id,
        label: form.name,
        forceRender: true,
        children: (
          <PrimaryForm
            allowEdit={props.service.allowEdit}
            info={info}
            form={form}
            service={props.service}
            node={props.node}
            instanceData={props.instanceData}
          />
        ),
      });
    }
    return items;
  };
  return (
    <Tabs
      items={loadItems()}
      activeKey={activeTabKey}
      tabBarExtraContent={props.tabBarExtraContent}
      onChange={(key) => setActiveTabKey(key)}
    />
  );
};

export default PrimaryForms;
