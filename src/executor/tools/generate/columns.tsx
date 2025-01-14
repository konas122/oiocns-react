import React from 'react';
import { command, model, parseAvatar, schema } from '../../../ts/base';
import { Column, IColumnProps } from 'devextreme-react/data-grid';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { equals, generateUuid, isSnowflakeId } from '@/ts/base/common';
import { ellipsisText, formatDate, formatNumber } from '@/utils';
import { Button } from 'antd';
import { jsonParse } from '@/utils/tools';
import { XThing } from '@/ts/base/schema';

/** 构建分类型路径 */
const buildPath = (result: { [key: string]: model.FiledLookup }, value?: string) => {
  if (value) {
    let first = result[value];
    let str = first?.text;
    while (first?.parentId) {
      const parent = result[first.parentId];
      if (parent) {
        str = parent.text + '/' + str;
        first = parent;
      } else {
        break;
      }
    }
    return str;
  }
};

/** 使用form生成表单列 */
export const GenerateColumn = (
  field: model.FieldModel,
  beforeSource: schema.XThing[] | undefined,
  dataIndex: 'attribute' | 'property' | undefined,
) => {
  const props: IColumnProps = {
    caption: field.name,
    fixedPosition: 'left',
    fixed: field.options?.fixed === true,
    visible: field.options?.visible === true,
    dataField: dataIndex === 'attribute' ? field.id : field.code,
    sortOrder: field.options?.sortOrder,
  };
  const cellRender: any = {};
  props.width = field.options?.defaultWidth || 180;
  switch (field.valueType) {
    case '时间型':
      props.dataType = 'datetime';
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
    case '分类型': {
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
      let result = (field.lookups ?? []).reduce((p, n) => {
        p[n.id] = n;
        p[n.value] = n;
        return p;
      }, {} as { [key: string]: model.FiledLookup });
      cellRender.render = (data: any) => {
        if (Array.isArray(data.value)) {
          var texts: string[] = [];
          for (var val of data.value) {
            texts.push((field.lookups || []).find((i) => i.value === val)?.text || val);
          }
          return texts.join(' , ');
        } else {
          return buildPath(result, data.value) || data.value;
        }
      };
      break;
    }
    case '引用型':
      props.dataType = 'string';
      props.allowHeaderFiltering = false;
      cellRender.render = (data: any) => {
        const arrData = jsonParse(data.value, data.value);
        if (arrData?.length && Array.isArray(arrData)) {
          return arrData.map((item: XThing, i: number) => {
            return (
              <Button
                type="link"
                key={i}
                title={item?.text}
                onClick={async () => {
                  command.emitter(
                    'executor',
                    'open',
                    { ...item, typeName: field.valueType, key: item?.id },
                    'preview',
                  );
                }}>
                {ellipsisText(item?.text || '-', 10)}
              </Button>
            );
          });
        }
        return arrData ?? '';
      };
      break;
    case '数值型':
      props.dataType = 'number';
      cellRender.render = (data: any) => {
        if (
          data.value !== undefined &&
          data.value !== null &&
          field.opitons?.accuracy !== null &&
          field.options?.accuracy !== undefined
        ) {
          const formattedValue = Number(data.value);
          return formatNumber(formattedValue, field.options.accuracy);
        }
        return formatNumber(data.value, 2);
      };
      break;
    case '货币型':
      props.dataType = 'number';
      props.allowHeaderFiltering = false;
      props.fixed = field.id === 'id';
      break;
    case '用户型':
      props.dataType = 'string';
      cellRender.render = (data: any) => {
        if (data.value) {
          const ids = Array.isArray(data.value) ? data.value : [data.value];
          return (
            <div
              style={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'row', gap: 2 }}>
              {ids.map((id: string) => {
                if (isSnowflakeId(id)) {
                  return (
                    <EntityIcon
                      key={id}
                      entityId={id}
                      size={14}
                      showName
                      showCode={field.options?.showCode ?? false}
                    />
                  );
                }
                return <p key={id}>{id}</p>;
              })}
            </div>
          );
        }
        return <></>;
      };
      break;
    case '附件型':
      props.dataType = 'string';
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
    case '办事流程':
      props.dataType = 'string';
      props.allowFiltering = false;
      cellRender.render = (data: any) => {
        if (!data.value) return <></>;
        return <EntityIcon entityId={data.value} typeName="办事" showName />;
      };
      break;
    default:
      props.dataType = 'string';
      props.allowHeaderFiltering = false;
      if (field.widget === '超链接框') {
        cellRender.render = (data: any) => {
          return (
            <a href={data.value} target="_blank" rel="noreferrer">
              {data.value}
            </a>
          );
        };
      }
      break;
  }
  if (beforeSource && beforeSource.length > 0) {
    props.cellRender = (data: any) => {
      const text = cellRender.render ? cellRender.render(data) : data.text;
      if (data?.data?.id && data?.column?.dataField) {
        const before = beforeSource.find((i) => i.id === data.data.id);
        if (before) {
          const beforeValue = before[data.column.dataField];
          if (!equals(beforeValue, data.value)) {
            let beforeText = <></>;
            switch (field.valueType) {
              case '日期型':
              case '时间型':
                beforeText = cellRender.calcText
                  ? cellRender.calcText(beforeValue)
                  : beforeValue;
                break;
              case '用户型':
              default:
                beforeText = cellRender.render
                  ? cellRender.render({ value: beforeValue })
                  : beforeValue;
                break;
            }
            return (
              <span
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  flexDirection: 'row',
                  gap: 2,
                }}>
                <span style={{ marginRight: 6 }}>{beforeText}</span>
                <a>{!data.text ? '（置空）' : text}</a>
              </span>
            );
          }
        }
      }
      return text;
    };
  } else {
    if (cellRender.render) {
      props.cellRender = cellRender.render;
    }
  }
  return <Column key={generateUuid()} {...props} />;
};
