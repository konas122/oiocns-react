import { kernel } from '@/ts/base';
import { nextTick } from '@/ts/base/common/timer';
import { getAllNodes } from '@/ts/base/common/tree';
import { NodeType } from '@/ts/base/enum';
import { InstanceDataModel, ReportStatus, ReportTaskTreeNodeView, TaskContentType } from '@/ts/base/model';
import { XReception, XReportTaskTreeNode, XThing } from '@/ts/base/schema';
import { IForm } from '@/ts/core';
import { IReportDistribution } from '@/ts/core/work/assign/distribution/report';
import { ReportReception } from '@/ts/core/work/assign/reception/report';
import { getStatus } from '@/ts/core/work/assign/reception/status';
import { formatDate } from '@/utils';
import { Button, Modal, Progress, Switch, Typography, message } from 'antd';
import _ from 'lodash';
import React, { useState } from 'react';

interface Props {
  distribution: IReportDistribution;
  treeNode: XReportTaskTreeNode;
  visible: boolean;
  onClose: () => void;
}

function isNeedFill(n: ReportTaskTreeNodeView) {
  if (!n.reception) {
    return true;
  }
  // 跳过已自动汇总的
  if (n.reception.isAutoFill && n.reception.thingId) {
    return false;
  }
  // 跳过数据已经归档的
  const status = getStatus(n.reception);
  if (status == 'finished' || status == 'changed') {
    return false;
  }
  return true;
}

