import React, { FC, useEffect, useState } from 'react';
import './index.less';
import css from './designer.module.less';
import { IPrint } from '@/ts/core';
import {
  Input,
  Button,
  Modal,
  Space,
  Transfer,
  InputNumber,
  Tag,
  Radio,
  Tree,
  message,
  Checkbox,
} from 'antd';
import type { RadioChangeEvent } from 'antd';
import type { CheckboxValueType } from 'antd/es/checkbox/Group';
import { SelectBox } from 'devextreme-react';
import { schema } from '@/ts/base';
import { itemsTable } from '@/ts/base/model';
import QrCode from 'qrcode.react';
const CheckboxGroup = Checkbox.Group;
interface IProps {
  printType: string;
  fields: any;
  forms: schema.XForm[];
  print: schema.XPrint;
  resource: any;
}
const Template1: FC<IProps> = ({ fields, forms, printType, print, resource }) => {
  const [attrShow, setAttrShow] = useState(false);
  const [sumShow, setSumShow] = useState(false);
  const [sumShowKey, setSumShowKey] = useState(false);
  const [subTableNameShow, setSubTableNameShow] = useState(false);
  const [sumNameDialog, setSumNameDialog] = useState(false);
  const [checkAttrShow, setCheckAttrShow] = useState(false);
  const [formAttrShow, setFormAttrShow] = useState(false);
  const [treeShowFlag, setTreeShowFlag] = useState(false);
  const [treeData, setTreeData] = useState([]);
  const [sumFields, setSumFields] = useState([]);
  const [subTableflag, setSubTableflag] = useState<boolean[][]>([[false]]);
  const [target, setTarget] = useState();
  const [nowkey, setNowkey] = useState('');
  const [title, setTitle] = useState('');
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [targetFormKeys, setTargetFormKeys] = useState<string[]>([]);
  const [mockData, setMockData] = useState<any[]>([]);
  const [mockFormData, setMockFormData] = useState<any[]>([]);
  const [foreignCheckedKeysList, setForeignCheckedKeysList] = useState<any[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedKeys2, setSelectedKeys2] = useState<string[]>([]);
  const [formKey, setFormKey] = useState<string>('');
  const [sumKey, setSumKey] = useState<string>('');
  const [foreignCheckedList, setForeignCheckedList] = useState<CheckboxValueType[]>([]);
  const [radioValue, setRadioValue] = useState(1);
  const [sumPrimaryValue, setSumPrimaryValue] = useState('');
  const [radioValue2, setRadioValue2] = useState(1);
  const [treeIndexNumber, setTreeIndexNumber] = useState(1);
  const [keysForms, setKeysForms] = useState<any[]>([]);
  const [tableListIndex, setTableListIndex] = useState<{
    index: number;
    index2: number;
    subindex: number;
  }>({ index: 0, index2: 0, subindex: 0 });
  const onChangePrimaryKey = (e: RadioChangeEvent) => {
    setSumPrimaryValue(e.target.value);
  };
  const onChangeForeignKey = (list: CheckboxValueType[]) => {
    setForeignCheckedList(list);
    const foreignList = fields.filter((field: any) => list.includes(field.id));
    setForeignCheckedKeysList(foreignList);
  };
  const onChange = (nextTargetKeys: string[]) => {
    setTargetKeys(nextTargetKeys);
  };
  const onChange2 = (nextTargetKeys: string[]) => {
    setTargetFormKeys(nextTargetKeys);
  };

  const onSelectChange = (sourceSelectedKeys: string[], targetSelectedKeys: string[]) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
  };
  const onSelectChange2 = (
    sourceSelectedKeys: string[],
    targetSelectedKeys: string[],
  ) => {
    setSelectedKeys2([...sourceSelectedKeys, ...targetSelectedKeys]);
  };

  const showDialog = (key: string) => {
    setNowkey(key);
    setAttrShow(true);
  };
  const showSumDialog = (key: string) => {
    setNowkey(key);
    setSumShow(true);
  };
  const showSumDialogKey = (key: string) => {
    const sumFields = fields
      .filter((item: any) => item.valueType === '分类型')
      .filter((item: any) => keysForms.includes(item.xfield.formId));
    setSumFields(sumFields);
    setSumKey(key);
    setSumShowKey(true);
  };
  const showTableDialog = (
    index: number,
    index2: number,
    subindex: number,
    key: string,
  ) => {
    setSubTableNameShow(true);
    setTableListIndex({
      index,
      index2,
      subindex,
    });
    setFormKey(key);
  };
  const showSumNameDialog = (
    index: number,
    index2: number,
    subindex: number,
    key: string,
    sort?: number,
    name?: string,
  ) => {
    let sortIndex: number = templateMap[
      `attr${index}_${index2}_sum`
    ].attributes.findIndex((attr: any) => attr.sort === sort && attr.name === name);
    setSumNameDialog(true);
    setTableListIndex({
      index,
      index2,
      subindex: sortIndex != -1 ? sortIndex : subindex,
    });
    setFormKey(key);
  };
  const changeCheckAttrShow = (flag: boolean, lookups: any) => {
    const newData = lookups.filter((item: any) => item.hide).map((item: any) => item.id);
    setTargetKeys([...newData]);
    setMockData(lookups);
    setCheckAttrShow(flag);
  };
  const changeFormAttrShow = (flag: boolean, item: any, key: string) => {
    if (!item) {
      return false;
    } else {
      const newData = item.attributes
        .filter((item: any) => item.hide)
        .map((item: any) => item.id);
      setTargetFormKeys([...newData]);
      setFormAttrShow(flag);
      setMockFormData(item.attributes);
      setFormKey(key);
    }
  };
  const onChangeTreeIndexNumber = (e: any) => {
    setTreeIndexNumber(e);
  };
  const onChangeNumber = (e: any, type: string) => {
    templateMap[formKey].attributes.filter((item: { hide: any }) => !item.hide)[
      tableListIndex.subindex
    ][type] = e;
    setTemplateMap((prevState: any) => ({
      ...prevState,
      [formKey]: templateMap[formKey],
    }));
  };
  const buildTree = (items: any[], parentId: any, level: number): any[] => {
    const tree: any[] = [];
    items.forEach((item) => {
      if (item.parentId === parentId) {
        const children = buildTree(items, item.id, level + 1);
        const node = { ...item, level, children };
        tree.push(node);
      }
    });
    return tree;
  };
  const onRadioChange = (e: RadioChangeEvent) => {
    setRadioValue(e.target.value);
    if (e.target.value === 1) {
      //开启选择 操作子表中的数据结构
      changeCheckAttrShow(
        true,
        templateMap[formKey].attributes.filter((item: { hide: any }) => !item.hide)[
          tableListIndex.subindex
        ].lookups,
      );
    }
  };
  const onRadioChange2 = (e: RadioChangeEvent) => {
    setRadioValue2(e.target.value);
    if (e.target.value === 2) {
      const tree = buildTree(
        templateMap[formKey].attributes.filter((item: { hide: any }) => !item.hide)[
          tableListIndex.subindex
        ].lookups,
        undefined,
        1,
      );
      //给一个弹窗，把树传进去
      setTreeShow(true, tree);
    }
  };
  const buildTreeData = (nodes: any) => {
    return nodes.map((node: any) => ({
      key: node.id,
      title: `${node.text} - 第 ${node.level} 层`,
      children: node.children ? buildTreeData(node.children) : undefined,
    }));
  };
  const setTreeShow = (
    flag: boolean | ((prevState: boolean) => boolean),
    data: any[],
  ) => {
    setTreeShowFlag(flag);
    const treeData = buildTreeData(data);
    setTreeData(treeData);
  };
  const [templateMap, setTemplateMap] = useState<any>({});
  const [items, setItems] = useState<itemsTable[]>([]);
  function templateRender(obj: any) {
    switch (obj.valueType) {
      case '数值型':
      case '货币型':
        return obj.name;
      case '描述型':
        return obj.name;
      case '引用型':
        return obj.xfield.caption;
      case '日期型':
        return obj.xfield.caption;
      case '时间型':
        return obj.name;
      case '用户型':
        return obj.name;
      case '分类型':
        return obj.name;
      case '选择型':
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {obj.lookups
              .filter((item: any) => !item.hide)
              .map((lookup: any) => (
                <label
                  className="print-checkbox-label"
                  key={lookup.value}
                  style={{ marginRight: '30px', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    value={lookup.value}
                    checked={
                      obj.widget == '多选框'
                        ? obj.options.defaultValue.includes(lookup.id)
                        : obj.options.defaultValue == lookup.value
                    }
                  />
                  <span style={{ verticalAlign: 'middle', marginLeft: '8px' }}>
                    {lookup.text}
                  </span>
                </label>
              ))}
          </div>
        );
      case '输出型':
        return obj.name;
      default:
        return <></>;
    }
  }
  useEffect(() => {
    resource.printData.attributes &&
      resource.printData.attributes.forEach((item: any) => {
        if (item.title == printType) {
          setTemplateMap(item);
          Object.entries(item).forEach(([key, value]: any) => {
            if (value && value.typeName == '表单') {
              //子表的数据个数
              const flag = subTableflag;
              const index = key.substring(4);
              const indexArr = index.split('_');
              if (value.attributes.filter((att: { hide: any }) => !att.hide).length > 0) {
                flag[Number(indexArr[0])][Number(indexArr[1])] = true;
                setSubTableflag(flag);
              }
            }
          });
        }
      });
    let nweKeysForms: any = [];
    const dData = forms.filter((item: any) => item.xform.type === '子表');
    dData.forEach((item: any) => {
      nweKeysForms.push(item.xform.formId);
    });
    setKeysForms(nweKeysForms);
  }, []);
  useEffect(() => {
    setTitle(printType);
    if (print && print.id === printType) {
      setItems(print.table!);
    }
  }, [print]);
  return (
    <>
      <div>
        {items.map((item: itemsTable, index: number) => (
          <div
            className={'Content'}
            key={index - 200}
            style={{ marginTop: index == 0 ? '10px' : '150px', position: 'relative' }}>
            {item.qrcode &&
              item.qrcode!.map((qcitem, qcindex) => {
                return (
                  <div
                    className={'qccode'}
                    key={qcindex - 100000}
                    style={{
                      position: 'absolute',
                      top: qcitem.style.top - qcitem.style.size / 2 + 'px',
                      left: qcitem.style.left - qcitem.style.size / 2 + 'px',
                    }}>
                    <QrCode
                      level="H"
                      size={qcitem.style.size}
                      renderAs="canvas"
                      value={''}
                      data-index={-888}
                    />
                  </div>
                );
              })}
            {item.title.flag && (
              <div className={'head'}>
                <div
                  className={'Table-title'}
                  style={item.title.style}
                  dangerouslySetInnerHTML={{ __html: item.title.name }}></div>
              </div>
            )}
            {item.subtitle && item.subtitle.flag && (
              <table
                className={css.printSubtitleContent}
                cellSpacing=""
                cellPadding="10"
                style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={item.subtitle.style} className={'subtitle-container'}>
                      <span
                        className="tableData"
                        data-index={-888}
                        style={{ whiteSpace: 'pre-wrap' }}
                        dangerouslySetInnerHTML={{ __html: item.subtitle.name }}
                      />
                      {item.subtitle.dataSource &&
                        templateMap[`attr${index}_subtitle`] &&
                        templateRender(templateMap[`attr${index}_subtitle`])}
                      {item.subtitle.dataSource && (
                        <Button onClick={() => showDialog(`attr${index}_subtitle`)}>
                          添加属性
                        </Button>
                      )}
                      {item.subtitle.text &&
                        item.subtitle.text.length &&
                        item.subtitle.text.map((subtitleItem, subtitleIndex) => (
                          <div
                            key={subtitleIndex + 100000}
                            className={css.textDiv}
                            style={subtitleItem.style}>
                            <span
                              data-index={-888}
                              style={{ whiteSpace: 'pre-wrap' }}
                              dangerouslySetInnerHTML={{ __html: subtitleItem.name }}
                            />
                            {subtitleItem.dataSource &&
                              templateMap[`attr${index}_subText_${subtitleIndex}`] &&
                              templateRender(
                                templateMap[`attr${index}_subText_${subtitleIndex}`],
                              )}
                            {subtitleItem.dataSource && (
                              <Button
                                onClick={() =>
                                  showDialog(`attr${index}_subText_${subtitleIndex}`)
                                }>
                                添加属性
                              </Button>
                            )}
                          </div>
                        ))}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
            <table
              className={css.printContent}
              border={1}
              style={item.style}
              cellSpacing=""
              cellPadding="10">
              <tbody>
                {item.data.map((item2, index2) => (
                  <>
                    {item2.data.type == 'table' &&
                      subTableflag.length > 0 &&
                      subTableflag[index][index2] && (
                        <tr style={{ width: '100%' }}>
                          <td
                            style={{ width: '100%', padding: '0' }}
                            colSpan={item2.data.data[0].colNumber}>
                            <table style={{ width: '100%' }}>
                              <tbody
                                style={
                                  item2.data.data[0].style
                                    ? item2.data.data[0].style
                                    : item.style
                                }>
                                {templateMap[`attr${index}_${index2}`] &&
                                  templateMap[`attr${index}_${index2}`].attributes.filter(
                                    (item: any) => !item.hide,
                                  ).length > 0 && (
                                    //子表区域
                                    <tr key={index2 + 19823}>
                                      {templateMap[`attr${index}_${index2}`].attributes
                                        .filter((item: any) => !item.hide)
                                        .map((subdataitem: any, subdataindex: number) => (
                                          <th
                                            onClick={() =>
                                              showTableDialog(
                                                index,
                                                index2,
                                                subdataindex,
                                                `attr${index}_${index2}`,
                                              )
                                            }
                                            key={subdataindex + 100000}
                                            style={{
                                              width: `${subdataitem.width}%`,
                                              height: `${
                                                subdataitem.height
                                                  ? subdataitem.height
                                                  : 50
                                              }px`,
                                              textAlign: 'center',
                                              wordBreak: 'break-all',
                                              borderLeft:
                                                subdataindex == 0
                                                  ? 'none'
                                                  : '1px solid black',
                                              borderTop: '1px solid black',
                                            }}>
                                            {subdataitem.name}
                                          </th>
                                        ))}
                                    </tr>
                                  )}
                                {templateMap[`attr${index}_${index2}`] &&
                                  templateMap[`attr${index}_${index2}`].attributes.filter(
                                    (item: any) => !item.hide,
                                  ).length > 0 && (
                                    <tr key={index2 + 39898}>
                                      {
                                        //子表区域
                                        templateMap[`attr${index}_${index2}`].attributes
                                          .filter((item: any) => !item.hide)
                                          .map(
                                            (subdataitem: any, subdataindex: number) => (
                                              <td
                                                onClick={() =>
                                                  showTableDialog(
                                                    index,
                                                    index2,
                                                    subdataindex,
                                                    `attr${index}_${index2}`,
                                                  )
                                                }
                                                key={subdataindex + 100000}
                                                style={{
                                                  width: `${subdataitem.width}%`,
                                                  height: `${
                                                    subdataitem.height
                                                      ? subdataitem.height
                                                      : 50
                                                  }px`,
                                                  textAlign: 'center',
                                                  wordBreak: 'break-all',
                                                  borderLeft:
                                                    subdataindex == 0
                                                      ? 'none'
                                                      : '1px solid black',
                                                  borderTop: '1px solid black',
                                                }}>
                                                xxx
                                              </td>
                                            ),
                                          )
                                      }
                                    </tr>
                                  )}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    {item2.data.type == 'sum' &&
                      templateMap[`attr${index}_${index2}_sum`] &&
                      templateMap[`attr${index}_${index2}_sum`].attributes.length > 0 && (
                        //合计区域
                        <tr style={{ width: '100%' }}>
                          <td
                            style={{ width: '100%', padding: '0' }}
                            colSpan={item2.data.data[0].colNumber}>
                            <table style={{ width: '100%' }}>
                              <tbody
                                style={
                                  item2.data.data[0].style
                                    ? item2.data.data[0].style
                                    : item.style
                                }>
                                {templateMap[`attr${index}_${index2}_sum`] &&
                                  templateMap[`attr${index}_${index2}_sum`].attributes
                                    .length > 0 && (
                                    <tr key={index2 + 29823}>
                                      {[
                                        ...templateMap[`attr${index}_${index2}_sum`]
                                          .attributes,
                                      ]
                                        .sort((a, b) => a.sort - b.sort)
                                        .map((subdataitem: any, subdataindex: number) => (
                                          <th
                                            onClick={() =>
                                              showSumNameDialog(
                                                index,
                                                index2,
                                                subdataindex,
                                                `attr${index}_${index2}_sum`,
                                                subdataitem.sort,
                                                subdataitem.name,
                                              )
                                            }
                                            key={subdataindex + 100000}
                                            style={{
                                              width: `${subdataitem.width}%`,
                                              height: `${
                                                subdataitem.height
                                                  ? subdataitem.height
                                                  : 50
                                              }px`,
                                              textAlign: 'center',
                                              wordBreak: 'break-all',
                                              borderLeft:
                                                subdataindex == 0
                                                  ? 'none'
                                                  : '1px solid black',
                                              borderTop: '1px solid black',
                                            }}>
                                            {subdataitem.name}
                                            {subdataitem.addonAfter &&
                                              subdataitem.addonAfter}
                                          </th>
                                        ))}
                                    </tr>
                                  )}
                                {templateMap[`attr${index}_${index2}_sum`] &&
                                  templateMap[`attr${index}_${index2}_sum`].attributes
                                    .length > 0 && (
                                    <tr key={index2 + 49898}>
                                      {templateMap[
                                        `attr${index}_${index2}_sum`
                                      ].attributes.map(
                                        (subdataitem: any, subdataindex: number) => (
                                          <td
                                            onClick={() =>
                                              showSumNameDialog(
                                                index,
                                                index2,
                                                subdataindex,
                                                `attr${index}_${index2}_sum`,
                                              )
                                            }
                                            key={subdataindex + 100000}
                                            style={{
                                              width: `${subdataitem.width}%`,
                                              height: `${
                                                subdataitem.height
                                                  ? subdataitem.height
                                                  : 50
                                              }px`,
                                              textAlign: 'center',
                                              wordBreak: 'break-all',
                                              borderLeft:
                                                subdataindex == 0
                                                  ? 'none'
                                                  : '1px solid black',
                                              borderTop: '1px solid black',
                                            }}>
                                            xxx
                                          </td>
                                        ),
                                      )}
                                    </tr>
                                  )}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    <tr key={index2} data-index={index2} className={'dynamic-row'}>
                      {item2.data.type == 'table' &&
                        subTableflag.length > 0 &&
                        !subTableflag[index][index2] && (
                          //子表区域
                          <th
                            className={'tableName'}
                            colSpan={item2.data.data[0].colNumber}>
                            <SelectBox
                              label="添加目标子表"
                              labelMode="floating"
                              value={templateMap[`attr${index}_${index2}`]?.xform.name}
                              showClearButton
                              width={'100%'}
                              displayExpr={(cur) => {
                                return cur?.xform.name;
                              }}
                              valueExpr={(cur) => {
                                return cur?.xform.name;
                              }}
                              dataSource={forms}
                              onSelectionChanged={(e) => {
                                e.selectedItem &&
                                  e.selectedItem.attributes.forEach((cur: any) => {
                                    if (cur.valueType && cur.valueType === '选择型') {
                                      fields.forEach(
                                        (field: { id: any; lookups: any }) => {
                                          if (field.id == cur.id) {
                                            cur.lookups = field.lookups;
                                          }
                                        },
                                      );
                                    }
                                    if (cur.valueType && cur.valueType === '分类型') {
                                      fields.forEach(
                                        (field: { id: any; lookups: any }) => {
                                          if (field.id == cur.id) {
                                            cur.lookups = field.lookups;
                                          }
                                        },
                                      );
                                    }
                                  });
                                const parintCurrentData =
                                  resource.printData.attributes.filter((cur: any) => {
                                    return cur.title == title;
                                  });
                                if (parintCurrentData.length > 0) {
                                  resource.printData.attributes.forEach((cur: any) => {
                                    if (cur.title == title) {
                                      cur[`attr${index}_${index2}`] = e.selectedItem;
                                    }
                                  });
                                } else {
                                  resource.printData.attributes.push({
                                    [`attr${index}_${index2}`]: e.selectedItem,
                                    title: title,
                                  });
                                }
                                setTemplateMap((prevState: any) => ({
                                  ...prevState,
                                  [`attr${index}_${index2}`]: e.selectedItem,
                                }));
                                //e.selectedItem.attributes是子表的属性要放在跟多选的那个过滤一样的多虑掉，字段是name和valueType告诉用户这个字段的名称和类型，往里面添加一个字段，字段名称是hide，然后去拿去判断隐藏还是显示
                                changeFormAttrShow(
                                  true,
                                  e.selectedItem,
                                  `attr${index}_${index2}`,
                                );
                              }}
                            />
                          </th>
                        )}
                      {item2.data.type == 'sum' &&
                        !templateMap[`attr${index}_${index2}_sum`] && (
                          //合计区域
                          <th
                            className={'tableName'}
                            colSpan={item2.data.data[0].colNumber}>
                            <Button
                              type="primary"
                              onClick={() => showSumDialog(`attr${index}_${index2}_sum`)}>
                              选择分类合计属性
                            </Button>
                          </th>
                        )}

                      {item2.data.data &&
                        item2.data.type != 'table' &&
                        item2.data.type != 'sum' &&
                        item2.data.data.map((item3, index3) => (
                          <td
                            key={index3 + 1000}
                            colSpan={item3.colNumber}
                            data-index={index3}
                            className={'tableData'}
                            style={item3.style}>
                            <span
                              dangerouslySetInnerHTML={{ __html: item3.name }}
                              style={{ whiteSpace: 'pre-wrap' }}
                            />
                            {item3.dataSource &&
                              templateMap[`attr${index}_${index2}_${index3}`] &&
                              templateRender(
                                templateMap[`attr${index}_${index2}_${index3}`],
                              )}
                            {item3.dataSource && (
                              <Button
                                onClick={() =>
                                  showDialog(`attr${index}_${index2}_${index3}`)
                                }>
                                添加属性
                              </Button>
                            )}
                            {item3.text &&
                              item3.text.length &&
                              item3.text.map((item4, index4) => (
                                <div
                                  key={index4 + 100000}
                                  className={css.textDiv}
                                  style={item4.style}>
                                  <span
                                    dangerouslySetInnerHTML={{ __html: item4.name }}
                                    style={{ whiteSpace: 'pre-wrap' }}
                                  />

                                  {item4.dataSource &&
                                    templateMap[
                                      `attr${index}_${index2}_${index3}_${index4}`
                                    ] &&
                                    templateRender(
                                      templateMap[
                                        `attr${index}_${index2}_${index3}_${index4}`
                                      ],
                                    )}
                                  {item4.dataSource && (
                                    <Button
                                      onClick={() =>
                                        showDialog(
                                          `attr${index}_${index2}_${index3}_${index4}`,
                                        )
                                      }>
                                      添加属性
                                    </Button>
                                  )}
                                </div>
                              ))}
                          </td>
                        ))}
                      {item2.data.emptydata &&
                        item2.data.emptydata.length > 0 &&
                        item2.data.emptydata.map((_item3, index3) => {
                          return (
                            <td
                              key={index3 + 2000}
                              colSpan={1}
                              data-index={index3}
                              className="empty">
                              <span data-index={-888}></span>
                            </td>
                          );
                        })}
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
            {item.footer && item.footer.flag && (
              <table
                className={css.printSubtitleContent}
                cellSpacing=""
                cellPadding="10"
                style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={item.footer.style} className={'subtitle-container'}>
                      <span
                        className="tableData"
                        data-index={-888}
                        style={{ whiteSpace: 'pre-wrap' }}
                        dangerouslySetInnerHTML={{ __html: item.footer.name }}
                      />
                      {item.footer.dataSource &&
                        templateMap[`attr${index}_footer`] &&
                        templateRender(templateMap[`attr${index}_footer`])}
                      {item.footer.dataSource && (
                        <Button onClick={() => showDialog(`attr${index}_footer`)}>
                          添加属性
                        </Button>
                      )}
                      {item.footer.text &&
                        item.footer.text.length &&
                        item.footer.text.map((footerItem, footerIndex) => (
                          <div
                            key={footerIndex + 100000}
                            className={css.textDiv}
                            style={footerItem.style}>
                            <span
                              data-index={-888}
                              style={{ whiteSpace: 'pre-wrap' }}
                              dangerouslySetInnerHTML={{ __html: footerItem.name }}
                            />
                            {footerItem.dataSource &&
                              templateMap[`attr${index}_footerText_${footerIndex}`] &&
                              templateRender(
                                templateMap[`attr${index}_footerText_${footerIndex}`],
                              )}
                            {footerItem.dataSource && (
                              <Button
                                onClick={() =>
                                  showDialog(`attr${index}_footerText_${footerIndex}`)
                                }>
                                添加属性
                              </Button>
                            )}
                          </div>
                        ))}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
      <Modal
        zIndex={2000}
        width={700}
        title="选择选框是否隐藏"
        open={checkAttrShow}
        onOk={() => {
          const newData = [...mockData];
          newData.forEach((item) => {
            if (targetKeys.includes(item.id)) {
              //隐藏项
              item.hide = true;
            } else {
              //显示项
              item.hide = false;
            }
          });
          setMockData([...newData]);
          setCheckAttrShow(false);
        }}
        onCancel={() => setCheckAttrShow(false)}>
        <Transfer
          listStyle={{
            width: 500,
            height: 300,
          }}
          dataSource={mockData}
          showSearch
          rowKey={(record) => record.id}
          titles={['显示', '隐藏']}
          targetKeys={targetKeys}
          selectedKeys={selectedKeys}
          onChange={onChange}
          onSelectChange={onSelectChange}
          render={(item) => item.text}
        />
      </Modal>
      <Modal
        zIndex={2000}
        width={700}
        title="选择子表字段"
        open={formAttrShow}
        onOk={() => {
          const newData = [
            { id: 1, name: '序号', valueType: '数值型', hide: false },
            ...mockFormData,
          ];
          newData.forEach((item) => {
            if (targetFormKeys.includes(item.id)) {
              //隐藏项
              item.hide = true;
            } else {
              //显示项
              item.hide = false;
            }
          });
          setMockFormData([...newData]);
          // formKey
          const newTemplateMap = templateMap;
          newTemplateMap[formKey].attributes = newData;
          resource.printData.attributes.forEach((cur: any) => {
            if (cur.title == title) {
              cur[formKey] = newTemplateMap[formKey];
            }
          });
          const index = formKey.substring(4);
          const indexArr = index.split('_');
          const subNewData = newData.filter((item) => !item.hide);
          subNewData.forEach((item) => {
            item.width = 100 / subNewData.length;
          });

          setTemplateMap((prevState: any) => ({
            ...prevState,
            [formKey]: newTemplateMap[formKey],
          }));
          setFormAttrShow(false);
          const flag: boolean[][] = subTableflag;
          flag[Number(indexArr[0])][Number(indexArr[1])] = true;
          setSubTableflag(flag);
        }}
        onCancel={() => setFormAttrShow(false)}>
        <Transfer
          listStyle={{
            width: 500,
            height: 300,
          }}
          showSearch
          dataSource={mockFormData}
          rowKey={(record) => record.id}
          titles={['显示', '隐藏']}
          targetKeys={targetFormKeys}
          selectedKeys={selectedKeys2}
          onChange={onChange2}
          onSelectChange={onSelectChange2}
          render={(item) => item.name}
        />
      </Modal>
      <Modal
        destroyOnClose
        title={'选择表单属性'}
        width={700}
        open={attrShow}
        bodyStyle={{
          border: 'none',
          padding: 0,
          marginLeft: '32px',
          marginRight: '32px',
        }}
        onOk={() => {
          const parintCurrentData = resource.printData.attributes.filter((item: any) => {
            return item.title == title;
          });
          if (parintCurrentData.length > 0) {
            resource.printData.attributes.forEach((item: any) => {
              if (item.title == title) {
                if (target) {
                  item[nowkey] = target;
                } else {
                  delete item[nowkey];
                }
              }
            });
          } else {
            if (target) {
              resource.printData.attributes.push({ [nowkey]: target, title: title });
            }
          }
          setTemplateMap((prevState: any) => ({
            ...prevState,
            [nowkey]: target,
          }));
          setAttrShow(false);
        }}
        onCancel={() => setAttrShow(false)}>
        <Space direction="vertical" size={15}>
          <SelectBox
            label="目标对象"
            labelMode="floating"
            value={target?.xfield?.caption}
            showClearButton
            width={600}
            displayExpr={(item) => item?.xfield?.caption}
            valueExpr={(item) => item?.xfield?.caption}
            dataSource={fields}
            itemRender={(item) => (
              <span title={item?.xfield?.caption}>{item?.xfield?.caption}</span>
            )}
            onSelectionChanged={(e) => {
              // 判断是否是选择框，如果是选择框的话那么再来一个弹窗可以选择字段隐藏和显示的。
              if (e.selectedItem && e.selectedItem.valueType == '选择型') {
                // 给一个弹窗
                changeCheckAttrShow(true, e.selectedItem.lookups);
              }
              setTarget(e.selectedItem);
            }}
          />
        </Space>
      </Modal>
      <Modal
        z-index="2500"
        title="子表字段配置"
        open={subTableNameShow}
        onCancel={() => setSubTableNameShow(false)}
        footer={[
          <Button key="back" onClick={() => setSubTableNameShow(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              templateMap[formKey].attributes.forEach((item: any, index: number) => {
                if (item.hide) {
                  delete item.hide;
                  delete item.width;
                  if (item.height) {
                    delete item.height;
                  }
                }
                if (item.id === 1 && item.name === '序号') {
                  //移除该项
                  templateMap[formKey].attributes.splice(index, 1);
                }
              });
              const flag: boolean[][] = subTableflag;
              flag[tableListIndex.index][tableListIndex.index2] = false;
              setSubTableflag(flag);
              setSubTableNameShow(false);
            }}>
            返回选择字段
          </Button>,
          <Button
            key="link"
            type="primary"
            onClick={() => {
              const checkForm = templateMap[formKey].attributes.filter(
                (item: { hide: any }) => !item.hide,
              )[tableListIndex.subindex];
              if (checkForm.valueType == '分类型') {
                if (radioValue2 == 1) {
                  if (checkForm.parentCheck) {
                    delete checkForm.parentCheck;
                  }
                } else {
                  checkForm.parentCheck = treeIndexNumber;
                }
              } else if (checkForm.valueType == '选择型') {
                if (radioValue == 1) {
                  if (checkForm.checkTrue) {
                    delete checkForm.checkTrue;
                  }
                } else {
                  checkForm.checkTrue = true;
                }
              }
              setTemplateMap((prevState: any) => ({
                ...prevState,
                [formKey]: templateMap[formKey],
              }));
              setSubTableNameShow(false);
            }}>
            确认配置
          </Button>,
        ]}
        onOk={() => {
          setSubTableNameShow(false);
        }}>
        {subTableNameShow && (
          <div>
            <div
              className="props-header"
              style={{ textAlign: 'center', marginBottom: '30px' }}>
              <span className="header-title">
                {
                  templateMap[formKey].attributes.filter(
                    (item: { hide: any }) => !item.hide,
                  )[tableListIndex.subindex].name
                }
              </span>
              <Tag color="processing" className="header-kind">
                {
                  templateMap[formKey].attributes.filter(
                    (item: { hide: any }) => !item.hide,
                  )[tableListIndex.subindex].valueType
                }
              </Tag>
            </div>
            <div className="props-content">
              <div className="page-element-props-item">
                <div
                  className={'item-label'}
                  style={{ width: '150px', textAlign: 'center' }}>
                  宽度
                </div>
                <InputNumber
                  style={{ width: '100px', flex: 'none' }}
                  min={1}
                  max={100}
                  value={
                    templateMap[formKey].attributes.filter(
                      (item: { hide: any }) => !item.hide,
                    )[tableListIndex.subindex].width
                  }
                  onChange={(e) => onChangeNumber(e, 'width')}
                  addonAfter="%"
                />
              </div>
              <div className="page-element-props-item">
                <div
                  className={'item-label'}
                  style={{ width: '150px', textAlign: 'center' }}>
                  高度
                </div>
                <InputNumber
                  style={{ width: '100px', flex: 'none' }}
                  min={1}
                  max={100}
                  value={
                    templateMap[formKey].attributes.filter(
                      (item: { hide: any }) => !item.hide,
                    )[tableListIndex.subindex].height || 50
                  }
                  onChange={(e) => onChangeNumber(e, 'height')}
                  addonAfter="px"
                />
              </div>
              {templateMap[formKey].attributes.filter(
                (item: { hide: any }) => !item.hide,
              )[tableListIndex.subindex].valueType == '分类型' && (
                <div className="page-element-props-item">
                  <div
                    className={'item-label'}
                    style={{ width: '150px', textAlign: 'center' }}>
                    类型设置
                  </div>
                  <Radio.Group onChange={onRadioChange2} value={radioValue2}>
                    <Radio value={1}>默认返回</Radio>
                    <Radio value={2}>
                      选择返回{radioValue2 === 2 ? `${treeIndexNumber}层` : ''}
                    </Radio>
                  </Radio.Group>
                </div>
              )}
              {templateMap[formKey].attributes.filter(
                (item: { hide: any }) => !item.hide,
              )[tableListIndex.subindex].valueType == '选择型' && (
                <div className="page-element-props-item">
                  <div
                    className={'item-label'}
                    style={{ width: '150px', textAlign: 'center' }}>
                    类型设置
                  </div>
                  <Radio.Group onChange={onRadioChange} value={radioValue}>
                    <Radio value={1}>自由设定</Radio>
                    <Radio value={2}>选择设定</Radio>
                  </Radio.Group>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
      <Modal
        z-index="2500"
        title="分类合计字段配置"
        open={sumNameDialog}
        onCancel={() => setSumNameDialog(false)}
        footer={[
          <Button key="back" onClick={() => setSumNameDialog(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              delete templateMap[formKey];
              setTemplateMap(templateMap);
              setSumNameDialog(false);
            }}>
            初始化
          </Button>,
          <Button
            key="link"
            type="primary"
            onClick={() => {
              setSumNameDialog(false);
            }}>
            确认配置
          </Button>,
        ]}
        onOk={() => {
          setSumNameDialog(false);
        }}>
        {sumNameDialog && (
          <div>
            <div
              className="props-header"
              style={{ textAlign: 'center', marginBottom: '30px' }}>
              <span className="header-title">
                {templateMap[formKey].attributes[tableListIndex.subindex].name}
              </span>
              <Tag color="processing" className="header-kind">
                {templateMap[formKey].attributes[tableListIndex.subindex].valueType}
              </Tag>
            </div>
            <div className="props-content">
              <div className="page-element-props-item">
                <div
                  className={'item-label'}
                  style={{ width: '150px', textAlign: 'center' }}>
                  宽度
                </div>
                <InputNumber
                  style={{ width: '100px', flex: 'none' }}
                  min={1}
                  max={100}
                  value={templateMap[formKey].attributes[tableListIndex.subindex].width}
                  onChange={(e) => onChangeNumber(e, 'width')}
                  addonAfter="%"
                />
              </div>
              <div className="page-element-props-item">
                <div
                  className={'item-label'}
                  style={{ width: '150px', textAlign: 'center' }}>
                  高度
                </div>
                <InputNumber
                  style={{ width: '100px', flex: 'none' }}
                  min={1}
                  max={100}
                  value={
                    templateMap[formKey].attributes[tableListIndex.subindex].height || 50
                  }
                  onChange={(e) => onChangeNumber(e, 'height')}
                  addonAfter="px"
                />
              </div>

              <div className="page-element-props-item">
                <div
                  className={'item-label'}
                  style={{ width: '150px', textAlign: 'center' }}>
                  副键数值排序
                </div>
                <InputNumber
                  style={{ width: '100px', flex: 'none' }}
                  min={1}
                  max={100}
                  value={templateMap[formKey].attributes[tableListIndex.subindex].sort}
                  onChange={(e) => onChangeNumber(e, 'sort')}
                />
              </div>

              {Object.prototype.hasOwnProperty.call(
                templateMap[formKey].attributes[tableListIndex.subindex],
                'addonAfter',
              ) && (
                <div className="page-element-props-item">
                  <div
                    className={'item-label'}
                    style={{ width: '150px', textAlign: 'center' }}>
                    单位
                  </div>
                  <Input
                    style={{ width: '100px', flex: 'none' }}
                    value={
                      templateMap[formKey].attributes[tableListIndex.subindex].addonAfter
                    }
                    onChange={(e) => {
                      templateMap[formKey].attributes[
                        tableListIndex.subindex
                      ].addonAfter = e.target.value;
                      setTemplateMap((prevState: any) => ({
                        ...prevState,
                        [formKey]: templateMap[formKey],
                      }));
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
      <Modal
        destroyOnClose
        title={'选择分类返回'}
        open={treeShowFlag}
        onOk={() => {
          setTreeShowFlag(false);
        }}
        onCancel={() => setTreeShowFlag(false)}>
        <div className="page-element-props-item">
          <div className={'item-label'} style={{ width: '150px', textAlign: 'center' }}>
            选择第几级返回
          </div>
          <InputNumber
            style={{ width: '100px', flex: 'none' }}
            min={1}
            max={100}
            value={treeIndexNumber}
            onChange={(e) => onChangeTreeIndexNumber(e)}
          />
        </div>
        <div className="page-element-props-item">
          <Tree treeData={treeData} />
        </div>
      </Modal>
      <Modal
        width={900}
        destroyOnClose
        title={'选择分类合计属性'}
        open={sumShow}
        onOk={() => {
          //在这里集成表单
          if (!sumPrimaryValue) {
            message.error('主键必须选择');
            return false;
          }
          const primaryFilter = fields.filter(
            (field: any) => field.id == sumPrimaryValue,
          );
          const sumFilter = [
            { id: 1, name: '序号', valueType: '数值型' },
            ...primaryFilter,
            ...foreignCheckedKeysList,
          ];
          const index = nowkey.substring(4);
          const indexArr = index.split('_');
          sumFilter.forEach((item, index) => {
            item.width = 100 / sumFilter.length;
            item.sort = index + 1;
          });
          const parintCurrentData = resource.printData.attributes.filter((cur: any) => {
            return cur.title == title;
          });
          if (parintCurrentData.length > 0) {
            resource.printData.attributes.forEach((cur: any) => {
              if (cur.title == title) {
                cur[`attr${Number(indexArr[0])}_${Number(indexArr[1])}_sum`] = {
                  attributes: sumFilter,
                  level: treeIndexNumber,
                };
              }
            });
          } else {
            resource.printData.attributes.push({
              [`attr${Number(indexArr[0])}_${Number(indexArr[1])}_sum`]: {
                attributes: sumFilter,
                level: treeIndexNumber,
              },
              title: title,
            });
          }
          setTemplateMap((prevState: any) => ({
            ...prevState,
            [nowkey]: { attributes: sumFilter, level: treeIndexNumber },
          }));
          setSumShow(false);
        }}
        onCancel={() => setSumShow(false)}>
        <div className="page-element-props-item">
          <div
            className={'item-label is-required'}
            style={{ width: '150px', textAlign: 'center' }}>
            主键
          </div>
          <Button type="primary" onClick={() => showSumDialogKey(`primary`)}>
            添加主键
          </Button>
          {sumPrimaryValue && (
            <div>
              主键已选择：
              {
                fields.filter((field: any) => field.id == sumPrimaryValue)[0].xfield
                  .caption
              }
            </div>
          )}
          {sumPrimaryValue && (
            <div>
              <Tag color="processing" className="header-kind">
                选择主键层级
              </Tag>
              <InputNumber
                style={{ width: '100px', flex: 'none' }}
                min={1}
                max={100}
                disabled
                value={treeIndexNumber}
              />
              <Button type="link" onClick={() => setTreeShowFlag(true)}>
                查看更改层级
              </Button>
            </div>
          )}
        </div>
        <div className="page-element-props-item">
          <div className={'item-label'} style={{ width: '150px', textAlign: 'center' }}>
            副键
          </div>
          <Button type="primary" onClick={() => showSumDialogKey(`foreign`)}>
            添加副键
          </Button>
          {foreignCheckedKeysList.length > 0 && (
            <div>
              已选择:
              <div
                style={{
                  backgroundColor: '#ccc',
                  padding: '20px',
                  overflow: 'scroll',
                  width: '600px',
                  height: '100px',
                  display: 'flex',
                  flexWrap: 'wrap',
                }}>
                {foreignCheckedKeysList.map((item: any, index: number) => {
                  return (
                    <div key={item.id} style={{ marginRight: '10px' }}>
                      {item.xfield.caption}
                      {index === foreignCheckedKeysList.length - 1 ? '' : '、'}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>
      <Modal
        destroyOnClose
        title={`选择${sumKey == 'primary' ? '主键' : '副键'}属性`}
        open={sumShowKey}
        onOk={() => {
          if (sumKey == 'primary') {
            const sumCheckFields: any = sumFields.filter(
              (cur: any) => cur.id == sumPrimaryValue,
            );
            const tree = buildTree(sumCheckFields[0].lookups, undefined, 1);
            const treeData = buildTreeData(tree);
            setTreeData(treeData);
          }
          setSumShowKey(false);
        }}
        onCancel={() => setSumShowKey(false)}>
        {sumKey == 'primary' ? (
          <div className="page-element-props-item">
            <Radio.Group onChange={onChangePrimaryKey} value={sumPrimaryValue}>
              {sumFields.length > 0 &&
                sumFields.map((item: any) => {
                  return (
                    <Radio key={item.id} value={item.id}>
                      {item.xfield.caption}
                    </Radio>
                  );
                })}
            </Radio.Group>
          </div>
        ) : (
          <div className="page-element-props-item">
            <CheckboxGroup
              options={fields
                .filter((cur: any) => cur.valueType === '数值型')
                .filter((item: any) => keysForms.includes(item.xfield.formId))
                .map((item: any) => ({
                  label: item.xfield.caption,
                  value: item.id,
                }))}
              value={foreignCheckedList}
              onChange={onChangeForeignKey}
            />
          </div>
        )}
      </Modal>
    </>
  );
};
export default Template1;
