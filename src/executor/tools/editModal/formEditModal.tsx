import { Modal } from 'antd';
import React from 'react';
import { kernel, model, schema } from '@/ts/base';
import { IBelong } from '@/ts/core';
import { setDefaultField } from '@/ts/scripting/core/services/FormService';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import { XThing } from '@/ts/base/schema';
import WorkForm from '../workForm';
import { formatDate } from '@/ts/base/common';

interface IFormEditProps {
  form: schema.XForm;
  fields: model.FieldModel[];
  belong: IBelong;
  create: boolean;
  initialValues?: XThing;
  formData?: any;
}

const FormEditModal = async ({
  form,
  fields,
  belong,
  create,
  initialValues,
}: IFormEditProps) => {
  if (create) {
    const res = await kernel.createThing(belong.id, [], '');
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      await setDefaultField(res.data[0], fields, belong);
      initialValues = res.data[0];
    }
  }
  const editData = { ...initialValues } as XThing;
  const work = WorkFormService.createStandalone(belong, form, fields, true, [
    {
      before: [],
      after: [editData],
      nodeId: 'nodeId',
      formName: form.name,
      creator: belong.userId,
      createTime: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss.S'),
      rules: [],
    },
  ]);

  return await new Promise<XThing>((s, e) => {
    function close() {
      modal.destroy();
      work.dispose();
    }

    const modal = Modal.confirm({
      icon: <></>,
      width: '80vw',
      className: 'edit-modal',
      okText: `确认${create ? '新增' : '变更'}`,
      cancelText: '关闭',
      onCancel: () => {
        close();
        e('close');
      },
      content: (
        <div
          style={{
            maxHeight: '70vh',
            width: '100%',
            overflowY: 'scroll',
            minHeight: 600,
          }}>
          <WorkForm
            allowEdit={true}
            isCreate={create}
            belong={belong}
            nodeId={work.model.node.id}
            data={work.model}
          />
        </div>
      ),
      onOk: async () => {
        let errors = await work.validateAll();
        if (errors.length === 0) {
          close();
          s(work.model.data[form.id][0].after.at(-1)!);
        } else {
          throw new Error('校验失败');
        }
      },
    });
  });
};

export default FormEditModal;
