import { IReport } from '@/ts/core';
import React from 'react';
import Toolbar, { Item } from 'devextreme-react/toolbar';
import { Emitter } from '@/ts/base/common';
import ReportDesign from '../design/index';
import { XCells, XFloatRowsInfo } from '@/ts/base/schema';

const ReportRender: React.FC<{
  current: IReport;
  notityEmitter: Emitter;
  onItemSelected: (cell: XCells) => void;
  onRowSelected: (rowInfo: XFloatRowsInfo | undefined) => void;
}> = ({ current, notityEmitter, onItemSelected, onRowSelected }) => {
  if (current.metadata.attributes === undefined) {
    current.metadata.attributes = [];
  }
  return (
    <div style={{ padding: 16 }}>
      <Toolbar height={60}>
        <Item
          location="center"
          locateInMenu="never"
          render={() => (
            <div className="toolbar-label">
              <b style={{ fontSize: 28 }}>{current.name}</b>
            </div>
          )}
        />
      </Toolbar>

      <ReportDesign
        current={current}
        notityEmitter={notityEmitter}
        selectCellItem={(cell: XCells | undefined) => {
          if (cell) {
            onItemSelected(cell);
          }
        }}
        selectRow={(rowInfo: XFloatRowsInfo | undefined) => {
          onRowSelected(rowInfo);
        }}></ReportDesign>
    </div>
  );
};

export default ReportRender;
