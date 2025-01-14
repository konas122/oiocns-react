import FullScreenModal from '@/components/Common/fullScreen';
import OpenFileDialog from '@/components/OpenFileDialog';
import FormView from '@/executor/open/form';
import TaskStart from '@/executor/tools/task/start';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { model, schema } from '@/ts/base';
import { deepClone } from '@/ts/base/common';
import { PeriodType } from '@/ts/base/enum';
import { IFinancial, IPeriod, IWork, TargetType } from '@/ts/core';
import { Form, IForm } from '@/ts/core/thing/standard/form';
import { CloseOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Modal,
  Space,
  Spin,
  Tabs,
  Tag,
  message,
} from 'antd';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Closing } from './closing';
import { ClosingTemplate } from './closing/template';
import Depreciation from './depreciation';
import { DepreciationTemplate } from './depreciation/template';
import LedgerTable from './ledger/ledger';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import { PrimaryForm } from '@/executor/tools/workForm/primary';
import { TaskContentType } from '@/ts/base/model';

interface IProps {
  work: IWork;
  financial: IFinancial;
}

const Financial: React.FC<IProps> = ({ financial }) => {
  const [metadata, setMetadata] = useState(financial.metadata);
  const [center, setCenter] = useState(<></>);
  const month = useRef<string>();
  const add = async (month: string, offsetPeriod: number) => {
    const next = financial.getOffsetPeriod(month, offsetPeriod);
    await financial.createSnapshots(next);
    await financial.createPeriod(next);
  }
  useEffect(() => {
    const id = financial.subscribe(() => setMetadata({ ...financial.metadata }));
    return () => financial.unsubscribe(id);
  }, []);
  const Center = () => {
    const [loading, setLoading] = useState(false);
    if (metadata?.initialized) {
      return (
        <Space>
          <Card>{'初始结账日期：' + (metadata.initialized ?? '')}</Card>
          <Card>{'当前业务账期：' + (metadata?.current ?? '')}</Card>
          {metadata?.initialized && !financial.current && (
            <Button
              loading={loading}
              onClick={async () => {
                setLoading(true);
                await financial.createSnapshots(metadata.initialized!);
                const next = financial.getOffsetPeriod(metadata.initialized!, 1);
                await financial.createPeriod(next);
                setLoading(false);
              }}>
              生成期初账期
            </Button>
          )}
          <Button
            loading={loading}
            onClick={() =>
              setCenter(
                <DepreciationTemplate
                  financial={financial}
                  onFinished={() => setCenter(<></>)}
                  onCancel={() => setCenter(<></>)}
                />,
              )
            }>
            折旧模板配置
          </Button>
          <Button
            loading={loading}
            onClick={() =>
              setCenter(
                <ClosingTemplate
                  financial={financial}
                  onFinished={() => setCenter(<></>)}
                  onCancel={() => setCenter(<></>)}
                />,
              )
            }>
            月结模板配置
          </Button>
          <Button
            loading={loading}
            onClick={() =>
              financial.clear().catch((error) => {
                if (error instanceof Error) {
                  message.error(error.message);
                }
              })
            }>
            清空初始化
          </Button>
          <Button
            loading={loading}
            onClick={() => {
              if (financial.periods.length > 1) {
                message.error('操作失败，存在一个月及以上账期！');
                return;
              }
              Modal.confirm({
                title: '此操作将会清空资产数据！',
                async onOk() {
                  try {
                    await financial.space.activated?.dataManager.runCommand({
                      type: 'collection',
                      cmd: 'clear',
                      params: { collName: '_system-things' },
                    });
                    message.success('清空成功');
                  } catch (error) {
                    if (error instanceof Error) {
                      message.error(error.message);
                    }
                  }
                },
              });
            }}>
            清空资产数据
          </Button>
        </Space>
      );
    } else {
      return (
        <Space>
          <DatePicker
            style={{ width: '100%' }}
            picker="month"
            onChange={(_, data) => (month.current = data)}
          />
          <Button
            onClick={async () => {
              if (month.current) {
                financial.setInitialize(month.current);
              }
            }}>
            确认
          </Button>
        </Space>
      );
    }
  };
  return (
    <>
      <Card
        title={
          <Space>
            {'初始化账期'}
            {metadata?.initialized ? (
              <Tag color="green">已初始化</Tag>
            ) : (
              <Tag color="red">未初始化</Tag>
            )}
          </Space>
        }>
        {<Center />}
      </Card>
      {center}
    </>
  );
};

