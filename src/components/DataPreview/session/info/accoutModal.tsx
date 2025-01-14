import React, { useState, useEffect } from 'react';
import { common } from '@/ts/base';
import { Input } from 'antd';
import message from '@/utils/message';
import orgCtrl from '@/ts/controller';
import FullScreenModal from '@/components/Common/fullScreen';

interface IProps {
  info: {
    id?: number | string;
    key: string;
    title: string;
    bindInfo?: {};
  };
  onOk: (result: any) => void;
  onCancel: () => void;
}

interface IAccountInfo {
  account: string;
  password: string;
  tenantCode?: string;
}

const AccoutModal: React.FC<IProps> = (props) => {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const cachePath = 'account.' + orgCtrl.user.cache.fullId;
  const secret = 'assetcloudorgcna';

  useEffect(() => {
    orgCtrl.user.cacheObj.get(cachePath).then((res: any) => {
      if (res && res.fullId) {
        const accountInfo = res[props.info.key] ?? {};
        if (accountInfo) {
          setAccount(accountInfo.account ?? '');
          setPassword(common.decrypt(secret, accountInfo.password) ?? '');
        }
      }
    });
  }, []);

  const serialize = (data: any) => {
    let list: any = [];
    Object.keys(data).forEach((ele) => {
      list.push(`${ele}=${data[ele]}`);
    });
    return list.join('&');
  };

  // 内网版本校验
  const getVerifyStatus = async (accountInfo: IAccountInfo) => {
    let url =
      'http://59.202.38.125/platform//authVerify?' + serialize({ ...accountInfo });
    const res = await fetch(url, {
      method: 'post',
    });
    if (!res.ok) {
      message.warn('请输入正确的账号和密码！');
      return false;
    }
    const data = await res.json();
    if (data.info.returnCode === '0001') {
      return true;
    } else {
      message.warn('请输入正确的账号和密码！');
      return false;
    }
  };

  // 外网校验
  const getNetVerifyStatus = async (accountInfo: IAccountInfo) => {
    const res = await fetch(
      `${location.protocol}//assetcloud.asset-cloud.cn/dev-api/blade-auth/token?` +
      serialize({
        ...accountInfo,
        tenantCode: '',
      }),
      {
        method: 'post',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          Authorization: 'Basic c3dvcmQ6c3dvcmRfc2VjcmV0',
        },
      },
    );

    if (!res.ok) {
      message.warn('请输入正确的账号和密码！');
      return false;
    }
    const data = await res.json();
    if (data.code === 200 && data.data.accessToken) {
      return true;
    } else {
      message.warn('请输入正确的账号和密码！');
      return false;
    }
  };

  const handleOk = async () => {
    if (account == '' || password == '') {
      message.warn('请选择完善信息后再提交');
      return;
    }
    const _pwd = common.encrypt(secret, password);
    const accountInfo = { account, password: encodeURIComponent(_pwd) };

    const arr = ['59.202.38.125:8081'];
    const status = arr.includes(location.host)
      ? await getVerifyStatus(accountInfo)
      : await getNetVerifyStatus(accountInfo);
    if (status) {
      const result = {
        ...accountInfo,
        fullId: orgCtrl.user.cache.fullId,
        [props.info.key]: { account: accountInfo.account, password: _pwd },
      };
      const res = await orgCtrl.user.cacheObj.set(cachePath, result);
      if (res) {
        message.info('保存成功');
        props.onOk(accountInfo);
      } else {
        message.warn('提交失败');
      }
    }
  };

  const handleCancel = () => {
    props.onCancel();
  };

  return (
    <>
      <FullScreenModal
        open
        title={props.info.title + '绑定'}
        onSave={handleOk}
        onCancel={handleCancel}>
        <div style={{ padding: '15px' }}>
          <Input
            placeholder="请输入账号"
            autoComplete="new-user"
            value={account}
            onChange={(e) => {
              setAccount(e.target.value);
            }}
          />
          <Input.Password
            placeholder="请输入密码"
            autoComplete="new-password"
            value={password}
            visibilityToggle={{
              visible: passwordVisible,
              onVisibleChange: setPasswordVisible,
            }}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </div>
      </FullScreenModal>
    </>
  );
};

export default AccoutModal;
