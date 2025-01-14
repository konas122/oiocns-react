import { getNodeByNodeId } from '@/utils/work';
import React, { useEffect, useRef, useState } from 'react';
import { model } from '../../../ts/base';
import DetailForms from './detail';
import PrimaryForms from './primary';
import { IBelong } from '@/ts/core';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import { Space } from 'antd';
import type { TabBarExtraContent } from 'rc-tabs/lib/interface';

interface IWorkFormProps {
  allowEdit: boolean;
  belong: IBelong;
  nodeId: string;
  data: model.InstanceDataModel;
  service?: WorkFormService;
  isCreate?: boolean;
  allowLabelPrint?: boolean;
  splitDetailFormId?: string;
  tabBarExtraContent?: TabBarExtraContent;
  instanceData?: model.InstanceDataModel;
}

/** 流程节点表单 */
const WorkForm: React.FC<IWorkFormProps> = (props) => {
  const [node, setNode] = useState<model.WorkNodeModel>();
  const service = useRef(props.service);
  useEffect(() => {
    const node = getNodeByNodeId(props.nodeId, props.data.node);
    if (!service.current) {
      service.current = new WorkFormService(props.belong, props.data, props.allowEdit);
      service.current.init();
      service.current.isCreate = props.isCreate ?? true;
    }
    setNode(node);
  }, [props.data]);
  if (!node || !service.current) return <></>;
  const tabBarExtraContent = !node.primaryForms
    ? {
        tabBarExtraContent: props.tabBarExtraContent,
      }
    : {};
  return (
    <div style={{ padding: 10 }}>
      <Space size={20} direction="vertical" style={{ width: '100%' }}>
        {node.primaryForms && node.primaryForms.length > 0 && (
          <PrimaryForms
            service={service.current}
            node={node}
            tabBarExtraContent={props.tabBarExtraContent}
            instanceData={props.instanceData}
          />
        )}
        {node.detailForms && node.detailForms.length > 0 && (
          <DetailForms
            {...tabBarExtraContent}
            service={service.current}
            node={node}
            allowLabelPrint={props.allowLabelPrint}
            splitDetailFormId={props.splitDetailFormId}
            instanceData={props.instanceData}
          />
        )}
      </Space>
    </div>
  );
};

export default WorkForm;
