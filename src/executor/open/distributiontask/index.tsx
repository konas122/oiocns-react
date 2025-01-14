import CardOrTable from '@/components/CardOrTableComp';
import EntityInfo from '@/components/Common/EntityInfo';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import FullScreenModal from '@/components/Common/fullScreen';
import PageCard from '@/components/PageCard';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import useObjectUpdate from '@/hooks/useObjectUpdate';
import { command, model, schema } from '@/ts/base';
import { TaskContentType } from '@/ts/base/model';
import { IDistributionTask } from '@/ts/core/thing/standard/distributiontask';
import { ReportDistribution } from '@/ts/core/work/assign/distribution/report';
import { $confirm } from '@/utils/react/antd';
import { ProColumns } from '@ant-design/pro-table';
import { Button, Descriptions, Spin, Typography, message } from 'antd';
import React, { useState } from 'react';
import cls from './index.module.less';
import saveAs from 'file-saver';
import { IReportTaskTree } from '@/ts/core/work/assign/taskTree/ReportTaskTree';
import ReportTreeModal from '@/executor/design/reportTreeModal';

type IProps = {
  current: IDistributionTask;
  finished: () => void;
};

/*
  弹出框表格查询
*/
const DistributionTaskModal: React.FC<IProps> = ({ current, finished }) => {
  const [tkey, tforceUpdate] = useObjectUpdate(current);
  const [loaded] = useAsyncLoad(async () => {
    await current.loadDistributions();
    tforceUpdate();
  });

  const [loading, setLoading] = useState(false);

  const [taskTree, setTaskTree] = useState<IReportTaskTree | null>(null);
  const [taskTreeVisible, setTaskTreeVisible] = useState(false);

  function viewReception(item: schema.XDistribution) {
    switch (item.content.type) {
      case TaskContentType.Report:
      case TaskContentType.Closing: {
        const dist = new ReportDistribution(current, item);
        command.emitter('executor', 'open', dist, 'preview');
        break;
      }
    }
  }

  /** 报表树节点信息列 */
  const TaskColumn = (): ProColumns<schema.XDistribution>[] => {
    const contentCols: ProColumns<schema.XDistribution>[] = [];
    const content = current.metadata.content;
    if (content.type == TaskContentType.Report) {
      contentCols.push(
        {
          title: '开始时间',
          dataIndex: 'content.startDate',
          key: 'startDate',
          valueType: 'dateTime',
          width: 150,
          render: (_: any, record: schema.XDistribution) => {
            return record.content.startDate;
          },
        },
        {
          title: '结束时间',
          dataIndex: 'content.endDate',
          key: 'endDate',
          valueType: 'dateTime',
          width: 150,
          render: (_: any, record: schema.XDistribution) => {
            return record.content.endDate;
          },
        },
      );
    }

    return [
      {
        title: '序号',
        valueType: 'index',
        width: 50,
      },
      // {
      //   title: '编号',
      //   dataIndex: 'code',
      //   key: 'code',
      //   width: 100,
      // },
      // {
      //   title: '名称',
      //   dataIndex: 'name',
      //   key: 'name',
      //   width: 150,
      // },
      {
        title: '数据时期',
        dataIndex: 'period',
        key: 'period',
        width: 100,
        render: (_: any, record: schema.XDistribution) => {
          return (
            <Button
              type="link"
              style={{ fontWeight: 'bold' }}
              onClick={() => viewReception(record)}>
              {record.period}
            </Button>
          );
        },
      },
      ...contentCols,
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 150,
        className: 'no-wrap',
      },
      {
        title: '创建人',
        dataIndex: 'createUser',
        editable: false,
        key: 'createUser',
        width: 150,
        render: (_: any, record: schema.XDistribution) => {
          return <EntityIcon entityId={record.createUser} showName />;
        },
      },
      {
        title: '创建时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 200,
        editable: false,
      },
    ];
  };

  const renderBtns = () => {
    return <></>;
  };

  // 操作内容渲染函数
  const renderOperate = (item: schema.XDistribution) => {
    const operates: any[] = [
      {
        key: `viewReception`,
        label: `查看任务接收`,
        onClick: () => viewReception(item),
      },
      {
        key: `viewMonthClosing`,
        label: `查看月结情况`,
        onClick: () => {
          const content: model.TaskContent = {
            ...item.content,
            type: TaskContentType.Closing,
          };
          viewReception({ ...item, content });
        },
      },
      ...(item.content.type == TaskContentType.Report
        ? [
            {
              key: `exportStatus`,
              label: `导出上报状态`,
              onClick: async () => {
                try {
                  setLoading(true);
                  const dist = new ReportDistribution(current, item);
                  const space = dist.target.space;
                  const file = await dist.exportReceptionStatus(space.id);
                  saveAs(file, file.name);
                } catch (error) {
                  message.error(error instanceof Error ? error.message : String(error));
                } finally {
                  setLoading(false);
                }
              },
            },
            {
              key: `editTaskTree`,
              label: `查看任务树形`,
              onClick: async () => {
                const dist = new ReportDistribution(current, item);
                const tree = await dist.holder.loadTree();
                if (!tree) {
                  message.warning('加载树形失败');
                  return;
                }

                setTaskTree(tree);
                setTaskTreeVisible(true);
              },
            },
          ]
        : []),
    ];

    if (current.directory.target.hasRelationAuth()) {
      operates.push({
        key: `删除分发`,
        label: <span style={{ color: 'red' }}>{`删除分发`}</span>,
        onClick: async () => {
          let count = 0;
          if (item.content.type == TaskContentType.Report) {
            const dist = new ReportDistribution(current, item);
            count = await dist.existsReceptionCount();
          }

          await $confirm({
            content: (
              <div>
                <span>确实要删除所选分发吗？</span>
                {count > 0 && (
                  <>
                    <br />
                    <span>
                      该分发存在 {count} 条已被用户发起或完结的任务，删除会导致任务将无法完成！
                    </span>
                  </>
                )}
              </div>
            ),
          });

          await current.hardDeleteDistribution(item);

          await current.loadDistributions();
          tforceUpdate();
        },
      });
    }
    return operates;
  };
  const TitleItems = [
    {
      tab: `${current.typeName}分发`,
      key: 'Items',
    },
  ];

  return (
    <FullScreenModal
      open
      centered
      fullScreen
      width={'80vw'}
      destroyOnClose
      title={current.typeName + '管理'}
      onCancel={() => finished()}
      footer={[]}>
      <div className={cls['main-wrapper']}>
        {loading && <Spin spinning={loading} className={cls['loading-spin']} />}
        <div className={cls['right-content']}>
          <EntityInfo
            entity={current as any}
            column={4}
            other={
              <>
                <Descriptions.Item label="任务周期">
                  <Typography.Paragraph>
                    {current.metadata.periodType}
                  </Typography.Paragraph>
                </Descriptions.Item>
                <Descriptions.Item label="任务类型">
                  <Typography.Paragraph>
                    {current.metadata.content.type}
                  </Typography.Paragraph>
                </Descriptions.Item>
                {current.metadata.content.type == TaskContentType.Report && (
                  <>
                    <Descriptions.Item label="办事">
                      <Typography.Paragraph>
                        <EntityIcon
                          entityId={current.metadata.content.workId}
                          typeName="办事"
                          showName
                        />
                      </Typography.Paragraph>
                    </Descriptions.Item>
                    <Descriptions.Item label="报表树">
                      <Typography.Paragraph>
                        <EntityIcon
                          entityId={current.metadata.content.treeId}
                          typeName="报表树"
                          showName
                        />
                      </Typography.Paragraph>
                    </Descriptions.Item>
                  </>
                )}
              </>
            }></EntityInfo>
          <PageCard
            className={cls[`card-wrap`]}
            style={{
              height: 'auto',
            }}
            bordered={false}
            tabList={TitleItems}
            onTabChange={(_: any) => {}}
            tabBarExtraContent={renderBtns()}>
            <Spin spinning={!loaded}>
              <CardOrTable<schema.XDistribution>
                key={tkey}
                rowKey={'id'}
                dataSource={current.distributions}
                operation={renderOperate}
                columns={TaskColumn()}
              />
            </Spin>
          </PageCard>

          {taskTreeVisible && (
            <ReportTreeModal
              current={taskTree!}
              readonly
              finished={() => setTaskTreeVisible(false)}
            />
          )}
        </div>
      </div>
    </FullScreenModal>
  );
};

export default DistributionTaskModal;
