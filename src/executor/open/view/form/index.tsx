import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import FullScreenModal from '@/components/Common/fullScreen';
import { schema } from '@/ts/base';
import { IDirectory } from '@/ts/core';
import React from 'react';
import FormView from './formView';
interface IProps {
  form: schema.XView;
  directory: IDirectory;
  isMemberView: boolean;
  finished: () => void;
}

/** 表单查看--字典项过多 */
const DictFormViewModal: React.FC<IProps> = ({
  form,
  directory,
  isMemberView,
  finished,
}) => {
  return (
    <FullScreenModal
      centered
      open={true}
      fullScreen
      width={'80vw'}
      title={form.name}
      bodyHeight={'80vh'}
      icon={<EntityIcon entityId={form.id} />}
      destroyOnClose
      onCancel={() => finished()}>
      <FormView form={form} directory={directory} isMemberView={isMemberView} />
    </FullScreenModal>
  );
};

export default DictFormViewModal;
