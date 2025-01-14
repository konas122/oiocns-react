import React, { useState } from 'react';
import cls from './index.module.less';
import { WorkNodeDisplayModel } from '@/utils/work';
import { IBelong, IWork } from '@/ts/core';
import CardOrTableComp from '@/components/CardOrTableComp';
import { schema } from '@/ts/base';
import { ProColumns } from '@ant-design/pro-components';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import message from '@/utils/message';
import useObjectUpdate from '@/hooks/useObjectUpdate';
import { Card, Divider } from 'antd';
import { SelectBox } from 'devextreme-react';

interface IProps {
  current: WorkNodeDisplayModel;
  define: IWork;
  belong: IBelong;
  refresh: () => void;
}

/**
 * @description: 成员节点配置信息
 * @return {*}
 */

const GatewayNode: React.FC<IProps> = (props) => {
  const [tkey, tforceUpdate] = useObjectUpdate(props.current);
  const [destId, setDestId] = useState<string>(props.current.destId);
  const [loaded, nodeInfo] = useAsyncLoad(async () => {
    await props.define.loadGatewayInfo();
    return props.define.gatewayInfo.filter((a) => a.nodeId == props.current.primaryId);
  });
  const [loadField, fields] = useAsyncLoad(async () => {
    const fields: { text: string; value: string }[] = [];
    for (const xform of props.define.primaryForms) {
      const xfields = await xform.loadFields();
      fields.push(
        ...xfields
          .filter(
            (a) =>
              a.valueType == '用户型' &&
              a.widget == '成员选择框' &&
              a.options?.teamId == props.define.directory.target.id,
          )
          .map((a) => {
            return {
              text: `[${xform.name}] ${a.name}`,
              value: a.id,
            };
          }),
      );
    }
    return fields;
  });
  /** 分流网关信息列 */
  const GatewayColumns: ProColumns<schema.XWorkGateway>[] = [
    { title: '序号', valueType: 'index', width: 50 },
    {
      title: '组织',
      dataIndex: 'target',
      render: (_: any, record: schema.XWorkGateway) => {
        return <EntityIcon entityId={record.targetId} showName />;
      },
    },
    {
      title: '办事名称',
      dataIndex: 'name',
      render: (_: any, record: schema.XWorkGateway) => {
        return record.define?.name;
      },
    },
    {
      title: '绑定时间',
      dataIndex: 'createTime',
    },
  ];
  // 操作内容渲染函数
  const renderOperate = (item: schema.XWorkGateway) => {
    return [
      {
        key: item.id,
        label: `解绑`,
        onClick: async () => {
          const success = await props.define.deleteGateway(item.id);
          if (success) {
            message.info('解绑成功!');
            tforceUpdate();
          }
        },
      },
    ];
  };
  return (
    <div className={cls[`app-roval-node`]}>
      <div className={cls[`roval-node`]}>
        {loadField && (
          <Card
            className={cls[`card-info`]}
            type="inner"
            style={{ border: 'none' }}
            headStyle={{
              backgroundColor: '#FCFCFC',
              padding: '0px 12px',
              borderBottom: 'none',
            }}
            title={
              <div>
                <Divider type="vertical" className={cls['divider']} />
                <span>网关设置</span>
              </div>
            }>
            <SelectBox
              label="默认值"
              labelMode="static"
              valueExpr={'value'}
              displayExpr={'text'}
              defaultValue={destId}
              onValueChanged={(e) => {
                props.current.destId = e.value;
                setDestId(e.value);
              }}
              dataSource={fields}
            />
          </Card>
        )}
        {loaded && (
          <Card
            className={cls[`card-info`]}
            type="inner"
            style={{ border: 'none' }}
            headStyle={{
              backgroundColor: '#FCFCFC',
              padding: '0px 12px',
              borderBottom: 'none',
            }}
            title={
              <div>
                <Divider type="vertical" className={cls['divider']} />
                <span>网关绑定详情</span>
              </div>
            }>
            <CardOrTableComp<schema.XWorkGateway>
              key={tkey}
              rowKey={'id'}
              dataSource={nodeInfo ?? []}
              scroll={{ y: 'calc(60vh - 150px)' }}
              operation={renderOperate}
              columns={GatewayColumns}
            />
          </Card>
        )}
      </div>
    </div>
  );
};
export default GatewayNode;
