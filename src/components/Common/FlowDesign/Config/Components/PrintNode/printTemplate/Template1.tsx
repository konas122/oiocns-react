import React, { FC, useEffect, useState } from 'react';
import './index.less';
import css from './designer.module.less';
import { IWorkTask, TaskStatus, TaskStatusZhMap } from '@/ts/core';
import orgCtrl from '@/ts/controller';
import { schema } from '@/ts/base';
import QrCode from 'qrcode.react';
import { formatZhDate, findNodeByKey } from '@/utils/tools';
import { isSnowflakeId } from '@/ts/base/common';
interface IProps {
  printData: any;
  current: IWorkTask;
  print: any;
  loading: () => void;
  styleTemplate: string;
}

const Template1: FC<IProps> = ({ printData, current, loading, styleTemplate, print }) => {
  const [subTableFlag, setSubTableFlag] = useState(false);
  const [sameRenderType] = useState<string[]>(['货币型', '描述型', '时间型']);
  const [items, setItems] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<{ [key: string]: any }>({});
  const [cheChangeAttributes, setCheChangeAttributes] = useState<any[]>([]);
  const [sumAttributes, setSumAttributes] = useState<any[]>([]);
  useEffect(() => {
    //变更处理
    let changeArr: any[] = [];
    let changeAttributes: any = [];
    let updatedChangeArr: any[] = [];
    current.instanceData &&
      current.name &&
      current.name.indexOf('变更') > -1 &&
      Object.entries(current.instanceData.data).forEach(([_key, value]) => {
        if (value[0].before.length > 0) {
          current.instanceData?.node.detailForms.forEach((item: any) => {
            if (item.id === _key) {
              changeAttributes = item.attributes;
            }
          });

          //比较after和before中的数组的id值，确认是弄的同一个数据
          value[0].before.forEach((item: any) => {
            value[0].after.forEach((item2: any) => {
              if (item.id === item2.id) {
                let Obj = {};
                //找到相同的数据
                for (const key in item2) {
                  if (!isNaN(Number(key))) {
                    changeAttributes.forEach((att: any) => {
                      //再添加编号和资产名称
                      if (['卡片编号', '资产编号'].includes(att.name) && att.id == key) {
                        Obj = {
                          ...Obj,
                          ...{ CardID: item2[key] },
                        };
                      }
                      if (att.name == '资产名称' && att.id == key) {
                        Obj = {
                          ...Obj,
                          ...{ IDName: item2[key] },
                        };
                      }
                    });
                    if (item[key] !== item2[key]) {
                      const type = changeAttributes.filter((cur: any) => cur.id == key)[0]
                        .property.valueType;
                      if (type === '数值型') {
                        changeArr.push({
                          ...Obj,
                          key,
                          before: item[key] !== undefined ? formatNumber(item[key]) : 0,
                          after: item2[key] !== undefined ? formatNumber(item2[key]) : 0,
                        });
                      } else if (type === '日期型') {
                        changeArr.push({
                          ...Obj,
                          key,
                          before: item[key]
                            ? formatZhDate(item[key], 'YYYY年MM月DD日')
                            : item[key],
                          after: item2[key]
                            ? formatZhDate(item2[key], 'YYYY年MM月DD日')
                            : item2[key],
                        });
                      } else if (type === '用户型') {
                        changeArr.push({
                          ...Obj,
                          key,
                          before:
                            orgCtrl.user.findMetadata<schema.XEntity>(item[key])?.name ??
                            item[key],
                          after:
                            orgCtrl.user.findMetadata<schema.XEntity>(item2[key])?.name ??
                            item2[key],
                        });
                      } else if (type === '分类型' || type === '选择型') {
                        const curData = current.instanceData!.fields[_key].filter(
                          (cur: any) => cur.id == key,
                        )[0];
                        changeArr.push({
                          ...Obj,
                          key,
                          before:
                            item[key] &&
                            curData.lookups &&
                            curData.lookups.filter((cur: any) => cur.value == item[key])
                              .length > 0
                              ? curData.lookups.filter(
                                  (cur: any) => cur.value == item[key],
                                )[0].text
                              : item[key],
                          after:
                            item2[key] &&
                            curData.lookups &&
                            curData.lookups.filter((cur: any) => cur.value == item2[key])
                              .length > 0
                              ? curData.lookups.filter(
                                  (cur: any) => cur.value == item2[key],
                                )[0].text
                              : item2[key],
                        });
                      } else {
                        changeArr.push({
                          ...Obj,
                          key,
                          before: item[key],
                          after: item2[key],
                        });
                      }
                    }
                  }
                }
              }
            });
          });
          updatedChangeArr = changeArr.map((item: any) => {
            changeAttributes.forEach((item2: any) => {
              if (item.key === item2.id) {
                item = {
                  ...item,
                  ...item2,
                };
              }
            });
            return item;
          });
          const beforeNameData: any = [];
          for (const key in current.instanceData!.fields) {
            beforeNameData.push(current.instanceData!.fields[key]);
          }
          updatedChangeArr.forEach((item: any) => {
            if (
              (item.valueType == '分类型' || item.property.valueType == '分类型') &&
              current.instanceData
            ) {
              const curData = beforeNameData
                .flat()
                .filter((item2: any) => item2.id == item.id)[0];
              if (curData.lookups.length > 0) {
                item.before = curData.lookups.filter(
                  (item3: any) => item3.value == item.before,
                )[0]?.text;
                item.after = curData.lookups.filter(
                  (item3: any) => item3.value == item.after,
                )[0]?.text;
              }
            }
          });
          setCheChangeAttributes(updatedChangeArr);
        }
      });
    //打印样式和数据源处理
    print &&
      print.forEach((item: any) => {
        if (item.id === printData.type) {
          let newItems = item.table;
          setItems(newItems);
          let newAttributes: { [key: string]: any } = {};
          printData.attributes.forEach((item: any) => {
            if (item.title === printData.type) {
              newAttributes = item;
            }
          });
          Object.entries(newAttributes).forEach(([key, value]) => {
            if (value && value.typeName == '表单') {
              setSubTableFlag(true);
            }
            if (key.includes('sum')) {
              //分类合计
              //拿到分类合计，找到这个合计中的分类项目
              let sumArr: any = [];
              let sumInfo = '';
              let sumIDS: any = [];
              let treeData: any = [];
              value.attributes.forEach((item: any) => {
                sumIDS.push(item.id);
                if (item.valueType == '分类型') {
                  sumInfo = item.id;
                  //找到分类项目
                  treeData = buildTree(item.lookups, undefined, 1); //转化成树结构
                  //拿到主表的信息，把提交上来的表单数据去掉主表，剩下的就是子表的提交数据
                  let primaryIDs: any = [];
                  current.instanceData?.node.primaryForms.forEach((cur: any) => {
                    primaryIDs.push(cur.id);
                  });
                  //过滤掉主表的数据,拿到子表的提交数据
                  Object.entries(current.instanceData!.data).forEach(([_obj, data]) => {
                    if (!primaryIDs.includes(_obj)) {
                      //不是主表的东西
                      sumArr.push({ detail: data });
                    }
                  });
                }
              });
              let sumIDSInfos: any = [];
              //拿到这个分类项目，找到需要合计的层级
              sumArr.forEach((item: any) => {
                if (item.detail.length > 0) {
                  item.detail[0].after.forEach((item2: any) => {
                    if (item2[sumInfo]) {
                      let sumObjArr: any = [];
                      sumIDS.forEach((item3: any) => {
                        if (item3 == 3) {
                          sumObjArr.push({
                            num: 1,
                          });
                        }
                        if (item3 != sumInfo && item3 != 1 && item3 != 3) {
                          sumObjArr.push({
                            [item3]: item2[item3] ?? 0,
                          });
                        }
                        if (item3 == sumInfo) {
                          const text = findParentNodeByIdAndLevel(
                            treeData,
                            item2[item3],
                            value.level,
                          );
                          sumObjArr.push({
                            mainKey: {
                              id: text && text.id,
                              name: text && text.text,
                            },
                          });
                        }
                      });
                      sumIDSInfos.push(sumObjArr);
                    }
                  });
                }
              });
              const Data = mergeData(sumIDSInfos);
              setSumAttributes(Data);
            }
          });
          setAttributes(newAttributes);
        }
      });
  }, []);
  const mergeData = (data: any[][]): any[] => {
    const mergedData = data.reduce((acc: any, item: any) => {
      const id = item[0].mainKey.id;
      if (!acc[id]) {
        acc[id] = {
          ...item[0], // mainKey 对象
          values: {},
        };
      }

      for (let i = 1; i < item.length; i++) {
        const key = Object.keys(item[i])[0];
        if (!acc[id].values[key]) {
          acc[id].values[key] = 0;
        }
        acc[id].values[key] = dynamicPrecisionAdd(
          item[i][key] === undefined ? 0 : Number.isNaN(item[i][key]) ? 0 : item[i][key],
          acc[id].values[key],
        );
      }

      return acc;
    }, {});
    return Object.values(mergedData).map((item: any) => {
      const { values, ...rest } = item;
      return {
        ...rest,
        ...values,
      };
    });
  };
  const dynamicPrecisionAdd = (a: any, b: any) => {
    const numbers = [a, b];
    let maxPrecision = 0;
    numbers.forEach((num) => {
      const numStr = num.toString();
      const decimalIndex = numStr.indexOf('.');
      const precision = decimalIndex === -1 ? 0 : numStr.length - decimalIndex - 1;
      maxPrecision = Math.max(maxPrecision, precision);
    });

    const multiplier = Math.pow(10, maxPrecision);
    let sum = 0;
    numbers.forEach((num) => {
      sum += num * multiplier;
    });

    return sum / multiplier;
  };
  const formatNumber = (num: Number) => {
    return Number(Number(num).toFixed(2));
  };
  const Tab: FC<any> = ({ value }) => {
    const attrsObj = attributes[value];
    if (!attrsObj) {
      return <span></span>;
    }
    const [userDetail, setUserDetail] = useState<{ [key: string]: string }>({});
    const type = attrsObj['valueType'];
    const curData = current.instanceData?.data || [];
    const attrXfieldId: string = attrsObj['xfield']?.name.split('-')[0];
    let fieldAfter = [];
    if (curData[attrXfieldId]) {
      if (attrXfieldId == current.instanceData?.node.primaryForms[0].id) {
        //主表
        fieldAfter = curData[attrXfieldId][0]?.after;
      } else {
        fieldAfter = curData[attrXfieldId].filter(
          (i) => i.nodeId == current.instanceData?.node.id,
        )[0];
      }
    }
    const fieldValue = fieldAfter[0]?.[attrsObj['id']];
    useEffect(() => {
      if (type === '用户型') {
        (async () => {
          const res = orgCtrl.user.findMetadata<schema.XEntity>(fieldValue);
          setUserDetail({ ...userDetail, [fieldValue]: res?.name });
        })();
      }
    }, []);
    if (type === '数值型') {
      return <span>{fieldValue !== undefined ? formatNumber(fieldValue) : 0}</span>;
    }
    if (~sameRenderType.indexOf(type)) {
      if (
        attrsObj.valueType === '描述型' &&
        (attrsObj.id === '111' || attrsObj.id === '333' || attrsObj.id === '444')
      ) {
        return <span>{attrsObj.name}</span>;
      }
      if (attrsObj.valueType === '描述型' && attrsObj.id === '222') {
        return <span>{attrsObj.status < 200 ? '通过' : '拒绝'}</span>;
      }
      if (attrsObj.valueType === '时间型' && attrsObj.id === '888') {
        return <span>{attrsObj.name}</span>;
      }
      return <span>{fieldValue}</span>;
    }
    if (type == '日期型') {
      return <span>{fieldValue ? formatZhDate(fieldValue, 'YYYY年MM月DD日') : ''}</span>;
    } else if (type === '引用型') {
      const parentObj = JSON.parse(fieldValue);
      const newParentObj = parentObj.map((item: any) => {
        return item.name;
      });
      const parentNodeText = newParentObj.join('、');
      return <span>{parentNodeText}</span>;
    } else if (type === '选择型') {
      const lookups =
        attrsObj.lookups != undefined && attrsObj.lookups.length > 0
          ? attrsObj.lookups
          : current.instanceData!.fields[attrsObj.xfield.formId].filter(
              (obj) => obj.id == attrsObj.id,
            )[0].lookups;
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {lookups
            .filter((item: any) => !item.hide)
            .map((lookup: any) => (
              <label
                className="print-checkbox-label"
                key={lookup.id}
                style={{ marginRight: '30px', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  value={lookup.value}
                  checked={
                    attrsObj.widget == '多选框'
                      ? current.instanceData!.data[
                          attrsObj.xfield.name.split('-')[0]
                        ][0].after?.[0]?.[attrsObj.id].includes(lookup.value)
                      : current.instanceData!.data[attrsObj.xfield.name.split('-')[0]][0]
                          .after?.[0]?.[attrsObj.id] === lookup.value
                  }
                />
                <span style={{ verticalAlign: 'middle', marginLeft: '8px' }}>
                  {lookup.text}
                </span>
              </label>
            ))}
        </div>
      );
    } else if (type === '分类型') {
      const lookups =
        attrsObj.lookups != undefined && attrsObj.lookups.length > 0
          ? attrsObj.lookups
          : current.instanceData!.fields[attrsObj.xfield.formId].filter(
              (obj) => obj.id == attrsObj.id,
            )[0].lookups;
      let flText = '';
      lookups.forEach((item: any) => {
        if (
          item.value ==
          current.instanceData!.data[attrsObj.xfield.name.split('-')[0]][0].after?.[0]?.[
            attrsObj.id
          ]
        ) {
          flText = item.text;
        }
      });
      return <span>{flText}</span>;
    } else if (type === '用户型') {
      return <span>{userDetail[fieldValue]}</span>;
    } else if (type === '输出型') {
      try {
        if (attrsObj.value) {
          return <span>{attrsObj.value}</span>;
        }

        if (attrsObj.shouldReassignValue) {
          if (attrsObj.field === 'company') {
            return <span>{current.belong.metadata.name}</span>;
          }

          if (attrsObj.field === 'workflowDuration') {
            return (
              <span>{formatZhDate(current.updateTime, 'YYYY年MM月DD日 HH:mm:ss')}</span>
            );
          }

          if (
            (current as IWorkTask).instance &&
            (current as IWorkTask).instance!.tasks &&
            (current as IWorkTask).instance!.tasks!.length > 0
          ) {
            const item = findNodeByKey(
              current!.instanceData!.node,
              attrsObj.extra.id,
              'primaryId',
            );
            if (item) {
              const taskData: any = (current as IWorkTask).instance!.tasks!.find(
                (v) => v.nodeId === item.id && v.records && v.records.length > 0,
              );
              if (taskData) {
                if (attrsObj.field) {
                  const taskItemData = (taskData.records as any)![
                    taskData.records?.length - 1
                  ];
                  const itemValue = taskItemData[attrsObj.field];
                  if (taskItemData?.status == TaskStatus.ApprovalStart) {
                    switch (attrsObj.field) {
                      case 'createUser':
                        if (itemValue && isSnowflakeId(itemValue)) {
                          const userProfile =
                            orgCtrl.user.findMetadata<schema.XEntity>(itemValue);
                          return <span>{userProfile?.name}</span>;
                        }
                        return <span></span>;
                      case 'updateTime':
                        return (
                          <span>
                            {formatZhDate(itemValue, 'YYYY年MM月DD日 HH:mm:ss')}
                          </span>
                        );
                      case 'status':
                        return <span>{TaskStatusZhMap[itemValue] ?? '审核中'}</span>;
                      case 'comment':
                        return <span>{itemValue ? itemValue : '同意。'}</span>;
                      default:
                        return <span>{taskItemData}</span>;
                    }
                  }
                }
              }
            }
          }
        }
      } catch (error) {}
    }
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
  const treeFind = (tree: { children: any }, targetId: any, result = null) => {
    if (!tree.children) return result;
    for (const child of tree.children) {
      if (child.value === targetId) {
        return child;
      } else {
        result = treeFind(child, targetId, result);
      }
    }
    return result;
  };
  const findParentNodeByIdAndLevel = (
    tree: any[],
    selectedId: any,
    targetLevel: number,
    currentLevel = 1,
  ) => {
    for (let node of tree) {
      if (node.value == selectedId) {
        return node;
      } else {
        if (currentLevel === targetLevel && node.children && treeFind(node, selectedId)) {
          return node;
        }
        if (node.children.length > 0) {
          const parentNode: any = findParentNodeByIdAndLevel(
            node.children,
            selectedId,
            targetLevel,
            currentLevel + 1,
          );
          if (parentNode) {
            return parentNode;
          }
        }
      }
    }
    return null;
  };
  const SubTab: FC<any> = ({ id, valueType, value, checkKey }) => {
    const [userDetail, setUserDetail] = useState<{ [key: string]: string }>({});
    useEffect(() => {
      if (valueType === '用户型') {
        (async () => {
          const res = orgCtrl.user.findMetadata<schema.XEntity>(value);
          setUserDetail({ ...userDetail, [value]: res?.name });
        })();
      }
    }, []);
    const attributesData = attributes[id].attributes;
    const attrsObj = attributesData.filter((item: any) => item.id == checkKey)[0];
    if (valueType == '日期型') {
      return <span>{value ? formatZhDate(value, 'YYYY年MM月DD日') : ''}</span>;
    } else if (valueType === '数值型') {
      return <span>{value !== undefined ? formatNumber(value) : 0}</span>;
    } else if (valueType === '引用型') {
      const parentObj = JSON.parse(value);
      const newParentObj = parentObj.map((item: any) => {
        return item.name;
      });
      const parentNodeText = newParentObj.join('、');
      return <span>{parentNodeText}</span>;
    } else if (valueType == '选择型') {
      const isLookups =
        attrsObj.lookups != undefined && attrsObj.lookups.length > 0
          ? attrsObj.lookups
          : current.instanceData!.fields[attrsObj.formId].filter(
              (obj) => obj.id == attrsObj.id,
            )[0].lookups;
      const lookups = attrsObj.checkTrue
        ? isLookups.filter((item: any) =>
            attrsObj.widget == '多选框'
              ? value.includes(item.value)
              : value === item.value,
          )
        : isLookups;
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {lookups
            .filter((item: any) => !item.hide)
            .map((lookup: any) => (
              <label
                className="print-checkbox-label"
                key={lookup.id}
                style={{ marginRight: '30px', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  value={lookup.value}
                  checked={
                    attrsObj.widget == '多选框'
                      ? value.includes(lookup.value)
                      : value === lookup.value
                  }
                />
                <span style={{ verticalAlign: 'middle', marginLeft: '8px' }}>
                  {lookup.text}
                </span>
              </label>
            ))}
        </div>
      );
    } else if (valueType == '分类型') {
      const lookups =
        attrsObj.lookups != undefined && attrsObj.lookups.length > 0
          ? attrsObj.lookups
          : current.instanceData!.fields[attrsObj.formId].filter(
              (obj) => obj.id == attrsObj.id,
            )[0].lookups;

      if (!attrsObj.parentCheck) {
        let flText = '';
        lookups.forEach((item: any) => {
          if (item.value == value) {
            flText = item.text;
          }
        });
        return <span>{flText}</span>;
      } else {
        const treeData = buildTree(lookups, undefined, 1);
        const parentNode = findParentNodeByIdAndLevel(
          treeData,
          value,
          attrsObj.parentCheck,
        );
        return <span>{parentNode.text}</span>;
      }
    } else if (valueType == '用户型') {
      return <span>{userDetail[value]}</span>;
    }
    return <span></span>;
  };
  useEffect(() => {
    // 添加一个延时来查看下一次渲染时的load值
    //要分辨有没有子表，没有子表的话，加载这个loading方法
    if (!subTableFlag && loading) {
      loading();
    }
  }, [subTableFlag]);
  return (
    <html>
      <head>
        <style>{styleTemplate}</style>
      </head>
      <body>
        <div className="printSection">
          {items.map((item, index) => {
            return (
              <div
                className={index !== 0 ? 'ContentTitle' : ''}
                key={index - 200}
                style={{ position: 'relative' }}>
                {item.qrcode &&
                  item.qrcode!.map((qcitem: any, qcindex: number) => {
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
                {item.title && item.title.flag && (
                  <div className={'head'}>
                    <div
                      className={'Table-title'}
                      style={item.title.style}
                      dangerouslySetInnerHTML={{ __html: item.title.name }}></div>
                  </div>
                )}
                {item.subtitle && item.subtitle.flag && (
                  <table
                    style={{ width: '100%' }}
                    className={css.printSubtitleContent}
                    cellSpacing=""
                    cellPadding="10">
                    <tbody>
                      <tr>
                        <td style={item.subtitle.style} className={'subtitle-container'}>
                          <span
                            className="tableData"
                            data-index={-888}
                            dangerouslySetInnerHTML={{ __html: item.subtitle.name }}
                            style={{ whiteSpace: 'pre-wrap' }}
                          />
                          {item.subtitle.dataSource && (
                            <Tab value={`attr${index}_subtitle`} />
                          )}
                          {item.subtitle.text &&
                            item.subtitle.text.length &&
                            item.subtitle.text.map(
                              (subtitleItem: any, subtitleIndex: number) => (
                                <div
                                  key={subtitleIndex + 100000}
                                  className={css.textDiv}
                                  style={subtitleItem.style}>
                                  <span
                                    data-index={-888}
                                    style={{ whiteSpace: 'pre-wrap' }}
                                    dangerouslySetInnerHTML={{
                                      __html: subtitleItem.name,
                                    }}
                                  />
                                  {subtitleItem.dataSource && (
                                    <Tab
                                      value={`attr${index}_subText_${subtitleIndex}`}
                                    />
                                  )}
                                </div>
                              ),
                            )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
                {cheChangeAttributes.length > 0 && index == 0 && (
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      fontSize: '14px',
                    }}>
                    <div style={{ display: 'flex', width: '100%', height: '50px' }}>
                      <div className="table-cell">序号</div>
                      <div className="table-cell">卡片编号</div>
                      <div className="table-cell">资产名称</div>
                      <div className="table-cell">变更项</div>
                      <div className="table-cell">变更前值</div>
                      <div className="table-cell">变更后值</div>
                    </div>
                    {cheChangeAttributes.map((changeItem: any, changeIndex: number) => (
                      <div
                        style={{ display: 'flex', width: '100%', height: '50px' }}
                        key={changeIndex + 30280}>
                        <div
                          className="table-cell"
                          style={
                            changeIndex == cheChangeAttributes.length - 1 &&
                            item.data.length
                              ? { borderBottom: 'none' }
                              : {}
                          }>
                          {changeIndex + 1}
                        </div>
                        <div
                          className="table-cell"
                          style={
                            changeIndex == cheChangeAttributes.length - 1 &&
                            item.data.length
                              ? { borderBottom: 'none' }
                              : {}
                          }>
                          {changeItem.CardID}
                        </div>
                        <div
                          className="table-cell"
                          style={
                            changeIndex == cheChangeAttributes.length - 1 &&
                            item.data.length
                              ? { borderBottom: 'none' }
                              : {}
                          }>
                          {changeItem.IDName}
                        </div>
                        <div
                          className="table-cell"
                          style={
                            changeIndex == cheChangeAttributes.length - 1 &&
                            item.data.length
                              ? { borderBottom: 'none' }
                              : {}
                          }>
                          {changeItem.name}
                        </div>
                        <div
                          className="table-cell"
                          style={
                            changeIndex == cheChangeAttributes.length - 1 &&
                            item.data.length
                              ? { borderBottom: 'none' }
                              : {}
                          }>
                          {changeItem.before}
                        </div>
                        <div
                          className="table-cell"
                          style={
                            changeIndex == cheChangeAttributes.length - 1 &&
                            item.data.length
                              ? { borderBottom: 'none' }
                              : {}
                          }>
                          {changeItem.after}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <table
                  style={{ width: '100%' }}
                  className={'printContent'}
                  border={1}
                  cellSpacing=""
                  cellPadding="10">
                  <tbody style={item.style}>
                    {item.data.map((item2: any, index2: any) => (
                      <>
                        <tr key={index2} data-index={index2} className={'dynamic-row'}>
                          {item2.data.data &&
                            item2.data.type != 'table' &&
                            item2.data.type != 'sum' &&
                            item2.data.data.map((item3: any, index3: number) => (
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
                                {item3.dataSource && (
                                  <Tab value={`attr${index}_${index2}_${index3}`} />
                                )}
                                {item3.text &&
                                  item3.text.length &&
                                  item3.text.map((item4: any, index4: number) => (
                                    <div
                                      key={index4 + 100000}
                                      className={css.textDiv}
                                      style={item4.style}>
                                      <span
                                        dangerouslySetInnerHTML={{ __html: item4.name }}
                                        style={{ whiteSpace: 'pre-wrap' }}
                                      />
                                      {item4.dataSource && (
                                        <Tab
                                          value={`attr${index}_${index2}_${index3}_${index4}`}
                                        />
                                      )}
                                    </div>
                                  ))}
                              </td>
                            ))}
                          {item2.data.emptydata &&
                            item2.data.emptydata.length > 0 &&
                            item2.data.emptydata.map((_item3: any, index3: number) => {
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
                        {item2.data.type == 'sum' &&
                          attributes[`attr${index}_${index2}_sum`] &&
                          attributes[`attr${index}_${index2}_sum`].attributes.length >
                            0 && (
                            <tr style={{ border: 'none', width: '100%' }}>
                              <td
                                colSpan={item2.data.data[0].colNumber}
                                style={{ padding: 0, border: 0, width: '100%' }}>
                                {attributes[`attr${index}_${index2}_sum`] &&
                                  attributes[`attr${index}_${index2}_sum`].attributes
                                    .length == 0 && <div></div>}
                                {attributes[`attr${index}_${index2}_sum`] &&
                                  attributes[`attr${index}_${index2}_sum`].attributes
                                    .length > 0 && (
                                    <table style={{ width: '100%' }}>
                                      <tbody
                                        style={
                                          item2.data.data[0].style
                                            ? item2.data.data[0].style
                                            : item.style
                                        }>
                                        <tr key={index2 + 19823}>
                                          {attributes[`attr${index}_${index2}_sum`] &&
                                            attributes[
                                              `attr${index}_${index2}_sum`
                                            ].attributes
                                              .sort((a, b) => a.sort - b.sort)
                                              .map(
                                                (
                                                  subdataitem: any,
                                                  subdataindex: number,
                                                ) => (
                                                  <th
                                                    key={subdataindex + 100000}
                                                    style={{
                                                      width: `${subdataitem.width}%`,
                                                      height: `${
                                                        subdataitem.height
                                                          ? subdataitem.height
                                                          : 50
                                                      }px`,
                                                      textAlign: 'center',
                                                      borderLeft:
                                                        subdataindex == 0
                                                          ? 'none'
                                                          : '1px solid black',
                                                      borderTop:
                                                        index2 != 0 &&
                                                        item.data[index2 - 1].data.type ==
                                                          'table'
                                                          ? '1px solid black'
                                                          : 'none',
                                                    }}>
                                                    {subdataitem.name}
                                                    {subdataitem.addonAfter &&
                                                      subdataitem.addonAfter}
                                                  </th>
                                                ),
                                              )}
                                        </tr>
                                        {sumAttributes &&
                                          sumAttributes.length > 0 &&
                                          sumAttributes.map(
                                            (cur: any, curIndex: number) => (
                                              <tr key={index2 + 190823}>
                                                <td
                                                  style={{
                                                    width: `${
                                                      attributes[
                                                        `attr${index}_${index2}_sum`
                                                      ].attributes[0].width
                                                    }%`,
                                                    height: `${
                                                      attributes[
                                                        `attr${index}_${index2}_sum`
                                                      ].attributes[0].height
                                                        ? attributes[
                                                            `attr${index}_${index2}_sum`
                                                          ].attributes[0].height
                                                        : 50
                                                    }px`,
                                                    textAlign: 'center',
                                                    borderTop: '1px solid black',
                                                    borderLeft: 'none',
                                                  }}>
                                                  {curIndex + 1}
                                                </td>
                                                <td
                                                  style={{
                                                    width: `${
                                                      attributes[
                                                        `attr${index}_${index2}_sum`
                                                      ].attributes[1].width
                                                    }%`,
                                                    height: `${
                                                      attributes[
                                                        `attr${index}_${index2}_sum`
                                                      ].attributes[1].height
                                                        ? attributes[
                                                            `attr${index}_${index2}_sum`
                                                          ].attributes[1].height
                                                        : 50
                                                    }px`,
                                                    textAlign: 'center',
                                                    borderTop: '1px solid black',
                                                    borderLeft: '1px solid black',
                                                  }}>
                                                  {cur.mainKey.name}
                                                </td>
                                                {attributes[
                                                  `attr${index}_${index2}_sum`
                                                ] &&
                                                  attributes[
                                                    `attr${index}_${index2}_sum`
                                                  ].attributes
                                                    .slice(2)
                                                    .sort((a, b) => a.sort - b.sort)
                                                    .map(
                                                      (cur2: any, curIndex2: number) => (
                                                        <td
                                                          key={curIndex2 + 92882}
                                                          style={{
                                                            width: `${
                                                              attributes[
                                                                `attr${index}_${index2}_sum`
                                                              ] &&
                                                              attributes[
                                                                `attr${index}_${index2}_sum`
                                                              ].attributes[curIndex2 + 2]
                                                                .width
                                                            }%`,
                                                            height: `${
                                                              attributes[
                                                                `attr${index}_${index2}_sum`
                                                              ] &&
                                                              attributes[
                                                                `attr${index}_${index2}_sum`
                                                              ].attributes[curIndex2 + 2]
                                                                .height
                                                                ? attributes[
                                                                    `attr${index}_${index2}_sum`
                                                                  ] &&
                                                                  attributes[
                                                                    `attr${index}_${index2}_sum`
                                                                  ].attributes[
                                                                    curIndex2 + 2
                                                                  ].height
                                                                : 50
                                                            }px`,
                                                            textAlign: 'center',
                                                            borderTop: '1px solid black',
                                                            borderLeft: '1px solid black',
                                                          }}>
                                                          {formatNumber(cur[cur2.id])}
                                                        </td>
                                                      ),
                                                    )}
                                              </tr>
                                            ),
                                          )}
                                      </tbody>
                                    </table>
                                  )}
                              </td>
                            </tr>
                          )}
                        {item2.data.type == 'table' && (
                          //子表区域
                          <tr style={{ border: 'none', width: '100%' }}>
                            <td
                              colSpan={item2.data.data[0].colNumber}
                              style={{ padding: 0, border: 0, width: '100%' }}>
                              {attributes[`attr${index}_${index2}`] &&
                                attributes[`attr${index}_${index2}`].attributes.filter(
                                  (att: any) => !att.hide,
                                ).length == 0 && <div></div>}
                              {attributes[`attr${index}_${index2}`] &&
                                attributes[`attr${index}_${index2}`].attributes.filter(
                                  (att: any) => !att.hide,
                                ).length > 0 && (
                                  <table style={{ width: '100%' }}>
                                    <tbody
                                      style={
                                        item2.data.data[0].style
                                          ? item2.data.data[0].style
                                          : item.style
                                      }>
                                      <tr key={index2 + 19823}>
                                        {attributes[`attr${index}_${index2}`] &&
                                          attributes[`attr${index}_${index2}`].attributes
                                            .filter((att: any) => !att.hide)
                                            .map(
                                              (
                                                subdataitem: any,
                                                subdataindex: number,
                                              ) => (
                                                <th
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
                                                    borderTop:
                                                      index2 != 0 &&
                                                      (item.data[index2 - 1].data.type ==
                                                        'table' ||
                                                        item.data[index2 - 1].data.type ==
                                                          'sum')
                                                        ? '1px solid black'
                                                        : 'none',
                                                  }}>
                                                  {subdataitem.name}
                                                </th>
                                              ),
                                            )}
                                      </tr>
                                      {current.instanceData?.data[
                                        attributes[`attr${index}_${index2}`]?.id
                                      ]
                                        ?.filter(
                                          (cur) =>
                                            cur.nodeId == current.instanceData?.node.id,
                                        )[0]
                                        ?.after.map((subItem: any, subIndex: number) => (
                                          <tr key={subIndex + 30080}>
                                            {attributes[`attr${index}_${index2}`] &&
                                              attributes[
                                                `attr${index}_${index2}`
                                              ].attributes
                                                .filter((item: any) => !item.hide)
                                                .map(
                                                  (
                                                    subdataitem: any,
                                                    subdataindex: number,
                                                  ) => {
                                                    return (
                                                      <>
                                                        {subdataindex === 0 && (
                                                          <td
                                                            key={`extra-${subdataindex}`}
                                                            style={{
                                                              width: `${subdataitem.width}%`,
                                                              height: `${
                                                                subdataitem.height
                                                                  ? subdataitem.height
                                                                  : 50
                                                              }px`,
                                                              wordBreak: 'break-all',
                                                              textAlign: 'center',
                                                              borderLeft: 'none',
                                                              borderTop:
                                                                '1px solid black',
                                                            }}>
                                                            {subIndex + 1}
                                                          </td>
                                                        )}
                                                        {subdataindex !== 0 && (
                                                          <td
                                                            key={subdataindex + 50080}
                                                            style={{
                                                              width: `${subdataitem.width}%`,
                                                              height: `${
                                                                subdataitem.height
                                                                  ? subdataitem.height
                                                                  : 50
                                                              }px`,
                                                              wordBreak: 'break-all',
                                                              textAlign: 'center',
                                                              borderLeft:
                                                                '1px solid black',
                                                              borderTop:
                                                                '1px solid black',
                                                            }}>
                                                            {sameRenderType.includes(
                                                              subdataitem.valueType,
                                                            ) ? (
                                                              <div>
                                                                {subItem[subdataitem.id]}
                                                              </div>
                                                            ) : subItem[
                                                                subdataitem.id
                                                              ] !== undefined ? (
                                                              <SubTab
                                                                id={`attr${index}_${index2}`}
                                                                checkKey={subdataitem.id}
                                                                value={
                                                                  subItem[subdataitem.id]
                                                                }
                                                                valueType={
                                                                  subdataitem.valueType
                                                                }
                                                                key={subdataindex}
                                                              />
                                                            ) : (
                                                              <span></span>
                                                            )}
                                                          </td>
                                                        )}
                                                      </>
                                                    );
                                                  },
                                                )}
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                )}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
                {item.footer && item.footer.flag && (
                  <table
                    style={{ width: '100%' }}
                    className={css.printSubtitleContent}
                    cellSpacing=""
                    cellPadding="10">
                    <tbody>
                      <tr>
                        <td style={item.footer.style} className={'subtitle-container'}>
                          <span
                            className="tableData"
                            data-index={-888}
                            dangerouslySetInnerHTML={{ __html: item.footer.name }}
                            style={{ whiteSpace: 'pre-wrap' }}
                          />
                          {item.footer.dataSource && (
                            <Tab value={`attr${index}_footer`} />
                          )}
                          {item.footer.text &&
                            item.footer.text.length &&
                            item.footer.text.map(
                              (footerItem: any, footerIndex: number) => (
                                <div
                                  key={footerIndex + 100000}
                                  className={css.textDiv}
                                  style={footerItem.style}>
                                  <span
                                    data-index={-888}
                                    style={{ whiteSpace: 'pre-wrap' }}
                                    dangerouslySetInnerHTML={{
                                      __html: footerItem.name,
                                    }}
                                  />
                                  {footerItem.dataSource && (
                                    <Tab
                                      value={`attr${index}_footerText_${footerIndex}`}
                                    />
                                  )}
                                </div>
                              ),
                            )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      </body>
    </html>
  );
};
export default Template1;
