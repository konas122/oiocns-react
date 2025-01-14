import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react';
import { textRenderer, registerRenderer } from 'handsontable/renderers';
import { registerLanguageDictionary, zhCN } from 'handsontable/i18n';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.min.css';
import { IReport } from '@/ts/core';
import { Emitter } from '@/ts/base/common';
import {
  numberToLetters,
  getRanges,
  isPointInRange,
  getSelected,
  excelCellRef,
} from './../../Utils';
import { ReportSettingInfo } from '../../types';
import Handsontable from 'handsontable';
import { message, Modal } from 'antd';
import {
  XSheet,
  XFloatRowsInfo,
  XSheetConfig,
  XCells,
  XSheetCells,
  XRowsInfo,
} from '@/ts/base/schema';
import _ from 'lodash';
import * as el from '@/utils/excel';
import { Uploader } from './uploadTemplate';
import { CellSettings } from 'handsontable/settings';
import { deepClone } from '@/ts/base/common';
import { CellChange } from 'handsontable/common';

registerLanguageDictionary(zhCN);
registerAllModules();
interface IProps {
  current: IReport;
  sheet: XSheet;
  updateKey: string;
  reportChange: any;
  changeType: string;
  classType: any | undefined;
  notityEmitter: Emitter;
  handEcho: (cellStyle: any) => void;
  selectCellItem: (cellInfo: XCells | undefined) => void;
  selectRow: (rowInfo: XFloatRowsInfo | undefined) => void;
  onUpdate: (sheet: XSheet) => void;
}

function reducer(state: any, action: any) {
  switch (action.type) {
    case 'updateCell':
      return {
        ...state,
        [action.payload.key]: {
          ...state[action.payload.key],
          ...action.payload.cell,
        },
      };
    default:
      return state;
  }
}

const floatRowsReducer = (
  state: XFloatRowsInfo[],
  action: { type: string; payload: XFloatRowsInfo },
) => {
  switch (action.type) {
    case 'ADD_FLOAT_ROW':
      return [...state, action.payload];
    case 'UPDATE_FLOAT_ROW':
      return state.map((info) =>
        info.coords === action.payload.coords ? action.payload : info,
      );
    case 'REMOVE_FLOAT_ROW':
      return state.filter((info) => info.coords !== action.payload.coords);
    default:
      return state;
  }
};

