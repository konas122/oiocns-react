import React, { ReactNode, useMemo, useState } from 'react';
import { defineElement } from '../../defineElement';
import './index.less';
import { ElementMeta } from '@/ts/element/ElementMeta';
import { TableCell } from './TableCell';
import { TableCellElement, TableMeta } from '@/ts/element/standard/document/model';
import { PageElementView } from '@/ts/element/ElementTreeManager';
import { useEffectOnce } from 'react-use';
import { useFixedCallback } from '@/hooks/useFixedCallback';
import CellLocationError from './CellLocationError';

function range(start: number, end: number): number[] {
  const ret = [];
  for (let i = start; i <= end; i++) {
    ret.push(i);
  }
  return ret;
}

export default defineElement({
  render(props, ctx) {
    const isDesign = ctx.view.mode == 'design';
    const table = ctx.view.treeManager.allElements[
      props.id
    ] as PageElementView<TableMeta>;

    const [refresh, setRefresh] = useState(false);

    const cb = useFixedCallback((type: string, cmd: string, args: any) => {
      if (type == 'props' && cmd == 'change') {
        if (props.id == args || props.children.some(c => c.id == args)) {
          setRefresh(!refresh);
        }
      }
    });

    useEffectOnce(() => {
      const id = ctx.view.pageInfo.command.subscribe(cb);
      return () => ctx.view.pageInfo.command.unsubscribe(id);
    });

    const elementMap = useMemo(() => {
      const map: {
        [row: string]: {
          [col: string]: TableCellElement | true | CellLocationError | undefined;
        };
      } = {};

      for (const v of props.children as TableCellElement[]) {
        for (const row of range(v.props.row, v.props.row + (v.props.rowSpan ?? 1) - 1)) {
          for (const col of range(
            v.props.col,
            v.props.col + (v.props.colSpan ?? 1) - 1,
          )) {
            map[row] ||= {};
            if (map[row][col]) {
              const msg =
                `单元格合并错误：单元格 (${v.props.row + 1}行${v.props.col + 1}列) ` +
                `跨越了其他单元格区域 (${row + 1}行${col + 1}列)`;
              console.error(msg);
              map[row][col] = new CellLocationError(msg, {
                col,
                row,
              });
              return map;
            }
            if (row != v.props.row || col != v.props.col) {
              map[row][col] = true;
            } else {
              map[row][col] = v;
            }
          }
        }
      }
      return map;
    }, [props.cols, props.rows, props.children, refresh]);

    const renderCells = () => {
      const rows = [];
      for (let row = 0; row < props.rows; row++) {
        const tds = [];
        for (let col = 0; col < props.cols; col++) {
          let element = elementMap[row]?.[col];
          let error: CellLocationError | undefined;
          if (element === true) {
            continue;
          } else if (element instanceof CellLocationError) {
            error = element;
            element = undefined;
          }
          tds.push(
            <TableCell
              key={`${row},${col}`}
              ctx={ctx}
              element={element}
              error={error}
              table={table}
              col={col}
              row={row}
              colSpan={element?.props?.colSpan ?? 1}
              rowSpan={element?.props?.rowSpan ?? 1}
              onChildUpdate={() => setRefresh(!refresh)}
            />,
          );
        }
        rows.push(<tr key={row}>{tds}</tr>);
      }
      return rows;
    };

    return (
      <div className={['document-table', isDesign ? 'is-design' : ''].join(' ')}>
        <table className={'is-border--' + (props.border || 'all')}>
          <tbody>{renderCells()}</tbody>
        </table>
      </div>
    );
  },
  displayName: 'Table',
  meta: {
    label: '表格',
    type: 'Document',
    props: {
      cols: {
        type: 'number',
        label: '列数',
        default: 4,
        min: 1,
      },
      rows: {
        type: 'number',
        label: '行数',
        default: 3,
        min: 1,
      },
      border: {
        type: 'enum',
        label: '边框',
        options: [
          { label: '无', value: 'none' },
          { label: '全部', value: 'all' },
          { label: '外框', value: 'outline' },
          { label: '行', value: 'row' },
        ],
        default: 'all'
      },
    },
    attachProps: {
      rowSpan: {
        type: 'number',
        label: '单元格合并行',
        default: 1,
        min: 1,
      },
      colSpan: {
        type: 'number',
        label: '单元格合并列',
        default: 1,
        min: 1,
      },
      row: {
        type: 'number',
        label: '单元格行下标',
        readonly: true,
      },
      col: {
        type: 'number',
        label: '单元格列下标',
        readonly: true,
      }
    },
    childrenFilter: (element: { name: string }) => {
      return element.name != 'Paper' && element.name != 'ListTableColumn';
    },
  },
});
