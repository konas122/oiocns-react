import React, { useEffect, useState } from 'react';
import { Card, Divider, Space } from 'antd';
import cls from './index.module.less';
import { convertToFields, WorkNodeDisplayModel } from '@/utils/work';
import { IBelong, ITarget, IWork, IPrint } from '@/ts/core';
import { model } from '@/ts/base';
import OpenFileDialog from '@/components/OpenFileDialog';
import { SelectBox } from 'devextreme-react';
import { getUuid } from '@/utils/tools';
import Rule from '../../Components/Rule';
import ExecutorConfigModal from './configModal';
import ExecutorShowComp from '@/components/Common/ExecutorShowComp';
import SelectAuth from '@/components/Common/SelectAuth';
import TreeSelectItem from '@/components/DataStandard/WorkForm/Viewer/customItem/treeItem';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { CloseOutlined } from '@ant-design/icons';
import PrintConfigModal from '../../Components/PrintNode/PrintModal';
import orgCtrl from '@/ts/controller';
import FormBinding from '../../Components/FormBinding';
import DocumentConfig from '../../Components/Document';
import FormItem from '@/components/DataStandard/WorkForm/Viewer/formItem';
import { FieldModel } from '@/ts/base/model';

interface IProps {
  work: IWork;
  rootNode: WorkNodeDisplayModel;
  current: WorkNodeDisplayModel;
  belong: IBelong;
  refresh: () => void;
}

/**
 * @description: 审核对象
 * @return {*}
 */

const CustomNode: React.FC<IProps> = (props) => {
  const [executors, setExecutors] = useState<model.Executor[]>([]);
  const [destType, setDestType] = useState(props.current.destType ?? '人员');
  const [destId, setDestId] = useState<string | undefined>(props.current.destId);
  const [executorModal, setExecutorModal] = useState(false);
  const [openType, setOpenType] = useState<string>(''); // 打开弹窗
  const [primaryPrints, setPrimaryPrints] = useState(props.current.print ?? []);
  const [printType, setPrintType] = useState<string>(
    (props.current.printData && props.current.printData.type) ?? '默认无',
  );
  const [printLoaded, prints] = useAsyncLoad(async () => {
    return await props.work.application.loadAllPrint();
  });
  const [gatewayFields, setGatewayFields] = useState<FieldModel>();
  const [loading, setLoading] = useState(true);
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
    props.current.primaryForms = props.current.primaryForms || [];
    props.current.executors = props.current.executors || [];
    setExecutors(props.current.executors);
  }, [props.current]);
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
  /** 审核对象选择组件 */
  const rednerSelectedFC = (type: '身份' | '角色') => {
    const getTreeItems = (targets: ITarget[], pid?: string): any[] => {
      return targets.reduce((result, item) => {
        // 递归处理子目标
        const children = item.subTarget ? getTreeItems(item.subTarget, item.id) : [];
        // 添加当前项到结果数组
        result.push({
          id: item.id,
          text: item.name,
          parentId: pid,
          value: item.id,
        } as model.FiledLookup);
        // 添加子项到结果数组
        result.push(...children);
        return result;
      }, [] as model.FiledLookup[]);
    };
    switch (type) {
      case '身份': {
        const dataSource: model.FiledLookup[] = getTreeItems([props.belong]);
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <TreeSelectItem
              displayType={2}
              readOnly={false}
              flexWrap={'nowrap'}
              label={'组织选择'}
              isSelectLastLevel={true}
              speciesItems={dataSource}
              value={props.current.destId}
              onValueChanged={(e) => {
                if (e.value) {
                  const destName = dataSource.find((a) => a.id == e.value)?.text || '';
                  const fields = convertToFields(
                    {
                      ...props.current,
                      nodeType: props.current.type,
                      id: props.current.destId,
                    } as any,
                    props.belong,
                  );
                  setGatewayFields(fields);
                  props.current.destId = e.value;
                  props.current.destName = '角色:' + destName;
                }
              }}
            />
            {props.current.destId && gatewayFields && (
              <FormItem
                rules={[]}
                key={props.current.id}
                data={{ [props.current.destId]: props.current.defaultRoleIds }}
                numStr={'1'}
                field={gatewayFields}
                belong={props.belong}
                onValuesChange={(_, data) => {
                  props.current.defaultRoleIds = data;
                }}
              />
            )}
          </Space>
        );
      }
      case '角色':
        return (
          <SelectAuth
            excludeAll
            space={props.belong}
            value={destId}
            onChange={(value, label) => {
              if (props.current.destId !== value) {
                props.current.destName = '权限: ' + label;
                props.current.destId = value;
                setDestId(value);
              }
            }}
          />
        );
      default:
        return <div>暂不支持配置 {type}</div>;
    }
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
                  if (props.current.destType != e.selectedItem.value) {
                    props.current.destType = e.selectedItem.value;
                    setDestType(e.selectedItem.value);
                    props.current.destId = e.selectedItem.value === '人员' ? '0' : '';
                    props.current.destName = '';
                    setDestId(props.current.destId);
                  }
                }}
                dataSource={[
                  { value: '人员', label: '人员' },
                  { value: '身份', label: '角色' },
                  { value: '角色', label: '权限' },
                ]}
              />
            </>
          }>
          {destType && rednerSelectedFC(destType as '身份')}
        </Card>
        <FormBinding
          {...props}
          title="主表配置"
          formType="主表"
          xforms={props.current.primaryForms}
        />
        <Card
          type="inner"
          title={
            <div>
              <Divider type="vertical" className={cls['divider']} />
              <span>执行器配置</span>
            </div>
          }
          className={cls[`card-info`]}
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
      {executorModal ? (
        <ExecutorConfigModal
          refresh={(param) => {
            if (param) {
              executors.push({
                id: getUuid(),
                trigger: param.trigger,
                funcName: param.funcName,
                changes: [],
                hookUrl: '',
                belongId: props.belong.id,
                acquires: [],
              });
              setExecutors([...executors]);
              props.current.executors = executors;
            }
            setExecutorModal(false);
          }}
          current={props.current}
        />
      ) : null}
      {openType == '打印模板设置' && (
        <PrintConfigModal
          refresh={() => {
            setOpenType('');
          }}
          print={primaryPrints}
          resource={props.current}
          work={props.work}
          printType={props.current.printData.type}
          primaryForms={props.current.primaryForms}
          detailForms={[]}
        />
      )}
      {openType == '打印模板添加' && printLoaded && (
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
    </div>
  );
};
export default CustomNode;
