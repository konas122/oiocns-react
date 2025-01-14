import CustomBuilder from '@/components/DataStandard/WorkForm/Design/config/formRule/builder';
import OpenFileDialog from '@/components/OpenFileDialog';
import { IFinancial, IProperty } from '@/ts/core';
import { fieldConvert } from '@/utils/tools';
import { Input, Modal, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { useEffectOnce } from 'react-use';
import { FieldInfo } from 'typings/globelType';

interface IProps {
  financial: IFinancial;
  onFinished: () => void;
}

const Filter: React.FC<IProps> = (props) => {
  const [fields, setFields] = React.useState<FieldInfo[]>([]);
  const [excludes, setExcludes] = useState(props.financial.configuration.excludes);
  const [center, setCenter] = useState(<></>);
  useEffectOnce(() => {
    props.financial.loadFields().then((res) => setFields(fieldConvert(res)));
  });
  useEffect(() => {
    const id = props.financial.subscribe(() => {
      setExcludes(props.financial.configuration.excludes);
    });
    return () => {
      props.financial.unsubscribe(id);
    };
  }, []);
  if (fields.length === 0) {
    return <></>;
  }
  return (
    <>
      <Modal
        title={'过滤条件'}
        open
        onOk={() => props.onFinished()}
        onCancel={() => props.onFinished()}
        footer={<></>}>
        <Space direction="vertical">
          <span>增加过滤</span>
          <CustomBuilder
            fields={fields}
            displayText={props.financial.configuration.filterExp?.plus ?? '[]'}
            onValueChanged={(value: string) => {
              props.financial.configuration.setFilterExp({
                ...props.financial.configuration.filterExp,
                plus: value,
              });
            }}
          />
          <span>减少过滤</span>
          <CustomBuilder
            fields={fields}
            displayText={props.financial.configuration.filterExp?.minus ?? '[]'}
            onValueChanged={(value: string) => {
              props.financial.configuration.setFilterExp({
                ...props.financial.configuration.filterExp,
                minus: value,
              });
            }}
          />
          <span>期初期末过滤</span>
          <CustomBuilder
            fields={fields}
            displayText={props.financial.configuration.filterExp?.time ?? '[]'}
            onValueChanged={(value: string) => {
              props.financial.configuration.setFilterExp({
                ...props.financial.configuration.filterExp,
                time: value,
              });
            }}
          />
          <span>排除影响维度</span>
          <Input
            allowClear
            onChange={() => props.financial.configuration.setExcludes([])}
            onClick={() => {
              setCenter(
                <OpenFileDialog
                  accepts={['变更源']}
                  rootKey={props.financial.space.key}
                  multiple
                  onOk={async (files) => {
                    await props.financial.configuration.setExcludes(
                      files.map((item) => (item as IProperty).metadata),
                    );
                    setCenter(<></>);
                  }}
                  onCancel={() => setCenter(<></>)}
                />,
              );
            }}
            value={excludes.map((item: any) => item.name).join('、')}
          />
        </Space>
      </Modal>
      {center}
    </>
  );
};

export default Filter;
