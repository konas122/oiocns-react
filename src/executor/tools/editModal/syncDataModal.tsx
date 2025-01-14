import { Modal, Card, message } from 'antd';
import React from 'react';
import { model, schema } from '@/ts/base';
import { ITarget, IForm } from '@/ts/core';
import { Form } from '@/ts/core/thing/standard/form';
import { XThing } from '@/ts/base/schema';

interface IFormSelectProps {
  form: schema.XForm;
  fields: model.FieldModel[];
  belong: ITarget;
  multiple?: Boolean;
  isShowClass?: Boolean;
  onSave: (values: schema.XThing[]) => void;
  onCancel?: () => void;
  returnRawData?: boolean;
}

const SyncDataModal = async ({ form, belong }: IFormSelectProps) => {
  const curDirectory = belong.targets.find((target) => target.id === form.shareId);
  if (!curDirectory) return message.warning('未查询到集群信息');
  const groupMetaForm: IForm = new Form(form, curDirectory.directory);
  const companyMetaForm: IForm = new Form(form, belong.directory);

  return await new Promise<XThing>((s, e) => {
    function close() {
      modal.destroy();
    }

    const modal = Modal.confirm({
      title: '数据同步',
      icon: <></>,
      width: '30vw',
      className: 'edit-modal',
      okText: '确认同步',
      cancelText: '关闭',
      onCancel: () => {
        close();
        e('close');
      },
      content: (
        <Card
          style={{
            maxHeight: '70vh',
            width: '100%',
            overflowY: 'scroll',
            minHeight: 200,
          }}>
          本次同步的数据来源表单为{groupMetaForm.name}，同步至集合 &nbsp;"
          {groupMetaForm.thingColl.collName}
          "&nbsp;中,是否确认同步数据？
        </Card>
      ),
      onOk: async () => {
        let running = true;
        let loadOptions: any = {
          take: 100,
          skip: 0,
          sort: [
            {
              selector: 'id',
              desc: false,
            },
          ],
        };
        loadOptions.options = loadOptions.options || {};
        while (running) {
          const formData = await groupMetaForm.loadThing(loadOptions);
          if (formData.data.length === 0) {
            running = false;
            message.success('同步完成');
          } else {
            loadOptions.skip += loadOptions.take;
            if (formData.success) {
              const result = await companyMetaForm.thingColl.replaceMany(formData.data);
              if (formData.data.length > 0 && result.length === 0) {
                running = false;
                return message.error('同步失败');
              }
            }
          }
        }
      },
    });
  });
};

export default SyncDataModal;
