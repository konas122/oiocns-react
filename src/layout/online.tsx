import { useEffect, useState } from 'react';
import { Drawer, List, Tabs, Tag, Button } from 'antd';
import orgCtrl from '@/ts/controller';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import ScrollList from '@/components/Common/ScrollList';
import React from 'react';
import { kernel, model, schema } from '@/ts/base';
import { showChatTime } from '@/utils/tools';
import { formatDate } from '@/utils';
import FullScreenModal from '@/components/Common/fullScreen';
import { Layout } from 'antd';
import { Resizable } from 'devextreme-react';

const OnlineInfo: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [key, setKey] = useState('1');
  const [loaded, setloaded] = useState(false);
  const [users, setUsers] = useState<model.OnlineInfo[]>([]);
  const [storages, setStorages] = useState<model.OnlineInfo[]>([]);
  useEffect(() => {
    kernel.onlines().then((value) => {
      setKey(key);
      setloaded(true);
      if (value?.users && Array.isArray(value.users)) {
        setUsers(
          value.users.sort(
            (a, b) => new Date(b.onlineTime).getTime() - new Date(a.onlineTime).getTime(),
          ),
        );
      }
      if (value?.storages && Array.isArray(value.storages)) {
        setStorages(
          value.storages.sort(
            (a, b) => new Date(b.onlineTime).getTime() - new Date(a.onlineTime).getTime(),
          ),
        );
      }
    });
  }, []);

  const loadOnlineInfo = (onlines: model.OnlineInfo[]) => {
    const idOnlines = new Map<string, model.OnlineInfo[]>();
    const [search, setSearch] = useState('');
    onlines.forEach((i) =>
      idOnlines.set(i.userId, [...(idOnlines.get(i.userId) ?? []), i]),
    );
    if (search && search.length > 0) {
      for (var item of idOnlines) {
        if (item[1].every((i) => !i.remoteAddr.includes(search))) {
          var entity = orgCtrl.user.findMetadata<schema.XTarget>(item[0]);
          if (
            !(entity && (entity.name.includes(search) || entity.code.includes(search)))
          ) {
            idOnlines.delete(item[0]);
          }
        }
      }
    }
    return (
      <ScrollList
        height="calc(100vh - 160px)"
        data={Array.from(idOnlines.keys())}
        loaded={loaded}
        searchValue={search}
        setSearchValue={(v) => setSearch(v)}
        renderItem={(userId: string) => (
          <UserOnlineItem
            key={userId}
            userId={userId}
            data={idOnlines.get(userId) || []}
          />
        )}
      />
    );
  };

  const loadErrorLogs = () => {
    const idLogs = new Map<string, model.RequestRecord[]>();
    const [search, setSearch] = useState('');
    kernel.requestLogs
      .filter((i) => {
        if (
          search != '' &&
          !i.res.msg.includes(search) &&
          !i.req.action.includes(search)
        ) {
          var entity = orgCtrl.user.findMetadata<schema.XTarget>(i.req.belongId);
          return entity && (entity.name.includes(search) || entity.code.includes(search));
        }
        return true;
      })
      .forEach((i) => {
        idLogs.set(i.req.belongId, [...(idLogs.get(i.req.belongId) ?? []), i]);
      });
    return (
      <ScrollList
        height="calc(100vh - 160px)"
        data={Array.from(idLogs.keys())}
        loaded={loaded}
        searchValue={search}
        setSearchValue={(v) => setSearch(v)}
        renderItem={(belongId: string) => (
          <ErrorLogItem belongId={belongId} data={idLogs.get(belongId) || []} />
        )}
      />
    );
  };

  return (
    <Drawer
      open
      width={650}
      height={'100vh'}
      closable={false}
      placement="right"
      onClose={() => onClose()}>
      <Tabs
        key={key}
        centered
        items={[
          {
            key: 'online_user',
            label: `在线用户(${users.length})`,
            children: loadOnlineInfo(users),
          },
          {
            key: 'online_data',
            label: `在线数据核(${storages.length})`,
            children: loadOnlineInfo(storages),
          },
          {
            key: 'error_logs',
            label: `错误日志(${kernel.requestLogs.length})`,
            children: loadErrorLogs(),
          },
        ]}
      />
    </Drawer>
  );
};

