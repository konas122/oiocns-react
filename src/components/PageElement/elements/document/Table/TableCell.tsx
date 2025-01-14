import React, { ReactNode, useState } from 'react';
import { PageElement } from '@/ts/element/PageElement';
import { Context } from '@/components/PageElement/render/PageContext';
import { Alert, Button } from 'antd';
import { PageElementView } from '@/ts/element/ElementTreeManager';
import AddElementModal from '@/executor/design/pageBuilder/design/AddElementModal';
import {
  TableCellElement,
  TableCellMeta,
  TableMeta,
} from '@/ts/element/standard/document/model';
import CellLocationError from './CellLocationError';

interface TableCellProps extends TableCellMeta {
  table: PageElementView<TableMeta>;
  element?: TableCellElement;
  error?: CellLocationError;
  ctx: Context;
  onChildUpdate?: () => any;
}

export function TableCell(props: TableCellProps) {
  const ctx = props.ctx;
  const [visible, setVisible] = useState(false);

  let children: ReactNode;

  if (props.element) {
    const Render = ctx.view.components.getComponentRender(
      props.element.kind,
      ctx.view.mode,
    );
    children = <Render key={props.element.id} element={props.element} />;
  }

  if (ctx.view.mode == 'design') {
    if (!props.element) {
      if (props.error) {
        children = (
          <Alert
            message={props.error.message}
            type="error"
            showIcon
          />
        );
      }
      else {
        children = (
          <div style={{ textAlign: 'center' }}>
            <Button size="small" onClick={() => setVisible(true)}>
              添加内容
            </Button>
          </div>
        );
      }
    }
  }

  return (
    <td className="cell" colSpan={props.colSpan} rowSpan={props.rowSpan}>
      {children}
      {visible && (
        <AddElementModal
          parentId={props.table.id}
          accepts={(ctx.view as any).accepts}
          onFinished={() => {
            setVisible(false);
            props.onChildUpdate?.();
          }}
          initialValue={{
            col: props.col,
            row: props.row,
          }}
        />
      )}
    </td>
  );
}
