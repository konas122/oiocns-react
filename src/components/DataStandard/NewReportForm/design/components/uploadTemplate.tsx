import * as el from '@/utils/excel';
import { message, Space, Spin, Upload } from 'antd';
import React, { useState } from 'react';
import { Workbook } from 'exceljs';
import { parseRanges, convertARGBToCSSColor, capitalizeFirstLetter } from './../../Utils';
import { ReportSettingInfo } from '../../types';

async function nextTick() {
  return new Promise<void>((s, e) => {
    setTimeout(() => {
      s();
    }, 50);
  });
}

interface IProps {
  templateName: string;
  excel: el.IExcel;
  finished: (data: any) => void;
}

export const Uploader: React.FC<IProps> = ({ excel, finished }) => {
  const [loading, setLoading] = useState(false);

  const readXlsx = (file: Blob, _excel: el.IExcel): Promise<Workbook | null> => {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = new Workbook();
          await workbook.xlsx.load(e.target?.result as ArrayBuffer);
          resolve(workbook);
        } catch (error) {
          console.error('read xlsx errors: ', error);
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
      reader.onerror = (error) => {
        reject(new Error('Failed to read file: ' + error.toString()));
      };
    });
  };

  const convertStyle = (workSheet: any) => {
    const col_w: number[] = workSheet.cols.map((item: { width: number }) =>
      Math.floor(item.width),
    );
    const row_h: number[] = workSheet.rows.map((item: { height: number }) =>
      Math.floor(item.height),
    );
    const mergeCells = parseRanges(workSheet.merges);
    let styleList: any[] = [],
      classList: any[] = [],
      datas: any[] = [];
    workSheet.rows.forEach((row: any, rowIndex: number) => {
      let data: any[] = [];
      row.cells.forEach((cell: any, cellIndex: number) => {
        let styleJson: any = {
          row: rowIndex,
          col: cellIndex,
          styles: {
            fontSize: cell.style.font.size + 'px',
            fontFamily: cell.style.font.name,
            fontWeight: cell.style.font.bold ? 'bold' : 0,
          },
        };
        if (cell.style.font.color?.argb) {
          styleJson.styles.color = convertARGBToCSSColor(
            cell.style.font.color.argb,
            true,
          );
        }
        // if (Object.keys(cell.style.border).length > 0) {
        //   const borderCss = converBorder(cell.style.border);
        //   styleJson.styles = { ...styleJson.styles, ...borderCss };
        // }
        let classJson = {
          row: rowIndex,
          col: cellIndex,
          class: {
            horizontal: 'ht' + capitalizeFirstLetter(cell.style.alignment.horizontal),
            vertical: 'ht' + capitalizeFirstLetter(cell.style.alignment.vertical),
          },
        };
        styleList.push(styleJson);
        classList.push(classJson);
        data.push(cell.value ?? '');
      });

      datas.push(data);
    });
    const reportInfo: ReportSettingInfo = {
      row_h,
      col_w,
      mergeCells,
      styleList,
      classList,
      datas,
    };
    finished(reportInfo);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Spin spinning={loading}>
        <Upload
          type={'drag'}
          showUploadList={false}
          accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          style={{ width: '100%', height: 240, marginTop: 20 }}
          customRequest={async (options) => {
            setLoading(true);
            await nextTick();
            try {
              const workbook = await readXlsx(options.file as Blob, excel);
              convertStyle(workbook?.model.worksheets[0]);
              message.success('导入成功');
            } catch (error: any) {
              message.error('导入失败：' + error);
            } finally {
              setLoading(false);
            }
          }}>
          <div style={{ color: 'limegreen', fontSize: 22 }}>点击或拖拽至此处上传</div>
        </Upload>
      </Spin>
    </Space>
  );
};
