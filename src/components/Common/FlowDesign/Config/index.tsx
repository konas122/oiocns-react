import React, { useEffect, useState } from 'react';
import ApprovalNode from './Nodes/ApprovalNode';
import CcNode from './Nodes/CcNode';
import RootNode from './Nodes/RootNode';
import ConcurrentNode from './Nodes/ConcurrentNode';
import ConditionNode from './Nodes/ConditionNode';
import GatewayNode from './Nodes/GatewayNode';
import { WorkNodeDisplayModel } from '@/utils/work';
import { IWork } from '@/ts/core';
import { model } from '@/ts/base';
import { Card } from 'antd';
import { SelectBox, TextBox } from 'devextreme-react';
import CustomNode from './Nodes/Custom';
import EndNode from './Nodes/EndNode';
import { AddNodeType } from '@/utils/work';
import ConfluenceNode from './Nodes/ConfluenceNode';
/**
 * @description: 流程设置抽屉
 * @return {*}
 */

interface IProps {
  define: IWork;
  node: WorkNodeDisplayModel;
  rootNode: WorkNodeDisplayModel;
  isGroupWork: boolean;
  refresh: () => void;
}

const Config: React.FC<IProps> = (props) => {
  const belong = props.define.directory.target.space;
  const [dataSource, setDataSource] = useState<{ value: string; label: string }[]>([]);
  const [conditions, setConditions] = useState<model.FieldModel[]>([]);
  useEffect(() => {
    if (props.define && props.node.type == AddNodeType.CONDITION) {
      const fields: model.FieldModel[] = [];
      props.define.primaryForms.forEach((f) => {
        fields.push(...f.fields);
      });
      setConditions(fields);
    }
  }, [props.define]);

  useEffect(() => {
    switch (props.node.type) {
      case AddNodeType.CC:
      case AddNodeType.APPROVAL:
        setDataSource([
          { value: '审批', label: '审核' },
          { value: '抄送', label: '抄送' },
        ]);
        break;
      default:
        setDataSource([{ value: props.node.type, label: props.node.type }]);
        break;
    }
  }, [props.node]);

  const loadContent = () => {
    switch (props.node.type) {
      case AddNodeType.ROOT:
        return (
          <RootNode
            work={props.define}
            current={props.node}
            belong={belong}
            refresh={props.refresh}
            type="design"
          />
        );
      case AddNodeType.APPROVAL:
        return (
          <ApprovalNode
            work={props.define}
            current={props.node}
            belong={belong}
            refresh={props.refresh}
            rootNode={props.rootNode}
            isGroupWork={props.isGroupWork}
          />
        );
      case AddNodeType.Confluence:
        return (
          <ConfluenceNode
            work={props.define}
            current={props.node}
            belong={belong}
            refresh={props.refresh}
          />
        );
      case AddNodeType.CC:
        return (
          <CcNode
            work={props.define}
            current={props.node}
            belong={belong}
            refresh={props.refresh}
            isGroupWork={props.isGroupWork}
          />
        );
      case AddNodeType.CUSTOM:
        return (
          <CustomNode
            work={props.define}
            current={props.node}
            belong={belong}
            rootNode={props.rootNode}
            refresh={props.refresh}
          />
        );
      case AddNodeType.GATEWAY:
        return (
          <GatewayNode
            current={props.node}
            belong={belong}
            refresh={props.refresh}
            define={props.define}
          />
        );
      case AddNodeType.CONDITION:
        return (
          <ConditionNode
            current={props.node}
            conditions={conditions}
            refresh={props.refresh}
          />
        );
      case AddNodeType.CONCURRENTS:
        return <ConcurrentNode current={props.node} />;
      case AddNodeType.END:
        return (
          <EndNode
            current={props.node}
            belong={belong}
            refresh={props.refresh}
            work={props.define}
          />
        );
      default:
        return <div>暂无需要处理的数据</div>;
    }
  };
  return (
    <Card
      style={{ border: 'none', backgroundColor: '#fff' }}
      headStyle={{ borderBottom: 'none' }}
      title={
        <>
          <SelectBox
            value={props.node.type}
            valueExpr={'value'}
            displayExpr={'label'}
            style={{ width: '30%', display: 'inline-block' }}
            onSelectionChanged={(e) => {
              if (props.node.type != e.selectedItem.value) {
                props.node.type = e.selectedItem.value;
                props.node.name = e.selectedItem.value;
                props.refresh();
              }
            }}
            dataSource={dataSource}
          />
          <TextBox
            style={{ paddingLeft: 10, width: '70%', display: 'inline-block' }}
            height={32}
            placeholder="节点名称*"
            value={props.node.name}
            label="流程名称"
            labelMode="floating"
            onValueChange={(e) => {
              props.node.name = e;
              props.refresh();
            }}
          />
        </>
      }>
      {loadContent()}
    </Card>
  );
};

export default Config;
