import React, { FC, useState, useEffect } from 'react';
import FullScreenModal from '@/components/Common/fullScreen';
import PrintTemplate from './Template';
import Drafts from './Template/drafts';
import { IWork, IWorkTask } from '@/ts/core';
import { schema } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import LoadingView from '@/components/Common/Loading';
interface IProps {
  refresh: (cur: any) => void;
  printType: string;
  print: any;
  work?: IWork | IWorkTask;
  primaryForms: schema.XForm[];
  detailForms: schema.XForm[];
  resource: any;
  type?: string;
  ser?: any;
}

const ConfigModal: FC<IProps> = (props) => {
  const [print2, setPrint2] = useState<schema.XPrint>();
  const [loaded, setLoaded] = useState<boolean>(false);
  useEffect(() => {
    const fetchData = async () => {
      setLoaded(false);
      const IPrints = await orgCtrl.loadFindPrint(
        props.printType,
        props.work?.metadata.shareId,
      );
      if (IPrints) {
        setPrint2(IPrints as schema.XPrint);
      }
      setLoaded(true);
    };
    fetchData();
  }, []);
  return (
    <FullScreenModal
      open
      title={'打印模板配置'}
      onCancel={() => props.refresh(props.resource)}
      destroyOnClose
      width={'80vw'}
      bodyHeight={'70vh'}>
      <>
        {!loaded && (
          <div className="loading-page">
            <LoadingView text="信息加载中..." />
          </div>
        )}
        {props.type != 'default' && props.work && loaded && print2 && (
          <PrintTemplate
            resource={props.resource}
            printType={props.printType}
            work={props.work}
            primaryForms={props.primaryForms}
            detailForms={props.detailForms}
            print={print2}
            type={props.type}
          />
        )}
        {props.type == 'default' && loaded && print2 && (
          <Drafts
            resource={props.resource}
            printType={props.printType}
            ser={props.ser}
            primaryForms={props.primaryForms}
            detailForms={props.detailForms}
            print={print2}
          />
        )}
      </>
    </FullScreenModal>
  );
};

export default ConfigModal;
