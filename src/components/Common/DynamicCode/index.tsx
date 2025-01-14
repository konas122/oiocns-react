import { Button, Input, message, Space } from 'antd';
import React, { useImperativeHandle, useState, forwardRef } from 'react';
import { AiOutlineLock, AiOutlineUser } from 'react-icons/ai';
import { model } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { getResouces } from '@/config/location';

interface DynamicCodeType {
  /** 是否展示手机号 */
  showPhone?: boolean;
  /** 是否可修改手机号 */
  editPhone?: boolean;
  /** 手机号 */
  account?: string;
}
// eslint-disable-next-line react/display-name
const DynamicCode = forwardRef((props: DynamicCodeType, ref: any) => {
  const { showPhone = true, editPhone = true, account } = props;
  const resources = getResouces();
  const [formData, setFormData] = useState<model.LoginModel>({
    account: account ?? '',
    dynamicCode: '',
    dynamicId: '',
  });
  /**
   * @description: 获取手机验证码
   * @return {*}
   */
  const getDynamicCode = React.useCallback(async () => {
    if (!/(^1[3|4|5|6|7|8|9]\d{9}$)|(^09\d{8}$)/.test(formData.account)) {
      message.warn('请输入正确的手机号');
      return false;
    }
    const res = await orgCtrl.auth.dynamicCode({
      account: formData.account,
      platName: `${resources.platName ?? '资产共享云'}_注销账户`,
      dynamicId: '',
    });
    if (res.success && res.data) {
      setFormData({ ...formData, dynamicId: res.data.dynamicId });
    }
  }, [formData]);
  /**
   * @description: 校验验证码
   * @return {*}
   */
  const verifyCode = (): boolean => {
    if (!formData.dynamicId || !formData.dynamicCode) {
      message.warning('请先获取验证码');
      return false;
    }
    //TODO:验证手机号与 验证码匹配
    return true;
  };
  useImperativeHandle(ref, () => ({
    // 暴露给父组件的方法
    verifyCode,
  }));
  return (
    <Space direction="vertical" size={16}>
      {showPhone && (
        <Input
          prefix={<AiOutlineUser />}
          placeholder={`请输入手机号`}
          size="large"
          readOnly={!editPhone}
          defaultValue={formData.account}
          onChange={(e) => setFormData({ ...formData, account: e.target.value })}
        />
      )}
      {/* <div>短信验证码的编号为：{formData.dynamicId}</div> */}
      <Space direction="horizontal" size={0}>
        <Input
          size="large"
          prefix={<AiOutlineLock />}
          placeholder={`请输入验证码`}
          onChange={(e) => setFormData({ ...formData, dynamicCode: e.target.value })}
        />
        <Button
          size="large"
          type="primary"
          disabled={!!formData.dynamicId && formData.dynamicId.length >= 5}
          onClick={getDynamicCode}>
          获取验证码
        </Button>
      </Space>
    </Space>
  );
});

export default DynamicCode;
