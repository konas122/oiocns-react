import Node from './Node';
import Concurrent from './ConcurrentNode';
import Condition from './ConditionNode';
import DeptWay from './DeptWayNode';
import { WorkNodeDisplayModel } from '@/utils/work';
import { AddNodeType } from '@/utils/work';
import React from 'react';
import { ITarget } from '@/ts/core';
import EndNode from './EndNode';

export interface NodeProps {
  onInsertNode: Function;
  onDelNode: Function;
  onSelected: Function;
  config: any;
  level: any;
  isEdit: boolean;
  target?: ITarget;
}

//解码渲染的时候插入dom到同级
export const decodeAppendDom = (
  node: WorkNodeDisplayModel,
  props: NodeProps,
  isGroupWork: boolean,
) => {
  switch (node.type) {
    case AddNodeType.CONDITION:
      return <Condition {...props} isGroupWork={isGroupWork} />;
    case AddNodeType.CONCURRENTS:
      return <Concurrent {...props} isGroupWork={isGroupWork} />;
    case AddNodeType.ORGANIZATIONA:
      return <DeptWay {...props} isGroupWork={isGroupWork} />;
    case AddNodeType.END:
      return <EndNode {...props} isGroupWork={isGroupWork} />;
    default:
      return <Node {...props} isGroupWork={isGroupWork} />;
  }
};
