import { IReception } from '@/ts/core/work/assign/reception';
import { Button, Empty, Spin, Tag } from 'antd';
import React, { ReactNode, createContext, useMemo, useState } from 'react';
import cls from './index.module.less';
import { ReportTaskTreeNodeView } from '@/ts/base/model';
import { ReportTaskTree } from './ReportTaskTree';
import { ReceptionStart } from './ReceptionStart';
import { useEffectOnce } from 'react-use';
import { ReceptionView } from './ReceptionView';
import orgCtrl from '@/ts/controller';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import {
  IReportReception,
  ReportReception,
} from '@/ts/core/work/assign/reception/report';
import { $confirm } from '@/utils/react/antd';
import _ from 'lodash';
import { delay } from '@/ts/base/common/timer';
import { ReceptionDataView } from './ReceptionDataView';
import { getStatus } from '@/ts/core/work/assign/reception/status';

export interface IProps {
  reception: IReportReception;
}

export const ReceptionContext = createContext(null as IReception | null);

const ReceptionTask: React.FC<IProps> = (props) => {
  const metadata = props.reception.metadata;
  const [current, setCurrent] = useState<IReportReception | undefined>(props.reception);
  const [loaded, setLoaded] = useState(false);
  const [tree, setTree] = useState<ReportTaskTreeNodeView[]>([]);
  const [treeNode, setTreeNode] = useState<ReportTaskTreeNodeView | null>(null);
  const [expand, setExpand] = useState<boolean>(true);

  const showTree = useMemo(() => {
    if (tree.length == 0) {
      return false;
    }
    return tree[0].children.length > 0;
  }, [tree]);

  async function loadTree() {
    let tree: ReportTaskTreeNodeView[] = [];
    const t = await props.reception.holder.loadTree();
    if (t) {
      const hasChildren = await t.hasChildren(props.reception.metadata.content.treeNode);
      if (hasChildren) {
        [tree] = await t.loadDistributionTree(
          props.reception.metadata.content.treeNode,
          props.reception.getPublicProvider(),
          true, // 只查下面一级，减少查全树形接口量
        );
      } else {
        tree = [
          {
            ...props.reception.metadata.content.treeNode,
            reception: _.cloneDeep(props.reception.metadata),
            children: [],
          },
        ];
      }
    } else {
      console.warn('找不到当前任务接收的报表树，可能导致汇总异常！');
      tree = [
        {
          ...props.reception.metadata.content.treeNode,
          children: [],
        },
      ];
      tree[0].name += '（已删除）';
    }
    // 判断汇总节点下级节点状态
    setTreeNode(tree[0]);
    checkChildrenStatus(tree[0]);
    setTree(tree);
    setLoaded(true);
  }

  function checkChildrenStatus(node: ReportTaskTreeNodeView) {
    if (node.children && node.children.length > 0) {
      for (let i = 0; i < node.children.length; i++) {
        const status = getStatus(node.children[i].reception);
        if ('changed' !== status && 'finished' !== status) {
          node.directionChildrenComplete = false;
          setTreeNode(node);
          break;
        }
      }
    }
  }

  async function handleNodeSelect(node: ReportTaskTreeNodeView) {
    setTreeNode(node);
    checkChildrenStatus(node);
    setCurrent(undefined);
    await delay(10);

    if (node.id == props.reception.metadata.content.treeNode.id) {
      setCurrent(props.reception);
    } else if (node.reception) {
      setCurrent(
        new ReportReception(
          node.reception,
          props.reception.target,
          props.reception.holder,
        ),
      );
    } else if (node.taskStatus) {
      const receptionMap = await props.reception
        .getPublicProvider()
        .findReportReceptions([node.id]);
      if (receptionMap[node.id]) {
        setCurrent(
          new ReportReception(
            receptionMap[node.id]!,
            props.reception.target,
            props.reception.holder,
          ),
        );
      } else {
        setCurrent(undefined);
        console.warn(`状态异常：节点 ${node.name} 有状态但无任务接收`);
      }
    }
  }

  useEffectOnce(() => {
    loadTree();
  });

  if (!loaded) {
    return <Spin>正在加载数据中</Spin>;
  }

  const tags: ReactNode[] = [];
  if (treeNode?.nodeTypeName || metadata.content.treeNode.nodeTypeName) {
    tags.push(
      <Tag key="green" color="green">
        {treeNode?.nodeTypeName || metadata.content.treeNode.nodeTypeName}
      </Tag>,
    );
  }
  if (current && current.metadata.isAutoFill) {
    tags.push(<Tag color="green">自动补全</Tag>);
  }

  if (current && current.metadata.instanceId && current.metadata.thingId) {
    if (current.metadata.isReject) {
      tags.push(
        <b key="reject-info" style={{ color: 'red' }}>
          退回的任务请从草稿中重新发起
        </b>,
      );
    }
    tags.push(
      <Button
        key="change"
        type="primary"
        onClick={async () => {
          await $confirm({
            content: '发起变更后任务接收状态将会重置，确定要变更吗？',
          });
          await current.change();
          handleNodeSelect(treeNode!);
        }}>
        变更
      </Button>,
    );
  }

  return (
    <div className={cls['task']}>
      <div className={cls['content']}>
        {showTree ? (
          <div className={[cls['left-content'], !expand ? 'is-collapsed' : ''].join(' ')}>
            <Button
              type="primary"
              shape="round"
              className={cls['expand-btn']}
              onClick={() => {
                setExpand(!expand);
              }}>
              {expand ? '收起' : '展开'}
            </Button>
            <ReportTaskTree
              width={300}
              tree={tree as any}
              currentNode={treeNode}
              onNodeSelect={handleNodeSelect}
            />
          </div>
        ) : (
          <></>
        )}
        <div className={cls['work-wrap']}>
          {current ? (
            current.metadata.isReject ? (
              <ReceptionStart
                reception={current}
                curTreeNode={treeNode as ReportTaskTreeNodeView}
                finished={() => {
                  handleNodeSelect(treeNode!);
                }}>
                {tags}
              </ReceptionStart>
            ) : current.metadata.instanceId ? (
              <ReceptionView reception={current}>{tags}</ReceptionView>
            ) : current.metadata.isAutoFill ? (
              <ReceptionDataView reception={current}>{tags}</ReceptionDataView>
            ) : current.metadata.receiveUserId != orgCtrl.user.id ? (
              <Empty>
                当前任务正在等待
                <EntityIcon entityId={current.metadata.receiveUserId} showName />
                办理
              </Empty>
            ) : (
              <ReceptionStart
                reception={current}
                curTreeNode={treeNode as ReportTaskTreeNodeView}
                finished={() => {
                  handleNodeSelect(treeNode!);
                }}>
                {tags}
              </ReceptionStart>
            )
          ) : (
            <Empty></Empty>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceptionTask;
