import React, { FC } from 'react';
import './index.less';
import { styleTemplate } from './style';
import Template1 from './Template1';

interface IProps {
  printData: any;
  print: any;
  current: any;
  loading: () => void;
}
const Template: FC<IProps> = ({ printData, current, loading, print }) => {
  return (
    <>
      <Template1
        printData={printData}
        print={print}
        current={current}
        loading={loading}
        styleTemplate={styleTemplate}
      />
    </>
  );
};
export default Template;
