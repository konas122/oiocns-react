import React, { useState, useEffect } from 'react';
import { WithCommonProps, defineElement } from '../../defineElement';
import cls from './index.module.less';
import Cloud from '/img/cloud.jpg';
import { Input, Select } from 'antd';
import orgCtrl from '@/ts/controller';
import AccoutModal from '@/components/DataPreview/session/info/accoutModal';

interface IIframe {
  url: string;
  system: any;
  isNeedAccount: boolean;
  info: any;
  iframeId: string;
  onBindInfo: Function;
}

const Design: React.FC<WithCommonProps<IIframe>> = (props) => {
  const [url, setUrl] = useState(props.url);
  const [system, setSystem] = useState(props.system ?? { value: '' });

  return (
    <>
      <IframeContent
        {...props}
        url={url}
        isNeedAccount={props.isNeedAccount}
        info={props.info}
        onBindInfo={(info: any) => {
          props.onBindInfo(info);
        }}
      />
      {/* <iframe className={cls.iframe} loading="eager" src={resetUrl(props.info, url)} /> */}
      <Input
        style={{ width: 200, position: 'absolute', left: 10, bottom: 10 }}
        value={url}
        placeholder="输入外部地址"
        onChange={(e) => {
          props.props.url = e.target.value;
          setUrl(e.target.value);
        }}
      />
      <Select
        style={{ width: 160, position: 'absolute', left: 220, bottom: 10 }}
        allowClear={true}
        placeholder="请选择系统(选填)"
        value={system && system.value ? system.value : null}
        options={[{ value: 'assetcloud2', label: '共享云老版本' }]}
        onChange={(e, obj) => {
          props.props.system = obj;
          setSystem(obj);
        }}
        onClear={() => {
          props.props.system = {};
          setSystem({});
        }}
      />
    </>
  );
};

const IframeContent: React.FC<WithCommonProps<IIframe>> = (props) => {
  const [showAccountType, setShowAccountType] = useState<string>('');

  const _key = new Date().getTime();
  if (!props.isNeedAccount) {
    let newUrl = props.url ?? '';
    if (props.url) {
      newUrl = props.url + (props.url.indexOf('?') != -1 ? '&' : '?') + '&t=' + _key;
    }
    return (
      <iframe
        id={props.iframeId}
        key={_key}
        className={cls.iframe}
        loading="eager"
        src={newUrl}
      />
    );
  }

  if (props.info.account && props.info.password) {
    let newUrl = props.url ?? '';
    if (props.url) {
      newUrl =
        props.url +
        (props.url.indexOf('?') != -1 ? '&' : '?') +
        'account=' +
        props.info.account +
        '&password=' +
        encodeURIComponent(props.info.password) +
        '&t=' +
        _key;
    }
    return (
      <iframe
        id={props.iframeId}
        key={_key}
        className={cls.iframe}
        loading="eager"
        src={newUrl}
      />
    );
  }
  return (
    <>
      <a
        style={{
          display: 'block',
          textDecoration: 'underline',
          fontSize: '18px',
          textAlign: 'center',
        }}
        onClick={() => {
          setShowAccountType('assetcloud2');
        }}>
        请先绑定系统账号
      </a>
      {showAccountType === 'assetcloud2' && (
        <AccoutModal
          info={{ key: 'assetcloud2', title: '共享云老版本' }}
          onOk={(result: any) => {
            props.onBindInfo(result);
            setShowAccountType('');
          }}
          onCancel={() => {
            setShowAccountType('');
          }}
        />
      )}
    </>
  );
};

export default defineElement({
  render(props, ctx) {
    const [info, setInfo] = useState<any>({});
    const [system, setSystem] = useState(props.system ?? { value: '' });
    const [isNeedAccount, setIsNeedAccountt] = useState<boolean>(false);

    useEffect(() => {
      setSystem(props.system ?? { value: '' });
      const sysValue = system.value ?? '';
      setIsNeedAccountt(sysValue && sysValue != '' ? true : false);
      const fetchData = async () => {
        const cachePath = 'account.' + orgCtrl.user.cache.fullId;
        const res: any = await orgCtrl.user.cacheObj.get(cachePath);
        if (sysValue && sysValue != '') {
          setIsNeedAccountt(true);
          if (res?.fullId && res[sysValue]) {
            setInfo(res[sysValue]);
          }
        }
      };
      fetchData();
    }, []);
    if (ctx.view.mode == 'design') {
      return (
        <Design
          {...props}
          iframeId={ctx.view.page.id}
          isNeedAccount={isNeedAccount}
          info={info}
          onBindInfo={(info: any) => {
            setInfo(info);
          }}
        />
      );
    }
    return (
      <IframeContent
        {...props}
        iframeId={ctx.view.page.id}
        url={props.url}
        isNeedAccount={isNeedAccount}
        info={info}
        onBindInfo={(info: any) => {
          setInfo(info);
        }}
      />
    );
    // return <iframe className={cls.iframe} loading="eager" src={props.url} />;
  },
  displayName: 'Iframe',
  meta: {
    props: {
      url: {
        type: 'string',
        label: '链接地址',
      },
      system: {
        type: 'enum',
        label: '系统名称',
        options: [
          {
            value: 'assetcloud2',
            label: '共享云老版本',
          },
        ],
      },
    },
    type: 'Template',
    layoutType: 'full',
    photo: Cloud,
    description: '用于链接外部地址',
    label: '链接',
  },
});
