import { IBelong, IWork } from '@/ts/core';
import { useRef, useState } from 'react';
import React from 'react';
import { Tabs } from 'antd';
import WorkFormViewer from '@/components/DataStandard/WorkForm/Viewer';
import WorkReportViewer from '@/components/DataStandard/ReportForm/Viewer';
import FormService from '@/ts/scripting/core/services/FormService';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import { FieldModel, WorkNodeModel } from '@/ts/base/model';
import { schema } from '@/ts/base';

interface IProps {
  form: schema.XForm;
  work: WorkFormService;
  belong: IBelong;
}

export const PrimaryForm: React.FC<IProps> = ({ form, work, belong }) => {
  const service = useRef(new FormService(form, work));
  const [loaded, data] = useAsyncLoad(() => service.current.createThing());
  if (!loaded || !data) {
    return <></>;
  }
  switch (form.typeName) {
    case '表单':
    case '主表':
      return <WorkFormViewer allowEdit={false} service={service.current} data={data} />;
    case '报表':
      return (
        <WorkReportViewer
          form={form}
          readonly={true}
          belong={belong}
          fields={work.model.fields[form.id]}
          rules={[]}
          height={'calc(85vh - 20px)'}
          data={data}
          service={work}
          allowEdit={false}
        />
      );
    default:
      return <>未维护该类型表单打开方式</>;
  }
};

interface PrimaryIProps {
  node: WorkNodeModel;
  work: IWork;
}

const Preview: React.FC<PrimaryIProps> = (props) => {
  const belong = props.work.directory.target.space;
  const all = [...props.work.primaryForms, ...props.work.detailForms];
  const forms = [...props.node.primaryForms, ...props.node.detailForms];
  const [activeTabKey, setActiveTabKey] = useState<string | undefined>();
  const service = useRef<WorkFormService>(null!);
  if (!service.current) {
    service.current = new WorkFormService(
      props.work.directory.target.space,
      {
        node: props.node,
        fields: all
          .filter((item) => forms.map((one) => one.id).includes(item.id))
          .reduce<Dictionary<FieldModel[]>>((a, v) => {
            a[v.id] = v.fields;
            return a;
          }, {}),
        data: {},
        primary: {},
        rules: [],
      },
      false,
    );
    service.current.init();
  }
  const loadItems = () => {
    return [
      ...props.node.primaryForms.map((form) => {
        return {
          key: 'primary' + form.id,
          label: `【主表】${form.name}`,
          forceRender: true,
          children: <PrimaryForm form={form} work={service.current} belong={belong} />,
        };
      }),
      ...props.node.detailForms.map((form) => {
        return {
          key: 'detail' + form.id,
          label: `【子表】${form.name}`,
          forceRender: true,
          children: <PrimaryForm form={form} work={service.current} belong={belong} />,
        };
      }),
    ];
  };
  return (
    <>
      <Tabs
        className="ogo-tabs-primary"
        items={loadItems()}
        activeKey={activeTabKey}
        onChange={(key) => setActiveTabKey(key)}
      />
    </>
  );
};

export default Preview;