export function FillDataModal(props: Props) {
  const [skipSubmitted, setSkipSubmitted] = useState(false);

  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isStart, setIsStart] = useState(false);

  async function startSync() {
    try {
      setMsg('加载完整树形及任务接收');
      const [tree] = await props.distribution.holder.tree!.loadFullDistributionTree(
        props.treeNode,
        props.distribution,
      );
      if (!tree.length) {
        setErrors(['加载树形失败']);
        return;
      }

      setMsg('查找办事信息');

      const treeNode = tree[0];
      const allNodes = getAllNodes(tree);
      const total = allNodes.length;
      let err: string[] = [];
      let current = 0;

      const report = new ReportReception(
        treeNode.reception!,
        props.distribution.target,
        props.distribution.holder,
      );

      const work = await report.loadWork(true);
      if (!work) {
        setErrors(['未找到办事']);
        return;
      }
      const application = work.application.metadata;

      let workNode = (await work.loadNode())!;
      if (!workNode) {
        setErrors(['未找到提交节点']);
        return;
      }

      const forms = [...work.primaryForms, ...work.detailForms];
      const formMap = forms.reduce<Dictionary<IForm>>((a, v) => {
        a[v.id] = v;
        return a;
      }, {});

      async function* recursiveSync(
        node: ReportTaskTreeNodeView,
      ): AsyncGenerator<[string, boolean]> {
        for (const child of node.children) {
          yield* recursiveSync(child);
        }

        if (!isNeedFill(node)) {
          yield [node.id, true];
          return;
        }

        if (node.nodeType == NodeType.Summary) {
          yield [node.id, true];
          return;
        }

        const nodeInfo = `${node.name} ${node.nodeTypeName}：`;

        const status = getStatus(node.reception);
        let reception = node.reception!;
        if (!reception) {
          reception = {
            taskId: props.distribution.metadata.taskId,
            period: props.distribution.metadata.period,
            sessionId: work!.metadata.shareId,
            belongId: props.distribution.task.spaceId,
            periodType: props.distribution.periodType,
            distId: props.distribution.id,
            typeName: '接收任务',
            name: props.distribution.metadata.name,
            receiveUserId: props.distribution.target.userId,
            remark: '数据自动填充',
            isAutoFill: true,
            content: {
              type: TaskContentType.Report,
              directoryId: application.directoryId,
              workId: work!.metadata.sourceId ?? work!.metadata.id,
              treeNode: _.cloneDeep(
                _.omit(node, ['reception', 'children', 'taskStatus']),
              ),
            },
          } as Partial<XReception> as any;

          // let res = reception;
          let res = await report.publicReceptionColl!.replace(reception);
          if (!res) {
            errors.push(nodeInfo + `创建任务接收失败`);
            yield [node.id, false];
            return;
          }
          reception = res;
          node.reception = res;
        }

        const r = new ReportReception(
          reception,
          props.distribution.target,
          props.distribution.holder
        );

        if (reception.instanceId && !skipSubmitted) {
          setMsg(`正在保存 ${node.name} ${node.nodeTypeName}`);

          const detail = await r.loadInstanceDetail(reception.instanceId);
          if (!detail) {
            err.push(nodeInfo + `加载流程实例失败`);
            yield [node.id, false];
            return;
          }

          const data: InstanceDataModel = JSON.parse(detail.data || '{}');
          const thingId: Dictionary<string[]> = {};
          for (const [formId, value] of Object.entries(data.data)) {
            const rows = value.at(-1)!.after;
            thingId[formId] = rows.map((d) => d.id);

            const form = formMap[formId];
            if (!form) {
              err.push(nodeInfo + `找不到 ${formId} 对应表单`);
              yield [node.id, false];
              continue;
            }

            rows.forEach(row => {
              for (const attr of form.attributes) {
                row[`T${attr.propId}`] = row[attr.id];
                delete row[attr.id];
              }
              row.remark = `自动保存`;
              row.archives ||= {};
              row.receptionId = reception.id;
            });
            const ret = await form.thingColl.replaceMany(rows);
            if (ret.length != rows.length) {
              err.push(nodeInfo + `保存表单 ${form.name} 数据失败`);
              continue;
            }
          }

          reception.thingId = thingId;
          reception.isAutoFill = true;
          let res = await r.publicReceptionColl!.replace(reception);
          if (!res) {
            err.push(nodeInfo + `更新任务接收状态失败`);
            yield [node.id, false];
            return;
          }
        } else {
          reception.thingId ||= {};

          setMsg(`正在通过上期数据补全 ${node.name} ${node.nodeTypeName}`);

          const lastPeriod = props.distribution.getHistoryPeriod(-1);

          const [lastReception] = await r.publicReceptionColl!.loadSpace({
            options: {
              match: {
                period: lastPeriod,
                taskId: props.distribution.metadata.taskId,
                'content.treeNode.targetId': reception.content.treeNode.targetId,
                'content.treeNode.nodeType': reception.content.treeNode.nodeType,
              }
            }
          });

          if (!lastReception) {
            err.push(nodeInfo + `上期任务未接收或是新增单位`);
            yield [node.id, false];
            return;
          }

          if (!lastReception.thingId) {
            err.push(nodeInfo + `上期报表未完结`);
            yield [node.id, false];
            return;
          }

          const thingId: Dictionary<string[]> = {};
          for (const form of work!.forms) {
            const ids = lastReception.thingId[form.id];
            const data = await form.thingColl.loadSpace({
              options: {
                match: {
                  id: {
                    _in_: ids
                  }
                }
              }
            });

            // 将新的任务接收的字段标记进去
            data.forEach(d => {
              d.id = 'snowId()';
              d.createUser = reception.receiveUserId;
              d.createTime = formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss.S');
              d.remark = '自动取上月数';
              d.receptionId = reception.id;

              d.periodType = reception.periodType;
              d.taskId = reception.taskId;
              d.distId = reception.distId;
              d.period = reception.period;

              d.nodeId = reception.content.treeNode.targetId;
              d.nodeType = reception.content.treeNode.nodeType;
              d.targetId = reception.content.treeNode.targetId;
            });
            const newData = await form.thingColl.replaceMany(data);

            thingId[form.id] = newData.map(d => d.id);
            if (newData.length != data.length) {
              err.push(nodeInfo + `保存 ${form.name} 表单数据失败`);
              continue;
            }
          }
          reception.thingId = thingId;
          reception.isAutoFill = true;
          let res = await r.publicReceptionColl!.replace(reception);
          if (!res) {
            err.push(nodeInfo + `更新任务接收状态失败`);
            yield [node.id, false];
            return;
          }
        }
        yield [node.id, true];
      }

      await nextTick();

      for await (const [nodeId, success] of recursiveSync(treeNode)) {
        console.error(success ? true : nodeId)
        current++;
        setProgress(parseFloat(((current / total) * 100).toFixed(2)));
        await nextTick();
      }
      if (err.length > 0) {
        setErrors(err);
      } else {
        setMsg('补全成功');
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : String(error)]);
    }
  }

  return (
    <Modal
      open={props.visible}
      title="批量数据补全"
      width={640}
      onOk={props.onClose}
      onCancel={props.onClose}>
      <div className="flex flex-col" style={{ height: '50vh', overflow: 'auto' }}>
        <div style={{ padding: '8px', marginBottom: '8px' }}>
          <div>将下级未填报的单位自动补全并保存，不进行汇总</div>
          <div>补全前请刷新页面确保数据最新，且不要进行树形筛选</div>
          <div>耗时极长，请在系统空闲时进行，一旦开始操作不可撤销！</div>
          <div>完成后根据错误提示检查未成功的节点，如遇网络问题可以重试</div>
          <div style={{ marginTop: '16px' }}>
            <Switch checked={skipSubmitted} onChange={setSkipSubmitted} />
            <span> 跳过审核中单位，直接取上期数</span>
          </div>
        </div>
        {isStart ? (
          <div className="flex flex-col flex-auto justify-center items-center">
            <div
              style={{
                whiteSpace: 'pre-wrap',
                marginBottom: '16px',
              }}>
              {errors.length > 0 ? (
                <Typography style={{ color: 'red' }}>
                  <div>遇到 {errors.length} 个错误</div>
                  <ul>
                    {errors.map((e, i) => (
                      <li key={i} style={{ listStyle: 'initial' }}>{e}</li>
                    ))}
                  </ul>
                </Typography>
              ) : (
                <div>{msg}</div>
              )}
            </div>
            <Progress percent={progress} style={{ width: '75%' }} />
          </div>
        ) : (
          <Button
            type="primary"
            onClick={() => {
              setIsStart(true);
              setErrors([]);
              setMsg('');
              if (!props.treeNode.taskStatus || props.treeNode.taskStatus == 'empty') {
                message.warning('当前节点未接收');
                return;
              }
              startSync();
            }}>
            开始补全
          </Button>
        )}
      </div>
    </Modal>
  );
}
