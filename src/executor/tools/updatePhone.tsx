import React, { useState } from 'react';
import { Input, Space, Button, message, Modal } from 'antd';
import { model } from '@/ts/base';
import { getResouces } from '@/config/location';
import orgCtrl from '@/ts/controller';

interface Iprops {
  value: string;
  readonly: boolean;
  title: string;
  onChanged: (value: model.LoginModel) => void;
}

const UpdatePhone: React.FC<Iprops> = ({ value, readonly, title, onChanged }) => {
  const resources = getResouces();
  const [open, setOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<model.LoginModel>({
    account: value,
  });

  const verifyFun = (type?: string): boolean => {
    if (!/(^1[3|4|5|6|7|8|9]\d{9}$)|(^09\d{8}$)/.test(formData.account)) {
      message.warn('请输入正确的手机号');
      return false;
    }
    if (formData.account === value) {
      message.warn('请先修改手机号');
      return false;
    }

    if (type === 'submit') {
      const isFormDataEmpty =
        !Object.prototype.hasOwnProperty.call(formData, 'dynamicCode') ||
        formData['dynamicCode'] === '';

      if (isFormDataEmpty) {
        message.warn('请完善必填项');
        return false;
      }
    }
    return true;
  };

  const getDynamicCode = React.useCallback(async () => {
    if (verifyFun()) {
      const res = await orgCtrl.auth.dynamicCode({
        account: formData.account,
        platName: resources.platName,
        dynamicId: '',
      });
      if (res.success && res.data) {
        setFormData({ ...formData, dynamicId: res.data.dynamicId });
      }
    }
  }, [formData]);

  return (
    <Space>
      <Input value={value} readOnly={readonly} />
      <Button type="link" onClick={() => setOpen(true)}>
        修改手机号
      </Button>
      <Modal
        width={400}
        title={title}
        open={open}
        onOk={() => {
          if (verifyFun('submit')) {
            onChanged(formData);
            setOpen(false);
          }
        }}
        onCancel={() => setOpen(false)}>
        <Space direction="vertical" size={30}>
          <Input
            size="middle"
            placeholder="请输入手机号"
            autoComplete="new-password"
            value={formData.account}
            readOnly={false}
            onChange={(e) => {
              setFormData({ ...formData, account: e.target.value });
            }}
          />
          <Space direction="vertical" size={16}>
            <div>短信验证码的编号为：{formData.dynamicId}</div>
            <Space direction="horizontal" size={0}>
              <Input
                size="middle"
                placeholder={`请输入验证码`}
                autoComplete="new-password"
                onChange={(e) =>
                  setFormData({ ...formData, dynamicCode: e.target.value })
                }
              />
              <Button
                disabled={formData.dynamicId != undefined}
                size="middle"
                type="primary"
                onClick={getDynamicCode}>
                获取验证码
              </Button>
            </Space>
          </Space>
        </Space>
      </Modal>
    </Space>
  );
};
export default UpdatePhone;
