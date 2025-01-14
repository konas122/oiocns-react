import React, { useEffect, useState } from 'react';
import { Card, Divider } from 'antd';
import cls from './index.module.less';
import { WorkNodeDisplayModel } from '@/utils/work';
import { IBelong, IPrint, IWork } from '@/ts/core';
import OpenFileDialog from '@/components/OpenFileDialog';
import { model } from '@/ts/base';
import { SelectBox } from 'devextreme-react';
import { getUuid } from '@/utils/tools';
import Rule from '../../Components/Rule';
import ExecutorShowComp from '@/components/Common/ExecutorShowComp';
import ExecutorConfigModal from '../ApprovalNode/configModal';
import ButtonConfig from '../../Components/Button';
import PrintConfigModal from '../../Components/PrintNode/PrintModal';
import { CloseOutlined } from '@ant-design/icons';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import orgCtrl from '@/ts/controller';
import FormBinding from '../../Components/FormBinding';
import DocumentConfig from '../../Components/Document';

interface IProps {
  work: IWork;
  belong: IBelong;
  type?: string;
  current: WorkNodeDisplayModel;
  refresh: () => void;
}
/**
 * @description: 角色
 * @return {*}
 */

const RootNode: React.FC<IProps> = (props) => {
  props.current.primaryForms = props.current.primaryForms || [];
  props.current.detailForms = props.current.detailForms || [];
  props.current.buttons = props.current.buttons || [];
  props.current.documentConfig = props.current.documentConfig || {
    propMapping: {},
    nodeMapping: {},
    templates: [],
  };
  const [primaryPrints, setPrimaryPrints] = useState(props.current.print);
  const [executors, setExecutors] = useState<model.Executor[]>(
    props.current.executors ?? [],
  );
  const [executorModal, setExecutorModal] = useState(false);
  const [printModalCreate, setPrintModalCreate] = useState(false);
  const [printModal, setPrintModal] = useState(false);
  const [printType, setPrintType] = useState<string>(
    props.current.printData.type ?? '默认无',
  );
  const [printLoaded, prints] = useAsyncLoad(async () => {
    return await props.work.application.loadAllPrint();
  });
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
    props.current.print = primaryPrints;
  }, [primaryPrints]);
  return (
    <div className={cls[`app-roval-node`]}>
      <div className={cls[`roval-node`]}>
        <FormBinding
          {...props}
          title="主表配置"
          formType="主表"
          xforms={props.current.primaryForms}
        />
        <FormBinding
          {...props}
          title="子表配置"
          formType="子表"
          xforms={props.current.detailForms}
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
          bodyStyle={{ padding: executors && executors.length ? '24px' : '0' }}
          extra={
            <>
              <a
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
                  var exes = executors.filter((a) => a.id != id);
                  setExecutors(exes);
                  props.current.executors = exes;
                }}
              />
            </span>
          )}
        </Card>
        <ButtonConfig work={props.work} current={props.current} />
        <Rule
          work={props.work}
          current={props.current}
          primaryForms={props.current.primaryForms}
          detailForms={props.current.detailForms}
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
                  setPrintModalCreate(true);
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
              props.current.printData.type = e;
              setPrintType(e);
              if (e == '默认无') {
                setPrintModal(false);
              } else if (e == null) {
                setPrintModal(false);
              } else {
                setPrintModal(true);
              }
            }}
            itemRender={(data) => (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ whiteSpace: 'nowrap' }}>{data.name}</span>
                <CloseOutlined
                  onClick={(e) => {
                    e.stopPropagation();
                    if (data.id == '默认无') {
                      return false;
                    }
                    const newPrintData = primaryPrints.filter(
                      (option) => option.id !== data.id,
                    );
                    const newPrintData2 = props.current.printData.attributes.filter(
                      (option) => option.title !== data.id,
                    );
                    props.current.print = newPrintData;
                    setPrimaryPrints([...newPrintData]);
                    props.current.printData.attributes = newPrintData2;
                  }}
                />
              </div>
            )}
          />
        </Card>
        {executorModal ? (
          <ExecutorConfigModal
            refresh={(param) => {
              if (param) {
                executors.push({
                  id: getUuid(),
                  trigger: param.trigger,
                  funcName: param.funcName as any,
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
        ) : null}
        {printModal && (
          <PrintConfigModal
            refresh={() => {
              setPrintModal(false);
            }}
            print={primaryPrints}
            resource={props.current}
            work={props.work}
            printType={props.current.printData.type}
            primaryForms={props.current.primaryForms}
            detailForms={props.current.detailForms}
            type={props.type}
          />
        )}
        {printModalCreate && printLoaded && (
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
            onCancel={() => setPrintModalCreate(false)}
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
              setPrintModalCreate(false);
            }}
          />
        )}
      </div>
    </div>
  );
};
export default RootNode;