export interface FullProps {
  title: string;
  fullScreen?: boolean;
  onFinished?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  children: ReactNode;
}

export const FullScreen: React.FC<FullProps> = (props) => {
  return (
    <FullScreenModal
      open
      centered
      fullScreen={props.fullScreen ?? true}
      destroyOnClose
      width={'80vw'}
      bodyHeight={'80vh'}
      title={props.title}
      onOk={props.onFinished}
      onCancel={props.onCancel}
      onSave={props.onSave}>
      {props.children}
    </FullScreenModal>
  );
};

const Periods: React.FC<IProps> = ({ work, financial }) => {
  const [periods, setPeriods] = useState<IPeriod[]>([]);
  const [form, setForm] = useState(financial.form);
  const [balance, setBalance] = useState(financial.balance);
  const [balanceWork, setBalanceWork] = useState(financial.work);
  const [center, setCenter] = useState(<></>);
  useEffect(() => {
    const id = financial.subscribe(async () => {
      setPeriods([...(await financial.loadPeriods())]);
      setForm(await financial.loadForm());
      setBalance(await financial.loadBalance());
      setBalanceWork(await financial.loadWork());
    });
    return () => financial.unsubscribe(id);
  }, []);
  const binding = (type: string) => {
    let accepts = ['表单'];
    switch (type) {
      case 'balance':
        accepts.push('报表');
        break;
      case 'work':
        accepts = ['办事'];
        break;
    }
    setCenter(
      <OpenFileDialog
        accepts={accepts}
        rootKey={work.application.key}
        leftShow={false}
        rightShow={false}
        onOk={async (files) => {
          if (files.length > 0) {
            const metadata = files[0].metadata as any;
            switch (type) {
              case 'form':
                await financial.setForm(metadata);
                break;
              case 'balance':
                await financial.setBalance(metadata);
                break;
              case 'work':
                await financial.setWork(metadata.applicationId, metadata.id);
                break;
            }
          }
          setCenter(<></>);
        }}
        onCancel={() => setCenter(<></>)}
      />,
    );
  };
  return (
    <>
      <Card title={'结账记录'}>
        <Tabs
          items={[...new Set(periods.map((item) => item.annual))]
            .sort()
            .reverse()
            .map((annual) => {
              return {
                label: annual,
                key: annual,
                children: (
                  <ProTable<IPeriod>
                    search={false}
                    options={false}
                    pagination={false}
                    dataSource={periods.filter((item) => item.annual == annual)}
                    columns={[
                      {
                        title: '序号',
                        valueType: 'index',
                      },
                      {
                        title: '期间',
                        valueType: 'text',
                        dataIndex: 'period',
                      },
                      {
                        title: '是否已折旧',
                        valueType: 'text',
                        dataIndex: 'deprecated',
                        render(_, entity) {
                          if (entity.deprecated) {
                            return <Tag color="green">已折旧</Tag>;
                          }
                          return <Tag color="red">未折旧</Tag>;
                        },
                      },
                      {
                        title: '是否已结账',
                        valueType: 'text',
                        dataIndex: 'closed',
                        render(_, entity) {
                          if (entity.closed) {
                            return <Tag color="green">已结账</Tag>;
                          }
                          return <Tag color="red">未结账</Tag>;
                        },
                      },
                      {
                        title: (
                          <Space>
                            <span>资产负债表</span>
                            {balance && (
                              <Tag
                                color="green"
                                icon={
                                  <CloseOutlined
                                    onClick={() => {
                                      financial.setBalance(undefined);
                                    }}
                                  />
                                }>
                                {balance.name}
                              </Tag>
                            )}
                          </Space>
                        ),
                        valueType: 'text',
                        render(_, item) {
                          return (
                            <a
                              onClick={async () => {
                                if (!balance) {
                                  binding('balance');
                                } else {
                                  setCenter(
                                    <BalanceSheet
                                      period={item}
                                      balance={balance}
                                      onFinished={() => setCenter(<></>)}
                                      onCancel={() => setCenter(<></>)}
                                    />,
                                  );
                                }
                              }}>
                              查看
                            </a>
                          );
                        },
                      },
                      {
                        title: (
                          <Space>
                            <span>快照</span>
                            {form && (
                              <Tag
                                color="green"
                                icon={
                                  <CloseOutlined
                                    onClick={() => {
                                      financial.setForm(undefined);
                                    }}
                                  />
                                }>
                                {form.name}
                              </Tag>
                            )}
                          </Space>
                        ),
                        valueType: 'text',
                        render(_, item) {
                          return (
                            <Space>
                              <a
                                onClick={() => {
                                  if (!form) {
                                    binding('form');
                                  } else {
                                    const metadata = deepClone(form.metadata);
                                    metadata.collName = '_system-things';
                                    if (item.period != financial.current) {
                                      metadata.collName =
                                        metadata.collName + '_' + item.period;
                                    }
                                    setCenter(
                                      <FormView
                                        form={
                                          new Form(metadata, financial.space.directory)
                                        }
                                        finished={() => setCenter(<></>)}
                                      />,
                                    );
                                  }
                                }}>
                                查看
                              </a>
                            </Space>
                          );
                        },
                      },
                      {
                        title: '总账',
                        valueType: 'text',
                        render(_, entity) {
                          return (
                            <a
                              onClick={() => {
                                setCenter(
                                  <FullScreen
                                    title="资产总账"
                                    onFinished={() => setCenter(<></>)}
                                    onCancel={() => setCenter(<></>)}>
                                    <LedgerTable
                                      financial={financial}
                                      period={entity.period}
                                    />
                                  </FullScreen>,
                                );
                              }}>
                              查看
                            </a>
                          );
                        },
                      },
                      {
                        title: (
                          <Space>
                            <span>操作</span>
                            {balanceWork && (
                              <Tag
                                color="green"
                                icon={
                                  <CloseOutlined
                                    onClick={() => {
                                      financial.setWork(undefined, undefined);
                                    }}
                                  />
                                }>
                                {balanceWork.name}
                              </Tag>
                            )}
                          </Space>
                        ),
                        valueType: 'option',
                        width: 300,
                        render: (_, item) => {
                          return (
                            <Space>
                              <Button
                                type="primary"
                                size="small"
                                onClick={async () => {
                                  const start = () => {
                                    setCenter(
                                      <FullScreen
                                        title={'资产折旧'}
                                        onFinished={() => setCenter(<></>)}
                                        onCancel={() => setCenter(<></>)}>
                                        <Depreciation
                                          financial={financial}
                                          current={item}
                                          config={financial.configuration}
                                        />
                                      </FullScreen>,
                                    );
                                  };
                                  if (financial.configuration.checkConfig()) {
                                    start();
                                  } else {
                                    setCenter(
                                      <DepreciationTemplate
                                        financial={financial}
                                        onCancel={() => setCenter(<></>)}
                                        onSaved={() => start()}
                                      />,
                                    );
                                  }
                                }}>
                                {item.deprecated ? '查看折旧' : '发起折旧'}
                              </Button>
                              {!item.closed && (
                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={async () => {
                                    if (!balanceWork) {
                                      binding('work');
                                    } else {
                                      const node = await work.loadNode();
                                      if (node) {
                                        const data: {
                                          [key: string]: model.FormEditData[];
                                        } = {};
                                        if (balance) {
                                          data[balance.id] = [
                                            await item.loadBalanceForm(),
                                          ];
                                        }
                                        setCenter(
                                          <FullScreen
                                            title={'加载财务数据'}
                                            onFinished={() => setCenter(<></>)}
                                            onCancel={() => setCenter(<></>)}>
                                            <TaskStart
                                              current={balanceWork}
                                              data={{
                                                node,
                                                fields: {},
                                                data: data,
                                                primary: {},
                                                rules: [],
                                                reception: {
                                                  periodType: PeriodType.Month,
                                                  period: item.period,
                                                  content: {
                                                    type: TaskContentType.Financial,
                                                  },
                                                } as schema.XReception,
                                              }}
                                              finished={() => setCenter(<></>)}
                                            />
                                          </FullScreen>,
                                        );
                                      }
                                    }
                                  }}>
                                  加载财务数据
                                </Button>
                              )}
                              <Button
                                type="primary"
                                size="small"
                                onClick={async () =>
                                  setCenter(
                                    <FullScreen
                                      title={'月结账'}
                                      onFinished={() => setCenter(<></>)}
                                      onCancel={() => setCenter(<></>)}>
                                      <Closing financial={financial} current={item} />
                                    </FullScreen>,
                                  )
                                }>
                                {item.closed ? '查看结账' : '发起结账'}
                              </Button>
                              {!item.closed && (
                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={async () => {
                                    Modal.confirm({
                                      title: (
                                        <>
                                          <p>此操作将会删除本账期，返回上一账期</p>
                                          <p>本期未产生业务操作可使用</p>
                                        </>
                                      ),
                                      onOk: async () => {
                                        try {
                                          await item.reverseSettlement();
                                        } catch (error) {
                                          if (error instanceof Error) {
                                            message.error(error.message);
                                          }
                                        }
                                      },
                                    });
                                  }}>
                                  反结账
                                </Button>
                              )}
                            </Space>
                          );
                        },
                      },
                    ]}
                  />
                ),
              };
            })}
        />
      </Card>
      {center}
    </>
  );
};

