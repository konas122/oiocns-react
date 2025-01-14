import React, { useState, useEffect } from 'react';
import HotTableView from './components/hotTable';
import ToolBar from './components/tool';
import cls from './index.module.less';
import { IForm } from '@/ts/core';
import { Emitter } from '@/ts/base/common';
import { XFloatRowsInfo } from '../types';
interface IProps {
  current: IForm;
  notityEmitter: Emitter;
  selectCellItem: (cell: any) => void;
  selectRow: (rowInfo: XFloatRowsInfo | undefined) => void;
}

const ReportDesign: React.FC<IProps> = ({
  current,
  notityEmitter,
  selectCellItem,
  selectRow,
}) => {
  const [reportChange, setReportChange] = useState<any>();
  const [changeType, setChangeType] = useState<string>('');
  const [classType, setClassType] = useState<string | undefined>('');
  const [sheetList, setSheetList] = useState<any>([]);
  const [cellStyle, setCellStyle] = useState<any>();
  const [key, setKey] = useState<string>('');

  useEffect(() => {
    /** 获取报表数据，没有数据默认给个sheet页 */
    let sheetListData: any = current.metadata?.reportDatas
      ? JSON.parse(current.metadata?.reportDatas)
      : { 0: { name: 'sheet1', code: 'test1' } };
    delete sheetListData?.list;
    setSheetList(Object.values(sheetListData));
  }, []);

  return (
    <div className={cls['report-content-box']}>
      <div className={cls['report-tool-box']}>
        <ToolBar
          cellStyle={cellStyle}
          handClick={(value: string | any, type: string, classType?: any) => {
            setKey(Math.random().toString(36));
            setReportChange(value);
            setChangeType(type);
            setClassType(classType);
          }}></ToolBar>
      </div>
      <div>
        <HotTableView
          updataKey={key}
          current={current}
          notityEmitter={notityEmitter}
          handEcho={(cellStyle: any) => {
            /** 单元格样式回显到工具栏 */
            setCellStyle(cellStyle);
          }}
          selectCellItem={(cell: any) => {
            selectCellItem(cell);
          }}
          selectRow={(rowInfo: XFloatRowsInfo | undefined) => {
            selectRow(rowInfo);
          }}
          sheetList={sheetList}
          reportChange={reportChange}
          changeType={changeType}
          classType={classType}></HotTableView>
      </div>
    </div>
  );
};
export default ReportDesign;
