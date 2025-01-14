import { kernel } from '@/ts/base';
import { getAllNodes } from '@/ts/base/common/tree';
import { ReportTaskTreeNodeView } from '@/ts/base/model';
import { XThing } from '@/ts/base/schema';
import { IForm } from '@/ts/core';
import { IReportDistribution } from '@/ts/core/work/assign/distribution/report';
import { ReportReception } from '@/ts/core/work/assign/reception/report';
import { Button, Modal, Progress, message } from 'antd';
import React, { useState } from 'react';

interface Props {
  distribution: IReportDistribution;
  treeNode: ReportTaskTreeNodeView;
  visible: boolean;
  onClose: () => void;
}

export function FetchDataModal(props: Props) {
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isStart, setIsStart] = useState(false);

  async function startSync() {
    try {
      setMsg('查找办事信息');

      const total = getAllNodes([props.treeNode]).length;
      let current = 0;

      const report = new ReportReception(
        props.treeNode.reception!,
        props.distribution.target,
        props.distribution.holder,
      );

      const work = await report.loadWork();
      if (!work) {
        setMsg('未找到办事');
        setHasError(true);
        return;
      }

      let workNode = (await work.loadNode())!;
      if (!workNode) {
        setMsg('未找到提交节点');
        setHasError(true);
        return;
      }

      const forms = [...work.primaryForms, ...work.detailForms];
      const formMap = forms.reduce<Dictionary<IForm>>((a, v) => {
        a[v.id] = v;
        return a;
      }, {});

      const space = props.distribution.target;
      const groupId = props.treeNode.reception!.sessionId;

      async function* recursiveSync(
        node: ReportTaskTreeNodeView,
      ): AsyncGenerator<boolean> {
        for (const child of node.children) {
          yield* recursiveSync(child);
        }

        if (node.reception && node.reception.thingId) {
          setMsg('正在同步 ' + node.name);

          for (const [formId, thingIds] of Object.entries(node.reception.thingId)) {
            const form = formMap[formId];
            if (!form) {
              continue;
            }

            const res = await kernel.collectionLoad<XThing[]>(
              node.belongId,
              node.belongId,
              [props.treeNode.belongId, groupId, node.belongId],
              form.metadata.collName || '_system-things',
              {
                options: {
                  match: {
                    id: {
                      _in_: thingIds,
                    },
                  },
                },
              },
            );
            const data = res.data || [];

            if (data.length > 0) {
              const thingColl = form.metadata.collName
                ? space.resource.genColl(form.metadata.collName)
                : space.resource.thingColl;
              await thingColl.replaceMany(data, groupId);
            }
          }
        }
        yield true;
      }

      for await (const _ of recursiveSync(props.treeNode)) {
        current++;
        setProgress(parseFloat(((current / total) * 100).toFixed(2)));
      }
      setMsg('同步完成');
    } catch (error) {
      setHasError(true);
      setMsg(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <Modal
      open={props.visible}
      title="更新下级数据"
      width={640}
      onOk={props.onClose}
      onCancel={props.onClose}>
      <div className="flex flex-col" style={{ height: '40vh' }}>
        <div style={{ padding: '8px', marginBottom: '8px' }}>
          将下级填报的数据递归同步到各级汇总节点归属组织的空间中
        </div>
        {isStart ? (
          <div className="flex flex-col flex-auto justify-center items-center">
            <div
              style={{
                color: hasError ? 'red' : '',
                whiteSpace: 'pre-wrap',
                marginBottom: '16px',
              }}>
              {msg}
            </div>
            <Progress percent={progress} style={{ width: '75%' }} />
          </div>
        ) : (
          <Button
            type="primary"
            onClick={() => {
              setIsStart(true);
              setHasError(false);
              setMsg('');
              if (!props.treeNode.reception) {
                message.warning('当前节点未接收');
                return;
              }
              startSync();
            }}>
            开始同步
          </Button>
        )}
      </div>
    </Modal>
  );
}
