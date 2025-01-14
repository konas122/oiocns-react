import { Card, Tabs } from 'antd';
import React, { useRef } from 'react';
import ThingArchive from '../archive';
import { IForm } from '@/ts/core';
import { schema } from '@/ts/base';
import WorkFormViewer from '@/components/DataStandard/WorkForm/Viewer';
import FormService from '@/ts/scripting/core/services/FormService';

interface IProps {
  form: IForm;
  thingData: schema.XThing;
}

/**
 * 物-查看
 * @returns
 */
const CardView: React.FC<IProps> = (props) => {
  const service = useRef(FormService.fromIForm(props.form));
  const convertData = () => {
    let data: any = {};
    for (let [key, value] of Object.entries(props.thingData)) {
      const field = props.form.fields.find((a) => a.code == key);
      if (field) {
        data[field.id] = value;
      }
    }
    return data;
  };
  return (
    <Card>
      <Tabs
        items={[
          {
            key: '1',
            label: `卡片信息`,
            children: (
              <WorkFormViewer
                key={props.form.id}
                allowEdit={false}
                data={convertData()}
                service={service.current}
              />
            ),
          },
          {
            key: '2',
            label: `归档痕迹`,
            children: (
              <ThingArchive instances={Object.values(props.thingData?.archives ?? {})} />
            ),
          },
        ]}
      />
    </Card>
  );
};

export default CardView;
