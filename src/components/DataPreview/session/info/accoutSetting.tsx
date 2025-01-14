import React, { useState, useEffect } from 'react';
import orgCtrl from '@/ts/controller';
import { Card, List } from 'antd';
import { EditOutlined, RightOutlined } from '@ant-design/icons';
import AccoutModal from '@/components/DataPreview/session/info/accoutModal';
import message from '@/utils/message';
import './accoutSetting.less';

const AccoutSetting: React.FC<{}> = (_props) => {
  const arr: any = [
    { id: 1, key: 'assetcloud2', title: '共享云老版本', bindInfo: {} },
    { id: 2, key: 'dingding', title: '钉钉', bindInfo: {} },
    { id: 3, key: 'qywx', title: '企业微信', bindInfo: {} },
    { id: 4, key: 'weibo', title: '微博', bindInfo: {} },
    { id: 5, key: 'weixin', title: '微信', bindInfo: {} },
  ];

  const [curItem, setCurItem] = useState<any>({});
  const [showModalType, setShowModalType] = useState<string>('');
  const [list, setList] = useState(arr);
  const cachePath = 'account.' + orgCtrl.user.cache.fullId;

  const setBindInfo = () => {
    orgCtrl.user.cacheObj.get(cachePath).then((res: any) => {
      if (res?.fullId) {
        const arr = [...list];
        arr.forEach((it) => {
          if (res[it.key]) {
            it['bindInfo'] = res[it.key];
          }
        });
        setList(arr);
      }
    });
  };

  useEffect(() => {
    setBindInfo();
  }, []);

  const onListItemClick = async (item: any) => {
    setCurItem(item);
    if (item.id === 1) {
      setShowModalType(item.key);
    } else {
      message.warn('功能开发中...');
    }
  };

  return (
    <>
      <Card title="账号和安全">
        <div className="password">
          <div className="passwordLabel">密码</div>
          <a
            className="passwordBtn"
            onClick={() => {
              message.warn('功能开发中...');
            }}>
            <EditOutlined /> 修改密码
          </a>
        </div>
        <div className="bindTitle">绑定第三方</div>
        <List
          className="demo-loadmore-list"
          itemLayout="horizontal"
          dataSource={list}
          renderItem={(item: any) => (
            <List.Item
              actions={[
                item.bindInfo?.account ? (
                  <span
                    key="list-loadmore-edit"
                    onClick={() => {
                      onListItemClick(item);
                    }}>
                    已绑定 <RightOutlined />
                  </span>
                ) : (
                  <a
                    key="list-loadmore-edit"
                    onClick={() => {
                      onListItemClick(item);
                    }}>
                    绑定 <RightOutlined />
                  </a>
                ),
              ]}>
              {item.title}
            </List.Item>
          )}
        />
      </Card>
      {showModalType == 'assetcloud2' && (
        <AccoutModal
          info={curItem}
          onOk={(result: any) => {
            const arr = list.map((it: any) => {
              if (it.id == curItem.id) {
                it.bindInfo = result;
              }
              return { ...it };
            });
            setList(arr);
            setShowModalType('');
          }}
          onCancel={() => {
            setShowModalType('');
          }}
        />
      )}
    </>
  );
};

export default AccoutSetting;
