import React, { useState, useEffect } from 'react';
import { IForm, IPrint } from '@/ts/core';
import { Card, Divider } from 'antd';
import cls from './print.module.less';
import { SelectBox } from 'devextreme-react';
import OpenFileDialog from '@/components/OpenFileDialog';
import { CloseOutlined } from '@ant-design/icons';
import orgCtrl from '@/ts/controller';
import PrintConfigModal from './PrintModal';

interface Iprops {
  current: IForm;
}
const FormPrint: React.FC<Iprops> = (props) => {
  const [printType, setPrintType] = useState<string>(
    props.current.metadata.printData ? props.current.metadata.printData.type ?? '' : '',
  );
  const [printModalCreate, setPrintModalCreate] = useState(false);
  const [primaryPrints, setPrimaryPrints] = useState(
    props.current.metadata.primaryPrints ?? [],
  );
  const [printModal, setPrintModal] = useState(false);
  useEffect(() => {
    if (props.current.metadata.primaryPrints) {
      //所有的打印模板拿到后做自动更新
      orgCtrl.loadPrint().then((result) => {
        result.forEach((item) => {
          props.current.metadata.primaryPrints.forEach((primaryPrint: any) => {
            if (item.id == primaryPrint.id) {
              primaryPrint.name = item.name;
              primaryPrint.table = item.table;
            }
          });
        });
      });
    }
  }, []);
  return (
    <>
      <div className={cls[`app-roval-node`]}>
        <div className={cls[`roval-node`]}>
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
              placeholder="请选择打印模板"
              dataSource={primaryPrints}
              displayExpr={'name'}
              valueExpr={'id'}
              onFocusIn={() => {
                setPrintType('');
              }}
              onValueChange={(e) => {
                if (props.current.metadata.printData) {
                  props.current.metadata.printData.type = e;
                } else {
                  props.current.metadata.printData = { type: e, attributes: [] };
                }
                setPrintType(e);
                if (e == null) {
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
                      const newPrintData = props.current.metadata.primaryPrints.filter(
                        (option: any) => option.id !== data.id,
                      );
                      const newPrintData2 =
                        props.current.metadata.printData.attributes.filter(
                          (option: any) => option.title !== data.id,
                        );
                      props.current.metadata.primaryPrints = newPrintData;
                      setPrimaryPrints([...newPrintData]);
                      props.current.metadata.printData.attributes = newPrintData2;
                    }}
                  />
                </div>
              )}
            />
          </Card>
          {printModal && (
            <PrintConfigModal
              refresh={() => {
                setPrintModal(false);
              }}
              print={primaryPrints}
              printType={props.current.metadata.printData.type}
              current={props.current}
              primaryForms={props.current.metadata}
            />
          )}
          {printModalCreate && (
            <OpenFileDialog
              multiple
              title={`选择打印模板`}
              rootKey={''}
              accepts={['打印模板']}
              excludeIds={primaryPrints.map((i: any) => i.id)}
              onCancel={() => setPrintModalCreate(false)}
              onOk={(files) => {
                if (files.length > 0) {
                  const prints = (files as unknown[] as IPrint[]).map((i) => i.metadata);
                  props.current.metadata.primaryPrints = [
                    ...(props.current.metadata.primaryPrints ?? []),
                    ...prints,
                  ];
                  setPrimaryPrints([...props.current.metadata.primaryPrints]);
                }
                setPrintModalCreate(false);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default FormPrint;