interface FinancialProps {
  work: IWork;
  finished: (success: boolean) => void;
}

const BelongFinancial: React.FC<FinancialProps> = (props) => {
  const belong = props.work.directory.target.space;
  const [loaded] = useAsyncLoad(() => belong.financial.loadContent(), []);
  if (loaded) {
    if ([TargetType.Company, TargetType.Person].includes(belong.typeName as TargetType)) {
      return (
        <Space style={{ width: '100%' }} direction="vertical">
          <Financial work={props.work} financial={belong.financial} />
          <Periods work={props.work} financial={belong.financial} />
        </Space>
      );
    }
  }
  return <Spin spinning={!loaded} />;
};

interface BalanceProps {
  period: IPeriod;
  balance: IForm;
  onFinished: () => void;
  onCancel: () => void;
}

const BalanceSheet: React.FC<BalanceProps> = (props) => {
  const service = useRef<WorkFormService>();
  const [loaded] = useAsyncLoad(async () => {
    await props.balance.loadFields();
    const result = await props.period.loadBalanceForm();
    service.current = WorkFormService.createStandalone(
      props.period.space,
      props.balance.metadata,
      props.balance.fields,
      false,
      [result],
    );
  });
  if (!loaded) {
    return (
      <FullScreen
        title={'资产负债表'}
        onFinished={props.onFinished}
        onCancel={props.onCancel}>
        <Spin spinning={!loaded}>
          <Empty>正在加载配置中</Empty>
        </Spin>
      </FullScreen>
    );
  }

  if (!service.current) {
    return (
      <FullScreen
        title={'资产负债表'}
        onFinished={props.onFinished}
        onCancel={props.onCancel}>
        <Empty>未获取到数据</Empty>
      </FullScreen>
    );
  }

  return (
    <FullScreen
      title={'资产负债表'}
      onFinished={props.onFinished}
      onCancel={props.onCancel}>
      <PrimaryForm
        allowEdit={false}
        service={service.current}
        form={props.balance.metadata}
        info={{
          id: props.balance.id,
          showType: '主表',
          allowAdd: false,
          allowSelect: false,
          allowEdit: false,
        }}
        node={service.current.model.node}
      />
    </FullScreen>
  );
};

export default BelongFinancial;
