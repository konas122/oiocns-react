import React, { useEffect, useMemo, useState } from 'react';
import { WithCommonProps, defineElement } from '../../defineElement';
import { ElementMeta, ExistTypeMeta } from '@/ts/element/ElementMeta';
import {
  Modal,
  Spin,
  Transfer,
  message,
  Form,
  Switch,
  Select,
  Typography,
  Row,
  Button,
} from 'antd';
import { Form as FormClass } from '@/ts/core/thing/standard/form';
import { XForm, XThing } from '@/ts/base/schema';
import { formatNumber } from '@/utils';
import { SEntity } from '@/ts/element/standard';
import { useFixedCallback } from '@/hooks/useFixedCallback';
import { useEffectOnce } from 'react-use';
import { PageElement } from '@/ts/element/PageElement';
import {
  ListTableColumnElement,
  ListTableProps,
  SpeciesSummaryConfig,
} from '@/ts/element/standard/document/model';
import { PageElementView } from '@/ts/element/ElementTreeManager';
import './index.design.less';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import type DocumentViewerManager from '@/executor/open/document/view/ViewerManager';
import { FieldModel } from '@/ts/base/model';

function isListTableColumn(e: PageElement): e is ListTableColumnElement {
  return e.kind == 'ListTableColumn';
}
type Props = WithCommonProps<ListTableProps> & {
  ctx: { view: DocumentViewerManager };
  columns: ListTableColumnElement[];
  loadFinish(form: XForm | null, fields: FieldModel[]): void;
  formMeta: XForm | null;
  fields: FieldModel[];
  summaryFields: Dictionary<FieldModel | null>;
};