const HotTableView: React.FC<IProps> = ({
  current,
  sheet,
  updateKey,
  reportChange,
  changeType,
  classType,
  notityEmitter,
  handEcho,
  selectCellItem,
  selectRow,
  onUpdate,
}) => {
  const [cells, dispatch] = useReducer(reducer, sheet.cells);
  const [customBorders, setCustomBorders] = useState<any>([]);
  const [copySelected, setCopySelected] = useState<XCells>();
  const [floatRowsInfos, floatRowdispatch] = useReducer(
    floatRowsReducer,
    sheet.sheetConfig?.floatRowsSetting || [],
  );
  const initRowCount: number = 5;
  const initColCount: number = 5;
  const defaultRowHeight: number = 26;
  const hotRef = useRef<{ hotInstance: Handsontable }>(null!); // ref
  const reportFormView = useRef<HTMLDivElement>(null);
  const [importData, setImportData] = useState<ReportSettingInfo>();
  const [defaultColWidth, setDefaultColWidth] = useState<number>(100);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const setting = sheet.sheetConfig ?? {};
    if (reportFormView.current) {
      setDefaultColWidth(Math.floor(reportFormView.current?.offsetWidth / 5));
    }
    updateHot(setting, sheet.cells);
  }, [current]);

  useEffect(() => {
    /** 属性监听 */
    const id = notityEmitter.subscribe((_, type, data) => {
      if (data && data.code === sheet.code) {
        if (type === 'cell') {
          updateCells(data);
        } else if (type === 'row') {
          updateFloatRow(data, 'update');
        } else if (type === 'isFloatRows') {
          updateFloatRow(data, 'edit');
        }
      }
    });
    return () => {
      notityEmitter.unsubscribe(id);
    };
  }, [cells]);

  useEffect(() => {
    const cells: CellSettings[] = [];
    function getCellSetting(row: number, col: number) {
      let cell = cells.find((c) => c.col == col && c.row == row);
      if (!cell) {
        cell = { col, row };
        cells.push(cell);
      }
      return cell;
    }
    if (importData) {
      const hot = hotRef.current.hotInstance;
      hot.updateSettings({
        minCols: importData?.col_w.length,
        minRows: importData?.row_h.length,
        rowHeights: importData?.row_h,
        colWidths: importData?.col_w,
        data: importData?.datas,
        mergeCells: importData?.mergeCells || [],
      });
      importData?.styleList.forEach((item: any) => {
        const cell = getCellSetting(item.row, item.col);
        cell.renderer = (
          instance: Handsontable.Core,
          TD: HTMLTableCellElement,
          row: number,
          col: number,
          prop: string | number,
          value: any,
          cellProperties: Handsontable.CellProperties,
        ) => {
          textRenderer(instance, TD, row, col, prop, value, cellProperties);
          if (item.styles) {
            for (let key in item.styles) {
              if (key === 'paddingLeft') {
                TD.style[key] = item.styles[key] + 'px';
              } else {
                TD.style[key as any] = item.styles[key];
              }
            }
          }
        };
      });
      importData?.classList?.forEach((item: any) => {
        const cell = getCellSetting(item.row, item.col);
        let arr = [];
        for (let k in item.class) {
          arr.push(item.class[k]);
        }
        cell.className = arr.join(' ');
      });
      hot.updateSettings({
        cell: cells,
      });
    }
  }, [importData]);

  useEffect(() => {
    /** 根据工具栏类型进行操作 */
    switch (changeType) {
      case 'onSave':
        saveClickCallback();
        break;
      case 'importTemplate':
        importTemplate();
        break;
      case 'copyStyle':
        copyStyle();
        return;
      case 'pasteStyle':
        pasteStyle();
        return;
      case 'border':
        setBorder(classType);
        return;
      case '':
        return;
      default:
        buttonClickCallback();
        return;
    }
  }, [updateKey]);

  function setCellRender(meta: Handsontable.CellProperties, item: XCells) {
    meta.renderer = 'customStylesRenderer';
    if (
      (item?.rule.value?.type === '函数型' && item?.rule.value?.valueString) ||
      item?.rule?.isSummary
    ) {
      meta.renderType = 'computed';
    } else {
      meta.renderType = 'input';
    }

    if (item?.readOnly) {
      meta.readOnly = true;
    }
  }

  const updateHot = (setting: XSheetConfig, sheetCell: XSheetCells) => {
    const hot = hotRef.current.hotInstance;
    const mergeCells = setting?.mergeCells || [];
    /** 初始化行高和列宽 */
    const row_h = Array.from({ length: initRowCount }, () => defaultRowHeight);
    const col_w = Array.from({ length: initColCount }, () => defaultColWidth);
    /** 设置更新边框 */
    // updateBorder(setting?.customBorders || []);
    /** 渲染单元格 */
    hot.batch(() => {
      hot.updateSettings({
        minCols: setting?.col_w ? setting?.col_w.length : initColCount,
        minRows: setting?.row_h ? setting?.row_h.length : initRowCount,
        rowHeights: setting?.row_h || row_h,
        colWidths: setting?.col_w || col_w,
      });
      hot.updateSettings({
        mergeCells,
      });
      Object.keys(sheetCell).forEach((key) => {
        const cell = sheetCell[key];
        const meta = hot.getCellMeta(cell.row, cell.col);
        meta.styles = cell.style ?? {};
        meta.renderer = 'cellStylesRenderer';
        if (cell.rule.value?.type !== '固定型') {
          setCellRender(meta, cell);
        }
        hot.setCellMeta(
          cell.row,
          cell.col,
          'className',
          Object.values(cell.class || {}).join(' '),
        );
        if (cell.rule.value?.type === '固定型') {
          hot.setDataAtCell(cell.row, cell.col, cell.rule.value?.valueString);
        }
      });
      setting?.floatRowsSetting?.forEach((setting: XFloatRowsInfo) => {
        if (setting.isFloatRows) {
          const cellsRanges = getRanges(setting.mergeCells);
          cellsRanges.forEach((range) => {
            hot.getCellMeta(range[0], range[1]).readOnly = true;
            hot.getCellMeta(range[0], range[1]).renderer = 'floatRowsRenderer';
          });
        }
      });
    });

    function adjustColumnWidths() {
      const containerWidth = document.getElementById('hot-container')?.offsetWidth || 0;
      const columnCount = hot.countCols();
      const minColumnWidth = 50;
      const totalMinWidth = minColumnWidth * columnCount;

      if (totalMinWidth <= containerWidth) {
        hot.updateSettings({
          colWidths: Array.from({ length: columnCount }, () => minColumnWidth),
        });
      } else {
        let newColWidth = Math.floor((containerWidth - 20) / columnCount);
        newColWidth = Math.max(newColWidth, minColumnWidth);
        hot.updateSettings({
          colWidths: Array.from({ length: columnCount }, () => newColWidth),
        });
      }
    }

    adjustColumnWidths();

    setTimeout(() => {
      setReady(true);
    }, 20);
  };

  /** 导入模板 */
  const importTemplate = () => {
    const excel = new el.Excel(
      current.directory.target.space,
      el.getStandardSheets(current.directory),
    );
    const modal = Modal.info({
      icon: <></>,
      okText: '关闭',
      width: 610,
      className: 'uploader-model',
      title: '导入',
      maskClosable: true,
      content: (
        <Uploader
          templateName={current.name}
          excel={excel}
          finished={(data: ReportSettingInfo) => {
            if (data) {
              setImportData(data);
              modal.destroy();
            }
          }}
        />
      ),
    });
  };

  /** 复制样式 */
  const copyStyle = () => {
    const selected = hotRef.current.hotInstance.getSelected() || [];
    if (selected.length <= 0) return;
    const key = excelCellRef({ row: selected[0][0], col: selected[0][1] });
    const cell = cells[key];
    if (cell) {
      setCopySelected(cell);
    }
  };
  /** 粘贴样式 */
  const pasteStyle = () => {
    const hot = hotRef.current.hotInstance;
    const selected = hot.getSelected() || [];
    for (let index = 0; index < selected.length; index += 1) {
      const [row1, column1, row2, column2] = selected[index];
      const startRow = Math.max(Math.min(row1, row2), 0);
      const endRow = Math.max(row1, row2);
      const startCol = Math.max(Math.min(column1, column2), 0);
      const endCol = Math.max(column1, column2);
      for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
        for (let columnIndex = startCol; columnIndex <= endCol; columnIndex += 1) {
          /** 存储 */
          const key = excelCellRef({ row: rowIndex, col: columnIndex });
          const cell = {
            row: rowIndex,
            col: columnIndex,
            accuracy: copySelected?.accuracy,
            rule: {
              value: {
                type: copySelected?.rule.value?.type || '固定型',
                valueString: '',
              },
            },
            valueType: copySelected?.valueType,
            style: copySelected?.style,
            class: copySelected?.class,
          };
          /** 渲染 */
          hot.batch(() => {
            const meta = hot.getCellMeta(rowIndex, columnIndex);
            meta.styles = cell.style ?? {};
            meta.renderer = 'cellStylesRenderer';
            if (cell.rule && cell.rule.value?.type !== '固定型') {
              setCellRender(meta, cell);
            }
            let arr = [];
            for (let k in cell.class) {
              arr.push(cell.class[k]);
            }
            hot.setCellMeta(cell.row, cell.col, 'className', arr.join(' '));
          });
          dispatch({
            type: 'updateCell',
            payload: {
              key,
              cell: cell,
            },
          });
        }
      }
    }
  };

  /** 设置边框 */
  const setBorder = (border: string, { width = 1, color = '#000000' } = {}) => {
    const customBordersPlugin = hotRef.current.hotInstance.getPlugin('customBorders');
    const { xMin, xMax, yMin, yMax } = getSelected(
      hotRef.current.hotInstance.getSelectedLast(),
    );
    const range: any = [];
    let customBorder: any = {};
    switch (border) {
      case 'start':
        range.push([xMin, yMin, xMax, yMin]);
        customBorder.left = { hide: false, width, color };
        break;
      case 'end':
        range.push([xMin, yMax, xMax, yMax]);
        customBorder.right = { hide: false, width, color };
        break;
      case 'top':
        range.push([xMin, yMin, xMin, yMax]);
        customBorder.top = { hide: false, width, color };
        break;
      case 'bottom':
        range.push([xMax, yMin, xMax, yMax]);
        customBorder.bottom = { hide: false, width, color };
        break;
      case 'all':
        range.push([xMin, yMin, xMax, yMax]);
        customBorder.left = { hide: false, width, color };
        customBorder.right = { hide: false, width, color };
        customBorder.top = { hide: false, width, color };
        customBorder.bottom = { hide: false, width, color };
        break;
      case 'border-outline':
        setBorder('start', { width, color });
        setBorder('end', { width, color });
        setBorder('top', { width, color });
        setBorder('bottom', { width, color });
        return;
      case 'border-outline-2':
        setBorder('start', { width: 2, color });
        setBorder('end', { width: 2, color });
        setBorder('top', { width: 2, color });
        setBorder('bottom', { width: 2, color });
        return;
      case 'none':
        range.push([xMin, yMin, xMax, yMax]);
        customBorder.left = { hide: true, width: 0 };
        customBorder.right = { hide: true, width: 0 };
        customBorder.top = { hide: true, width: 0 };
        customBorder.bottom = { hide: true, width: 0 };
        customBordersPlugin.clearBorders(hotRef.current.hotInstance.getSelectedRange());
        break;
      default:
        break;
    }
    /** 存储边框数据 */
    let json = {
      range: range,
      border: border,
      customBorder: customBorder,
    };
    customBorders.push(json);
    if (range.length > 0 && customBorder) {
      customBordersPlugin.setBorders(range, customBorder);
    }
  };

  /** 更新边框 */
  // const updateBorder = (customBordersProp: any) => {
  //   const customBordersPlugin = hotRef.current.hotInstance.getPlugin('customBorders');
  //   if (customBordersProp.length > 0) {
  //     customBordersProp.forEach((it: any) => {
  //       if (it.range.length > 0) {
  //         customBordersPlugin.setBorders(it.range, it.customBorder);
  //       }
  //     });
  //   }
  // };
  //   const selected = hotRef.current.hotInstance.getSelectedLast(); // [startRow, startCol, endRow, endCol]
  //   if (!selected) {
  //     return {
  //       xMin: 0,
  //       yMin: 0,
  //       xMax: 0,
  //       yMax: 0,
  //       unselected: true,
  //     };
  //   }
  //   /** 因为会从不同的方向选择，需要重新排序 */
  //   const xMin = Math.min(selected[0], selected[2]);
  //   const xMax = Math.max(selected[0], selected[2]);
  //   const yMin = Math.min(selected[1], selected[3]);
  //   const yMax = Math.max(selected[1], selected[3]);
  //   return {
  //     xMin,
  //     xMax,
  //     yMin,
  //     yMax,
  //   };
  // };

  /** 工具栏按钮点击 */
  const buttonClickCallback = () => {
    const hot = hotRef.current.hotInstance;
    const selected = hot.getSelected() || [];
    const newCells = deepClone(cells);
    for (let index = 0; index < selected.length; index += 1) {
      const [row1, column1, row2, column2] = selected[index];
      const startRow = Math.max(Math.min(row1, row2), 0);
      const endRow = Math.max(row1, row2);
      const startCol = Math.max(Math.min(column1, column2), 0);
      const endCol = Math.max(column1, column2);
      for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
        for (let columnIndex = startCol; columnIndex <= endCol; columnIndex += 1) {
          const key = excelCellRef({ row: rowIndex, col: columnIndex });
          const cell = newCells[key] ?? {
            row: rowIndex,
            col: columnIndex,
            rule: { value: { type: '固定型' } },
          };
          if (!cell.style) {
            cell.style = {};
          }
          if (changeType === 'className') {
            if (!cell.class) {
              cell.class = {};
            }
            cell.class[classType] = reportChange;
            let arr = [];
            for (let k in cell.class) {
              arr.push(cell.class[k]);
            }
            hot.setCellMeta(rowIndex, columnIndex, 'className', arr.join(' '));
          } else {
            cell.style[changeType] = reportChange;
            hot.getCellMeta(rowIndex, columnIndex).styles = cell.style;
            hot.getCellMeta(rowIndex, columnIndex).renderer = 'cellStylesRenderer';
          }
          dispatch({
            type: 'updateCell',
            payload: {
              key,
              cell: cell,
            },
          });
        }
      }
    }
  };

  /** 保存 保存数据结构 */
  const saveClickCallback = async () => {
    const hot = hotRef.current.hotInstance;
    const count_col = hot.countCols(); /** 获取列数 **/
    const count_row = hot.countRows(); /** 获取行数 **/
    let row_h: any = [];
    let col_w: any = [];
    for (var i = 0; i < count_col; i++) {
      col_w.push(hot.getColWidth(i));
    }
    for (var k = 0; k < count_row; k++) {
      row_h.push(hot.getRowHeight(k));
    }
    const newSheet = deepClone(sheet);
    newSheet.cells = cells;
    newSheet.sheetConfig = {
      mergeCells: hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells,
      row_h: row_h,
      col_w: col_w,
      floatRowsSetting: floatRowsInfos,
      minCols: count_col,
      minRows: count_row,
    };
    onUpdate(newSheet);
  };

  /** 点击单元格展示单元格属性 */
  const afterOnCellMouseDown = (event: MouseEvent, coords: Handsontable.CellCoords) => {
    if (event && coords.row > -1) {
      const key = excelCellRef(coords);
      const cellInfo = cells[key] || {
        row: coords.row,
        col: coords.col,
        rule: { value: { type: '固定型' } },
      };

      selectRow(undefined);
      selectCellItem({ ...cellInfo, code: sheet.code });

      for (const floatRowInfo of floatRowsInfos) {
        if (isPointInRange(coords, floatRowInfo.mergeCells)) {
          selectRow(floatRowInfo);
          selectCellItem(undefined);
          return;
        }
      }

      handEcho({ styles: cellInfo.style ?? {}, class: cellInfo.class ?? {} });
    }
  };

  /** 更新单元格属性 */
  const updateCells = (data: XCells) => {
    const key = excelCellRef({ row: data.row, col: data.col });
    cells[key] = data;
    const hot = hotRef.current.hotInstance;
    if (cells[key].rule.value?.type === '固定型') {
      hot.setDataAtCell(
        cells[key].row,
        cells[key].col,
        cells[key].rule.value?.valueString,
      );
    } else if (cells[key].rule.value?.type === '取数型') {
      hot.setDataAtCell(
        cells[key].row,
        cells[key].col,
        JSON.stringify(cells[key].rule.value?.valueString),
      );
    } else {
      const meta = hotRef.current.hotInstance.getCellMeta(cells[key].row, cells[key].col);
      setCellRender(meta, cells[key]);
    }
    hot.render();
    selectCellItem({ ...data, code: sheet.code });
  };

  const updateFloatRow = async (floatRowsInfo: XFloatRowsInfo, type: string) => {
    const hot = hotRef.current.hotInstance;
    const cellsRanges = getRanges(floatRowsInfo.mergeCells);

    if (!floatRowsInfo.isFloatRows) {
      floatRowdispatch({ type: 'REMOVE_FLOAT_ROW', payload: floatRowsInfo });
      current.metadata.attributes = current.metadata.attributes.filter(
        (attr) => attr.options?.reportTemporaryCoord !== floatRowsInfo.coords,
      );
      hot.batch(() => {
        cellsRanges.forEach((range) => {
          hot.getCellMeta(range[0], range[1]).readOnly = false;
          hot.getCellMeta(range[0], range[1]).renderer = 'delStylesRenderer';
        });
      });
    } else {
      if (type === 'update') {
        const isExisting = floatRowsInfos.some(
          (info) => info.coords === floatRowsInfo.coords,
        );
        if (isExisting) {
          floatRowdispatch({ type: 'UPDATE_FLOAT_ROW', payload: floatRowsInfo });
        } else {
          floatRowdispatch({ type: 'ADD_FLOAT_ROW', payload: floatRowsInfo });
        }

        hot.batch(() => {
          cellsRanges.forEach((range) => {
            hot.getCellMeta(range[0], range[1]).readOnly = true;
            hot.getCellMeta(range[0], range[1]).renderer = 'floatRowsRenderer';
          });
        });

        message.success('批量生成成功');
      }
    }
  };

  /** 删除属性背景色 **/
  registerRenderer('delStylesRenderer', (hotInstance: any, TD: any, ...rest) => {
    textRenderer(hotInstance, TD, ...rest);
    TD.style.background = '#ffffff';
  });

  /** 渲染样式 **/
  registerRenderer(
    'cellStylesRenderer',
    (hotInstance: Handsontable.Core, TD: HTMLTableCellElement, ...rest) => {
      textRenderer(hotInstance, TD, ...rest);
      const styles = rest[4].styles;
      const td: any = TD.style;
      if (styles) {
        for (let key in styles) {
          if (key === 'paddingLeft') {
            td[key] = styles[key] + 'px';
          } else {
            td[key] = styles[key];
          }
        }
      }
    },
  );

  /** 渲染浮动行背景色 **/
  registerRenderer('floatRowsRenderer', (hotInstance: any, TD: any, ...rest) => {
    textRenderer(hotInstance, TD, ...rest);
    TD.style.background = '#50B450';
  });

  const getMenu = () => {
    return {
      row_above: {},
      row_below: {},
      col_left: {},
      col_right: {},
      make_read_only: {},
      alignment: {},
      mergeCells: {},
    };
  };

  // 函数来判断单元格是否被合并
  const isCellMerged = (row: number, col: number) => {
    const hot = hotRef.current.hotInstance;
    const mergedCells = hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells;
    for (var i = 0; i < mergedCells.length; i++) {
      const mergedCell = mergedCells[i];
      if (
        mergedCell.row <= row &&
        mergedCell.row + mergedCell.rowspan - 1 >= row &&
        mergedCell.col <= col &&
        mergedCell.col + mergedCell.colspan - 1 >= col
      ) {
        return true;
      }
    }
    return false;
  };

  const afterSelectionEnd = (
    row: number,
    column: number,
    row2: number,
    column2: number,
    _selectionLayerLevel: number,
  ) => {
    const isMerge = isCellMerged(row, column);
    if (!isMerge && row === row2 && column2 - column >= 1) {
      const hot = hotRef.current.hotInstance;
      const newRow = row + 1;
      let newColumn = column == -1 ? 0 : column;
      let arr: XRowsInfo[] = [];
      for (let i = 0; i < column2 + 1; i++) {
        if (i >= newColumn) {
          arr.push({
            name: numberToLetters(i + 1),
            index: i + 1,
            rule: {},
          });
        }
      }
      let colWidths: number[] = [];
      for (var colIndex = column; colIndex <= column2; colIndex++) {
        colWidths.push(hot.getColWidth(colIndex));
      }
      let floatRowsInfo: XFloatRowsInfo = {
        coords:
          numberToLetters(newColumn + 1) +
          newRow +
          ':' +
          numberToLetters(column2 + 1) +
          newRow,
        floatStartLine: newRow,
        isFloatRows: false,
        floatRowNumber: 10,
        rowsInfo: arr,
        startColumn: newColumn,
        mergeCells: getSelected(hot.getSelectedLast()),
        colWidths: colWidths,
        code: sheet.code,
      };
      selectRow({ ...floatRowsInfo, code: sheet.code });
      selectCellItem(undefined);
    }
  };

  const afterChange = (
    changes: CellChange[] | null,
    source: Handsontable.ChangeSource,
  ) => {
    if (!ready) {
      return;
    }
    if (
      changes &&
      (source === 'edit' || source === 'CopyPaste.paste' || source === 'Autofill.fill')
    ) {
      for (const change of changes) {
        const [row, col, , label]: any[] = change;
        const key = excelCellRef({ row: row, col: col });
        let cell = cells[key] || { row, col, rule: { value: { type: '固定型' } } };
        cell.rule.value.valueString = label;
        dispatch({
          type: 'updateCell',
          payload: {
            key,
            cell: cell,
          },
        });
      }
    }
  };

  const hotTableConfig = useMemo(
    () => ({
      customBorders: true,
      rowHeaders: true,
      colHeaders: true,
      autoColumnSize: true,
      manualColumnResize: true,
      manualRowResize: true,
      dropdownMenu: true,
      height: '650px',
      language: zhCN.languageCode,
      persistentState: true,
      stretchH: 'all',
      multiColumnSorting: true,
      filters: true,
      manualRowMove: true,
      contextMenu: {
        items: getMenu(),
      },
      outsideClickDeselects: false,
      renderAllRows: false,
      viewportRowRenderingOffset: 30,
      licenseKey: 'non-commercial-and-evaluation',
      afterOnCellMouseDown,
      afterSelectionEnd,
      afterChange,
    }),
    [afterOnCellMouseDown, afterSelectionEnd, afterChange],
  );

  return (
    <div className="report-form-viewer" ref={reportFormView}>
      <HotTable id="hot-container" ref={hotRef} {...hotTableConfig} />
    </div>
  );
};
export default React.memo(HotTableView);
