import React, { useMemo, useState } from 'react';
import { WithCommonProps, defineElement } from '../../defineElement';
import { ElementMeta } from '@/ts/element/ElementMeta';
import {
  Modal,
  Transfer,
  message,
} from 'antd';
import { SEntity } from '@/ts/element/standard';
import { useFixedCallback } from '@/hooks/useFixedCallback';
import { useEffectOnce } from 'react-use';
import { PageElement } from '@/ts/element/PageElement';
import {
  ListTableColumnElement,
  ListTableProps,
  WorkTaskInfo,
} from '@/ts/element/standard/document/model';
import { PageElementView } from '@/ts/element/ElementTreeManager';
import '../Table/index.design.less';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import type DocumentViewerManager from '@/executor/open/document/view/ViewerManager';
import { FieldModel } from '@/ts/base/model';
import { taskFields } from '@/ts/element/standard/document/fields';

function isListTableColumn(e: PageElement): e is ListTableColumnElement {
  return e.kind == 'ListTableColumn';
}
type Props = WithCommonProps<ListTableProps> & {
  ctx: { view: DocumentViewerManager };
  columns: ListTableColumnElement[];
  fields: FieldModel[];
};

function WorkHistoryTableView(props: Props) {
  const { ctx, columns, fields } = props;
  const manager = ctx.view as DocumentViewerManager;

  const [data, setData] = useState<WorkTaskInfo[]>([]);

  useEffectOnce(() => {
    setData(manager.dataset.taskData);
  });


  function getAttrValue(row: Dictionary<any>, col: ListTableColumnElement) {
    const propId = col.props.prop!.id;
    const attr = fields.find((a) => a.id == propId);
    if (!attr) {
      return '';
    }
    let label = row[`${attr.id}Name`];
    if (label) {
      return label;
    }

    let v = row[attr.id];
    if (v == null || v == '') {
      return v;
    }

    v = manager.dataset.formatFieldValue(v, attr, {
      accuracy: col.props.accuracy,
      displayFormat: col.props.dateFormat,
    });
    return v;
  }

  function renderCell(col: ListTableColumnElement, i: number | string, value: any) {
    const style = {
      width: col.props.width,
      textAlign: col.props.align,
    };
    return (
      <td key={i + col.id} style={style}>
        <div className="cell">{value}</div>
      </td>
    );
  }

  function renderViewTable() {
    return [
      data.map((row, i) => {
        return (
          <tr key={i}>
            {props.showIndex && (
              <td key={i + '-index'}>
                <div className="cell" style={{ textAlign: 'center' }}>
                  {i + 1}
                </div>
              </td>
            )}
            {columns.map((col) => {
              return renderCell(col, i, getAttrValue(row, col));
            })}
          </tr>
        );
      }),
    ];
  }

  return (
    <div className={['document-list-table', 'is-view'].join(' ')}>
      <table>
        <thead>
          <tr className="list-table__header">
            {props.showIndex && <th style={{ width: '60px' }}>序号</th>}
            {columns.length == 0 ? (
              <th>
                <div className="cell"></div>
              </th>
            ) : (
              columns.map((c) => {
                const Render = ctx.view.components.getComponentRender(
                  c.kind,
                  ctx.view.mode,
                );
                return (
                  <th style={{ width: c.props.width }}>
                    <div className="cell">
                      <Render key={c.id} element={c} />
                    </div>
                  </th>
                );
              })
            )}
          </tr>
        </thead>
        <tbody>{renderViewTable()}</tbody>
      </table>
    </div>
  );
}

