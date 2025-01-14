import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react';
import { textRenderer, registerRenderer } from 'handsontable/renderers';
import { registerLanguageDictionary, zhCN } from 'handsontable/i18n';
registerLanguageDictionary(zhCN);
import { registerAllModules } from 'handsontable/registry';
registerAllModules();
import 'handsontable/dist/handsontable.min.css';
import { IForm, IProperty, orgAuth } from '@/ts/core';
import OpenFileDialog from '@/components/OpenFileDialog';
import { Emitter } from '@/ts/base/common';
import { HyperFormula } from 'hyperformula';
import {
  numberToLetters,
  getRanges,
  isPointInRange,
  getSelected,
  generateProperties,
} from './../../Utils';
import { CellInfo, ReportSettingInfo, XFloatRowsInfo, XRowsInfo } from '../../types';
import Handsontable from 'handsontable';
import { message, Modal } from 'antd';
import { XAttribute } from '@/ts/base/schema';
import _ from 'lodash';
import * as el from '@/utils/excel';
import { Uploader } from './uploadTemplate';
import { CellSettings } from 'handsontable/settings';
interface IProps {
  current: IForm;
  sheetList: any;
  updataKey: string;
  reportChange: any;
  changeType: string;
  classType: any | undefined;
  notityEmitter: Emitter;
  handEcho: (cellStyle: any) => void;
  selectCellItem: (cell: any) => void;
  selectRow: (rowInfo: XFloatRowsInfo | undefined) => void;
}

