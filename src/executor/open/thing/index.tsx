import React, { useRef, useState } from 'react';
import { schema } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import WorkFormViewer from '@/components/DataStandard/WorkForm/Viewer';
import { XForm } from '@/ts/base/schema';
import { IBelong, IForm } from '@/ts/core';
import { Form } from '@/ts/core/thing/standard/form';
import FullScreenModal from '@/components/Common/fullScreen';
import { message } from 'antd';
import FormService from '@/ts/scripting/core/services/FormService';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';

interface Iprops {
  entity: schema.XThing;
  finished: () => void;
}
const ThingPreview: React.FC<Iprops> = ({ entity, finished }) => {
  const [form, setForm] = useState<XForm>();
  const [formInst, setFormInst] = useState<IForm>();
  const [formBelong, setFormBelong] = useState<IBelong>();
  const service = useRef<FormService>();
  const info = {
    id: entity?.formId,
    typeName: '主表',
    allowAdd: false,
    allowEdit: false,
    allowSelect: false,
  };
  // 初始化
  const [loaded] = useAsyncLoad(async () => {
    const { formId: targetFormId, belongId, form: xForm, fields } = entity;
    const belong = orgCtrl.user.companys.find((a) => a.id == belongId) || orgCtrl.user;
    setFormBelong(belong);
    if (targetFormId && belong) {
      let formList = await belong.resource.formColl.find([targetFormId]);
      if (fields && (xForm || entity)) {
        const useForm = xForm || { ...(entity || {}), attributes: fields };
        const formInst = new Form(
          { ...useForm, id: (xForm?.id || entity?.id) + '_' },
          belong.directory,
        );
        setForm(useForm);
        setFormInst(formInst);
        service.current = new FormService(
          useForm,
          WorkFormService.createStandalone(belong, useForm, fields),
        );
        return formInst;
      }
      if (formList.length > 0) {
        const useForm = formList[0];
        // 设置表单
        setForm(useForm);
        const formInst = new Form({ ...useForm, id: useForm.id + '_' }, belong.directory);
        await formInst.loadFields();
        service.current = new FormService(
          useForm,
          WorkFormService.createStandalone(belong, useForm, formInst.fields),
        );
        // 设置表单实例
        setFormInst(formInst);
        return formInst;
      }
    }
  });

  if (!loaded) {
    return <></>;
  } else if (!(formBelong && form && formInst && service.current)) {
    message.warning('出现错误，必要参数缺失😥');
    return <></>;
  }

  return (
    <FullScreenModal
      open
      onCancel={() => finished && finished()}
      width={'80vw'}
      title={'数据详情'}
      bodyStyle={{
        maxHeight: '100vh',
      }}>
      <WorkFormViewer
        allowEdit={false}
        data={entity}
        info={info}
        service={service.current}
      />
    </FullScreenModal>
  );
};

export default ThingPreview;