function WorkHistoryTableDesign(props: Props) {
  const { ctx, columns, fields } = props;

  const [refresh, setRefresh] = useState(false);

  const [configVisible, setConfigVisible] = useState(false);
  const [childProps, setChildProps] = useState<string[]>([]);


  const cb = useFixedCallback((type: string, cmd: string, args: any) => {
    if (type == 'props' && cmd == 'change') {
      if (props.id == args || columns.some((c) => c.id == args)) {
        setRefresh(!refresh);
      }
    } else if (type == 'props-action') {
      if (cmd == 'configTableColumn' && props.id == args) {
        setChildProps(columns.map((c) => c.props.prop!.id));
        setConfigVisible(true);
      }
    }
  });

  function updateChildren() {
    const table = ctx.view.treeManager.allElements[props.id] as PageElementView;
    if (!table) {
      message.warning('找不到当前元素');
      return;
    }

    let children: ListTableColumnElement[] = [];
    let oldChildren = columns.filter<ListTableColumnElement>(isListTableColumn);
    for (const id of childProps) {
      let prop: SEntity = {
        id,
        name: '已删除属性' + id,
      };
      let attr = fields.find((a) => a.id == id);
      if (attr) {
        prop.name = attr.name;
      }

      // 新增或保留
      let e = oldChildren.find((c) => c.props.prop?.id == id);
      if (e) {
        children.push(e);
        oldChildren.splice(oldChildren.indexOf(e), 1);
      } else {
        children.push(
          ctx.view.treeManager.createElement(
            'ListTableColumn',
            '列 ' + prop.name,
            undefined,
            props.id,
            {
              props: {
                prop,
                label: prop.name,
                align: attr?.widget == '数字框' ? 'right' : undefined,
              },
            },
          ) as ListTableColumnElement,
        );
      }
    }

    // 删除
    for (const e of oldChildren) {
      ctx.view.treeManager.removeElement(e);
    }

    // table.children = children;

    setChildProps([]);
    setRefresh(!refresh);
  }


  useEffectOnce(() => {
    const id = ctx.view.pageInfo.command.subscribe(cb);
    return () => ctx.view.pageInfo.command.unsubscribe(id);
  });


  function renderDesignTable() {
    if (columns.length == 0) {
      return (
        <tr>
          <td>
            <div className="cell">未配置子表列</div>
          </td>
        </tr>
      );
    }
    return (
      <>
        <tr>
          {props.showIndex && (
            <td>
              <div className="cell" style={{ textAlign: 'center' }}>
                1
              </div>
            </td>
          )}
          {columns.map((col) => {
            return (
              <td key={col.id}>
                <div className="cell">
                  {col.props.prop && (
                    <EntityIcon
                      entity={
                        {
                          ...col.props.prop,
                          typeName: '属性',
                        } as any
                      }
                      showName
                    />
                  )}
                </div>
              </td>
            );
          })}
        </tr>
      </>
    );
  }

  return (
    <div className={['document-list-table', 'is-design'].join(' ')}>
      <table>
        <thead>
          <tr className="list-table__header">
            {columns.length == 0 ? (
              <th>
                <div className="cell" style={{ textAlign: 'center' }}>
                  未配置子表列
                </div>
              </th>
            ) : (
              <>
                {props.showIndex && <th style={{ width: '80px' }}>序号</th>}
                {columns.map((c) => {
                  const Render = ctx.view.components.getComponentRender(
                    c.kind,
                    ctx.view.mode,
                  );
                  return (
                    <th style={{ width: c.props.width }}>
                      <div className="cell">
                        <Render key={c.id} element={c} />
                      </div>
                    </th>
                  );
                })}
              </>
            )}
          </tr>
        </thead>
        <tbody>{renderDesignTable()}</tbody>
      </table>
      {configVisible && (
        <Modal
          open
          getContainer={() => document.body}
          title="配置子表列"
          width={720}
          className="document-list-table--configmodal"
          onCancel={() => setConfigVisible(false)}
          onOk={() => {
            updateChildren();
            setConfigVisible(false);
          }}>
          <Transfer
            dataSource={fields}
            rowKey={(e) => e.id}
            render={(e) => (
              <span>
                {e.code} {e.name}
              </span>
            )}
            targetKeys={childProps}
            onChange={(e) => setChildProps(e)}
          />
        </Modal>
      )}
    </div>
  );
}

export default defineElement({
  render(props, ctx) {
    const isDesign = ctx.view.mode == 'design';

    const columns = useMemo(() => {
      return props.children.filter(
        (c) => isListTableColumn(c) && c.props.prop,
      ) as ListTableColumnElement[];
    }, [props.children]);


    const ListTable = isDesign ? WorkHistoryTableDesign : WorkHistoryTableView;
    return (
      <ListTable
        {...props}
        ctx={ctx as any}
        columns={columns}
        fields={taskFields}
      />
    );
  },
  displayName: 'WorkHistoryTable',
  meta: {
    label: '流程历史表格',
    type: 'Document',
    props: {
      showIndex: {
        type: 'boolean',
        label: '显示序号',
        default: true,
      },
      column: {
        type: 'type',
        typeName: 'TableColumnConfig',
        label: '子表列',
        required: true,
      },
    },
    childrenFilter: (element: ElementMeta & { name: string }) => {
      return element.name == 'ListTableColumn';
    },
  },
});
