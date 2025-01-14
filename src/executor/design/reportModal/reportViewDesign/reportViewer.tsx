import { model, schema } from '@/ts/base';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.min.css';
import { registerLanguageDictionary, zhCN } from 'handsontable/i18n';
import { registerAllModules } from 'handsontable/registry';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CellInfo,
  ReportInfo,
  ReportSettingInfo,
  XFloatRowsInfo,
  XRowsInfo,
  floatRowsData,
} from '@/components/DataStandard/ReportForm/types';
import { XAttribute } from '@/ts/base/schema';
import { Form } from '@/ts/core/thing/standard/form';
import { IView } from '@/ts/core';
registerLanguageDictionary(zhCN);
registerAllModules();

import '@/components/DataStandard/ReportForm/register';

const ReportViewer: React.FC<{
  current: IView;
  allowEdit: boolean;
  form: schema.XForm;
  info?: model.FormInfo;
  readonly?: boolean;
  showTitle?: boolean;
  formData?: model.FormEditData;
  activeTabKey?: string;
  height?: string;
}> = (props) => {
  const hotRef = useRef<{ hotInstance: Handsontable }>(null!);
  const [floatRowsData, setFloatRowsData] = useState<floatRowsData | undefined>(
    undefined,
  );
  let metaForm = new Form(props.form, props.current.directory);
  const attrMap = useMemo(() => {
    return metaForm.attributes.reduce<Dictionary<XAttribute>>((a, v) => {
      a[v.id] = v;
      return a;
    }, {});
  }, [metaForm]);

  useEffect(() => {
    const sheetListData: any = JSON.parse(metaForm.metadata.reportDatas ?? '{}');
    const selectItem = Object.values(sheetListData)[0] as ReportInfo;
    const setting = selectItem?.data?.setting || {};
    const datas = selectItem?.data?.data || [[]];
    updateHot(setting, datas, setting.floatRowsSetting || []);
  }, []);

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

  const updateHot = async (
    setting: ReportSettingInfo,
    data: any[][],
    floatRowsSetting: XFloatRowsInfo[],
  ) => {
    const hot = hotRef.current.hotInstance;

    floatRowsSetting?.forEach((infos) => {
      if (infos.isFloatRows && infos.id) {
        const mergeCells = infos.mergeCells;
        setting.mergeCells?.push({
          row: mergeCells.xMin,
          col: mergeCells.yMin,
          rowspan: 1,
          colspan:
            mergeCells.yMin > 0
              ? mergeCells.yMax - mergeCells.yMin + 1
              : mergeCells.yMax + 1,
          removed: false,
        });
      }
    });

    hot.updateSettings({
      // cell: cells,
      data,
      minCols: setting.col_w.length,
      minRows: setting.row_h.length,
      mergeCells: setting.mergeCells || [],
      rowHeights: setting.row_h,
      colWidths: setting.col_w,
    });

    // setting.styleList?.forEach((item: any) => {
    //   hotRef.current.hotInstance.getCellMeta(item.row, item.col).renderer =
    //     'cellStylesRenderer';
    // });

    setting.classList?.forEach((item: any) => {
      let arr = [];
      for (let k in item.class) {
        arr.push(item.class[k]);
      }
      hot.setCellMeta(item.row, item.col, 'className', arr.join(' '));
    });

    const floatRowsData = floatRowsSetting.reduce((acc: any, item: any) => {
      if (item.id) {
        acc[item.id] = {
          data: [],
          currentPage: 1,
          limit: 10,
          pageNum: 1,
        };
      }
      return acc;
    }, {});

    setFloatRowsData(floatRowsData);

    hot.batch(() => {
      setting?.cells?.forEach((item: CellInfo) => {
        if (!item.isFloatRow) {
          const meta = hot.getCellMeta(item.row, item.col);
          setCellRender(meta, item);
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

  useEffect(() => {
    const hot = hotRef.current.hotInstance;
    const sheetListData: any = JSON.parse(metaForm.metadata?.reportDatas);
    const selectItem = Object.values(sheetListData)[0] as ReportInfo;
    const setting = selectItem?.data?.setting || {};
    const floatRowsSetting = setting.floatRowsSetting || [];
    hot.batch(() => {
      floatRowsSetting.forEach((infos: XFloatRowsInfo) => {
        if (infos.isFloatRows && infos.id) {
          const mergeCells = infos.mergeCells;
          hot.getCellMeta(mergeCells.xMin, mergeCells.yMin).floatSetting = infos;
          hot.getCellMeta(mergeCells.xMin, mergeCells.yMin).renderer = customRenderer;
        }
      });
    });
  }, [floatRowsData]);

  const customRenderer = async (
    _instance: Handsontable.Core,
    TD: HTMLTableCellElement,
    _row: number,
    _col: number,
    _prop: string | number,
    value: any,
    cellProperties: Handsontable.CellProperties,
  ) => {
    const floatSetting = cellProperties.floatSetting;
    TD.style.padding = '0';
    while (TD.firstChild) {
      TD.removeChild(TD.firstChild);
    }
    // 如果value不是一个Handsontable实例，则创建一个新的
    if (!cellProperties.subTableInstance && floatRowsData) {
      let floatSet = floatRowsData[floatSetting.id];
      let subData: any[] = floatSet.data; // 表格数据
      let tableData: any[] = []; // 展示数据
      let currentPage: number = floatSet.currentPage || 1;
      let limit: number = floatSet.limit;
      let pageNum: number = Math.ceil(subData.length / limit) || 1;

      const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;
        return subData.slice(startIndex, endIndex);
      };
      for (var i = 0; i < 10; i++) {
        let json: any = {};
        floatSetting.rowsInfo.forEach((info: XRowsInfo) => {
          if (info.isLineNumber) {
            json[info.propId] = i + 1;
          } else if (info.type === '引用型') {
            json[info.propId] = '';
            json[info.propId + '_code'] = '';
          } else {
            json[info.propId] = '';
          }
        });
        tableData.push(json);
        subData.push(json);
      }
      const columns: any[] = [];
      floatSetting.rowsInfo.forEach((info: XRowsInfo) => {
        columns.push({
          data: info.propId,
          readOnly: info.isOnlyRead,
          renderer: 'customStylesRenderer',
        });
      });

      const prevPage = () => {
        if (currentPage > 1) {
          currentPage--;
          currentPageSpan.textContent = currentPage + '/' + pageNum;
          const data = getCurrentPageData();
          value.updateSettings({
            data: data,
          });
        }
      };

      const nextPage = () => {
        if (currentPage < pageNum) {
          currentPage++;
          currentPageSpan.textContent = currentPage + '/' + pageNum;
          const data = getCurrentPageData();
          value.updateSettings({
            data: data,
          });
        }
      };

      let subContainer = document.createElement('div');
      subContainer.style.width = '100%';
      subContainer.style.height = '235px';
      subContainer.style.overflowY = 'auto';

      // 创建分页控件的容器
      let paginationContainer = document.createElement('div');
      paginationContainer.id = 'paginationContainer';
      paginationContainer.style.display = 'flex';
      paginationContainer.style.flexWrap = 'nowrap';
      // paginationContainer.style.justifyContent = 'flex-end';

      let prevButton = document.createElement('button');
      prevButton.textContent = '上一页';
      prevButton.className = 'ogo-btn ogo-btn-primary ogo-btn-sm';
      prevButton.style.marginRight = '8px';
      prevButton.onclick = prevPage;

      let nextButton = document.createElement('button');
      nextButton.textContent = '下一页';
      nextButton.className = 'ogo-btn ogo-btn-primary ogo-btn-sm';
      nextButton.style.marginRight = '8px';
      nextButton.onclick = nextPage;

      let currentPageSpan = document.createElement('span');
      currentPageSpan.id = 'currentPage';
      currentPageSpan.textContent = currentPage + '/' + pageNum;
      currentPageSpan.style.marginRight = '8px';
      let currentPageParagraph = document.createElement('p');
      currentPageParagraph.textContent = '当前页: ';
      currentPageParagraph.appendChild(currentPageSpan);

      paginationContainer.appendChild(currentPageParagraph);
      paginationContainer.appendChild(prevButton);
      paginationContainer.appendChild(nextButton);
      TD.appendChild(subContainer);
      TD.appendChild(paginationContainer);

      value = new Handsontable(subContainer, {
        data: tableData,
        readOnly: props.readonly,
        columns: columns,
        width: '100%',
        stretchH: 'all',
        colWidths: floatSetting.colWidths,
        licenseKey: 'non-commercial-and-evaluation',
      });

      cellProperties.subTable = {
        instance: value,
      };
    }
  };

  return (
    <div className="report-form-viewer">
      <HotTable
        id="hot-container"
        ref={hotRef as any}
        readOnly={true}
        customBorders={true}
        rowHeaders={true}
        colHeaders={true}
        manualColumnResize={true}
        manualRowResize={true}
        height={props?.height ?? '100%'}
        language={zhCN.languageCode}
        persistentState={true}
        stretchH="all"
        outsideClickDeselects={false}
        renderAllRows={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ReportViewer;
