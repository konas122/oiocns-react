import React from 'react';
import { command, model, parseAvatar } from '@/ts/base';
import { Column, IColumnProps } from 'devextreme-react/data-grid';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { generateUuid, isSnowflakeId } from '@/ts/base/common';
import { ellipsisText, formatDate } from '@/utils';
import { Button } from 'antd';
import { jsonParse } from '@/utils/tools';
import { XThing } from '@/ts/base/schema';

/** 使用form生成表单列 */
export const GenerateColumn = (
  field: model.FieldModel,
  dataIndex: 'attribute' | 'property' | undefined,
) => {
  const props: IColumnProps = {
    caption: field.name,
    fixedPosition: 'left',
    fixed: field.options?.fixed === true,
    visible: field.options?.visible === true,
    dataField: dataIndex === 'attribute' ? field.id : field.code,
  };
  const cellRender: any = {};
  switch (field.valueType) {
    case '时间型':
      props.dataType = 'datetime';
      props.width = 200;
      props.headerFilter = {
        groupInterval: 'day',
      };
      props.allowHeaderFiltering = false;
      props.format = 'yyyy年MM月dd日 HH:mm:ss';
      cellRender.calcText = (value: string) => {
        return formatDate(new Date(value), 'yyyy年MM月dd日 HH:mm:ss');
      };
      break;
    case '日期型':
      props.dataType = 'date';
      props.width = 180;
      props.headerFilter = {
        groupInterval: 'day',
      };
      props.allowHeaderFiltering = false;
      props.format = 'yyyy年MM月dd日';
      cellRender.calcText = (value: string) => {
        return formatDate(new Date(value), 'yyyy年MM月dd日');
      };
      break;
    case '选择型':
    case '分类型':
      props.width = 200;
      props.headerFilter = {
        search: {
          enabled: true,
        },
        dataSource: field.lookups,
      };
      props.lookup = {
        dataSource: field.lookups,
        displayExpr: 'text',
        valueExpr: 'value',
      };
      cellRender.calcText = (value: string) => {
        return (field.lookups || []).find((i) => i.value === value)?.text || value;
      };
      break;
    case '引用型':
      props.dataType = 'string';
      props.width = 200;
      props.allowHeaderFiltering = false;
      cellRender.render = (data: any) => {
        const arrData = jsonParse(data.value, data.value);
        if (arrData?.length) {
          return arrData.map((item: XThing, i: number) => {
            return (
              <Button
                type="link"
                key={i}
                title={item.text}
                onClick={async () => {
                  command.emitter(
                    'executor',
                    'open',
                    { ...item, typeName: field.valueType, key: item.id },
                    'preview',
                  );
                }}>
                {ellipsisText(item.text || '-', 10)}
              </Button>
            );
          });
        }
        return '';
      };
      break;
    case '数值型':
    case '货币型':
      props.dataType = 'number';
      props.width = 150;
      props.allowHeaderFiltering = false;
      props.fixed = field.id === 'id';
      break;
    case '用户型':
      props.dataType = 'string';
      props.width = 150;
      props.allowFiltering = true;
      cellRender.render = (data: any) => {
        if (data.value) {
          const ids = Array.isArray(data.value) ? data.value : [data.value];
          return (
            <div style={{display: 'flex', flexWrap: 'wrap', flexDirection: 'row', gap: 2}}>
              {ids.map((id: string) => {
                if (isSnowflakeId(id)) {
                  return <EntityIcon entityId={id} size={14} showName />;
                }
                return <p>{id}</p>;
              })}
            </div>
          );
        }
        return <></>;
      };
      break;
    case '附件型':
      props.dataType = 'string';
      props.width = 150;
      props.allowFiltering = false;
      cellRender.render = (data: any) => {
        const shares = parseAvatar(data.value);
        if (shares) {
          return shares.map((share: model.FileItemShare, i: number) => {
            return (
              <Button
                type="link"
                key={i}
                title={share.name}
                onClick={() => {
                  command.emitter('executor', 'open', share, 'preview');
                }}>
                {ellipsisText(share.name, 10)}
              </Button>
            );
          });
        }
        return '';
      };
      break;
    default:
      props.dataType = 'string';
      props.width = 180;
      props.allowHeaderFiltering = false;
      break;
  }
  if (cellRender.render) {
    props.cellRender = cellRender.render;
  }
  return <Column key={generateUuid()} {...props} />;
};
