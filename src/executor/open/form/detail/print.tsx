/* eslint-disable no-case-declarations */
import React from 'react';
import { Button } from 'antd';
import QrCode from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';
import { model } from '@/ts/base';
import { schema } from '@/ts/base';
import { ValueType } from '@/ts/core/public/enums';
import orgCtrl from '@/ts/controller';
import FullScreenModal from '@/components/Common/fullScreen';

interface Iprops {
  things: schema.XThing[];
  printConfig: { [key: string]: string }; // 打印模板配置
  qrcodeConfig: { label: string; value: string; type: string }[]; // 二维码配置
  fields: model.FieldModel[];
  type: 'multiple' | 'single';
  finished: () => void;
}

/**
 * 物-打印
 * @returns
 */
let vdom: any = null;

const unitLevelList = [
  { id: 1, name: '居左', value: 'left' },
  { id: 2, name: '居中', value: 'center' },
  { id: 3, name: '居右', value: 'right' },
];

const ThingPrint: React.FC<Iprops> = ({
  things,
  printConfig,
  qrcodeConfig,
  fields,
  finished,
  type,
}) => {
  /** 打印之前 */
  const handleBefore = () => {
    const box = document.createElement('div');
    let printStr = '';
    let card = [];
    card = things.map((thing) => {
      return qrcodeConfig.map((i) => {
        let res = type === 'multiple' ? thing[i.value] : thing['T' + i.value];
        let data = '';
        if (res) {
          data = fieldMapping(i, res);
        }
        return { field: i.label, value: data, id: qrcodeValue(thing) };
      });
    });
    card.forEach((templates) => {
      let dataStr = '';
      templates.forEach((item) => {
        dataStr += `
            <p class="u-datas">
              <span class="u-spans" style="font-size:${printConfig.fontSize}px">${item.field}：${item.value}</span>
            </p>
          `;
      });
      printStr += `
          <div
            class="m-modals"
            style="
              page-break-inside: avoid;
              height:${Math.floor((Number(printConfig.height) / 25.4) * 105) - 2}px;
              width:${(Number(printConfig.width) / 25.4) * 110}px;
            "
          >
            <div style="
              height:${Math.floor((Number(printConfig.leaveNote) / 25.4) * 105) - 2}px;
              width:100%;
            "></div>
            <div class="u-imgPositions"
              style="
              height:${
                Math.floor((Number(printConfig.height) / 25.4) * 105) -
                2 -
                (Math.floor((Number(printConfig.leaveNote) / 25.4) * 105) - 2)
              }px;
              width:100%;
            ">
              <div class="u-top">
                <div class="u-QRcodes">
                  <div class="u-imgs">
                    <img
                      src=${
                        document
                          ?.querySelector(`#qrcode${templates[0].id}`)
                          ?.toDataURL('image/png') || null
                      }
                    />
                  </div>
                </div>
                <div class="u-selectLists">
                  ${dataStr}
                </div>
              </div>
              <div style="
                font-size: ${Number(printConfig.fontSize) + 3}px;
                display: flex;
                justify-content:${
                  printConfig.qrcodeCompanyName !== undefined
                    ? unitLevelList[Number(printConfig.unitLevel) - 1].value
                    : ''
                };
              ">
                ${
                  orgCtrl.user.companys.find(
                    (i) => i.id === printConfig.qrcodeCompanyName,
                  )?.name || ''
                }
              </div>
            </div>
        </div>
      `;
    });

    box.innerHTML = printStr;
    vdom = box;
  };

  /** 执行打印程序 */
  const handlePrint = useReactToPrint({
    onBeforeGetContent: handleBefore,
    content: () => vdom,
  });

  /** 字段映射 */
  const fieldMapping = (
    config: { label: string; value: string; type: string },
    item: string,
  ) => {
    switch (config.type) {
      case ValueType.Remark:
      case ValueType.Number:
        return item || '--';
      case '':
      case ValueType.File:
      case ValueType.Reference:
      case ValueType.Object:
        return '--';
      case ValueType.Date:
        return dayjs(item).format('YYYY-MM-DD') || '--';
      case ValueType.Time:
        return dayjs(item).format('HH:mm:ss') || '--';
      case ValueType.Species:
      case ValueType.Select:
        const curField = fields.find((field) => field.id === config.value);
        if (curField) {
          return curField.lookups?.find((itea) => itea.value === item)?.text || '--';
        } else {
          return '--';
        }
      case ValueType.Target:
        return orgCtrl.user.findShareById(item).name || '--';
      default:
        return '--';
    }
  };

  /** 二维码绑定字段设置 */
  const qrcodeValue = (thing: schema.XThing): string | undefined => {
    if (printConfig?.qrcodeSource === 'id') {
      return thing[printConfig?.qrcodeSource];
    }
    if (type === 'multiple') {
      return thing[printConfig?.qrcodeSource];
    }
    if (type === 'single') {
      return thing['T' + printConfig?.qrcodeSource];
    }
    return undefined;
  };

  return (
    <FullScreenModal
      open
      title={'标签打印'}
      width={'360px'}
      bodyHeight={'80px'}
      footer={
        <Button
          type="primary"
          onClick={() => {
            handlePrint();
            finished();
          }}>
          打印
        </Button>
      }
      onCancel={() => finished()}>
      是否确认打印选择的资产？
      {things.map((thing) => {
        const value = qrcodeValue(thing);
        return (
          <QrCode
            key={thing.id}
            value={`https://asset.orginone.cn/${value}`}
            id={`qrcode${value}`}
            style={{ display: 'none' }}
            size={Number(printConfig?.qrcodeSize)}
          />
        );
      })}
    </FullScreenModal>
  );
};
export default ThingPrint;
