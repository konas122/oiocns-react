import useAsyncLoad from '@/hooks/useAsyncLoad';
import { ReceptionContext } from '.';
import { Empty, Spin, Tag, message } from 'antd';
import React, { ReactNode } from 'react';
import cls from './index.module.less';
import './receptionview.less';
import { IReception } from '@/ts/core/work/assign/reception';
import orgCtrl from '@/ts/controller';
import { FieldModel, FormEditData, InstanceDataModel } from '@/ts/base/model';
import WorkForm from '@/executor/tools/workForm';
import { statusMap } from '@/ts/core/work/assign/reception/status';
import { formatDate } from '@/utils';

export interface IProps {
  reception: IReception;
  children?: ReactNode[];
}

/** 纯数据（不含流程实例查询） */
export function ReceptionDataView({ reception, children }: IProps) {
  const metadata = reception.metadata;
  const belongId = reception.metadata.content.treeNode.belongId;

  const [loaded, combine] = useAsyncLoad(async () => {
    const work = await reception.loadWork();
    if (!work) {
      return;
    }
    const node = await work.loadNode();
    if (!node) {
      return;
    }

    let data: Dictionary<FormEditData[]> = {};

    for (const [formId, thingId] of Object.entries(reception.metadata.thingId || {})) {
      data[formId] ||= [];

      const form = work.forms.find((f) => f.id == formId);
      if (!form) {
        console.warn(`报表 ${formId} 不存在`);
        continue;
      }

      const things = await form.thingColl.loadSpace({
        options: {
          match: {
            id: {
              _in_: thingId,
            },
          },
        },
      });
      if (things.length != thingId.length) {
        message.warning(`找不到报表 ${form.name} 的数据`);
      }

      for (const d of things) {
        for (const attr of form.attributes) {
          d[attr.id] = d[`T${attr.propId}`];
          delete d[`T${attr.propId}`];
        }
      }

      data[formId].push({
        before: [],
        after: things,
        rules: [],
        formName: form.name,
        creator: work.directory.userId,
        createTime: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss.S'),
        nodeId: node.id,
      });
    }

    let instance: InstanceDataModel = {
      data,
      fields: work.forms.reduce<Dictionary<FieldModel[]>>((a, f) => {
        a[f.id] = f.fields;
        return a;
      }, {}),
      primary: {},
      node,
      rules: [],
      reception: reception.metadata,
    };

    const belong = orgCtrl.user.companys.find((a) => a.id == belongId) || orgCtrl.user;
    return { data: instance, belong };
  });

  if (!loaded) {
    return <Spin>正在加载数据中</Spin>;
  }
  if (!combine) {
    return (
      <Empty>
        <div>加载办事信息失败</div>
        {children}
      </Empty>
    );
  }

  return (
    <ReceptionContext.Provider value={reception}>
      <div className="reception-view">
        <div className="reception-view--toolbar">
          <div className={cls['info']}>
            <div className={cls['title']}>{metadata.name}</div>
            <div>{metadata.period}</div>
            <Tag color="processing">{metadata.periodType}</Tag>
            <div>任务类型：</div>
            <Tag color="orange">{metadata.content.type}</Tag>
            {reception.status != 'empty' ? (
              <Tag color={statusMap[reception.status].color}>
                {statusMap[reception.status].label}
              </Tag>
            ) : (
              <></>
            )}
            {children}
          </div>
          <div style={{ flex: 'auto' }}></div>
        </div>
        <div className="workform-wrapper">
          {Object.keys(combine.data.data).length > 0 ? (
            <WorkForm
              allowEdit={false}
              belong={combine.belong}
              nodeId={combine.data.node.id}
              data={combine.data}
            />
          ) : (
            <Empty style={{ marginTop: '20%' }}>
              <div>无自动补全数据</div>
            </Empty>
          )}
        </div>
      </div>
    </ReceptionContext.Provider>
  );
}
