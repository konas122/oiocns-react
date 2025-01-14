import { ReportContentForm } from '@/executor/operate/entityForm/taskContent/ReportContentForm';
import { XDistribution } from '@/ts/base/schema';
import {
  DistributionContent,
  ReportTaskTreeNodeView,
  TaskContentType,
} from '@/ts/base/model';
import { IDistributionTask } from '@/ts/core/thing/standard/distributiontask';
import { Modal, message } from 'antd';
import _ from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { ReportTree } from '@/ts/core/thing/standard/reporttree/ReportTree';
import { ReportDistribution } from '@/ts/core/work/assign/distribution/report';
import { SessionContext } from '@/components/DataPreview/session/chat';

interface Props {
  task: IDistributionTask;
  onFinished?: (dist: XDistribution) => void;
  onCancel?: () => void;
}

export function CreateTaskModal(props: Props) {
  const [distribution, setDistribution] = useState<XDistribution>(null!);
  const [content, setContent] = useState<DistributionContent>(null!);
  const [loading, setLoading] = useState(false);
  const [hasStart, setHasStart] = useState(false);
  const [msg, setMsg] = useState('');
  const session = useContext(SessionContext);
  async function setDataAsync() {
    const dist: XDistribution = _.omit(_.cloneDeep(props.task.metadata), [
      'id',
      'typeName',
      'directoryId',
      'belongId',
      'createUser',
      'createTime',
      'updateUser',
      'updateTime',
    ]) as any;
    dist.typeName = '分发任务';
    dist.taskId = props.task.metadata.id;
    let resWork = await props.task.directory.target.resource.findEntityById(
      dist.content.workId!,
      '办事',
    );
    dist.content.workName = resWork?.name;
    let resReportTree = await props.task.directory.target.resource.findEntityById(
      dist.content.treeId!,
      '报表树',
    );
    dist.content.treeName = resReportTree?.name;
    setDistribution(dist);
    setContent(dist.content as DistributionContent);
  }

  useEffect(() => {
    setDataAsync();
  }, []);

  async function newDistribution() {
    distribution.period = content.period;
    delete content['period'];
    distribution.content = content;
    setHasStart(true);
    try {
      setLoading(true);
      setMsg('正在创建任务分发');
      const d = await props.task.create(distribution);
      if (d) {
        if (distribution.content.type == TaskContentType.Report) {
          setMsg('正在创建任务树形');

          const [metadata] = await props.task.directory.resource.reportTreeColl.loadSpace(
            {
              options: {
                match: {
                  id: d.content.treeId,
                },
              },
            },
          );
          if (!metadata) {
            setMsg('找不到报表树形');
            return;
          }

          const tree = new ReportTree(metadata, props.task.directory);
          const newTree = await tree.createTaskTree(d);
          if (!newTree) {
            setMsg('创建任务树形失败');
            return;
          }

          d.content.treeId = newTree.id;
          await props.task.directory.resource.distributionColl.replace(d);
          message.success('创建任务树形成功');

          setMsg('正在自动分发任务');
          let reportDistribution = new ReportDistribution(props.task, d);
          await reportDistribution.holder.loadTree();
          if (!reportDistribution.holder.tree) {
            setMsg('加载树形失败');
            return;
          }
          let processedCount = 0;
          while (true) {
            const nodes = (await reportDistribution.holder.tree.nodeColl.loadSpace({
              options: {
                match: {
                  treeId: reportDistribution.treeId,
                },
                sort: {
                  code: 1,
                },
              },
              skip: processedCount,
              take: 500,
            })) as ReportTaskTreeNodeView[];
            await reportDistribution.autoDistribution(session, nodes);
            if (nodes.length === 0) {
              break;
            }
            processedCount += nodes.length;
          }
          setMsg('自动分发任务完成');
          message.success('自动分发任务完成');
        }
        props.onFinished?.(d);
        return;
      }
      setMsg('创建失败');
    } catch (error) {
      if (error instanceof Error) {
        setMsg(error.message);
        message.error('创建失败');
      }
    } finally {
      setLoading(false);
    }
  }
  return (
    <Modal
      open
      title="分发任务"
      onCancel={props.onCancel}
      onOk={newDistribution}
      confirmLoading={loading}>
      <div>
        {hasStart ? (
          <div style={{ padding: '16px' }}>
            <div style={{ textAlign: 'center' }}>{msg}</div>
          </div>
        ) : content ? (
          <ReportContentForm
            task={props.task}
            distribute
            value={content}
            onChange={(v) => setContent(v as DistributionContent)}
            directory={props.task.directory}
          />
        ) : (
          <></>
        )}
      </div>
    </Modal>
  );
}
