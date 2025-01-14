import React, { useEffect, useState } from 'react';
import { AiOutlineUser } from 'react-icons/ai';
import { Col, Radio, Form, InputNumber, Card, Divider } from 'antd';
import cls from './index.module.less';
import { WorkNodeDisplayModel } from '@/utils/work';
import ShareShowComp from '@/components/Common/ShareShowComp';
import { IBelong, IWork, IPrint, IAuthority } from '@/ts/core';
import SelectIdentity from '@/components/Common/SelectIdentity';
import { model } from '@/ts/base';
import OpenFileDialog from '@/components/OpenFileDialog';
import { SelectBox } from 'devextreme-react';
import { getUuid } from '@/utils/tools';
import Rule from '../../Components/Rule';
import ExecutorConfigModal from './configModal';
import ExecutorShowComp from '@/components/Common/ExecutorShowComp';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { CloseOutlined } from '@ant-design/icons';
import PrintConfigModal from '../../Components/PrintNode/PrintModal';
import orgCtrl from '@/ts/controller';
import SelectAuth from '@/components/Common/SelectAuth';
import FormBinding from '../../Components/FormBinding';
import DocumentConfig from '../../Components/Document';
interface IProps {
  work: IWork;
  rootNode: WorkNodeDisplayModel;
  current: WorkNodeDisplayModel;
  isGroupWork: boolean;
  belong: IBelong;
  refresh: () => void;
}

/**
 * @description: 审核对象
 * @return {*}
 */