const HotTableView: React.FC<IProps> = ({
  current,
  sheetList,
  updataKey,
  reportChange,
  changeType,
  classType,
  notityEmitter,
  handEcho,
  selectCellItem,
  selectRow,
}) => {
  const [modalType, setModalType] = useState<string>('');
  const [cells, setCells] = useState<CellInfo[]>([]);
  const [styleList, setStyleList] = useState<any>([]);
  const [classList, setClassList] = useState<any>([]);
  const [customBorders, setCustomBorders] = useState<any>([]);
  const [copySelected, setCopySelected] = useState<any>();
  const [selectAttr, setSelectAttr] = useState<CellInfo>();
  // const [beforeCols, setBeforeCols] = useState<any>([]);
  // const [beforeRows, setBeforeRows] = useState<any>([]);
  const [grdatr, setGrdatr] = useState<any>({});
  const [floatRowsInfos, setFloatRowsInfos] = useState<XFloatRowsInfo[]>([]);
  const initRowCount: number = 30;
  const initColCount: number = 4;
  const defaultRowHeight: number = 26;
  const hotRef = useRef<{ hotInstance: Handsontable }>(null!); // ref
  const reportFormView = useRef<HTMLDivElement>(null);
  const [importData, setImportData] = useState<ReportSettingInfo>();
  const [defaultColWidth, setDefaultColWidth] = useState<number>(100);

  const hyperformulaInstance = HyperFormula.buildEmpty({
    licenseKey: 'internal-use-in-handsontable',
  });

  const attrMap = useMemo(() => {
    return current.attributes.reduce<Dictionary<XAttribute>>((a, v) => {
      a[v.id] = v;
      return a;
    }, {});
  }, [current.attributes]);

  useEffect(() => {
    const sheetListData: any = current.metadata?.reportDatas
      ? JSON.parse(current.metadata?.reportDatas)
      : { 0: { name: 'sheet1', code: 'test1' } };
    const selectItem: any = Object.values(sheetListData)[0];
    const setting = selectItem?.data?.setting || {};
    const datas = selectItem?.data?.data || [[]];
    setFloatRowsInfos(setting.floatRowsSetting || []);
    if (reportFormView.current) {
      setDefaultColWidth(Math.floor(reportFormView.current?.offsetWidth / 4));
    }
    updateHot(setting, datas);
  }, [current]);

  useEffect(() => {
    /** 属性监听 */
    const id = notityEmitter.subscribe((_, type, data) => {
      if (type === 'attr') {
        updateCells(data, cells);
      } else if (type === 'row') {
        updateFloatRow(data);
      } else if (type === 'isFloatRows') {
        whetherFloatRows(data);
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
      setStyleList(importData?.styleList || []);
      setClassList(importData?.classList || []);
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
  }, [updataKey]);

  function setCellRender(meta: Handsontable.CellProperties, item: CellInfo) {
    meta.renderer = 'customStylesRenderer';
    const prop = attrMap[item.prop.id];
    if ((prop?.rule && JSON.parse(prop.rule).id) || prop?.options?.isComputed) {
      meta.renderType = 'computed';
    } else {
      meta.renderType = 'input';
    }
    if (prop.options?.readOnly) {
      meta.readOnly = true;
    }
  }

  const updateHot = (setting: any, data: any) => {
    const hot = hotRef.current.hotInstance;
    const mergeCells = setting?.mergeCells || [];
    /** 初始化行高和列宽 */
    const row_h = [];
    for (let i = 0; i < initRowCount; i += 1) {
      row_h.push(defaultRowHeight);
    }
    const col_w = [];
    for (let j = 0; j < initColCount; j += 1) {
      col_w.push(defaultColWidth);
    }
    setGrdatr(setting?.grdatr || {});

    const allCells: CellInfo[] = setting?.cells || [];
    for (const cell of allCells) {
      const prop = attrMap[cell.prop.id];
      if (prop) {
        // 刷新cell.prop为外面的attrbutes里面的值
        cell.prop = prop;
      } else {
        console.warn(
          `单元格 (${cell.col}, ${cell.row}) 所绑定的特性 ${cell.prop.id} 不存在！`,
        );
      }
    }
    setCells(allCells);
    setStyleList(setting?.styleList || []);
    setClassList(setting?.classList || []);
    setCustomBorders(setting?.customBorders || []);
    // setBeforeCols(
    //   generateSequence(setting?.col_w ? setting?.col_w.length : initColCount),
    // );
    // setBeforeRows(
    //   generateArrayByLength(setting?.row_h ? setting?.row_h.length : initRowCount),
    // );
    /** 更新报表 */
    hot.updateSettings({
      minCols: setting?.col_w ? setting?.col_w.length : initColCount,
      minRows: setting?.row_h ? setting?.row_h.length : initRowCount,
      data: data,
      mergeCells: mergeCells,
      rowHeights: setting?.row_h || row_h,
      colWidths: setting?.col_w || col_w,
    });
    /** 设置更新边框 */
    // updateBorder(setting?.customBorders || []);

    const styleList: any[] = setting.styleList || [];
    const classList: any[] = setting.classList || [];

    styleList?.forEach((item: any) => {
      hotRef.current.hotInstance.getCellMeta(item.row, item.col).renderer =
        'cellStylesRenderer';
    });

    classList?.forEach((item: any) => {
      let arr = [];
      for (let k in item.class) {
        arr.push(item.class[k]);
      }
      hot.setCellMeta(item.row, item.col, 'className', arr.join(' '));
    });

    /** 渲染单元格颜色 */
    hot.batch(() => {
      setting?.cells?.forEach((item: CellInfo) => {
        if (!item.isFloatRow) {
          const meta = hot.getCellMeta(item.row, item.col);
          setCellRender(meta, item);
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
    if (selected) {
      const items = styleList.find(
        (it: any) => it.col === selected[0][1] && it.row === selected[0][0],
      );
      setCopySelected(items);
    }
  };

  /** 粘贴样式 */
  const pasteStyle = () => {
    clearStyle();
    const selected = hotRef.current.hotInstance.getSelected() || [];
    for (let index = 0; index < selected.length; index += 1) {
      const [row1, column1, row2, column2] = selected[index];
      const startRow = Math.max(Math.min(row1, row2), 0);
      const endRow = Math.max(row1, row2);
      const startCol = Math.max(Math.min(column1, column2), 0);
      const endCol = Math.max(column1, column2);
      for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
        for (let columnIndex = startCol; columnIndex <= endCol; columnIndex += 1) {
          /** 存储 */
          const item = styleList.find(
            (a: any) => a.col === columnIndex && a.row === rowIndex,
          );
          if (item) {
            item.styles = copySelected.styles;
          } else {
            let json: any = {
              col: columnIndex,
              row: rowIndex,
              styles: copySelected.styles,
            };
            styleList.push(json);
          }
          /** 渲染 */
          const kv =
            hotRef.current.hotInstance.getCellMeta(rowIndex, columnIndex).style || {};
          if (copySelected) {
            Object.keys(copySelected?.styles).map((key) => {
              kv[key] = copySelected.styles[key];
            });
          }
          hotRef.current.hotInstance.setCellMeta(rowIndex, columnIndex, 'style', kv);
        }
      }
    }
  };

  // 清除格式
  const clearStyle = () => {
    const selected = hotRef.current.hotInstance.getSelected() || [];
    for (let index = 0; index < selected.length; index += 1) {
      const [row1, column1, row2, column2] = selected[index];
      const startRow = Math.max(Math.min(row1, row2), 0);
      const endRow = Math.max(row1, row2);
      const startCol = Math.max(Math.min(column1, column2), 0);
      const endCol = Math.max(column1, column2);
      for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
        for (let columnIndex = startCol; columnIndex <= endCol; columnIndex += 1) {
          /** 清除存储 */
          const index = classList.findIndex(
            (a: any) => a.col === columnIndex && a.row === rowIndex,
          );
          if (index > -1) {
            classList.splice(index, 1);
          }
          /** 清除meta */
          let className =
            hotRef.current.hotInstance.getCellMeta(rowIndex, columnIndex).className || '';
          className = className.replace(/htCenter|htLeft|htRight/, 'htLeft');
          className = className.replace(/htMiddle|htTop|htBottom/, 'htMiddle');
          hotRef.current.hotInstance.removeCellMeta(rowIndex, columnIndex, 'style');
          hotRef.current.hotInstance.setCellMeta(
            rowIndex,
            columnIndex,
            'className',
            className,
          );
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
    const selected = hotRef.current.hotInstance.getSelected() || [];
    for (let index = 0; index < selected.length; index += 1) {
      const [row1, column1, row2, column2] = selected[index];
      const startRow = Math.max(Math.min(row1, row2), 0);
      const endRow = Math.max(row1, row2);
      const startCol = Math.max(Math.min(column1, column2), 0);
      const endCol = Math.max(column1, column2);
      for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
        for (let columnIndex = startCol; columnIndex <= endCol; columnIndex += 1) {
          if (changeType === 'className') {
            let json: any = { col: columnIndex, row: rowIndex, class: {} };
            if (classList.length > 0) {
              let items = classList.find(
                (it: any) => it.col === columnIndex && it.row === rowIndex,
              );
              if (items) {
                for (let k in items.class) {
                  if (k === classType) {
                    items.class[k] = reportChange;
                  } else {
                    items.class[classType] = reportChange;
                  }
                }
              } else {
                json.class[classType] = reportChange;
                classList.push(json);
              }
            } else {
              json.class[classType] = reportChange;
              classList.push(json);
            }
            let items = classList.find(
              (it: any) => it.row === rowIndex && it.col === columnIndex,
            );
            let arr = [];
            if (items) {
              for (let k in items.class) {
                arr.push(items.class[k]);
              }
            }
            hotRef.current.hotInstance.setCellMeta(
              rowIndex,
              columnIndex,
              'className',
              arr.join(' '),
            );
          } else {
            if (styleList.length > 0) {
              let index = styleList.findIndex(
                (it: any) => it.col === columnIndex && it.row === rowIndex,
              );
              if (index != -1) {
                for (let k in styleList[index]?.styles) {
                  if (k === changeType) {
                    styleList[index].styles[k] = reportChange;
                  } else {
                    styleList[index].styles[changeType] = reportChange;
                  }
                }
              } else {
                let json: any = { col: columnIndex, row: rowIndex, styles: {} };
                json.styles[changeType] = reportChange;
                styleList.push(json);
              }
            } else {
              let json: any = { col: columnIndex, row: rowIndex, styles: {} };
              json.styles[changeType] = reportChange;
              styleList.push(json);
            }
            hotRef.current.hotInstance.getCellMeta(rowIndex, columnIndex).renderer =
              'cellStylesRenderer';
          }
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

    // 缩小保存数据大小
    // cells.forEach(c => c.prop = _.pick(c.prop as XAttribute, ['id', 'propId']));

    let json = {
      data: hot.getData(),
      setting: {
        mergeCells: hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells,
        cells: cells,
        styleList: styleList,
        classList: classList,
        customBorders: customBorders,
        row_h: row_h,
        col_w: col_w,
        grdatr: grdatr,
        floatRowsSetting: floatRowsInfos,
      },
    };

    sheetList[0].data = json;
    const newData = Object.assign({}, sheetList);
    current.metadata.reportDatas = JSON.stringify(newData);

    if (floatRowsInfos.length === 0) {
      let matchArray: string[] = [];
      cells.forEach((cell) => {
        current.metadata.attributes.forEach((attr) => {
          if (cell.prop.id === attr.id) {
            matchArray.push(attr.id);
          }
        });
      });
      current.metadata.attributes = current.metadata.attributes.filter((attr) => {
        return matchArray.includes(attr.id);
      });
    }
    await current.save();
    message.success('保存成功');
  };

  /** 点击单元格展示编辑属性 */
  const afterOnCellMouseDown = (event: any, coords: any) => {
    if (event) {
      let classJson = { styles: {}, class: {} };
      styleList?.forEach((item: any) => {
        if (item.row === coords.row && item.col === coords.col) {
          classJson.styles = item.styles;
        }
      });
      classList?.forEach((item: any) => {
        if (item.row === coords.row && item.col === coords.col) {
          classJson.class = item.class;
        }
      });
      const cellItem = cells.find(
        (it: any) => it.row === coords.row && it.col === coords.col,
      );
      if (cellItem) {
        selectRow(undefined);
        setSelectAttr(cellItem);
        selectCellItem(cellItem);
      } else {
        setSelectAttr(undefined);
      }
      for (var i = 0; i < floatRowsInfos.length; i++) {
        if (isPointInRange(coords, floatRowsInfos[i].mergeCells)) {
          selectRow(floatRowsInfos[i]);
          selectCellItem(undefined);
          return;
        }
      }
      handEcho(classJson);
    }
  };

  /** 更新单元格属性 */
  const updateCells = (prop: XAttribute, changedDatas: CellInfo[]) => {
    const hot = hotRef.current.hotInstance;
    hot.batch(() => {
      changedDatas.forEach((item: CellInfo) => {
        if (prop.id === item.prop.id) {
          item.prop = prop;
          Object.keys(prop.options!).map((key) => {
            switch (key) {
              case 'readOnly':
                hotRef.current.hotInstance.batch(() => {
                  hotRef.current.hotInstance.setCellMeta(
                    item.row,
                    item.col,
                    'readOnly',
                    prop.options![key],
                  );
                  hotRef.current.hotInstance.getCellMeta(item.row, item.col).renderer =
                    'customStylesRenderer';
                });
                break;
              case 'defaultValue':
                hotRef.current.hotInstance.setDataAtCell(
                  item.row,
                  item.col,
                  prop.options![key],
                );
                break;
              case 'max':
              case 'min':
                hotRef.current.hotInstance.setCellMeta(
                  item.row,
                  item.col,
                  'validator',
                  function (value: any, callback: any) {
                    setTimeout(() => {
                      if (
                        value >= (prop.options as any)['min'] &&
                        value <= (prop.options as any)['max']
                      ) {
                        callback(true);
                      } else {
                        callback(false);
                      }
                    }, 100);
                  },
                );
                break;
              default:
                break;
            }
          });

          /** 渲染单元格颜色 */
          const meta = hotRef.current.hotInstance.getCellMeta(item.row, item.col);
          setCellRender(meta, item);
        }
      });
    });

    setCells(changedDatas);
  };

  const updateFloatRow = async (floatRowsInfo: XFloatRowsInfo) => {
    if (floatRowsInfo.isFloatRows) {
      let tempCells: any[] = [];
      let subData: any[] = [];
      const results = await generateProperties(current, floatRowsInfo, tempCells);
      const fintAttr = current.metadata.attributes.find(
        (attribute) => attribute.code === floatRowsInfo.code,
      );
      if (!fintAttr) {
        const item: any = await current.createReportTemporaryAttribute({
          code: floatRowsInfo.code,
          isChangeSource: false,
          isChangeTarget: false,
          name: current.name + '.floatRow' + '-' + floatRowsInfo.code,
          remark: current.name + '.floatRow' + '-' + floatRowsInfo.code,
          valueType: '对象型',
        });
        const newItem: XAttribute = {
          propId: item.id,
          property: item,
          ...item,
          rule: '{}',
          options: {
            visible: true,
            isRequired: false,
          },
          formId: current.id,
          authId: orgAuth.SuperAuthId,
          widget: '对象型',
        };
        floatRowsInfo.id = newItem.id;
        current.metadata.attributes.push(newItem);
      }
      for (let i = 0; i < floatRowsInfo.rowsInfo.length; i++) {
        current.metadata.attributes.filter(
          (item) =>
            item.code !== floatRowsInfo.code + '-' + floatRowsInfo.rowsInfo[i].name,
        );
        const item: any = await current.createReportTemporaryAttribute({
          code: floatRowsInfo.code + '-' + floatRowsInfo.rowsInfo[i].name,
          isChangeSource: false,
          isChangeTarget: false,
          name:
            current.name +
            '.' +
            floatRowsInfo.code +
            '-' +
            floatRowsInfo.rowsInfo[i].name,
          remark:
            current.name +
            '.' +
            floatRowsInfo.code +
            '-' +
            floatRowsInfo.rowsInfo[i].name,
          valueType: floatRowsInfo.rowsInfo[i].type,
        });
        if (floatRowsInfo.rowsInfo[i].applicationData) {
          item.valueType = floatRowsInfo.rowsInfo[i].applicationData.valueType;
          item.speciesId = floatRowsInfo.rowsInfo[i].applicationData.speciesId;
        }
        const newItem: XAttribute = {
          propId: item.id,
          property: item,
          ...item,
          rule: '{}',
          options: {
            visible: true,
            isRequired: false,
          },
          formId: current.id,
          authId: orgAuth.SuperAuthId,
        };
        floatRowsInfo.rowsInfo[i].propId = item.id;
        current.metadata.attributes.push(newItem);
      }

      if (results) {
        results.arrs?.forEach((arr) => {
          current.metadata.attributes.push(arr);
          attrMap[arr.id] = arr;
        });
        tempCells = [...tempCells, ...results.cells];
        subData = [...subData, ...results.subData];
      }
      floatRowsInfo.subData = subData;
      floatRowsInfo.cells = tempCells;
      message.success(`批量生成成功`);
      setFloatRowsInfos([...floatRowsInfos, floatRowsInfo]);
    }
  };

  const whetherFloatRows = async (floatRowsInfo: XFloatRowsInfo) => {
    const hot = hotRef.current.hotInstance;
    const cellsRanges = getRanges(floatRowsInfo.mergeCells);
    if (!floatRowsInfo.isFloatRows) {
      setFloatRowsInfos(
        floatRowsInfos.filter((info) => info.coords !== floatRowsInfo.coords),
      );
      current.metadata.attributes = current.metadata.attributes.filter(
        (attr) => attr.options?.reportTemporaryCoord === floatRowsInfo.coords,
      );
      hot.batch(() => {
        cellsRanges.forEach((range) => {
          hotRef.current.hotInstance.getCellMeta(range[0], range[1]).readOnly = false;
          hotRef.current.hotInstance.getCellMeta(range[0], range[1]).renderer =
            'delStylesRenderer';
        });
      });
    } else {
      let infos = floatRowsInfos;
      let index = infos.findIndex((info) => info.coords === floatRowsInfo.coords);
      if (index != -1) {
        infos[index] = floatRowsInfo;
      } else {
        infos.push(floatRowsInfo);
      }
      setFloatRowsInfos(infos);
      hot.batch(() => {
        cellsRanges.forEach((range) => {
          hotRef.current.hotInstance.getCellMeta(range[0], range[1]).readOnly = true;
          hotRef.current.hotInstance.getCellMeta(range[0], range[1]).renderer =
            'floatRowsRenderer';
        });
      });
    }
  };

  /** 删除属性背景色 **/
  registerRenderer('delStylesRenderer', (hotInstance: any, TD: any, ...rest) => {
    textRenderer(hotInstance, TD, ...rest);
    TD.style.background = '#ffffff';
  });

  /** 渲染样式 **/
  registerRenderer('cellStylesRenderer', (hotInstance: any, TD: any, ...rest) => {
    textRenderer(hotInstance, TD, ...rest);
    const items = styleList.find((it: any) => it.row === rest[0] && it.col === rest[1]);
    const td: any = TD.style;
    if (items) {
      for (let key in items.styles) {
        if (key === 'paddingLeft') {
          td[key] = items.styles[key] + 'px';
        } else {
          td[key] = items.styles[key];
        }
      }
    }
  });

  /** 渲染浮动行背景色 **/
  registerRenderer('floatRowsRenderer', (hotInstance: any, TD: any, ...rest) => {
    textRenderer(hotInstance, TD, ...rest);
    TD.style.background = '#50B450';
  });

  /** 插入属性 */
  const setAttributes = (attribute: IProperty) => {
    const item = current.metadata.attributes.find(
      (it: any) => it.propId === attribute.id,
    )!;
    const selected = hotRef.current.hotInstance.getSelected() || [];
    for (let index = 0; index < selected.length; index += 1) {
      const [row1, column1, row2, column2] = selected[index];
      const startRow = Math.max(Math.min(row1, row2), 0);
      const endRow = Math.max(row1, row2);
      const startCol = Math.max(Math.min(column1, column2), 0);
      const endCol = Math.max(column1, column2);
      for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
        for (let columnIndex = startCol; columnIndex <= endCol; columnIndex += 1) {
          cells.push({ col: columnIndex, row: rowIndex, prop: item });
          hotRef.current.hotInstance.getCellMeta(rowIndex, columnIndex).renderer =
            'customStylesRenderer';
        }
      }
    }
  };

  /** 删除属性(支持批量） */
  const delSpeciality = () => {
    const selected = hotRef.current.hotInstance.getSelected() || [];
    let tempCells = [...cells];
    for (let index = 0; index < selected.length; index += 1) {
      const [row1, column1, row2, column2] = selected[index];
      const startRow = Math.max(Math.min(row1, row2), 0);
      const endRow = Math.max(row1, row2);
      const startCol = Math.max(Math.min(column1, column2), 0);
      const endCol = Math.max(column1, column2);
      for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
        for (let columnIndex = startCol; columnIndex <= endCol; columnIndex += 1) {
          let findItem = tempCells.find((item: any) => {
            return item.row === rowIndex && item.col === columnIndex;
          });
          //涉及到current.metadata.attributes的删除,会有同步的隐患。
          if (findItem) {
            current.metadata.attributes = current.metadata.attributes.filter(
              (item: any) => {
                return item.propId !== findItem!.prop.propId;
              },
            );
            tempCells = tempCells.filter((item: any) => {
              return !(item.row === rowIndex && item.col === columnIndex);
            });
            hotRef.current.hotInstance.getCellMeta(rowIndex, columnIndex).renderer =
              'delStylesRenderer';
          }
        }
      }
    }
    setCells(tempCells);
  };

  /** 插入报表属性(支持批量） */
  const insertCoordinateSpecialities = async () => {
    const selected = hotRef.current.hotInstance.getSelected() || [];
    let tempCells = [...cells];
    let hasPropertyArr = [];
    for (let index = 0; index < selected.length; index += 1) {
      const [row1, column1, row2, column2] = selected[index];
      const startRow = Math.max(Math.min(row1, row2), 0);
      const endRow = Math.max(row1, row2);
      const startCol = Math.max(Math.min(column1, column2), 0);
      const endCol = Math.max(column1, column2);
      for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
        for (let columnIndex = startCol; columnIndex <= endCol; columnIndex += 1) {
          //查到对应数据,则执行替换操作,否则新增
          let findItem = tempCells.find((item: any) => {
            return item.row === rowIndex && item.col === columnIndex;
          });
          const coord = numberToLetters(columnIndex + 1) + (rowIndex + 1);
          const item: any = await current.createReportTemporaryAttribute({
            code: coord,
            isChangeSource: false,
            isChangeTarget: false,
            name: current.name + '-' + coord,
            remark: current.name + '-' + coord,
            valueType: '报表型',
          });
          const newItem: XAttribute = {
            propId: item.id,
            property: item,
            ...item,
            rule: '{}',
            options: {
              visible: true,
              isRequired: false,
              reportTemporaryCoord: coord,
            },
            formId: current.id,
            authId: orgAuth.SuperAuthId,
            widget: '数字框',
          };
          //涉及到current.metadata.attributes的添加,会有同步的隐患。
          if (findItem) {
            // current.metadata.attributes = current.metadata.attributes.map((item: any) => {
            //   if(item.options?.reportTemporaryCoord === coord) {
            //     return newItem
            //   } else {
            //     return item
            //   }
            // });
            // tempCells = tempCells.map((item: any) => {
            //   if (item.row === rowIndex && item.col === columnIndex) {
            //     return { col: columnIndex, row: rowIndex, prop: newItem }
            //   } else {
            //     return item
            //   }
            // })
            hasPropertyArr.push(findItem);
            continue;
          } else {
            current.metadata.attributes.push(newItem);
            attrMap[newItem.id] = newItem;
            findItem = {
              col: columnIndex,
              row: rowIndex,
              prop: newItem,
            };
            tempCells.push(findItem);
          }
          const meta = hotRef.current.hotInstance.getCellMeta(rowIndex, columnIndex);
          setCellRender(meta, findItem);
        }
      }
    }
    setCells(tempCells);
    hasPropertyArr.length > 0 &&
      message.warning(`有${hasPropertyArr.length}个单元格已存在属性`);
  };

  const getMenu = () => {
    const menu = {
      row_above: {},
      row_below: {},
      col_left: {},
      col_right: {},
      make_read_only: {},
      alignment: {},
      mergeCells: {},
      insert_speciality: {
        name: '插入属性',
        callback: function () {
          setModalType('新增属性');
        },
      },
      insert_coordinate_speciality: {
        name: '插入报表属性',
        callback: function () {
          insertCoordinateSpecialities();
        },
      },
    };
    let delMenu = {};
    if (selectAttr != undefined) {
      delMenu = {
        del_speciality: {
          name: '删除属性',
          callback: function () {
            delSpeciality();
          },
        },
      };
    }
    const newMenu = Object.assign(menu, delMenu);
    return newMenu;
  };

  const afterSelectionEnd = (
    row: number,
    column: number,
    row2: number,
    column2: number,
    _selectionLayerLevel: number,
  ) => {
    if (row === row2 && column2 - column >= 1) {
      const hot = hotRef.current.hotInstance;
      const newRow = row + 1;
      let newColumn = column == -1 ? 0 : column;
      let arr: XRowsInfo[] = [];
      for (let i = 0; i < column2 + 1; i++) {
        if (i >= newColumn) {
          arr.push({
            name: numberToLetters(i + 1),
            index: i + 1,
            type: '数字框',
            isOnlyRead: false,
            propId: '',
          });
        }
      }
      let colWidths: any = [];
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
        floatRowNumber: 20,
        rowsInfo: arr,
        startColumn: newColumn,
        mergeCells: getSelected(hot.getSelectedLast()),
        colWidths: colWidths,
        cells: [],
        subData: [],
      };
      selectRow(floatRowsInfo);
      selectCellItem(undefined);
    } else {
      console.log('选中了多行或者没有选中任何行');
    }
  };

  return (
    <div className="report-form-viewer">
      <HotTable
        id="hot-container"
        ref={hotRef}
        formulas={{
          engine: hyperformulaInstance,
        }}
        customBorders={true}
        rowHeaders={true}
        colHeaders={true}
        autoColumnSize={true}
        manualColumnResize={true}
        manualRowResize={true}
        dropdownMenu={true}
        height="630px"
        language={zhCN.languageCode}
        persistentState={true}
        stretchH="all"
        multiColumnSorting={true}
        filters={true}
        manualRowMove={true}
        contextMenu={{
          items: getMenu(),
        }}
        outsideClickDeselects={false}
        licenseKey="non-commercial-and-evaluation" // for non-commercial use only
        afterOnCellMouseDown={afterOnCellMouseDown} //鼠标点击单元格边角后被调用
        afterSelectionEnd={afterSelectionEnd}
      />

      {modalType.includes('新增属性') && (
        <OpenFileDialog
          multiple
          title={`选择属性`}
          accepts={['属性']}
          rootKey={current.spaceKey}
          excludeIds={current.attributes.filter((i) => i.propId).map((a) => a.propId)}
          onCancel={() => setModalType('')}
          onOk={(files) => {
            (files as IProperty[]).forEach((item) => {
              current.metadata.attributes.push({
                propId: item.id,
                property: item.metadata,
                ...item.metadata,
                rule: '{}',
                options: {
                  visible: true,
                  isRequired: false,
                },
                formId: current.id,
                authId: orgAuth.SuperAuthId,
              });
              setAttributes(item);
            });
            setModalType('');
          }}
        />
      )}
    </div>
  );
};
export default HotTableView;
