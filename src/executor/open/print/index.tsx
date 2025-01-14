import React, { FC, useState } from 'react';
import FullScreenModal from '@/components/Common/fullScreen';
import message from '@/utils/message';
import PrintCreate from '@/components/Common/FlowDesign/Config/Components/PrintNode/printCreate';
import { IPrint } from '@/ts/core';
interface IProps {
  formType: string; // 类型
  current: IPrint;
  finished: () => void;
}
const Print: FC<IProps> = (props) => {
  const [state, setState] = useState<boolean>(false);
  const Save = () => {
    setState(true);
  };
  const handSave = async (print: any) => {
    if (print.name && state) {
      const suuccess = await props.current.deitTable(print.table);
      if (suuccess) {
        message.info('保存成功');
        props.finished();
      }
    }
  };
  return (
    <FullScreenModal
      open
      title={'打印模板配置'}
      onCancel={() => props.finished()}
      destroyOnClose
      width={'80vw'}
      bodyHeight={'70vh'}
      onSave={Save}>
      <>
        <PrintCreate
          state={state}
          handSave={handSave}
          print={props.current.name}
          printData={props.current.table}
        />
      </>
    </FullScreenModal>
  );
};

export default Print;
