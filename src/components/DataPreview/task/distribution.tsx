import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { ReportTaskTreeNodeView } from '@/ts/base/model';
import {
  ReportTaskTreeSummary,
  getEmptySummary,
} from '@/ts/core/work/assign/reception/status';
import { IReportDistribution } from '@/ts/core/work/assign/distribution/report';
import { IReception } from '@/ts/core/work/assign/reception';
import { ReportReception } from '@/ts/core/work/assign/reception/report';
import { Button, Empty, Spin, Tag } from 'antd';
import React, { ReactNode, useMemo, useState } from 'react';
import { useEffectOnce } from 'react-use';
import { ReceptionView } from './ReceptionView';
import { ReportTaskTree } from './ReportTaskTree';
import cls from './index.module.less';
import { delay } from '@/ts/base/common/timer';
import { NodeType } from '@/ts/base/enum';
import { FetchDataModal } from './FetchDataModal';
import { FillDataModal } from './FillDataModal';
import { RefreshStatusModal } from './RefreshStatusModal';
import { ReceptionDataView } from './ReceptionDataView';

export interface IProps {
  distribution: IReportDistribution;
}

const DistributionPreview: React.FC<IProps> = (props) => {
  const [currentReception, setCurrentReception] = useState<IReception | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tree, setTree] = useState<ReportTaskTreeNodeView[]>([]);
  const [treeSummary, setTreeSummary] = useState<ReportTaskTreeSummary>(
    getEmptySummary(),
  );
  const [treeNode, setTreeNode] = useState<ReportTaskTreeNodeView | null>(null);
  const [fetchVisible, setFetchVisible] = useState(false);
  const [refreshVisible, setRefreshVisible] = useState(false);
  const [fillVisible, setFillVisible] = useState(false);

  const showTree = useMemo(() => {
    if (tree.length == 0) {
      return false;
    }
    if (tree.length == 1 && tree[0].nodeType == NodeType.Summary) {
      return true;
    }
    return tree[0].children.length > 0;
  }, [tree]);

  const isSameBelong = useMemo(() => {
    const task = props.distribution.task;
    return task.belongId == task.directory.target.space.id;
  }, [props.distribution]);

  async function loadData() {
    let tree: ReportTaskTreeNodeView[] = [];
    let summary: ReportTaskTreeSummary = getEmptySummary();
    const space = props.distribution.target.space;
    const roots = await props.distribution.findReportRootNode(space.id);
    if (roots.length == 0) {
      setLoaded(true);
      return;
    }
    const t = await props.distribution.holder.loadTree();
    if (t) {
      [tree, summary] = await t.loadDistributionTree(roots[0], props.distribution);
    }
    setTree(tree);
    setTreeSummary(summary);
    setLoaded(true);
    if (tree.length > 0) {
      await handleNodeSelect(tree[0]);
    }
  }

  async function loadChildrenData(parentNodeId: string) {
    let tree: ReportTaskTreeNodeView[] = [];
    const t = await props.distribution.holder.loadTree();
    if (t) {
      tree = await t.loadDistributionChildren(parentNodeId, props.distribution);
    }
    return tree;
  }
  async function handleNodeSelect(node: ReportTaskTreeNodeView) {
    setTreeNode(node);
    setCurrentReception(null);
    // 等待异步渲染完成
    await delay(10);

    if (node.reception) {
      setCurrentReception(
        new ReportReception(
          node.reception,
          props.distribution.target,
          props.distribution.holder,
        ),
      );
    } else if (node.taskStatus) {
      const receptionMap = await props.distribution.findReportReceptions([node.id]);
      if (receptionMap[node.id]) {
        setCurrentReception(
          new ReportReception(
            receptionMap[node.id]!,
            props.distribution.target,
            props.distribution.holder,
          ),
        );
      } else {
        setCurrentReception(null);
        console.warn(`状态异常：节点 ${node.name} 有状态但无任务接收`);
      }
    } else {
      setCurrentReception(null);
    }
  }

  useEffectOnce(() => {
    loadData();
  });

  function renderButtons() {
    const buttons: ReactNode[] = [];
    if (currentReception && isSameBelong) {
      if (treeNode?.nodeType == NodeType.Summary) {
        buttons.push(
          <Button
            type="primary"
            onClick={() => {
              setFetchVisible(true);
            }}>
            更新下级数据
          </Button>,
        );
        buttons.push(
          <Button
            type="primary"
            onClick={() => {
              setFillVisible(true);
            }}>
            批量数据补全
          </Button>,
        );
      }
    }
    return buttons;
  }

  if (!loaded) {
    return <Spin>正在加载数据中</Spin>;
  }

  if (!props.distribution.holder.tree) {
    return <Empty>查找报表树失败</Empty>;
  }

  if (tree.length == 0) {
    return <Empty>找不到符合要求的节点，是否有权限？</Empty>;
  }

  const tags: ReactNode[] = [];
  if (treeNode) {
    tags.push(
      <>
        <Tag color="processing">{treeNode.name}</Tag>
        <Tag color="green">{treeNode.nodeTypeName}</Tag>
        {currentReception?.metadata.isAutoFill && <Tag color="green">自动补全</Tag>}
        {renderButtons()}
      </>,
    );
  }

  return (
    <div className={cls['task']}>
      <div className={cls['content']}>
        {showTree ? (
          <ReportTaskTree
            width={480}
            tree={tree}
            currentNode={treeNode}
            onNodeSelect={handleNodeSelect}
            summary={treeSummary}
            onSyncStatus={() => setRefreshVisible(true)}
          />
        ) : (
          <></>
        )}
        <div className={cls['work-wrap']}>
          {currentReception ? (
            currentReception.metadata.instanceId ? (
              <ReceptionView reception={currentReception}>{tags}</ReceptionView>
            ) : currentReception.metadata.isAutoFill ? (
              <ReceptionDataView reception={currentReception}>{tags}</ReceptionDataView>
            ) : (
              <Empty>
                <div style={{ marginBottom: '8px' }}>
                  当前任务正在等待
                  <EntityIcon
                    entityId={currentReception.metadata.receiveUserId}
                    showName
                  />
                  办理
                </div>
                <div className="flex justify-center" style={{ gap: '8px' }}>
                  {renderButtons()}
                </div>
              </Empty>
            )
          ) : (
            <Empty>当前任务尚未被接收</Empty>
          )}
        </div>
      </div>
      {fetchVisible && (
        <FetchDataModal
          distribution={props.distribution}
          treeNode={treeNode!}
          visible={fetchVisible}
          onClose={() => setFetchVisible(false)}
        />
      )}
      {fillVisible && (
        <FillDataModal
          distribution={props.distribution}
          treeNode={treeNode!}
          visible={fillVisible}
          onClose={() => setFillVisible(false)}
        />
      )}
      {refreshVisible && (
        <RefreshStatusModal
          distribution={props.distribution}
          treeNode={treeNode!}
          visible={refreshVisible}
          onClose={() => {
            setRefreshVisible(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default DistributionPreview;
