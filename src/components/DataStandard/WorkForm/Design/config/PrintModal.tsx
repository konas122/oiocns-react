import React, { FC, useState, useEffect } from 'react';
import FullScreenModal from '@/components/Common/fullScreen';
import PrintTemplate from './Template';
import { IForm, IPrint } from '@/ts/core';
import { XForm } from '@/ts/base/schema';

interface IProps {
  refresh: (cur: any) => void;
  current: IForm;
  printType: string;
  print: any;
  primaryForms: XForm;
}

const ConfigModal: FC<IProps> = (props) => {
  const [print2, setPrint2] = useState<IPrint>();
  useEffect(() => {
    props.print &&
      props.print.forEach((item: any) => {
        if (item.id === props.printType) {
          const print = item as IPrint;
          setPrint2(print);
        }
      });
  }, []);
  return (
    <FullScreenModal
      open
      title={'打印模板配置'}
      onCancel={() => props.refresh(props.primaryForms)}
      destroyOnClose
      width={'80vw'}
      bodyHeight={'70vh'}>
      <>
        <PrintTemplate
          current={props.current}
          printType={props.printType}
          primaryForms={props.primaryForms}
          print={print2 as IPrint}
        />
      </>
    </FullScreenModal>
  );
};

export default ConfigModal;