function ListTableView(props: Props) {
  const { ctx, columns, formMeta, fields, summaryFields, loadFinish } = props;
  const manager = ctx.view as DocumentViewerManager;

  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<XThing[]>([]);
  const [summary, setSummary] = useState<Dictionary<number>>({});

  const [classifyProp, setClassifyProp] = useState<SEntity | null>(null);
  const [treeRoot, setTreeRoot] = useState(false);

  useEffect(() => {
    setClassifyProp(props.speciesSummary?.classifyProp ?? null);
    setTreeRoot(props.speciesSummary?.treeRoot ?? false);
  }, [props.speciesSummary]);

  useEffect(() => {
    loadForm();
  }, [props.form]);

  async function loadForm() {
    if (!props.form) {
      loadFinish(null, []);
      return;
    }

    try {
      setLoading(true);

      const formInfo = manager.dataset.service.formInfo[props.form.id];
      if (!formInfo) {
        console.warn('找不到表单' + props.form.name);
        loadFinish(null, []);
        return;
      }

      const data = manager.dataset.data;
      let tableData = data[props.form.id] || [];
      let sumKey = props.form.id;
      if (props.speciesSummary?.classifyProp) {
        tableData = manager.dataset.getSpeciesSummary(props.form.id) || [];
        sumKey += 'Classify';
      }

      setData(tableData);
      if (props.showSummary) {
        setSummary(manager.dataset.getSummary(sumKey));
      }

      loadFinish(
        formInfo.form,
        manager.dataset.service.model.fields[props.form.id] || [],
      );
    } finally {
      setLoading(false);
    }
  }

  function getAttrValue(row: XThing, col: ListTableColumnElement) {
    const propId = col.props.prop!.id;
    const attr = fields.find((a) => a.propId == propId);
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
            {classifyProp && (
              <td>
                <div className="cell">{row.name || row.id}</div>
              </td>
            )}
            {columns.map((col) => {
              return renderCell(col, i, getAttrValue(row, col));
            })}
          </tr>
        );
      }),
      props.showSummary && (
        <tr key="summary">
          {props.showIndex && (
            <td>
              <div className="cell" style={{ textAlign: 'center' }}>
                合计
              </div>
            </td>
          )}
          {classifyProp && (
            <td>
              <div className="cell"></div>
            </td>
          )}
          {columns.map((col) => {
            const attr = summaryFields[col.props.prop!.id];
            let v = '';
            if (attr) {
              v = manager.dataset.formatFieldValue(summary[attr.id], attr, {
                accuracy: col.props.accuracy,
                displayFormat: col.props.dateFormat,
              });
            }
            return renderCell(col, 'summary', v);
          })}
        </tr>
      ),
    ];
  }

  return (
    <div className={['document-list-table', 'is-view'].join(' ')}>
      {loading && <Spin spinning className="loading-spin" />}
      <table>
        <thead>
          <tr className="list-table__header">
            {props.showIndex && <th style={{ width: '60px' }}>序号</th>}
            {classifyProp && (
              <th>
                <div className="cell">{classifyProp.name}</div>
              </th>
            )}
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

function ListTableDesign(props: Props) {
  const { ctx, columns, formMeta, fields, summaryFields, loadFinish } = props;

  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const [configVisible, setConfigVisible] = useState(false);
  const [childProps, setChildProps] = useState<string[]>([]);

  const [classifyProp, setClassifyProp] = useState<SEntity | null>(null);
  const [treeRoot, setTreeRoot] = useState(false);
  const [classifyVisible, setClassifyVisible] = useState(false);

  useEffect(() => {
    setClassifyProp(props.speciesSummary?.classifyProp ?? null);
    setTreeRoot(props.speciesSummary?.treeRoot ?? false);
  }, [props.speciesSummary]);

  const cb = useFixedCallback((type: string, cmd: string, args: any) => {
    if (type == 'props' && cmd == 'change') {
      if (props.id == args || columns.some((c) => c.id == args)) {
        setRefresh(!refresh);
      }
    } else if (type == 'props-action') {
      if (cmd == 'configTableColumn' && props.id == args) {
        setChildProps(columns.map((c) => c.props.prop!.id));
        setConfigVisible(true);
      } else if (cmd == 'configSpeciesSummary' && props.id == args) {
        setClassifyProp(props.speciesSummary?.classifyProp ?? null);
        setTreeRoot(props.speciesSummary?.treeRoot ?? false);
        setClassifyVisible(true);
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
      let attr = fields.find((a) => a.propId == id);
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

  function updateSpeciesSummary() {


    const table = ctx.view.treeManager.allElements[
      props.id
    ] as PageElementView<ListTableProps>;
    if (!table) {
      message.warning('找不到当前元素');
      return;
    }

    table.props.speciesSummary = {
      classifyProp,
      treeRoot,
    };
    setClassifyVisible(false);
    setRefresh(!refresh);
  }

  useEffectOnce(() => {
    const id = ctx.view.pageInfo.command.subscribe(cb);
    return () => ctx.view.pageInfo.command.unsubscribe(id);
  });

  useEffect(() => {
    loadForm();
  }, [props.form]);

  async function loadForm() {
    if (!props.form) {
      loadFinish(null, []);
      return;
    }

    try {
      setLoading(true);
      const [formMeta] = await ctx.view.pageInfo.directory.resource.formColl.find([
        props.form.id,
      ]);
      if (!formMeta) {
        console.warn('找不到表单' + props.form.name);
        loadFinish(null, []);
        return;
      }

      const form = new FormClass(formMeta, ctx.view.pageInfo.directory);
      loadFinish(formMeta, await form.loadFields());
    } finally {
      setLoading(false);
    }
  }

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
          {classifyProp && (
            <td>
              <div className="cell">
                <EntityIcon
                  entity={
                    {
                      ...classifyProp,
                      typeName: '属性',
                    } as any
                  }
                  showName
                />
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
        {props.showSummary && (
          <tr>
            <td>
              <div className="cell" style={{ textAlign: 'center' }}>
                合计
              </div>
            </td>
            {classifyProp && (
              <td>
                <div className="cell"></div>
              </td>
            )}
            {columns.map((col) => {
              return (
                <td key={col.id}>
                  <div className="cell">
                    {summaryFields[col.props.prop!.id] ? '合计值' : ''}
                  </div>
                </td>
              );
            })}
          </tr>
        )}
      </>
    );
  }

  return (
    <div className={['document-list-table', 'is-design'].join(' ')}>
      {loading && <Spin spinning className="loading-spin" />}
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
                {classifyProp && (
                  <th>
                    <div className="cell">[分类汇总字段]</div>
                  </th>
                )}
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
      {configVisible && formMeta && (
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
            dataSource={formMeta.attributes}
            rowKey={(e) => e.propId}
            render={(e) => (
              <span>
                {e.property!.code} {e.name}
              </span>
            )}
            targetKeys={childProps}
            onChange={(e) => setChildProps(e)}
          />
        </Modal>
      )}
      {classifyVisible && (
        <Modal
          open
          title="配置分类汇总"
          width={640}
          onOk={updateSpeciesSummary}
          onCancel={() => setClassifyVisible(false)}>
          <Typography style={{ marginBottom: '16px' }}>
            <ul>
              <li>选择的汇总字段会插入为列表第一列</li>
              <li>子表列只有选择可汇总的字段才会生效</li>
            </ul>
          </Typography>
          <Form>
            <Form.Item label="汇总字段">
              <Select
                value={classifyProp?.id}
                onChange={(v) => {
                  const item = fields.find((f) => f.propId == v)!;
                  setClassifyProp({ id: item.propId, name: item.name });
                }}
                options={fields
                  .filter((f) => f.valueType == '分类型' || f.valueType == '选择型')
                  .map((f) => {
                    return {
                      label: (
                        <Row justify="space-between">
                          <span>{f.info} </span>
                          <span>{f.name}</span>
                        </Row>
                      ),
                      value: f.propId,
                      key: f.code,
                    };
                  })}
              />
            </Form.Item>
            <Form.Item label="是否按顶级分类项汇总">
              <Switch checked={treeRoot} onChange={setTreeRoot} />
            </Form.Item>
            <Form.Item>
              <Button
                onClick={() => {
                  setClassifyProp(null);
                  setTreeRoot(false);
                }}>
                清除
              </Button>
            </Form.Item>
          </Form>
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

    const [form, setForm] = useState<XForm | null>(null);
    const [fields, setFields] = useState<FieldModel[]>([]);

    const summaryFields = useMemo(() => {
      return fields
        .filter((f) => f.options?.isSummary)
        .reduce<Dictionary<FieldModel | null>>((a, v) => {
          a[v.propId] = v;
          return a;
        }, {});
    }, [fields]);

    function loadFinish(form: XForm, fields: FieldModel[]) {
      setForm(form);
      setFields(fields);
    }

    const ListTable = isDesign ? ListTableDesign : ListTableView;
    return (
      <ListTable
        {...props}
        ctx={ctx as any}
        columns={columns}
        formMeta={form}
        fields={fields}
        summaryFields={summaryFields}
        loadFinish={loadFinish}
      />
    );
  },
  displayName: 'ListTable',
  meta: {
    label: '子表',
    type: 'Document',
    props: {
      form: {
        type: 'type',
        label: '表单',
        typeName: 'formFile',
        required: true,
      } as ExistTypeMeta<SEntity | undefined>,
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
      showSummary: {
        type: 'boolean',
        label: '显示合计',
        default: false,
      },
      speciesSummary: {
        type: 'type',
        typeName: 'TableSpeciesSummaryConfig',
        label: '分类汇总',
      } as ExistTypeMeta<SpeciesSummaryConfig | null>,
    },
    childrenFilter: (element: ElementMeta & { name: string }) => {
      return element.name == 'ListTableColumn';
    },
  },
});