const ErrorLogItem: React.FC<{ belongId: string; data: model.RequestRecord[] }> = ({
  belongId,
  data,
}) => {
  const [target, setTarget] = useState<schema.XEntity>();
  const [showDetail, setShowDetail] = useState(false);
  const [showParamsDetail, setShowParamsDetail] = useState<model.RequestRecord | null>(
    null,
  );
  const [mainWidth, setMainWidth] = React.useState<number>(600);
  useEffect(() => {
    orgCtrl.user.findEntityAsync(belongId).then((item) => {
      if (item) {
        setTarget(item);
      }
    });
  }, []);
  const getListItemStyle = (item: model.RequestRecord) => {
    const baseStyle = { padding: 2, marginBottom: 8, cursor: 'pointer' };
    if (
      JSON.stringify(showParamsDetail?.req.params) === JSON.stringify(item?.req.params) &&
      showParamsDetail?.date === item?.date
    ) {
      return { ...baseStyle, backgroundColor: '#f2f3ff' };
    }
    return baseStyle;
  };
  const renderItem = (item: model.RequestRecord) => {
    return (
      <div style={getListItemStyle(item)} onClick={() => setShowParamsDetail(item)}>
        <div>
          方法:{item.req.module}/{item.req.action}
        </div>
        <div>
          错误:<span style={{ color: 'red', paddingLeft: 6 }}>{item.res.msg}</span>
        </div>
        <div>时间:{formatDate(item.date)}</div>
      </div>
    );
  };
  const loadDetail = () => {
    const [search, setSearch] = useState('');
    if (showDetail) {
      return (
        <>
          <FullScreenModal
            title={'错误日志'}
            hideMaxed
            width={'65vw'}
            bodyHeight={'70vh'}
            open={showDetail}
            onCancel={() => setShowDetail(false)}>
            <Layout>
              <Layout.Content>
                <div style={{ marginLeft: '14px' }}>错误列表</div>
                <ScrollList
                  height="calc(70vh - 100px)"
                  data={data.filter(
                    (i) =>
                      i.res.msg.includes(search) ||
                      i.req.action.includes(search) ||
                      JSON.stringify(i.req.params).includes(search),
                  )}
                  loaded={true}
                  searchValue={search}
                  setSearchValue={(v) => setSearch(v)}
                  renderItem={(item: model.RequestRecord) => renderItem(item)}
                />
              </Layout.Content>
              <Resizable
                handles={'right'}
                width={mainWidth}
                maxWidth={800}
                minWidth={600}
                height="calc(70vh - 40px)"
                onResize={(e) => setMainWidth(e.width)}>
                <div>错误详情</div>
                <Layout.Sider width={'100%'} style={{ height: '100%' }}>
                  <pre style={{ background: '#d8d8d8', height: '100%' }}>
                    <code>{JSON.stringify(showParamsDetail?.req, null, ' ')}</code>
                  </pre>
                </Layout.Sider>
              </Resizable>
            </Layout>
          </FullScreenModal>
        </>
      );
    }
    return <></>;
  };
  return (
    <List.Item style={{ cursor: 'pointer', padding: 6 }}>
      <List.Item.Meta
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 10 }}>{target?.name || belongId}</span>
            <Tag color="red" title="查看详情" onClick={() => setShowDetail(true)}>
              {data.length}
            </Tag>
            <Button type="link" size="small" onClick={() => setShowDetail(true)}>
              查看
            </Button>
          </div>
        }
        avatar={<>{target && <EntityIcon entity={target} size={42} />}</>}
        description={
          <div style={{ padding: 2 }}>
            <div>
              方法:{data[0].req.module}/{data[0].req.action}
            </div>
            <div>时间:{formatDate(data[0].date)}</div>
            <div>
              错误:<span style={{ color: 'red', paddingLeft: 6 }}>{data[0].res.msg}</span>
            </div>
          </div>
        }
      />
      {loadDetail()}
    </List.Item>
  );
};

const UserOnlineItem: React.FC<{ userId: string; data: model.OnlineInfo[] }> = ({
  userId,
  data,
}) => {
  const [target, setTarget] = useState<schema.XEntity>();
  useEffect(() => {
    if (userId != '0') {
      orgCtrl.user.findEntityAsync(userId).then((item) => {
        if (item) {
          setTarget(item);
        }
      });
    }
  }, [userId]);
  return (
    <List.Item style={{ cursor: 'pointer', padding: 6 }}>
      <List.Item.Meta
        title={
          <div style={{ display: 'flex' }}>
            <span style={{ marginRight: 10 }}>{target?.name || userId}</span>
            <Tag color="green">
              {data.reduce((sum, item) => {
                return sum + parseInt(`${item.requestCount}`);
              }, 0)}
            </Tag>
          </div>
        }
        avatar={<>{target && <EntityIcon entity={target} size={42} />}</>}
        description={
          <List
            itemLayout="horizontal"
            dataSource={data.sort(
              (a, b) =>
                new Date(b.onlineTime).getTime() - new Date(a.onlineTime).getTime(),
            )}
            renderItem={(item) => <OnlineItem data={item} />}
          />
        }
      />
    </List.Item>
  );
};

const OnlineItem: React.FC<{ data: model.OnlineInfo }> = ({ data }) => {
  data.remoteAddr = data.remoteAddr === '[' ? '127.0.0.1' : data.remoteAddr;
  return (
    <div style={{ display: 'flex', gap: 10, padding: 2 }}>
      <span style={{ width: 150 }}>地址:{data.remoteAddr}</span>
      <span style={{ width: 150 }}>
        时间:{showChatTime(data.userId === '0' ? data.onlineTime : data.authTime)}
      </span>
      <span style={{ width: 65 }}>
        连接:<span style={{ color: 'red', paddingLeft: 6 }}>{data.connectionNum}</span>
      </span>
      <span style={{ width: 80 }}>
        <Tag color="green">{data.requestCount}</Tag>
      </span>
    </div>
  );
};

export default OnlineInfo;
