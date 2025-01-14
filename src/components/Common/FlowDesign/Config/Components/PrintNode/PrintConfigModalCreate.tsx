import React, { FC, useState } from 'react';
import FullScreenModal from '@/components/Common/fullScreen';
import { WorkNodeDisplayModel } from '@/utils/work';
import { Modal, Form, Input } from 'antd';
import message from '@/utils/message';
import PrintCreate from './printCreate';
// import { IApplication, IPrint } from '@/ts/core';
interface IProps {
  current: WorkNodeDisplayModel;
  refresh: (param?: object) => void;
}
const PrintConfigModalCreate: FC<IProps> = (props) => {
  const [form] = Form.useForm();
  const [state, setState] = useState<boolean>(false);
  const [modalFlag, setModalFlag] = useState<boolean>(false);
  const [values, setValues] = useState<string>('');
  const Save = () => {
    setState(true);
  };
  const handSave = async (print: any) => {
    if (print.name && state) {
      message.info('保存成功');
      print.name = values;
      props.refresh(print);
    }
  };
  const handSaveModal = () => {
    setModalFlag(true);
  };
  const onOk = () => {
    form
      .validateFields()
      .then((values) => {
        form.resetFields();
        setValues(values.name);
        Save();
        setModalFlag(false);
      })
      .catch((_) => {
        message.error('保存失败');
      });
  };
  const onCancel = () => {
    setModalFlag(false);
  };
  return (
    <FullScreenModal
      open
      title={'打印模板配置'}
      onCancel={() => props.refresh()}
      destroyOnClose
      width={'80vw'}
      bodyHeight={'70vh'}
      modal={true}
      onSaveModal={handSaveModal}
      onSave={Save}>
      <>
        <PrintCreate state={state} handSave={handSave} print={values} />
        {modalFlag && (
          <Modal open={modalFlag} onOk={onOk} onCancel={onCancel} okText={'确认保存'}>
            <Form
              form={form}
              layout="vertical"
              name="form_in_modal"
              initialValues={{ modifier: 'public' }}>
              <Form.Item
                name="name"
                label="保存模板名称"
                rules={[
                  {
                    validator: (_rule, value) => {
                      const currentData = props.current.print.filter(
                        (item) => item.name == value,
                      );
                      if (value == undefined) {
                        return Promise.reject('请输入模板名称');
                      }
                      if (currentData.length > 0) {
                        return Promise.reject('该名称已存在');
                      }
                      return Promise.resolve();
                    },
                  },
                ]}>
                <Input />
              </Form.Item>
            </Form>
          </Modal>
        )}
      </>
    </FullScreenModal>
  );
};

export default PrintConfigModalCreate;
