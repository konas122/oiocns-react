import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IDirectory, IForm } from '@/ts/core';
import { model, schema } from '@/ts/base';
import { Form } from '@/ts/core/thing/standard/form';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.min.css';
import { zhCN } from 'handsontable/i18n';
import {
  CellInfo,
  ReportInfo,
  ReportSettingInfo,
  XFloatRowsInfo,
} from '@/components/DataStandard/ReportForm/types';
import { CellSettings } from 'handsontable/settings';
import { refreshFormData, updataCells } from '@/components/DataStandard/ReportForm/Utils';
import { XAttribute } from '@/ts/base/schema';
import { floatRowsData, XRowsInfo } from '@/components/DataStandard/ReportForm/types';

interface ViewContentType {
  form: schema.XForm;
  directory: IDirectory;
  readonly: boolean;
  node: schema.XReportTreeNode | undefined;
  height: string;
  onCellClick: (attributes: { id: string; name: string }) => void;
}
const ReportViewer: React.FC<ViewContentType> = ({
  form,
  directory,
  readonly,
  node,
  height,
  onCellClick,
}) => {
  const metaForm: IForm = new Form(form, directory);

  const attrMap = useMemo(() => {
    return metaForm.attributes.reduce<Dictionary<XAttribute>>((a, v) => {
      a[v.id] = v;
      return a;
    }, {});
  }, [metaForm]);

  const hotRef = useRef<{ hotInstance: Handsontable }>(null!);
  const [floatRowsData, setFloatRowsData] = useState<floatRowsData | undefined>(
    undefined,
  );
  const [formData, setFormData] = useState<any>([]);
  const [_ready, setReady] = useState(false);
  const [setting, setSetting] = useState<ReportSettingInfo | undefined>(undefined);

  useEffect(() => {
    const sheetListData = JSON.parse(metaForm.metadata.reportDatas ?? {});
    const selectItem = Object.values(sheetListData)[0] as ReportInfo;
    if (selectItem) {
      const setting = selectItem.data?.setting || {};
      const datas = selectItem.data?.data || [[]];
      setSetting(setting);
      updateHot(setting, datas, setting.floatRowsSetting || []);
    }
  }, [node]);

  const getReportData = async () => {
    const loadOptions: any = {};
    loadOptions.filter = metaForm.parseFilter(loadOptions.filter);
    const classify = metaForm.parseClassify();
    if (loadOptions.filter.length == 0 && Object.keys(classify).length == 0) {
      return { data: [], totalCount: 0 };
    }
    loadOptions.userData = [];
    if (node) {
      for (let i = 0; i < loadOptions.filter.length; i++) {
        if (
          Array.isArray(loadOptions.filter[i]) &&
          loadOptions.filter[i][0] === 'belongId'
        ) {
          loadOptions.filter[i][2] = node?.targetId;
        }
      }
    }
    try {
      return await metaForm.loadThing(loadOptions);
    } catch (error) {
      return { data: [], totalCount: 0 };
    }
  };

  const updateHot = async (
    setting: ReportSettingInfo,
    data: any[][],
    floatRowsSetting: XFloatRowsInfo[],
  ) => {
    const hot = hotRef.current.hotInstance;
    const fields = await metaForm.loadFields();
    const result = updataCells(setting, data, attrMap, fields, true, null);
    const cells: CellSettings[] = result.cells;
    data = result.data;

    floatRowsSetting.forEach((infos) => {
      if (infos.isFloatRows) {
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
      data,
      minCols: setting.col_w.length,
      minRows: setting.row_h.length,
      mergeCells: setting.mergeCells || [],
      rowHeights: setting.row_h,
    });
    const reportData = await getReportData();
    setFormData(reportData.data);
    let formData: any = {
      after: [],
    };
    const nawData: any = {};
    for (let key in reportData.data[0]) {
      if (key.startsWith('T')) {
        const newKey = key.substring(1);
        nawData[newKey] = reportData.data[0][key];
      } else {
        nawData[key] = reportData.data[0][key];
      }
    }
    formData.after.push(nawData);

    const changes = await refreshFormData(
      formData,
      attrMap,
      setting?.cells || [],
      'primary',
    );

    hot.batch(() => {
      for (const change of changes) {
        hot.setDataAtCell(...change);
      }
    });

    hot.updateSettings({
      cell: cells,
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

  useEffect(() => {
    if (floatRowsData) {
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
    }
  }, [floatRowsData]);

  const customRenderer = async (
    instance: Handsontable.Core,
    TD: HTMLTableCellElement,
    _row: number,
    _col: number,
    _prop: string | number,
    value: any,
    cellProperties: Handsontable.CellProperties,
  ) => {
    const floatSetting = cellProperties.floatSetting;
    const colWidths = [];
    for (
      var col = floatSetting.startColumn;
      col < floatSetting.floatRowNumber + floatSetting.startColumn;
      col++
    ) {
      var width = instance.getColWidth(col);
      colWidths.push(width);
    }
    TD.style.padding = '0';
    let fields = await metaForm.loadFields();
    while (TD.firstChild) {
      TD.removeChild(TD.firstChild);
    }
    // 如果value不是一个Handsontable实例，则创建一个新的
    if (!cellProperties.subTableInstance && floatRowsData) {
      let floatSet = floatRowsData[floatSetting.id];
      let subData: any[] = floatSet.data;
      let tableData: any[] = [];
      let currentPage: number = floatSet.currentPage || 1;
      let limit: number = floatSet.limit;
      let pageNum: number = Math.ceil(subData.length / limit) || 1;

      const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;
        return subData.slice(startIndex, endIndex);
      };
      const prop = fields.filter((field: model.FieldModel) => {
        return field.info == floatSetting.code;
      });
      if (formData.length > 0) {
        subData = prop.length > 0 ? formData[0][prop[0].propId] : floatSetting.subData;
        subData.forEach((data) => {
          for (let key in data) {
            if (key.startsWith('T')) {
              const newKey = key.substring(1);
              data[newKey] = data[key];
            }
          }
        });
        tableData = getCurrentPageData();
        currentPage = 1;
        pageNum = Math.ceil(subData.length / limit) || 1;
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

      let paginationContainer = document.createElement('div');
      paginationContainer.id = 'paginationContainer';
      paginationContainer.style.display = 'flex';
      paginationContainer.style.flexWrap = 'nowrap';

      let prevButton = document.createElement('button');
      prevButton.textContent = '上一页';
      prevButton.className = 'ogo-btn ogo-btn-default ogo-btn-sm';
      prevButton.style.marginRight = '8px';
      prevButton.onclick = prevPage;

      let nextButton = document.createElement('button');
      nextButton.textContent = '下一页';
      nextButton.className = 'ogo-btn ogo-btn-default ogo-btn-sm';
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
        readOnly: true,
        columns: columns,
        width: '100%',
        stretchH: 'all',
        licenseKey: 'non-commercial-and-evaluation',
      });

      const adjustColumnWidths = () => {
        const containerWidth = document.getElementById('hot-container')?.offsetWidth || 0;
        const columnCount = value.countCols();
        const minColumnWidth = 50;
        const totalMinWidth = minColumnWidth * columnCount;

        if (totalMinWidth <= containerWidth) {
          value.updateSettings({
            colWidths: Array.from({ length: columnCount }, () => minColumnWidth),
          });
        } else {
          let newColWidth = Math.floor((containerWidth - 120) / columnCount);
          newColWidth = Math.max(newColWidth, minColumnWidth);
          value.updateSettings({
            colWidths: Array.from({ length: columnCount }, () => newColWidth),
          });
        }
      };

      adjustColumnWidths();

      cellProperties.subTable = {
        instance: value,
      };
    }
  };
  const handleCellClick = (
    event: any,
    coords: { row: number; col: number },
    cellList: CellInfo[],
    onCellClick: (attributes: { id: string; name: string }) => void,
  ) => {
    if (event) {
      event.preventDefault();
    }
    const { row, col } = coords;
    const cellInfo = cellList.find(
      (cell: CellInfo) => cell.row === row && cell.col === col,
    );

    if (cellInfo) {
      const { prop } = cellInfo;
      onCellClick({
        id: prop.id,
        name: prop.name,
      });
    }
  };

  return (
    <HotTable
      ref={hotRef as any}
      readOnly={readonly}
      customBorders={true}
      rowHeaders={true}
      colHeaders={true}
      manualColumnResize={true}
      manualRowResize={true}
      height={height ?? '100%'}
      language={zhCN.languageCode}
      persistentState={true}
      stretchH="all"
      outsideClickDeselects={false}
      renderAllRows={true}
      licenseKey="non-commercial-and-evaluation"
      afterOnCellMouseDown={(event, coords) =>
        handleCellClick(event, coords, setting?.cells || [], onCellClick)
      }
    />
  );
};

export default ReportViewer;
