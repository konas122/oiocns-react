import React, { FC } from 'react';
import './index.less';
import { styleTemplate } from './style';
import { IWorkTask, IWorkApply } from '@/ts/core';
import Template1 from './Template1';
import Drafts from './drafts';

interface IProps {
  name?: string;
  instanceData?: any;
  printData: any;
  print: any;
  current?: IWorkTask | IWorkApply;
  type?: string;
  primary?: any;
  loading: () => void;
}
const Template: FC<IProps> = ({
  printData,
  current,
  loading,
  print,
  type,
  name,
  instanceData,
  primary,
}) => {
  return (
    <>
      {type != 'default' && current && (
        <Template1
          printData={printData}
          print={print}
          current={current as IWorkTask}
          loading={loading}
          styleTemplate={styleTemplate}
        />
      )}
      {type == 'default' && name && instanceData && (
        <Drafts
          name={name}
          instanceData={instanceData}
          printData={printData}
          print={print}
          loading={loading}
          primary={primary}
          styleTemplate={styleTemplate}
        />
      )}
    </>
  );
};
export default Template;
