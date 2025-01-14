import { nextTick } from '@/ts/base/common/timer';
import { buildTree, getAllNodes } from '@/ts/base/common/tree';
import { ReportTaskTreeNodeView } from '@/ts/base/model';
import { IReportDistribution } from '@/ts/core/work/assign/distribution/report';
import {
  ReceptionStatus,
  getEmptySummary,
  getStatus,
  statusMap,
} from '@/ts/core/work/assign/reception/status';
import { Button, Modal, Progress, message } from 'antd';
import _ from 'lodash';
import React, { useState } from 'react';

interface Props {
  distribution: IReportDistribution;
  treeNode: ReportTaskTreeNodeView;
  visible: boolean;
  onClose: () => void;
}

function deepSummary(tree: ReportTaskTreeNodeView[]) {
  for (const node of tree) {
    node.summary = getEmptySummary();
    node.summary.total = 1;
    node.summary[node.taskStatus!] = 1;
    if (!node.isLeaf) {
      deepSummary(node.children);

      node.summary.total += _.sumBy(node.children, (n) => n.summary!.total);
      for (const status of Object.keys(statusMap) as ReceptionStatus[]) {
        node.summary[status] += _.sumBy(node.children, (n) => n.summary![status]);
      }
    }
  }
}

export function RefreshStatusModal(props: Props) {
  const [progress, setProgress] = useState(0);
  const [isStart, setIsStart] = useState(false);

  async function startSync() {
    try {
      let allNodes: ReportTaskTreeNodeView[] = [];
      const t = await props.distribution.holder.loadTree();
      if (t) {
        [allNodes] = await t.loadDistributionTree(props.treeNode, props.distribution);
      }
      const nodes = getAllNodes(allNodes);
      const total = nodes.length;
      let current = 0;

      const chunks = _.chunk(nodes, 1000);
      for (const chunk of chunks) {
        const receptionMap = await props.distribution.findReportReceptions(
          chunk.map((node) => node.id),
        );
        await nextTick();
        // 更新taskStatus
        for (const node of chunk) {
          delete node.reception;
          delete (node as any).children;
          if (receptionMap[node.id]) {
            node.taskStatus = getStatus(receptionMap[node.id]);
          }
        }
        current += chunk.length;
        setProgress(parseFloat(((current / total) * 75).toFixed(2)));
      }

      //更新summary
      const tree = buildTree(nodes);
      deepSummary(tree);
      await nextTick();

      // 保存节点
      const nodes2 = getAllNodes(tree);
      current = 0;

      const chunks2 = _.chunk(nodes2, 1000);
      for (const chunk of chunks2) {
        const newNodes = chunk.map((node) => {
          const newNode = _.cloneDeep(_.omit(node, ['children']));
          return newNode;
        });

        await props.distribution.holder.tree!.nodeColl.replaceMany(newNodes);

        current += chunk.length;
        setProgress(parseFloat(((current / total) * 25 + 75).toFixed(2)));
      }

      message.success('更新完成');
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <Modal
      open={props.visible}
      title="更新状态"
      width={640}
      onOk={props.onClose}
      onCancel={props.onClose}>
      <div className="flex flex-col" style={{ height: '40vh' }}>
        <div style={{ padding: '8px', marginBottom: '8px' }}>
          将新的上报状态和汇总数量更新到当前空间
        </div>
        {isStart ? (
          <div className="flex flex-col flex-auto justify-center items-center">
            <Progress percent={progress} style={{ width: '75%' }} />
          </div>
        ) : (
          <Button
            type="primary"
            onClick={() => {
              setIsStart(true);
              startSync();
            }}>
            开始更新
          </Button>
        )}
      </div>
    </Modal>
  );
}
