import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import FullScreenModal from '@/components/Common/fullScreen';
import { schema } from '@/ts/base';
import { IDirectory } from '@/ts/core';
import React, { useState } from 'react';
import ReportView from './reportView';
import { IReportView } from '@/ts/core/thing/standard/view/reportView';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import LoadingView from '@/components/Common/Loading';

interface IProps {
  current: IReportView;
  form: schema.XView;
  directory: IDirectory;
  finished: () => void;
}

const ReportViewModal: React.FC<IProps> = ({ current, form, directory, finished }) => {
  const [formView, setFormView] = useState<schema.XView>(form);

  const [loaded] = useAsyncLoad(async () => {
    const data = await current.load();
    setFormView(data);
  }, []);

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
      {loaded ? (
        <ReportView current={current} form={formView} directory={directory} />
      ) : (
        <div className="loading-page">
          <LoadingView text="配置信息加载中..." />
        </div>
      )}
    </FullScreenModal>
  );
};

export default ReportViewModal;