const ApprovalNode: React.FC<IProps> = (props) => {
  const [executors, setExecutors] = useState<model.Executor[]>([]);
  const [openType, setOpenType] = useState<string>(''); // 打开弹窗
  const [radioValue, setRadioValue] = useState(1);
  const [destType, setDestType] = useState<string>();
  const [destTypeSource, setDestTypeSource] = useState<
    {
      label: string;
      value: string;
    }[]
  >();
  const [currentData, setCurrentData] = useState<{ id: string; name: string }>();
  const [executorModal, setExecutorModal] = useState(false);
  const [primaryPrints, setPrimaryPrints] = useState(props.current.print ?? []);
  const [printType, setPrintType] = useState<string>(
    (props.current.printData && props.current.printData.type) ?? '默认无',
  );
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (props.isGroupWork) {
      setDestTypeSource([{ value: '角色', label: '指定角色' }]);
      setDestType(props.current.destType ?? '角色');
    } else {
      setDestTypeSource([
        { value: '身份', label: '指定角色' },
        { value: '其他办事', label: '其他办事' },
        { value: '发起人', label: '发起人' },
      ]);
      setDestType(props.current.destType ?? '身份');
    }
    setExecutors(props.current.executors);
    setRadioValue(props.current.num == 0 ? 1 : 2);
    setCurrentData({
      id: props.current.destId,
      name: props.current.destName,
    });
  }, [props.current]);
  const [printLoaded, prints] = useAsyncLoad(async () => {
    return await props.work.application.loadAllPrint();
  });
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const newData: any = [];
      try {
        const IDsIprint = await orgCtrl.loadAllDefaultIPrint(props.work.belongId);
        const IPrints = await orgCtrl.loadAllFindIPrint(props.work.belongId);
        IPrints.forEach((item) => {
          if (
            props.work.belongId == item.belongId &&
            !item.groupTags.includes('已删除')
          ) {
            if (
              item.path.length > 0 &&
              item.path[1] == IDsIprint[0] &&
              item.path[2] == IDsIprint[1]
            ) {
              newData.push({ name: item.name, id: item.id });
            }
          }
        });
        const newPrimaryPrint = primaryPrints.filter(
          (obj1) => !newData.some((obj2: any) => obj1.id === obj2.id),
        );
        let newPrintData = primaryPrints.filter((item) => item.id == '默认无');
        if (newPrintData.length == 0) {
          setPrimaryPrints([
            { id: '默认无', name: '默认无' },
            ...newPrimaryPrint,
            ...newData,
          ]);
        } else {
          setPrimaryPrints([...newPrimaryPrint, ...newData]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  useEffect(() => {
    props.current.print = primaryPrints;
  }, [primaryPrints]);
  const handleRemoveItem = (
    e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
    data: { id: string },
  ) => {
    e.stopPropagation();
    if (data.id == '默认无') {
      return false;
    }
    const newPrintData = props.current.print.filter((option) => option.id !== data.id);
    const newPrintData2 = props.current.printData.attributes.filter(
      (option) => option.title !== data.id,
    );
    props.current.print = newPrintData;
    setPrimaryPrints([...newPrintData]);
    props.current.printData.attributes = newPrintData2;
  };
  const loadDestType = () => {
    switch (destType) {
      case '身份': {
        return (
          <>
            {currentData && (
              <ShareShowComp
                key={'审核对象'}
                departData={[currentData]}
                deleteFuc={(_) => {
                  props.current.destId = '';
                  props.current.destName = '';
                  setCurrentData(undefined);
                  props.refresh();
                }}
              />
            )}
            <Divider />
            <div className={cls['roval-node-select']}>
              <Col className={cls['roval-node-select-col']}></Col>
              <Radio.Group
                onChange={(e) => {
                  if (e.target.value == 1) {
                    props.current.num = 0;
                  } else {
                    props.current.num = 1;
                  }
                  setRadioValue(e.target.value);
                }}
                style={{ paddingBottom: '10px' }}
                value={radioValue}>
                <Radio value={1} style={{ width: '100%' }}>
                  全部: 需征得该角色下所有人员同意
                </Radio>
                <Radio value={2}>部分会签: 指定审核该节点的人员的数量</Radio>
              </Radio.Group>
              {radioValue === 2 && (
                <Form.Item label="会签人数">
                  <InputNumber
                    min={1}
                    onChange={(e: number | null) => {
                      props.current.num = e ?? 1;
                    }}
                    value={props.current.num}
                    placeholder="请设置会签人数"
                    addonBefore={<AiOutlineUser />}
                    style={{ width: '60%' }}
                  />
                </Form.Item>
              )}
            </div>
          </>
        );
      }
      case '角色':
        return (
          <SelectAuth
            excludeAll
            disableExp={(auth: IAuthority) => {
              return auth.metadata.shareId != props.work.metadata.shareId;
            }}
            space={props.belong}
            value={props.current.destId}
            onChange={(value, label) => {
              if (props.current.destId !== value) {
                props.current.destType = '角色';
                props.current.destName = '角色: ' + label;
                props.current.destId = value;
                props.refresh();
              }
            }}
          />
        );
      case '发起人':
        return <a>发起人</a>;
      default:
        return (
          <>
            {currentData && (
              <ShareShowComp
                key={'审核对象'}
                departData={[currentData]}
                deleteFuc={(_) => {
                  props.current.destId = '';
                  props.current.destName = '';
                  setCurrentData(undefined);
                  props.refresh();
                }}
              />
            )}
          </>
        );
    }
  };

  const loadDialog = () => {
    switch (openType) {
      case '身份':
        return (
          <SelectIdentity
            open={openType == '身份'}
            exclude={[]}
            multiple={false}
            space={props.belong}
            finished={(selected) => {
              if (selected.length > 0) {
                const item = selected[0];
                props.current.destType = '身份';
                props.current.destId = item.id;
                props.current.destName = item.name;
                setCurrentData(item);
                props.refresh();
              }
              setOpenType('');
            }}
          />
        );
      case '其他办事':
        return (
          <OpenFileDialog
            title={'选择其它办事'}
            rootKey={'disk'}
            accepts={['办事', '集群模板']}
            allowInherited
            excludeIds={[props.work.id]}
            onCancel={() => setOpenType('')}
            onOk={(files) => {
              if (files.length > 0) {
                const work = files[0] as IWork;
                let name = `${work.name} [${work.directory.target.name}]`;
                props.current.destId = work.metadata.primaryId;
                props.current.destShareId = work.metadata.shareId;
                props.current.destName = name;
                setCurrentData({ id: work.id, name: name });
              } else {
                setCurrentData({
                  id: '',
                  name: '',
                });
              }
              setOpenType('');
              props.refresh();
            }}
          />
        );
      case '打印模板添加': {
        return (
          <>
            {printLoaded && (
              <OpenFileDialog
                multiple
                title={`选择打印模板`}
                rootKey={props.work.application.key}
                currentKey={props.work.application.key}
                accepts={['打印模板']}
                fileContents={prints}
                excludeIds={primaryPrints.map((i) => i.id)}
                leftShow={false}
                rightShow={false}
                onCancel={() => setOpenType('')}
                onOk={(files) => {
                  if (files.length > 0) {
                    const prints = (files as unknown[] as IPrint[]).map((i) => ({
                      id: i.metadata.id,
                      name: i.metadata.name,
                    }));
                    const setPrintInfos = () => {
                      props.current.print = [...(props.current.print ?? []), ...prints];
                    };
                    setPrintInfos();
                    setPrimaryPrints((prevState: any) => [...prevState, ...prints]);
                  }
                  setOpenType('');
                }}
              />
            )}
          </>
        );
      }
      case '打印模板设置': {
        return (
          <>
            <PrintConfigModal
              refresh={() => {
                setOpenType('');
              }}
              resource={props.current}
              work={props.work}
              print={primaryPrints}
              printType={props.current.printData.type}
              primaryForms={props.current.primaryForms}
              detailForms={[]}
            />
          </>
        );
      }
      default:
        return <></>;
    }
  };

  const loadExecutor = () => {
    return (
      <>
        <Card
          type="inner"
          title={
            <div>
              <Divider type="vertical" className={cls['divider']} />
              <span>执行器配置</span>
            </div>
          }
          className={cls[`card-info`]}
          bodyStyle={{ padding: '12px' }}
          extra={
            <>
              <a
                type="link"
                onClick={() => {
                  setExecutorModal(true);
                }}>
                添加
              </a>
            </>
          }>
          {executors && executors.length > 0 && (
            <span>
              <ExecutorShowComp
                work={props.work}
                executors={executors}
                deleteFuc={(id: string) => {
                  const exes = executors.filter((a) => a.id != id);
                  setExecutors(exes);
                  props.current.executors = exes;
                }}
              />
            </span>
          )}
        </Card>
        {executorModal && (
          <ExecutorConfigModal
            refresh={(param) => {
              if (param) {
                executors.push({
                  id: getUuid(),
                  trigger: param.trigger,
                  funcName: param.funcName as any,
                  visible: param.visible,
                  changes: [],
                  hookUrl: '',
                  belongId: props.belong.id,
                  acquires: [],
                  copyForm: [],
                });
                setExecutors([...executors]);
                props.current.executors = executors;
              }
              setExecutorModal(false);
            }}
            current={props.current}
          />
        )}
      </>
    );
  };

  return (
    <div className={cls[`app-roval-node`]}>
      <div className={cls[`roval-node`]}>
        <Card
          type="inner"
          title={
            <div>
              <Divider type="vertical" className={cls['divider']} />
              <span>审核对象</span>
            </div>
          }
          className={cls[`card-info`]}
          extra={
            <>
              <SelectBox
                value={destType}
                valueExpr={'value'}
                displayExpr={'label'}
                style={{ width: 120, display: 'inline-block' }}
                onSelectionChanged={(e) => {
                  switch (e.selectedItem.value) {
                    case '身份':
                      props.current.destType = '身份';
                      setCurrentData(undefined);
                      break;
                    case '角色':
                      props.current.num = 1;
                      props.current.destType = '角色';
                      setCurrentData(undefined);
                      break;
                    case '其他办事':
                      props.current.destType = '其他办事';
                      setCurrentData(undefined);
                      break;
                    case '发起人':
                      props.current.num = 1;
                      props.current.destId = '1';
                      props.current.destName = '发起人';
                      props.current.destType = '发起人';
                      setCurrentData({ id: '1', name: '发起人' });
                      break;
                    default:
                      break;
                  }
                  if (destType != e.selectedItem.value) {
                    setDestType(e.selectedItem.value);
                    props.refresh();
                  }
                }}
                dataSource={destTypeSource}
              />
              {!['发起人', '角色', undefined].includes(destType) && (
                <>
                  <a
                    style={{ paddingLeft: 10, display: 'inline-block' }}
                    onClick={() => {
                      setOpenType(destType!);
                    }}>
                    {`+ 选择${destType === '身份' ? '角色' : destType}`}
                  </a>
                </>
              )}
            </>
          }>
          {loadDestType()}
        </Card>
        <FormBinding
          {...props}
          title="主表配置"
          formType="主表"
          xforms={props.current.primaryForms}
        />
        {loadExecutor()}
        {loadDialog()}
        <Rule
          work={props.work}
          current={props.current}
          primaryForms={props.current.primaryForms}
          detailForms={[]}
        />
        <DocumentConfig formHost={props.work} current={props.current} />
        <Card
          type="inner"
          title={
            <div>
              <Divider type="vertical" className={cls['divider']} />
              <span>打印模板设置</span>
            </div>
          }
          className={cls['card-info']}
          extra={
            <>
              <a
                onClick={() => {
                  setOpenType('打印模板添加');
                }}>
                添加
              </a>
            </>
          }>
          <SelectBox
            showClearButton
            value={printType}
            placeholder={loading ? '加载默认打印模板中...' : '请选择打印模板'}
            dataSource={loading ? [] : primaryPrints}
            displayExpr={'name'}
            valueExpr={'id'}
            onFocusIn={() => {
              setPrintType('');
            }}
            onValueChange={(e) => {
              props.current.printData
                ? (props.current.printData.type = e)
                : (props.current.printData = { attributes: [], type: e });
              setPrintType(e);
              if (e == '默认无') {
                setOpenType('');
              } else if (e == null) {
                setOpenType('');
              } else {
                setOpenType('打印模板设置');
              }
            }}
            itemRender={(data) => (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ whiteSpace: 'nowrap' }}>{data.name}</span>
                <CloseOutlined onClick={(e) => handleRemoveItem(e, data)} />
              </div>
            )}
          />
        </Card>
      </div>
    </div>
  );
};
export default ApprovalNode;
