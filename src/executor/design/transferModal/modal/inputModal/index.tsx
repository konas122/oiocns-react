import Viewer from '@/components/DataStandard/WorkForm/Viewer';
import { IForm } from '@/ts/core';
import FormService from '@/ts/scripting/core/services/FormService';
import { Modal } from 'antd';
import React, { useRef } from 'react';

interface IProps {
  current: IForm;
  finished: (values?: any) => void;
}

const InputModal: React.FC<IProps> = ({ current, finished }) => {
  const ref = useRef<any>({});
  const service = useRef(FormService.fromIForm(current));
  return (
    <Modal
      open
      title={'输入'}
      onOk={() => finished(ref.current)}
      onCancel={() => finished()}
      destroyOnClose={true}
      cancelText={'关闭'}
      width={1200}>
      <Viewer data={ref.current} allowEdit={true} service={service.current} />
    </Modal>
  );
};

export { InputModal };
