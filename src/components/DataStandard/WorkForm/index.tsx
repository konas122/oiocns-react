import { IForm } from '@/ts/core';
import React, { useRef } from 'react';
import Viewer from './Viewer';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import FormService from '@/ts/scripting/core/services/FormService';
import LoadingView from '@/components/Common/Loading';

const WorkForm: React.FC<{
  form: IForm;
}> = ({ form }) => {
  const service = useRef(FormService.fromIForm(form));
  const [loaded] = useAsyncLoad(() => form.loadContent(), [form]);
  if (loaded) {
    return <Viewer data={{}} allowEdit={false} service={service.current} />;
  }
  return (
    <div className="loading-page">
      <LoadingView text="信息加载中..." />
    </div>
  );
};

export default WorkForm;
