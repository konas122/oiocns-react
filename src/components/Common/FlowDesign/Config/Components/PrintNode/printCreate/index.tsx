import React, { ReactNode, useState, useEffect, useRef } from 'react';
import {
  Layout,
  Menu,
  message,
  Input,
  Card,
  Slider,
  Select,
  Button,
  Tag,
  InputNumber,
  Switch,
  Space,
} from 'antd';
import css from './designer.module.less';
import './index.less';
import { AiOutlineApartment } from 'react-icons/ai';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { SketchPicker } from 'react-color';
import QrCode from 'qrcode.react';
import { itemsTable, itemsProps } from '@/ts/base/model';
const { TextArea } = Input;
interface IProps {
  typeDrag: string;
  handleQcIndex: (index: number) => void;
}
interface EProps {
  index: number;
  index2: number;
  index3: number;
  tableIndex: number;
  flag: boolean;
  items: itemsTable[];
  type: string;
  qcIndex: number;
  handleFooter?: (footer: { name: string; style: object; flag: boolean }) => void;
  handleDataConfig: (items: itemsTable[]) => void;
  handleIndexData: (index: number) => void;
  handleIndexData2: (index: number) => void;
  handleIndexData3: (index: number) => void;
  handleTableIndex: (index: number) => void;
  handleType: (type: string) => void;
  handleFlag: (flag: boolean) => void;
}
//中间区域
const ContractTable: React.FC<IProps & EProps> = ({
  typeDrag,
  items,
  index,
  type,
  handleDataConfig,
  handleIndexData,
  handleType,
  handleIndexData2,
  handleIndexData3,
  index2,
  index3,
  tableIndex,
  flag,
  handleTableIndex,
  handleFlag,
  handleQcIndex,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<(HTMLDivElement | null)[]>([]);
  const [a4Data, setA4Data] = useState<number[]>([]);
  const [a4HeightWidth, setA4HeightWidth] = useState<number>(1123); //a4的长宽，如果是0是竖着的，如果是1是横着的
  const onA4Change = (e: boolean) => {
    if (e) {
      setA4HeightWidth(794);
    } else {
      setA4HeightWidth(1123);
    }
  };
  useEffect(() => {
    let page = 0;
    if (elementRef.current !== null) {
      page = Math.ceil(elementRef.current.scrollHeight / a4HeightWidth); //页数
    } else {
      console.error('elementRef.current is null, cannot calculate page count.');
    }
    let data = [];
    for (let i = 0; i < page; i++) {
      //循环给进一个数组里
      data.push(i);
    }
    setA4Data(data);
  }, [items, elementRef.current, a4HeightWidth]);
  useEffect(() => {
    mainRef.current.forEach((item) => {
      if (item) {
        //添加marginBottom的值
        if (a4HeightWidth > item.scrollHeight) {
          //判断如果大于的话直接添加差值
          item.style.marginBottom = a4HeightWidth - item.scrollHeight + 'px';
        } else {
          //判断如果小于的话
          item.style.marginBottom =
            Math.ceil(item.scrollHeight / a4HeightWidth) * a4HeightWidth -
            item.scrollHeight +
            'px';
        }
      }
    });
  }, [items, a4HeightWidth]);
  const curIndex = index;
  const curIndex2 = index2;
  const curIndex3 = index3;
  const onDragStart = () => {
    //把这个状态保持下来，拿来做发光之类的提示后续开发吧
    handleFlag(false);
  };
  const onDragEnd = (result: any, currentindex: number) => {
    if (!result.destination) {
      return;
    }
    const newRows = [...items];
    const [removed] = newRows[currentindex].data.splice(result.source.index, 1);
    newRows[currentindex].data.splice(result.destination.index, 0, removed);
    handleDataConfig([...newRows]);
  };
  const addItem = (currenTableIndex: number) => {
    //拿到最大的数组长度
    let maxLength = 0;
    // 遍历大数组中的每个内部数组
    if (items[currenTableIndex].data.length > 0) {
      items[currenTableIndex].data[0].data.data.forEach((item) => {
        maxLength = maxLength + item.colNumber;
      });
      if (items[currenTableIndex].data[0].data.emptydata) {
        maxLength = maxLength + items[currenTableIndex].data[0].data.emptydata!.length;
      }
    } else {
      maxLength = 1;
    }
    let newRows = [...items];
    let dropDataItem: itemsProps = {
      data: {
        data: [
          {
            name: '数据区域',
            colNumber: 1,
            dataSource: false,
          },
        ],
        type: 'tr',
      },
    };
    for (let index = 0; index < maxLength - 1; index++) {
      if (dropDataItem.data.emptydata) {
        dropDataItem.data.emptydata!.push({
          name: '空单元格',
        });
      } else {
        dropDataItem.data.emptydata = [
          {
            name: '空单元格',
          },
        ];
      }
    }
    if (newRows.length) {
      newRows[currenTableIndex].data.unshift(dropDataItem);
    }
    handleDataConfig([...newRows]);
  };
  const addSumtableItem = (currenTableIndex: number) => {
    let maxColNumber = 0;
    if (items[currenTableIndex].data.length > 0) {
      items[currenTableIndex].data[0].data.data.forEach((item) => {
        maxColNumber = maxColNumber + item.colNumber;
      });
      if (items[currenTableIndex].data[0].data.emptydata) {
        maxColNumber =
          maxColNumber + items[currenTableIndex].data[0].data.emptydata!.length;
      }
    } else {
      maxColNumber = 1;
    }
    const newItems = items;
    newItems[currenTableIndex].data.unshift({
      data: {
        data: [
          {
            name: '合计分类区域',
            colNumber: maxColNumber,
            dataSource: false,
          },
        ],
        type: 'sum',
      },
    });
    handleDataConfig([...newItems]);
  };
  const addSubtableItem = (currenTableIndex: number) => {
    let maxColNumber = 0;
    if (items[currenTableIndex].data.length > 0) {
      items[currenTableIndex].data[0].data.data.forEach((item) => {
        maxColNumber = maxColNumber + item.colNumber;
      });
      if (items[currenTableIndex].data[0].data.emptydata) {
        maxColNumber =
          maxColNumber + items[currenTableIndex].data[0].data.emptydata!.length;
      }
    } else {
      maxColNumber = 1;
    }
    const newItems = items;
    newItems[currenTableIndex].data.unshift({
      data: {
        data: [
          {
            name: '子表区域',
            colNumber: maxColNumber,
            dataSource: false,
          },
        ],
        type: 'table',
      },
    });
    handleDataConfig([...newItems]);
  };
  const handleDrop = (e: any, index: number) => {
    e.preventDefault();
    handleFlag(false);
    let currentDom = e.target;
    if (typeDrag == 'qrcode') {
      //二维码
      let newRow = [...items];
      let x = Math.round(
        e.clientX -
          document.querySelector('#mainContainer')!.getBoundingClientRect().left,
      );
      let y = Math.round(
        e.clientY - document.querySelector('#mainContainer')!.getBoundingClientRect().top,
      );
      newRow[index].qrcode
        ? newRow[index].qrcode!.push({
            style: { top: y, left: x, size: 80 },
          })
        : (newRow[index].qrcode = [{ style: { top: y, left: x, size: 80 } }]);
      handleDataConfig([...newRow]);
      return false;
    }
    if (e.target.getAttribute('data-index') == -888) {
      currentDom = e.target.parentNode;
    } else {
      currentDom = e.target;
    }
    handleTableIndex(index);
    if (
      currentDom.getAttribute('class') == 'subtitle-container' ||
      currentDom.parentNode.getAttribute('class') == 'subtitle-container'
    ) {
      const newRow = [...items];
      //判断是否是副标题
      if (typeDrag == 'text') {
        //文字进入副标题
        if (newRow[index].subtitle.text && newRow[index].subtitle.text!.length) {
          newRow[index].subtitle.text?.push({
            name: '文字',
            style: {},
            dataSource: false,
          });
        } else {
          newRow[index].subtitle.text = [
            {
              name: '文字',
              style: {},
              dataSource: false,
            },
          ];
        }
        handleDataConfig([...newRow]);
        return false;
      } else {
        message.error('该区域目前不可放置');
        return false;
      }
    } else if (
      currentDom.getAttribute('class') == 'footer-container' ||
      currentDom.parentNode.getAttribute('class') == 'footer-container'
    ) {
      const newRow = [...items];
      //判断是否是底注
      if (typeDrag == 'text') {
        //文字进入副标题
        if (newRow[index].footer.text && newRow[index].footer.text!.length) {
          newRow[index].footer.text?.push({
            name: '文字',
            style: {},
            dataSource: false,
          });
        } else {
          newRow[index].footer.text = [
            {
              name: '文字',
              style: {},
              dataSource: false,
            },
          ];
        }
        handleDataConfig([...newRow]);
        return false;
      } else {
        message.error('该区域目前不可放置');
        return false;
      }
    }
    //判断是否是行列或者子表
    if (typeDrag == 'tr') {
      //包含了这个元素,添加进表格
      addItem(index);
    } else if (typeDrag == 'text') {
      //需要判断是否是可填写的数据区域，别的区域不给放
      let currentIndex = 0;
      //获取到这个是第几个tr
      if (currentDom.getAttribute('class').includes('tableData')) {
        //放到了数据区域的正确td中
        currentIndex = currentDom.parentNode.getAttribute('data-index');
      } else if (currentDom.parentNode.getAttribute('class').includes('tableData')) {
        //放到了数据区域下的div中
        currentIndex = currentDom.parentNode.parentNode.getAttribute('data-index');
      } else {
        message.error('该区域目前不可放置');
        return false;
      }
      if (items[index].data[currentIndex].data.type == 'table') {
        message.error('该区域目前不可放置');
        return false;
      }
      if (items[index].data[currentIndex].data.type == 'sum') {
        message.error('该区域目前不可放置');
        return false;
      }
      //把这个文字信息放到items里面
      const newItems = items;
      let currentIndex2 = 0;
      if (currentDom.getAttribute('data-index')) {
        if (currentDom.getAttribute('data-index') != -888) {
          currentIndex2 = currentDom.getAttribute('data-index');
        } else {
          currentIndex2 = currentDom.parentNode.getAttribute('data-index');
        }
      } else if (currentDom.parentNode.getAttribute('data-index')) {
        currentIndex2 = currentDom.parentNode.getAttribute('data-index');
      }
      if (newItems[index].data[currentIndex].data.data[currentIndex2].text) {
        newItems[index].data[currentIndex].data.data[currentIndex2].text?.push({
          name: '文字',
          style: {},
          dataSource: false,
        });
      } else {
        newItems[index].data[currentIndex].data.data[currentIndex2].text = [
          {
            name: '文字',
            style: {},
            dataSource: false,
          },
        ];
      }
      handleDataConfig([...newItems]);
    } else if (typeDrag == 'table') {
      //子表区域，添加到表格内
      addSubtableItem(index);
    } else if (typeDrag == 'sum') {
      //合计分类区域，添加到表格内
      addSumtableItem(index);
    }
  };
  const clickSubTitleData = (e: any, index: number) => {
    handleFlag(true);
    //点击副标题，可以设置文字，设置字体大小，设置字体颜色，设置字体粗细，设置字体样式
    e.stopPropagation();
    let currentDom = e.target;
    if (e.target.getAttribute('data-index') == -888) {
      currentDom = e.target.parentNode;
    } else {
      currentDom = e.target;
    }
    //判断元素是否是副标题
    if (currentDom.getAttribute('class') == 'subtitle-container') {
      //告诉外面我要操作的是副标题修改
      handleType('subtitle');
    } else if (currentDom.parentNode.getAttribute('class') == 'subtitle-container') {
      //告诉外面我要操作的是副标题中的文字的
      handleType('subText');
      handleIndexData3(index);
    }
  };
  const clickFooterData = (e: any, index: number) => {
    handleFlag(true);
    //点击副标题，可以设置文字，设置字体大小，设置字体颜色，设置字体粗细，设置字体样式
    e.stopPropagation();
    let currentDom = e.target;
    if (e.target.getAttribute('data-index') == -888) {
      currentDom = e.target.parentNode;
    } else {
      currentDom = e.target;
    }
    //判断元素是否是底注
    if (currentDom.getAttribute('class') == 'footer-container') {
      //告诉外面我要操作的是底注修改
      handleType('footer');
    } else if (currentDom.parentNode.getAttribute('class') == 'footer-container') {
      //告诉外面我要操作的是底注中的文字的
      handleType('footerText');
      handleIndexData3(index);
    }
  };
  const clickData = (
    e: any,
    currentTableIndex: number,
    index?: number,
    index2?: number,
    index3?: number,
  ) => {
    handleFlag(true);
    //先把原先的数据给出去
    handleDataConfig(items);
    //点击表格内的元素，可以设置文字，设置字体大小，设置字体颜色，设置字体粗细，设置字体样式
    e.stopPropagation();
    handleTableIndex(currentTableIndex);
    let currentDom = e.target;
    if (e.target.getAttribute('data-index') == -888) {
      currentDom = e.target.parentNode;
    } else {
      currentDom = e.target;
    }
    if (currentDom.getAttribute('class') == 'qccode' && index) {
      //二维码
      handleQcIndex(index);
      handleType('qccode');
      return false;
    }
    //判断元素是否是底注
    if (currentDom.getAttribute('class') == 'footer-container') {
      //告诉外面我要操作的是底注修改
      handleType('footer');
    }
    if (currentDom.getAttribute('class') == 'Table-title') {
      //判断元素是否是标题，是否是表头，是否是数据区域，是否是文字
      //告诉外面我要操作的是标题修改
      handleType('Table-title');
      //设置标题,从外面传输进来，还可以设置样式
    } else if (currentDom.getAttribute('class') == 'tableData') {
      //设置数据区域，数据区域从外面传输进来，还可以设置样式
      //需要区分子表的还是数据区域的
      if (items[currentTableIndex].data[index!].data.type == 'table') {
        //子表区域，需要设置子表的样式
        handleType('tableSubData');
        if (index2) {
          handleIndexData2(index2);
        }
      } else if (items[currentTableIndex].data[index!].data.type == 'sum') {
        //合计分类区域
        handleType('sum');
        if (index2) {
          handleIndexData2(index2);
        }
      } else {
        handleType('tableData');
        if (index2) {
          handleIndexData2(index2);
        }
      }
      handleIndexData(index!);
    } else if (currentDom.parentNode.getAttribute('class') == 'tableData') {
      //文字部分，从外面传输进来，还可以设置样式
      handleIndexData(index!);
      if (index2) {
        handleIndexData2(index2);
      }
      if (index3) {
        handleIndexData3(index3);
      }
      handleType('text');
    }
  };
  return (
    <>
      <div style={{ height: '100%', position: 'relative' }}>
        <div
          ref={elementRef}
          style={{
            position: 'relative',
            zIndex: 2,
            width: '80%',
            margin: '0 auto',
          }}>
          {items.map((item, index) => {
            return (
              <div
                style={{
                  position: 'relative',
                }}
                ref={(element) => (mainRef.current[index] = element)}
                key={index - 100}
                onDrop={(e) => handleDrop(e, index)}
                onDragOver={(e) => e.preventDefault()}
                id="mainContainer">
                {item.qrcode &&
                  item.qrcode!.map((qcitem, qcindex) => {
                    return (
                      <div
                        onClick={(e) => clickData(e, index, qcindex)}
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
                  <div className={'head'} data-index={10}>
                    <div
                      onClick={(e) => clickData(e, index)}
                      dangerouslySetInnerHTML={{ __html: item.title.name }}
                      className={'Table-title'}
                      style={item.title.style}></div>
                  </div>
                )}
                {item.subtitle!.flag && (
                  <table
                    className={css.printSubtitleContent}
                    cellSpacing=""
                    cellPadding="10">
                    <tbody>
                      <tr>
                        <td
                          style={item.subtitle!.style}
                          className={
                            index == tableIndex && flag && type === 'subtitle'
                              ? `${css.current} subtitle-container`
                              : 'subtitle-container'
                          }
                          onClick={(e) => clickSubTitleData(e, 0)}>
                          <span
                            className="tableData"
                            data-index={-888}
                            dangerouslySetInnerHTML={{ __html: item.subtitle!.name }}
                            style={{ whiteSpace: 'pre-wrap' }}
                          />
                          {item.subtitle!.dataSource && <Button>添加属性</Button>}
                          {item.subtitle!.text &&
                            item.subtitle!.text.length &&
                            item.subtitle!.text.map(
                              (subtitleItem: any, subtitleIndex: number) => (
                                <div
                                  key={subtitleIndex + 100000}
                                  className={
                                    index == tableIndex &&
                                    curIndex3 == subtitleIndex + 1 &&
                                    flag &&
                                    type == 'subText'
                                      ? `${css.current} ${css.textDiv} parent-element`
                                      : `${css.textDiv} parent-element`
                                  }
                                  style={subtitleItem.style}
                                  onClick={(e) =>
                                    clickSubTitleData(e, subtitleIndex + 1)
                                  }>
                                  <span
                                    data-index={-888}
                                    dangerouslySetInnerHTML={{
                                      __html: subtitleItem.name,
                                    }}
                                    style={{ whiteSpace: 'pre-wrap' }}
                                  />
                                  {subtitleItem.dataSource && <Button>添加属性</Button>}
                                </div>
                              ),
                            )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
                <DragDropContext
                  onDragEnd={(e) => onDragEnd(e, index)}
                  onDragStart={onDragStart}>
                  <table
                    className={css.printContent}
                    border={1}
                    cellSpacing=""
                    style={item.style}
                    cellPadding="10">
                    {item.data.length === 0 && (
                      <div data-table-index={index} className={css.printTips}>
                        拖拽区域
                      </div>
                    )}
                    <Droppable droppableId="table">
                      {(provided: any) => (
                        <tbody ref={provided.innerRef} {...provided.droppableProps}>
                          {/* 自定义行列，自定义表头占多少宽度比例，自定义高度，自定义字体大小和颜色，再弄一个多选框单选框 */}
                          {item.data.map((item2, index2) => (
                            <Draggable
                              key={index2}
                              draggableId={index2.toString()}
                              index={index2}>
                              {(provided: any) => (
                                <tr
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  key={index2}
                                  data-index={index2}
                                  onClick={(e) => clickData(e, index, index2)}
                                  className={
                                    index == tableIndex &&
                                    curIndex === index2 &&
                                    flag &&
                                    type === 'tr'
                                      ? `${css.current} dynamic-row`
                                      : 'dynamic-row'
                                  }>
                                  {item2.data.data.map((item3, index3) => (
                                    <td
                                      key={index3 + 1000}
                                      data-table-index={index}
                                      onClick={(e) =>
                                        clickData(e, index, index2, index3 + 1)
                                      }
                                      colSpan={item3.colNumber}
                                      data-index={index3}
                                      className={
                                        index == tableIndex &&
                                        curIndex == index2 &&
                                        curIndex2 == index3 + 1 &&
                                        flag &&
                                        (type == 'tableData' ||
                                          type == 'tableSubData' ||
                                          type == 'sum')
                                          ? `${css.current} tableData`
                                          : 'tableData'
                                      }
                                      style={item3.style}>
                                      <span
                                        data-table-index={index}
                                        className="tableData"
                                        data-index={-888}
                                        dangerouslySetInnerHTML={{ __html: item3.name }}
                                        style={{ whiteSpace: 'pre-wrap' }}
                                      />
                                      {item3.dataSource && (
                                        <Button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            return false;
                                          }}>
                                          添加属性
                                        </Button>
                                      )}
                                      {item3.text &&
                                        item3.text.length &&
                                        item3.text.map((item4, index4) => (
                                          <div
                                            key={index4 + 100000}
                                            data-table-index={index}
                                            className={
                                              index == tableIndex &&
                                              curIndex == index2 &&
                                              curIndex2 == index3 + 1 &&
                                              curIndex3 == index4 + 1 &&
                                              flag &&
                                              type == 'text'
                                                ? `${css.current} ${css.textDiv} parent-element`
                                                : `${css.textDiv} parent-element`
                                            }
                                            style={item4.style}
                                            onClick={(e) =>
                                              clickData(
                                                e,
                                                index,
                                                index2,
                                                index3 + 1,
                                                index4 + 1,
                                              )
                                            }>
                                            <span
                                              data-table-index={index}
                                              data-index={-888}
                                              dangerouslySetInnerHTML={{
                                                __html: item4.name,
                                              }}
                                              style={{ whiteSpace: 'pre-wrap' }}
                                            />
                                            {item4.dataSource && (
                                              <Button>添加属性</Button>
                                            )}
                                          </div>
                                        ))}
                                    </td>
                                  ))}
                                  {item2.data.emptydata &&
                                    item2.data.emptydata.length > 0 &&
                                    item2.data.emptydata.map((item3, index3) => {
                                      return (
                                        <td
                                          key={index3 + 2000}
                                          data-table-index={index}
                                          colSpan={1}
                                          data-index={index3}
                                          className="empty">
                                          <span data-index={-888}>{item3.name}</span>
                                        </td>
                                      );
                                    })}
                                </tr>
                              )}
                            </Draggable>
                          ))}
                        </tbody>
                      )}
                    </Droppable>
                  </table>
                </DragDropContext>
                {item.footer!.flag && (
                  <table
                    className={css.printSubtitleContent}
                    cellSpacing=""
                    cellPadding="10">
                    <tbody>
                      <tr>
                        <td
                          style={item.footer!.style}
                          className={
                            index == tableIndex && flag && type === 'footer'
                              ? `${css.current} footer-container`
                              : 'footer-container'
                          }
                          onClick={(e) => clickFooterData(e, 0)}>
                          <span
                            className="tableData"
                            data-index={-888}
                            dangerouslySetInnerHTML={{ __html: item.footer!.name }}
                            style={{ whiteSpace: 'pre-wrap' }}
                          />
                          {item.footer!.dataSource && <Button>添加属性</Button>}
                          {item.footer!.text &&
                            item.footer!.text.length &&
                            item.footer!.text.map(
                              (footerItem: any, footerIndex: number) => (
                                <div
                                  key={footerIndex + 100000}
                                  className={
                                    index == tableIndex &&
                                    curIndex3 == footerIndex + 1 &&
                                    flag &&
                                    type == 'footerText'
                                      ? `${css.current} ${css.textDiv} parent-element`
                                      : `${css.textDiv} parent-element`
                                  }
                                  style={footerItem.style}
                                  onClick={(e) => clickFooterData(e, footerIndex + 1)}>
                                  <span
                                    data-index={-888}
                                    dangerouslySetInnerHTML={{
                                      __html: footerItem.name,
                                    }}
                                    style={{ whiteSpace: 'pre-wrap' }}
                                  />
                                  {footerItem.dataSource && <Button>添加属性</Button>}
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
        <div
          style={{
            height: '100%',
            position: 'absolute',
            width: '10%',
            bottom: 0,
            left: 0,
            zIndex: 1,
          }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '200px',
              zIndex: 3,
            }}>
            A4竖屏
            <Switch onChange={onA4Change} />
            A4横屏
          </div>
          {a4Data.map((_item, index) => {
            return (
              <div
                key={index}
                style={{
                  height: a4HeightWidth,
                  borderBottom: '1px dashed black',
                  position: 'relative',
                }}></div>
            );
          })}
        </div>
        <div
          style={{
            height: '100%',
            position: 'absolute',
            width: '10%',
            bottom: 0,
            right: 0,
            zIndex: 1,
          }}>
          {a4Data.map((item, index) => {
            return (
              <div
                key={index}
                style={{
                  height: a4HeightWidth,
                  borderBottom: '1px dashed black',
                  position: 'relative',
                }}>
                <span style={{ position: 'absolute', bottom: 0, right: 0 }}>
                  {item + 1} / {a4Data.length}页
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

//左边组件
const Assembly: React.FC<{
  items: itemsTable[];
  onDragStart: (parameter: string) => void;
  handleDataConfig: (items: itemsTable[]) => void;
  handleType: (type: string) => void;
}> = ({ onDragStart, items, handleDataConfig, handleType }) => {
  const dragStart = (_e: any, type: string) => {
    //开始拖拽
    onDragStart(type);
    handleType('');
  };
  const addTable = () => {
    //增加表格
    const newRows = [...items];
    newRows.push({
      title: { name: '标题', style: {}, flag: true },
      data: [],
      footer: {
        name: '底注',
        style: {},
        flag: true,
        dataSource: false,
      },
      subtitle: {
        name: '副标题',
        style: {},
        flag: true,
        dataSource: false,
      },
    });
    handleDataConfig([...newRows]);
  };
  const delTable = () => {
    //删除表格
    const newRows = [...items];
    if (newRows.length > 1) {
      newRows.pop();
    } else {
      message.error('至少需要一个表格');
    }
    handleDataConfig([...newRows]);
  };
  return (
    <div style={{ width: 300 }}>
      <Card
        onDragStart={(e) => dragStart(e, 'tr')}
        draggable
        title="行（可设置多列）"
        bordered={true}
        style={{ width: 300 }}>
        <table className={'printContent'} border={1} cellSpacing="" cellPadding="10">
          <tr className={'height20 dynamic-row'}>
            <th colSpan={1}>数据区域</th>
          </tr>
        </table>
      </Card>
      <Card
        draggable
        onDragStart={(e) => dragStart(e, 'text')}
        title="文字组件"
        bordered={true}
        style={{ width: 300 }}>
        <div>文字</div>
      </Card>
      <Card
        onDragStart={(e) => dragStart(e, 'table')}
        draggable
        title="子表区域"
        bordered={true}
        style={{ width: 300 }}>
        <table className={'printContent'} border={1} cellSpacing="" cellPadding="10">
          <tr className={'height20 dynamic-row'}>
            <th>A</th>
            <th colSpan={5}>B</th>
            <th colSpan={5}>C</th>
          </tr>
          <tr className={'height20 dynamic-row'}>
            <th>A</th>
            <th colSpan={5}>B</th>
            <th colSpan={5}>C</th>
          </tr>
        </table>
      </Card>
      <Card
        onDragStart={(e) => dragStart(e, 'sum')}
        draggable
        title="合计分类区域"
        bordered={true}
        style={{ width: 300 }}>
        <table className={'printContent'} border={1} cellSpacing="" cellPadding="10">
          <tr className={'height20 dynamic-row'}>
            <th>A</th>
            <th colSpan={5}>B</th>
            <th colSpan={5}>C</th>
          </tr>
          <tr className={'height20 dynamic-row'}>
            <th>A</th>
            <th colSpan={5}>B</th>
            <th colSpan={5}>C</th>
          </tr>
        </table>
      </Card>
      <Card
        title="二维码组件"
        bordered={true}
        style={{ width: 300 }}
        onDragStart={(e) => dragStart(e, 'qrcode')}
        draggable>
        <QrCode level="H" size={80} renderAs="canvas" value={''} />
      </Card>
      <Card title="表格组件" bordered={true} style={{ width: 300 }}>
        <Space>
          <Button type="primary" onClick={addTable}>
            增加表格
          </Button>
          <Button type="primary" danger onClick={delTable}>
            删除最后一项表格
          </Button>
        </Space>
      </Card>
    </div>
  );
};
// 右边区域
const ElementProps: React.FC<EProps> = ({
  items,
  index,
  index2,
  index3,
  type,
  handleDataConfig,
  handleType,
  flag,
  handleFlag,
  tableIndex,
  qcIndex,
}) => {
  const [valueText, setValueText] = useState('');
  const [color, setColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(14);
  const [fontWeight, setFontWeight] = useState('400');
  const [textLayout, setTextLayout] = useState('center');
  const [textDivLayout, setTextDivLayout] = useState('left');
  const [valueWidth, setValueWidth] = useState(25);
  const [valueHeight, setValueHeight] = useState(50);
  const [customCSS, setCustomCSS] = useState('');
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [footerFlag, setFooterFlag] = useState(false);
  const [typeSpan, setTypeSpan] = useState(false);
  const [maxColSpanNum, setMaxColSpanNum] = useState(0);
  const fontWeightData = [
    {
      value: '100',
      label: '100',
    },
    {
      value: '200',
      label: '200',
    },
    {
      value: '300',
      label: '300',
    },
    {
      value: '400',
      label: '400',
    },
    {
      value: '500',
      label: '500',
    },
    {
      value: '600',
      label: '600',
    },
    {
      value: '700',
      label: '700',
    },
    {
      value: '800',
      label: '800',
    },
    {
      value: '900',
      label: '900',
    },
    {
      value: 'bold',
      label: 'bold',
    },
    {
      value: 'bolder',
      label: 'bolder',
    },
    {
      value: 'lighter',
      label: 'lighter',
    },
    {
      value: 'normal',
      label: 'normal',
    },
    {
      value: 'inherit',
      label: 'inherit',
    },
    {
      value: 'initial',
      label: 'initial',
    },
    {
      value: 'revert',
      label: 'revert',
    },
    {
      value: 'revert-layer',
      label: 'revert-layer',
    },
    {
      value: 'unset',
      label: 'unset',
    },
  ];
  const textLayoutData = [
    {
      value: 'left',
      label: '左对齐',
    },
    {
      value: 'center',
      label: '居中',
    },
    {
      value: 'right',
      label: '右对齐',
    },
  ];
  const textDivLayoutData = [
    {
      value: 'left',
      label: '靠左',
    },
    {
      value: 'right',
      label: '靠右',
    },
  ];
  const onValueText = (e: any) => {
    const newText = e.target.value.replace(/\n/g, '<br>');
    setValueText(newText);
  };
  const onValueHeight = (e: number) => {
    setValueHeight(e);
  };
  const onChangeCol = (e: number) => {
    if (!e) return false;
    const newRows = [...items];
    //做好判断，如果e是大于目前的colspan，那么当前选中的元素colspan++，如果e是小于目前的colspan，那么--。然后如果是++，那么要去判断当前同行元素内有没有空单元格，如果有空单元格，那么删除一个空单元格，如果没有空单元格，那么删除当前元素下的下一个元素。如果是--，那么添加一个空单元格给当前行
    let newDataRowColNumber =
      newRows[tableIndex].data[index].data.data[index2 - 1].colNumber; //当下元素单元格数量
    let newEmptyDataNumber = newRows[tableIndex].data[index].data.emptydata; //空单元格数量
    if (e > newDataRowColNumber) {
      if (newEmptyDataNumber && newEmptyDataNumber!.length > 0) {
        //当前行内有空元素
        newRows[tableIndex].data[index].data.data[index2 - 1].colNumber++; //当前行元素colspan++
        newRows[tableIndex].data[index].data.emptydata!.pop();
      } else {
        //删除下一个元素
        newRows[tableIndex].data[index].data.data[index2 - 1].colNumber =
          newDataRowColNumber +
          newRows[tableIndex].data[index].data.data[index2].colNumber; //当前行元素colspan加上下一个元素的colspan
        newRows[tableIndex].data[index].data.data.splice(index2, 1);
      }
    } else if (e < newDataRowColNumber) {
      newRows[tableIndex].data[index].data.data[index2 - 1].colNumber--; //当前行元素colspan--
      if (newEmptyDataNumber && newEmptyDataNumber!.length > 0) {
        //当前行内有空元素
        newRows[tableIndex].data[index].data.emptydata!.push({
          name: '空单元格',
        });
      } else {
        newRows[tableIndex].data[index].data.emptydata = [{ name: '空单元格' }];
      }
    }
    handleDataConfig([...newRows]);
  };
  const onValueWidth = (e: number) => {
    setValueWidth(e);
  };
  const onValueChange = (style: any) => {
    const newRows = [...items];
    if (type == 'Table-title') {
      //标题
      newRows[tableIndex].title = {
        name: valueText,
        style: style,
        flag: footerFlag,
      };
    } else if (type == 'tableData') {
      //数据区域
      newRows[tableIndex].data[index].data.data[index2 - 1].name = valueText;
      newRows[tableIndex].data[index].data.data[index2 - 1].style = style;
    } else if (type == 'text') {
      //文字区域
      newRows[tableIndex].data[index].data.data[index2 - 1].text![index3 - 1].name =
        valueText;
      newRows[tableIndex].data[index].data.data[index2 - 1].text![index3 - 1].style =
        style;
    } else if (type == 'tableSubData') {
      //子表区域
      newRows[tableIndex].data[index].data.data[index2 - 1].style = style;
    } else if (type == 'sum') {
      //合计分类区域
      newRows[tableIndex].data[index].data.data[index2 - 1].style = style;
    } else if (type == 'Table') {
      newRows[tableIndex].style = style;
    } else if (type == 'footer') {
      //页脚
      newRows[tableIndex].footer = {
        name: valueText,
        style: style,
        flag: footerFlag,
        dataSource: newRows[tableIndex].footer.dataSource,
        text: newRows[tableIndex].footer.text,
      };
    } else if (type == 'subtitle') {
      //副标题
      newRows[tableIndex].subtitle = {
        name: valueText,
        style: style,
        flag: footerFlag,
        dataSource: newRows[tableIndex].subtitle.dataSource,
        text: newRows[tableIndex].subtitle.text,
      };
    } else if (type == 'subText') {
      //副标题中的文字
      newRows[tableIndex].subtitle!.text![index3 - 1].name = valueText;
      newRows[tableIndex].subtitle!.text![index3 - 1].style = style;
    } else if (type == 'footerText') {
      //副标题中的文字
      newRows[tableIndex].footer!.text![index3 - 1].name = valueText;
      newRows[tableIndex].footer!.text![index3 - 1].style = style;
    }
    handleDataConfig([...newRows]);
  };
  const applyStyles = () => {
    const updatedStyle = {
      color: color,
      ...parseCustomCSS(customCSS),
    };
    fontSize && (updatedStyle.fontSize = `${fontSize}px`);
    fontWeight && (updatedStyle.fontWeight = fontWeight);
    if (type != 'tableSubData' && type != 'sum') {
      textLayout && (updatedStyle.textAlign = textLayout);
    }
    if (type == 'tableData') {
      valueHeight && (updatedStyle.height = `${valueHeight}px`);
      if (items[tableIndex].data[index].data.data.length > 1) {
        valueWidth && (updatedStyle.width = `${valueWidth}%`);
      }
    }
    if (type == 'tableName') {
      valueWidth && (updatedStyle.width = `${valueWidth}%`);
    }
    if (type == 'text' || type == 'subText' || type == 'footerText') {
      valueWidth && (updatedStyle.width = `${valueWidth}%`);
      valueHeight && (updatedStyle.height = `${valueHeight}px`);
      textDivLayout && (updatedStyle.float = textDivLayout);
    }
    onValueChange(updatedStyle);
  };
  const parseCustomCSS = (css: string) => {
    const styles: any = {};
    css.split(';').forEach((style) => {
      const [property, value] = style.split(':');
      if (property && value) {
        styles[property.trim()] = value.trim();
      }
    });
    return styles;
  };
  const toggleColorPicker = () => {
    setDisplayColorPicker(!displayColorPicker);
  };
  const handleColorChange = (newColor: { hex: React.SetStateAction<string> }) => {
    setDisplayColorPicker(!displayColorPicker);
    setColor(newColor.hex);
  };
  const onChangeSlider = (value: number) => {
    setFontSize(value);
  };
  const onChangeSelect = (value: string) => {
    setFontWeight(value);
  };
  const onChangeSelectLayout = (value: string) => {
    setTextLayout(value);
  };
  const onChangeSelectDivLayout = (value: string) => {
    setTextDivLayout(value);
  };
  const onChangeArea = (e: { target: { value: React.SetStateAction<string> } }) => {
    setCustomCSS(e.target.value);
  };
  const onChangeRow = (e: any) => {
    if (!e) return false;
    const newRows = [...items];
    let newDataRowsTd = newRows[tableIndex].data[index].data.data; //当前行内元素数据
    let newDataEmptyDataRowsTd = newRows[tableIndex].data[index].data.emptydata; //当前行内空元素数据
    if (e > newDataRowsTd.length) {
      //如果现在有空元素，那么删除一个空元素
      if (newDataEmptyDataRowsTd && newDataEmptyDataRowsTd!.length > 0) {
        newDataEmptyDataRowsTd!.pop();
      }
      let maxIndexNumberLength = 0;
      newDataRowsTd.forEach((item) => {
        maxIndexNumberLength = maxIndexNumberLength + item.colNumber;
      });
      if (newDataEmptyDataRowsTd) {
        maxIndexNumberLength = maxIndexNumberLength + newDataEmptyDataRowsTd!.length;
      }
      //如果大于现在的数量，那么添加一个
      newRows[tableIndex].data.forEach((item, itemIndex) => {
        if (itemIndex != index) {
          let maxItemIndexNumberLength = 0;
          item.data.data.forEach((item) => {
            maxItemIndexNumberLength = maxItemIndexNumberLength + item.colNumber;
          });
          if (item.data.emptydata) {
            maxItemIndexNumberLength =
              maxItemIndexNumberLength + item.data.emptydata!.length;
          }
          //判断当前操作的数组和空数组相加的长度是否大于等于其他数组相加的长度，是的话相加否则不操作
          if (maxIndexNumberLength >= maxItemIndexNumberLength) {
            if (item.data.type == 'table' || item.data.type == 'sum') {
              //子表
              item.data.data[0].colNumber++;
            } else {
              if (item.data.emptydata) {
                item.data.emptydata!.push({
                  name: '空单元格',
                });
              } else {
                item.data.emptydata = [
                  {
                    name: '空单元格',
                  },
                ];
              }
            }
          }
        }
      });
      newDataRowsTd.push({
        name: '数据区域',
        colNumber: 1,
        dataSource: false,
      });
    } else {
      //拿到最小的空数组长度
      let minLength = 10000;

      // 遍历大数组中的每个内部数组
      newRows[tableIndex].data.forEach((innerArray, innerIndex) => {
        // 获取当前内部数组的长度
        if (innerIndex != index) {
          if (innerArray.data.type != 'table' && innerArray.data.type != 'sum') {
            const length = innerArray.data.emptydata
              ? innerArray.data.emptydata!.length
              : 0;
            // 比较当前长度与已知最长长度
            if (length < minLength) {
              minLength = length;
            }
          }
        }
      });
      let maxIndexNumberLength = 0;
      newDataRowsTd.forEach((item) => {
        maxIndexNumberLength = maxIndexNumberLength + item.colNumber;
      });
      if (newDataEmptyDataRowsTd) {
        maxIndexNumberLength = maxIndexNumberLength + newDataEmptyDataRowsTd!.length;
      }
      let delNum = newDataRowsTd[newDataRowsTd.length - 1].colNumber;
      //要被删除的元素最后一位的长度
      newRows[tableIndex].data.forEach((item, itemIndex) => {
        if (itemIndex != index) {
          let maxItemIndexNumberLength = 0;
          item.data.data.forEach((item) => {
            maxItemIndexNumberLength = maxItemIndexNumberLength + item.colNumber;
          });
          if (item.data.emptydata) {
            maxItemIndexNumberLength =
              maxItemIndexNumberLength + item.data.emptydata!.length;
          }
          //判断当前操作的数组和空数组相加的长度是否小于等于其他数组相加的长度，是的话给空数组加1否则不操作
          if (maxIndexNumberLength <= maxItemIndexNumberLength) {
            if (minLength != 0) {
              //当有其他数组都有空数组的时候
              //判断当前即将删除的元素单元格大小和其他行最小的空单元格数量做比较
              if (delNum > minLength) {
                // 即将删除的元素大小大于其他行最小空单元格，那么删除其他行最小空单元格的数量，自己添加删除单元格-最小空单元格的空数组，子表减掉最小空单元格数量，
                if (item.data.type == 'table' || item.data.type == 'sum') {
                  //子表
                  item.data.data[0].colNumber = item.data.data[0].colNumber - minLength;
                } else {
                  // 其他数组的空数组内删除minLength个,自己添加delNum-minLength空数组
                  for (let i = 0; i < minLength; i++) {
                    item.data.emptydata!.pop();
                  }
                }
              } else {
                // 即将删除掉元素大小小于等于其他行最小空单元格，那么删除其他空单元格 delNum个，子表减掉delNum个，自己不添加空数组
                if (item.data.type == 'table' || item.data.type == 'sum') {
                  //子表
                  item.data.data[0].colNumber = item.data.data[0].colNumber - delNum;
                } else {
                  for (let i = 0; i < delNum; i++) {
                    item.data.emptydata!.pop();
                  }
                }
              }
            }
          }
        } else {
          if (minLength == 0) {
            //当有其他数组存在0空数组的时候，当前数组添加delNum个空数组
            for (let i = 0; i < delNum; i++) {
              if (item.data.emptydata) {
                item.data.emptydata!.push({
                  name: '空单元格',
                });
              } else {
                item.data.emptydata = [
                  {
                    name: '空单元格',
                  },
                ];
              }
            }
          } else {
            if (delNum > minLength) {
              for (let i = 0; i < delNum - minLength; i++) {
                if (newDataEmptyDataRowsTd) {
                  newDataEmptyDataRowsTd?.push({
                    name: '空单元格',
                  });
                } else {
                  newDataEmptyDataRowsTd = [
                    {
                      name: '空单元格',
                    },
                  ];
                }
              }
            }
          }
        }
      });
      newDataRowsTd.pop();
    }
    handleDataConfig([...newRows]);
  };
  const delItem = () => {
    const newRows = [...items];
    if (type == 'tr') {
      //如果是tr层的删除
      newRows[tableIndex].data.splice(index, 1);
    } else if (type == 'text') {
      //如果是文字层的删除
      newRows[tableIndex].data[index].data.data[index2 - 1].text!.length > 1
        ? newRows[tableIndex].data[index].data.data[index2 - 1].text?.splice(
            index3 - 1,
            1,
          )
        : delete newRows[tableIndex].data[index].data.data[index2 - 1].text;
    } else if (type == 'tableSubData') {
      //删除子表
      newRows[tableIndex].data.splice(index, 1);
    } else if (type == 'sum') {
      //删除合计分类
      newRows[tableIndex].data.splice(index, 1);
    } else if (type == 'subText') {
      //副标题文字
      newRows[tableIndex].subtitle!.text!.length > 1
        ? newRows[tableIndex].subtitle!.text!.splice(index3 - 1, 1)
        : delete newRows[tableIndex].subtitle!.text;
    } else if (type == 'footerText') {
      //副标题文字
      newRows[tableIndex].footer!.text!.length > 1
        ? newRows[tableIndex].footer!.text!.splice(index3 - 1, 1)
        : delete newRows[tableIndex].footer!.text;
    }
    handleDataConfig([...newRows]);
    handleFlag(false);
  };
  function copyObjectWithoutProperties(source: any, excludedProps: any) {
    return Object.keys(source)
      .filter((key) => !excludedProps.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = source[key];
        return obj;
      }, {});
  }
  const dataSourceClick = () => {
    const newRows = [...items];
    if (type == 'tableData') {
      //数据区域
      newRows[tableIndex].data[index].data.data[index2 - 1].dataSource = true;
      handleDataConfig(newRows);
    } else if (type == 'text') {
      //文字
      newRows[tableIndex].data[index].data.data[index2 - 1].text![index3 - 1].dataSource =
        true;
      handleDataConfig(newRows);
    } else if (type == 'subtitle') {
      newRows[tableIndex].subtitle!.dataSource = true;
      handleDataConfig(newRows);
    } else if (type == 'footer') {
      newRows[tableIndex].footer!.dataSource = true;
      handleDataConfig(newRows);
    } else if (type == 'subText') {
      //副标题文字
      newRows[tableIndex].subtitle!.text![index3 - 1].dataSource = true;
      handleDataConfig(newRows);
    } else if (type == 'footerText') {
      //副标题文字
      newRows[tableIndex].footer!.text![index3 - 1].dataSource = true;
      handleDataConfig(newRows);
    }
  };
  const back = (type: string) => {
    if (type == 'subText') {
      //如果是副标题文字
      handleType('subtitle');
    } else if (type == 'footerText') {
      //如果是副标题文字
      handleType('footer');
    } else if (type == 'text') {
      //如果是文字层
      handleType('tableData');
    } else if (type == 'tr' || type == 'tableSubData' || type == 'sum') {
      //如果是行
      handleType('Table');
    } else {
      //其他的
      handleType('tr');
    }
  };
  const colSpan = (e: boolean) => {
    setTypeSpan(e);
  };
  const onChangeSwitch = (e: boolean) => {
    setFooterFlag(e);
  };
  const onChangeQc = (e: number, type: string) => {
    const newRows = [...items];
    if (type == 'size') {
      newRows[tableIndex].qrcode![qcIndex].style.size = e;
    } else if (type == 'top') {
      newRows[tableIndex].qrcode![qcIndex].style.top = e;
    } else if (type == 'left') {
      newRows[tableIndex].qrcode![qcIndex].style.left = e;
    }
    handleDataConfig([...newRows]);
  };
  const delQc = () => {
    const newRows = [...items];
    if (newRows[tableIndex].qrcode!.length == 1) {
      delete newRows[tableIndex].qrcode;
    } else {
      newRows[tableIndex].qrcode?.splice(qcIndex, 1);
    }
    handleFlag(false);
    handleDataConfig([...newRows]);
  };
  useEffect(() => {
    if (type == 'subText') {
      //副标题文字
      setValueText(items[tableIndex].subtitle!.text![index3 - 1].name);
      if (Object.keys(items[tableIndex].subtitle!.text![index3 - 1].style).length != 0) {
        let textStyle = items[tableIndex].subtitle!.text![index3 - 1]
          .style as React.CSSProperties;
        //有样式的话
        textStyle.color ? setColor(textStyle.color) : '#000000';
        textStyle.fontSize
          ? setFontSize(Number((textStyle.fontSize as string).slice(0, -2)))
          : 16;
        textStyle.fontWeight ? setFontWeight(textStyle.fontWeight as string) : '600';
        textStyle.textAlign ? setTextLayout(textStyle.textAlign) : '居中';
        textStyle.height
          ? setValueHeight(Number((textStyle.height as string).slice(0, -2)))
          : 50;
        textStyle.width
          ? setValueWidth(Number((textStyle.width as string).slice(0, -1)))
          : 25;
        textStyle.float ? setTextDivLayout(textStyle.float) : 'left';
        setCustomCSS(
          Object.entries(
            copyObjectWithoutProperties(textStyle, [
              'color',
              'fontSize',
              'fontWeight',
              'textAlign',
              'height',
              'width',
              'float',
            ]),
          )
            .map(([key, value]) => `${key}: ${value}`)
            .join(', '),
        );
      } else {
        setColor('#000000');
        setFontSize(14);
        setFontWeight('400');
        setTextLayout('center');
        setValueHeight(50);
        setValueWidth(25);
        setTextDivLayout('left');
        setCustomCSS('');
      }
    } else if (type == 'footerText') {
      //副标题文字
      setValueText(items[tableIndex].footer!.text![index3 - 1].name);
      if (Object.keys(items[tableIndex].footer!.text![index3 - 1].style).length != 0) {
        let textStyle = items[tableIndex].footer!.text![index3 - 1]
          .style as React.CSSProperties;
        //有样式的话
        textStyle.color ? setColor(textStyle.color) : '#000000';
        textStyle.fontSize
          ? setFontSize(Number((textStyle.fontSize as string).slice(0, -2)))
          : 16;
        textStyle.fontWeight ? setFontWeight(textStyle.fontWeight as string) : '600';
        textStyle.textAlign ? setTextLayout(textStyle.textAlign) : '居中';
        textStyle.height
          ? setValueHeight(Number((textStyle.height as string).slice(0, -2)))
          : 50;
        textStyle.width
          ? setValueWidth(Number((textStyle.width as string).slice(0, -1)))
          : 25;
        textStyle.float ? setTextDivLayout(textStyle.float) : 'left';
        setCustomCSS(
          Object.entries(
            copyObjectWithoutProperties(textStyle, [
              'color',
              'fontSize',
              'fontWeight',
              'textAlign',
              'height',
              'width',
              'float',
            ]),
          )
            .map(([key, value]) => `${key}: ${value}`)
            .join(', '),
        );
      } else {
        setColor('#000000');
        setFontSize(14);
        setFontWeight('400');
        setTextLayout('center');
        setValueHeight(50);
        setValueWidth(25);
        setTextDivLayout('left');
        setCustomCSS('');
      }
    } else if (type == 'subtitle') {
      //副标题
      setValueText(items[tableIndex].subtitle!.name);
      setFooterFlag(items[tableIndex].subtitle!.flag);
      if (Object.keys(items[tableIndex].subtitle!.style).length != 0) {
        let textStyle = items[tableIndex].subtitle!.style as React.CSSProperties;
        //有样式的话
        textStyle.color ? setColor(textStyle.color) : '#000000';
        textStyle.fontSize
          ? setFontSize(Number((textStyle.fontSize as string).slice(0, -2)))
          : 16;
        textStyle.fontWeight ? setFontWeight(textStyle.fontWeight as string) : '600';
        textStyle.textAlign ? setTextLayout(textStyle.textAlign) : '居中';

        setCustomCSS(
          Object.entries(
            copyObjectWithoutProperties(items[tableIndex].subtitle!.style, [
              'color',
              'fontSize',
              'fontWeight',
              'textAlign',
            ]),
          )
            .map(([key, value]) => `${key}: ${value}`)
            .join(', '),
        );
      } else {
        setColor('#000000');
        setFontSize(14);
        setFontWeight('400');
        setTextLayout('center');
        setCustomCSS('');
      }
    } else if (type == 'footer') {
      //底注
      setValueText(items[tableIndex].footer!.name);
      setFooterFlag(items[tableIndex].footer!.flag);
      if (Object.keys(items[tableIndex].footer!.style).length != 0) {
        let textStyle = items[tableIndex].footer!.style as React.CSSProperties;

        //有样式的话
        textStyle.color ? setColor(textStyle.color) : '#000000';
        textStyle.fontSize
          ? setFontSize(Number((textStyle.fontSize as string).slice(0, -2)))
          : 16;
        textStyle.fontWeight ? setFontWeight(textStyle.fontWeight as string) : '600';
        textStyle.textAlign ? setTextLayout(textStyle.textAlign) : '居中';

        setCustomCSS(
          Object.entries(
            copyObjectWithoutProperties(items[tableIndex].footer!.style, [
              'color',
              'fontSize',
              'fontWeight',
              'textAlign',
            ]),
          )
            .map(([key, value]) => `${key}: ${value}`)
            .join(', '),
        );
      } else {
        setColor('#000000');
        setFontSize(14);
        setFontWeight('400');
        setTextLayout('center');
        setCustomCSS('');
      }
    } else if (type == 'Table-title') {
      //标题
      setValueText(items[tableIndex].title.name);
      setFooterFlag(items[tableIndex].title.flag);
      if (Object.keys(items[tableIndex].title.style).length != 0) {
        let titleStyle = items[tableIndex].title.style as React.CSSProperties;
        //有样式的话
        titleStyle.color ? setColor(titleStyle.color) : '#000000';
        titleStyle.fontSize
          ? setFontSize(Number((titleStyle.fontSize as string).slice(0, -2)))
          : 16;
        titleStyle.fontWeight ? setFontWeight(titleStyle.fontWeight as string) : '600';
        titleStyle.textAlign ? setTextLayout(titleStyle.textAlign) : '居中';

        setCustomCSS(
          Object.entries(
            copyObjectWithoutProperties(titleStyle, [
              'color',
              'fontSize',
              'fontWeight',
              'textAlign',
            ]),
          )
            .map(([key, value]) => `${key}: ${value}`)
            .join(', '),
        );
      } else {
        setColor('#000000');
        setFontSize(14);
        setFontWeight('400');
        setTextLayout('center');
        setCustomCSS('');
      }
    } else if (type == 'tableData') {
      let maxColSpanNum = 0;
      for (let i = index2 - 1; i < items[tableIndex].data[index].data.data.length; i++) {
        maxColSpanNum =
          maxColSpanNum + items[tableIndex].data[index].data.data[i].colNumber;
      }
      setMaxColSpanNum(
        maxColSpanNum +
          (items[tableIndex].data[index].data.emptydata
            ? items[tableIndex].data[index].data.emptydata!.length
            : 0),
      );
      //数据区域
      setValueText(items[tableIndex].data[index].data.data[index2 - 1].name);
      if (items[tableIndex].data[index].data.data[index2 - 1].style) {
        let dataStyle = items[tableIndex].data[index].data.data[index2 - 1]
          .style as React.CSSProperties;
        //有样式的话
        dataStyle.color ? setColor(dataStyle.color) : '#000000';
        dataStyle.fontSize
          ? setFontSize(Number((dataStyle.fontSize as string).slice(0, -2)))
          : 16;
        dataStyle.fontWeight ? setFontWeight(dataStyle.fontWeight as string) : '600';
        dataStyle.textAlign ? setTextLayout(dataStyle.textAlign) : '居中';
        dataStyle.height
          ? setValueHeight(Number((dataStyle.height as string).slice(0, -2)))
          : 50;
        dataStyle.width
          ? setValueWidth(Number((dataStyle.width as string).slice(0, -1)))
          : 25;
        setCustomCSS(
          Object.entries(
            copyObjectWithoutProperties(dataStyle, [
              'color',
              'fontSize',
              'fontWeight',
              'textAlign',
              'height',
              'width',
            ]),
          )
            .map(([key, value]) => `${key}: ${value}`)
            .join(', '),
        );
      } else {
        setColor('#000000');
        setFontSize(14);
        setFontWeight('400');
        setTextLayout('center');
        setValueHeight(50);
        setValueWidth(25);
        setCustomCSS('');
      }
    } else if (type == 'text') {
      //文字区域
      setValueText(
        items[tableIndex].data[index].data.data[index2 - 1].text![index3 - 1].name,
      );
      if (
        Object.keys(
          items[tableIndex].data[index].data.data[index2 - 1].text![index3 - 1].style,
        ).length != 0
      ) {
        let textStyle = items[tableIndex].data[index].data.data[index2 - 1].text![
          index3 - 1
        ].style as React.CSSProperties;
        //有样式的话
        textStyle.color ? setColor(textStyle.color) : '#000000';
        textStyle.fontSize
          ? setFontSize(Number((textStyle.fontSize as string).slice(0, -2)))
          : 16;
        textStyle.fontWeight ? setFontWeight(textStyle.fontWeight as string) : '600';
        textStyle.textAlign ? setTextLayout(textStyle.textAlign) : '居中';
        textStyle.height
          ? setValueHeight(Number((textStyle.height as string).slice(0, -2)))
          : 50;
        textStyle.width
          ? setValueWidth(Number((textStyle.width as string).slice(0, -1)))
          : 25;
        textStyle.float ? setTextDivLayout(textStyle.float) : 'left';
        setCustomCSS(
          Object.entries(
            copyObjectWithoutProperties(textStyle, [
              'color',
              'fontSize',
              'fontWeight',
              'textAlign',
              'height',
              'width',
              'float',
            ]),
          )
            .map(([key, value]) => `${key}: ${value}`)
            .join(', '),
        );
      } else {
        setColor('#000000');
        setFontSize(14);
        setFontWeight('400');
        setTextLayout('center');
        setValueHeight(50);
        setValueWidth(25);
        setTextDivLayout('left');
        setCustomCSS('');
      }
    } else if (type == 'tableSubData') {
      //子表区域
      if (items[tableIndex].data[index].data.data[index2 - 1].style) {
        let dataStyle = items[tableIndex].data[index].data.data[index2 - 1]
          .style as React.CSSProperties;
        //有样式的话
        dataStyle.color ? setColor(dataStyle.color) : '#000000';
        dataStyle.fontSize
          ? setFontSize(Number((dataStyle.fontSize as string).slice(0, -2)))
          : 16;
        dataStyle.fontWeight ? setFontWeight(dataStyle.fontWeight as string) : '600';
        setCustomCSS(
          Object.entries(
            copyObjectWithoutProperties(dataStyle, ['color', 'fontSize', 'fontWeight']),
          )
            .map(([key, value]) => `${key}: ${value}`)
            .join(', '),
        );
      } else {
        setColor('#000000');
        setFontSize(14);
        setFontWeight('400');
        setCustomCSS('');
      }
    } else if (type == 'sum') {
      //合计分类区域
      if (items[tableIndex].data[index].data.data[index2 - 1].style) {
        let dataStyle = items[tableIndex].data[index].data.data[index2 - 1]
          .style as React.CSSProperties;
        //有样式的话
        dataStyle.color ? setColor(dataStyle.color) : '#000000';
        dataStyle.fontSize
          ? setFontSize(Number((dataStyle.fontSize as string).slice(0, -2)))
          : 16;
        dataStyle.fontWeight ? setFontWeight(dataStyle.fontWeight as string) : '600';
        setCustomCSS(
          Object.entries(
            copyObjectWithoutProperties(dataStyle, ['color', 'fontSize', 'fontWeight']),
          )
            .map(([key, value]) => `${key}: ${value}`)
            .join(', '),
        );
      } else {
        setColor('#000000');
        setFontSize(14);
        setFontWeight('400');
        setCustomCSS('');
      }
    } else if (type == 'Table') {
      //表格区域
      if (items[tableIndex].style) {
        let style = items[tableIndex].style as React.CSSProperties;
        //有样式的话
        style.color ? setColor(style.color) : '#000000';
        style.fontSize
          ? setFontSize(Number((style.fontSize as string).slice(0, -2)))
          : 16;
        style.fontWeight ? setFontWeight(style.fontWeight as string) : '600';
        style.textAlign ? setTextLayout(style.textAlign) : '居中';
        setCustomCSS(
          Object.entries(
            copyObjectWithoutProperties(style, [
              'color',
              'fontSize',
              'fontWeight',
              'textAlign',
            ]),
          )
            .map(([key, value]) => `${key}: ${value}`)
            .join(', '),
        );
      } else {
        setColor('#000000');
        setFontSize(14);
        setFontWeight('400');
        setTextLayout('center');
        setCustomCSS('');
      }
    }
  }, [type, index, index2, index3, tableIndex]);
  function renderComponent(type: string) {
    switch (type) {
      case 'Table-title':
        //修改标题
        return (
          <div>
            <div className="page-element-props-item">
              <div className={'item-label is-required'} style={{ width: '120px' }}>
                是否启用
              </div>
              <Switch
                checkedChildren="开启"
                unCheckedChildren="关闭"
                style={{ margin: 'auto' }}
                checked={footerFlag}
                onChange={onChangeSwitch}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label is-required'} style={{ width: '120px' }}>
                内容
              </div>
              <TextArea autoSize onChange={(e) => onValueText(e)} value={valueText} />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体大小
              </div>
              <Slider
                value={fontSize}
                min={14}
                max={30}
                style={{ width: '100%' }}
                onChange={onChangeSlider}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体粗细
              </div>
              <Select
                value={fontWeight}
                style={{ width: '100%' }}
                onChange={onChangeSelect}
                options={fontWeightData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                文字布局
              </div>
              <Select
                value={textLayout}
                style={{ width: '100%' }}
                onChange={onChangeSelectLayout}
                options={textLayoutData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体颜色
              </div>
              <div style={{ display: 'inline-block' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    onClick={toggleColorPicker}
                    style={{
                      width: 28,
                      height: 30,
                      backgroundColor: color,
                      border: '1px solid #ccc',
                    }}></div>
                </div>
                {displayColorPicker && (
                  <div style={{ position: 'absolute', zIndex: 2 }}>
                    <SketchPicker color={color} onChange={handleColorChange} />
                  </div>
                )}
              </div>
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                css
              </div>
              <TextArea autoSize onChange={onChangeArea} value={customCSS} />
            </div>
            <Button
              type="primary"
              block
              size="large"
              onClick={applyStyles}
              style={{ margin: '10px 0' }}>
              确认配置
            </Button>
          </div>
        );
      case 'tableData':
        //修改数据区域
        if (typeSpan) {
          return (
            <div>
              <div className="page-element-props-item">
                <div className={'item-label'} style={{ width: '120px' }}>
                  合并数
                </div>
                <InputNumber
                  min={1}
                  onFocus={(e) => e.target.blur()}
                  max={maxColSpanNum}
                  value={items[tableIndex].data[index].data.data[index2 - 1].colNumber}
                  onChange={(e) => {
                    if (e !== null) {
                      onChangeCol(e);
                    }
                  }}
                />
              </div>
              <Button
                type="primary"
                ghost
                block
                size="large"
                style={{ margin: '10px 0' }}
                onClick={() => colSpan(false)}>
                返回
              </Button>
            </div>
          );
        } else {
          return (
            <div>
              <div className="page-element-props-item">
                <div className={'item-label'} style={{ width: '120px' }}>
                  内容 (回车键<br></br>自动识别为换行)
                </div>
                <TextArea autoSize onChange={(e) => onValueText(e)} value={valueText} />
              </div>
              <div className="page-element-props-item">
                <div className={'item-label'} style={{ width: '120px' }}>
                  行高度
                </div>
                <InputNumber
                  min={15}
                  value={valueHeight}
                  onChange={(e) => {
                    if (e !== null) {
                      onValueHeight(e);
                    }
                  }}
                />
              </div>
              {items[tableIndex].data[index].data.data.length > 1 && (
                <div className="page-element-props-item">
                  <div className={'item-label'} style={{ width: '120px' }}>
                    列宽度占比
                  </div>
                  <InputNumber
                    min={1}
                    max={80}
                    value={valueWidth}
                    onChange={(e) => {
                      if (e !== null) {
                        onValueWidth(e);
                      }
                    }}
                    addonAfter="%"
                  />
                </div>
              )}
              <div className="page-element-props-item">
                <div className={'item-label'} style={{ width: '120px' }}>
                  字体大小
                </div>
                <Slider
                  value={fontSize}
                  min={14}
                  max={30}
                  style={{ width: '100%' }}
                  onChange={onChangeSlider}
                />
              </div>
              <div className="page-element-props-item">
                <div className={'item-label'} style={{ width: '120px' }}>
                  字体粗细
                </div>
                <Select
                  value={fontWeight}
                  style={{ width: '100%' }}
                  onChange={onChangeSelect}
                  options={fontWeightData}
                />
              </div>
              <div className="page-element-props-item">
                <div className={'item-label'} style={{ width: '120px' }}>
                  文字布局
                </div>
                <Select
                  value={textLayout}
                  style={{ width: '100%' }}
                  onChange={onChangeSelectLayout}
                  options={textLayoutData}
                />
              </div>
              <div className="page-element-props-item">
                <div className={'item-label'} style={{ width: '120px' }}>
                  字体颜色
                </div>
                <div style={{ display: 'inline-block' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      onClick={toggleColorPicker}
                      style={{
                        width: 28,
                        height: 30,
                        backgroundColor: color,
                        border: '1px solid #ccc',
                      }}></div>
                  </div>
                  {displayColorPicker && (
                    <div style={{ position: 'absolute', zIndex: 2 }}>
                      <SketchPicker color={color} onChange={handleColorChange} />
                    </div>
                  )}
                </div>
              </div>
              <div className="page-element-props-item">
                <div className={'item-label'} style={{ width: '120px' }}>
                  css
                </div>
                <TextArea autoSize onChange={onChangeArea} value={customCSS} />
              </div>
              <Button
                type="primary"
                block
                size="large"
                onClick={applyStyles}
                style={{ margin: '10px 0' }}>
                确认配置
              </Button>
              <Button
                type="primary"
                block
                size="large"
                onClick={() => colSpan(true)}
                style={{ margin: '10px 0' }}>
                合并
              </Button>
              <Button
                type="primary"
                ghost
                block
                size="large"
                style={{ margin: '10px 0' }}
                onClick={() => back(type)}>
                返回上一层元素
              </Button>
              <Button
                type="primary"
                ghost
                block
                size="large"
                style={{ margin: '10px 0' }}
                onClick={dataSourceClick}>
                设置数据源
              </Button>
            </div>
          );
        }

      case 'text':
        //修改文字区域
        return (
          <div>
            <div className="page-element-props-item">
              <div className={'item-label is-required'} style={{ width: '120px' }}>
                内容 (回车键<br></br>自动识别为换行)
              </div>
              <TextArea autoSize onChange={(e) => onValueText(e)} value={valueText} />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                高度
              </div>
              <InputNumber
                min={15}
                value={valueHeight}
                onChange={(e) => {
                  if (e !== null) {
                    onValueHeight(e);
                  }
                }}
                addonAfter="px"
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                宽度占比
              </div>
              <InputNumber
                min={1}
                max={100}
                value={valueWidth}
                onChange={(e) => {
                  if (e !== null) {
                    onValueWidth(e);
                  }
                }}
                addonAfter="%"
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体大小
              </div>
              <Slider
                value={fontSize}
                min={14}
                max={30}
                style={{ width: '100%' }}
                onChange={onChangeSlider}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                模块布局
              </div>
              <Select
                value={textDivLayout}
                style={{ width: '100%' }}
                onChange={onChangeSelectDivLayout}
                options={textDivLayoutData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                文字布局
              </div>
              <Select
                value={textLayout}
                style={{ width: '100%' }}
                onChange={onChangeSelectLayout}
                options={textLayoutData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体粗细
              </div>
              <Select
                value={fontWeight}
                style={{ width: '100%' }}
                onChange={onChangeSelect}
                options={fontWeightData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体颜色
              </div>
              <div style={{ display: 'inline-block' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    onClick={toggleColorPicker}
                    style={{
                      width: 28,
                      height: 30,
                      backgroundColor: color,
                      border: '1px solid #ccc',
                    }}></div>
                </div>
                {displayColorPicker && (
                  <div style={{ position: 'absolute', zIndex: 2 }}>
                    <SketchPicker color={color} onChange={handleColorChange} />
                  </div>
                )}
              </div>
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                css
              </div>
              <TextArea autoSize onChange={onChangeArea} value={customCSS} />
            </div>
            <Button
              type="primary"
              block
              size="large"
              onClick={applyStyles}
              style={{ margin: '10px 0' }}>
              确认配置
            </Button>
            <Button
              type="primary"
              ghost
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={() => back(type)}>
              返回上一层元素
            </Button>
            <Button
              type="primary"
              ghost
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={dataSourceClick}>
              设置数据源
            </Button>
            <Button
              type="primary"
              danger
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={delItem}>
              删除当前元素
            </Button>
          </div>
        );
      case 'tableSubData':
        //修改子表区域
        return (
          <div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体大小
              </div>
              <Slider
                value={fontSize}
                min={14}
                max={30}
                style={{ width: '100%' }}
                onChange={onChangeSlider}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体粗细
              </div>
              <Select
                value={fontWeight}
                style={{ width: '100%' }}
                onChange={onChangeSelect}
                options={fontWeightData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体颜色
              </div>
              <div style={{ display: 'inline-block' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    onClick={toggleColorPicker}
                    style={{
                      width: 28,
                      height: 30,
                      backgroundColor: color,
                      border: '1px solid #ccc',
                    }}></div>
                </div>
                {displayColorPicker && (
                  <div style={{ position: 'absolute', zIndex: 2 }}>
                    <SketchPicker color={color} onChange={handleColorChange} />
                  </div>
                )}
              </div>
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                css
              </div>
              <TextArea autoSize onChange={onChangeArea} value={customCSS} />
            </div>
            <Button
              type="primary"
              block
              size="large"
              onClick={applyStyles}
              style={{ margin: '10px 0' }}>
              确认配置
            </Button>
            <Button
              type="primary"
              ghost
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={() => back(type)}>
              返回上一层元素
            </Button>
            <Button
              type="primary"
              danger
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={delItem}>
              删除当前元素
            </Button>
          </div>
        );
      case 'sum':
        //修改合计分类区域
        return (
          <div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体大小
              </div>
              <Slider
                value={fontSize}
                min={14}
                max={30}
                style={{ width: '100%' }}
                onChange={onChangeSlider}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体粗细
              </div>
              <Select
                value={fontWeight}
                style={{ width: '100%' }}
                onChange={onChangeSelect}
                options={fontWeightData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体颜色
              </div>
              <div style={{ display: 'inline-block' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    onClick={toggleColorPicker}
                    style={{
                      width: 28,
                      height: 30,
                      backgroundColor: color,
                      border: '1px solid #ccc',
                    }}></div>
                </div>
                {displayColorPicker && (
                  <div style={{ position: 'absolute', zIndex: 2 }}>
                    <SketchPicker color={color} onChange={handleColorChange} />
                  </div>
                )}
              </div>
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                css
              </div>
              <TextArea autoSize onChange={onChangeArea} value={customCSS} />
            </div>
            <Button
              type="primary"
              block
              size="large"
              onClick={applyStyles}
              style={{ margin: '10px 0' }}>
              确认配置
            </Button>
            <Button
              type="primary"
              ghost
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={() => back(type)}>
              返回上一层元素
            </Button>
            <Button
              type="primary"
              danger
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={delItem}>
              删除当前元素
            </Button>
          </div>
        );
      case 'Table':
        //修改整个表格区域
        return (
          <div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体大小
              </div>
              <Slider
                value={fontSize}
                min={14}
                max={30}
                style={{ width: '100%' }}
                onChange={onChangeSlider}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体粗细
              </div>
              <Select
                value={fontWeight}
                style={{ width: '100%' }}
                onChange={onChangeSelect}
                options={fontWeightData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                文字布局
              </div>
              <Select
                value={textLayout}
                style={{ width: '100%' }}
                onChange={onChangeSelectLayout}
                options={textLayoutData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体颜色
              </div>
              <div style={{ display: 'inline-block' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    onClick={toggleColorPicker}
                    style={{
                      width: 28,
                      height: 30,
                      backgroundColor: color,
                      border: '1px solid #ccc',
                    }}></div>
                </div>
                {displayColorPicker && (
                  <div style={{ position: 'absolute', zIndex: 2 }}>
                    <SketchPicker color={color} onChange={handleColorChange} />
                  </div>
                )}
              </div>
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                css
              </div>
              <TextArea autoSize onChange={onChangeArea} value={customCSS} />
            </div>
            <Button
              type="primary"
              block
              size="large"
              onClick={applyStyles}
              style={{ margin: '10px 0' }}>
              确认配置
            </Button>
          </div>
        );
      case 'tr':
        //修改行
        return (
          <div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                列数
              </div>
              <InputNumber
                min={1}
                onFocus={(e) => e.target.blur()}
                value={items[tableIndex].data[index].data.data.length}
                onChange={(e) => onChangeRow(e)}
              />
            </div>
            <Button
              type="primary"
              ghost
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={() => back(type)}>
              返回上一层元素
            </Button>
            <Button
              type="primary"
              danger
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={delItem}>
              删除当前元素
            </Button>
          </div>
        );
      case 'footer':
        //修改底注
        return (
          <div>
            <div className="page-element-props-item">
              <div className={'item-label is-required'} style={{ width: '120px' }}>
                是否启用
              </div>
              <Switch
                checkedChildren="开启"
                unCheckedChildren="关闭"
                style={{ margin: 'auto' }}
                checked={footerFlag}
                onChange={onChangeSwitch}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label is-required'} style={{ width: '120px' }}>
                内容 (回车键<br></br>自动识别为换行)
              </div>
              <TextArea autoSize onChange={(e) => onValueText(e)} value={valueText} />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体大小
              </div>
              <Slider
                value={fontSize}
                min={14}
                max={30}
                style={{ width: '100%' }}
                onChange={onChangeSlider}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体粗细
              </div>
              <Select
                value={fontWeight}
                style={{ width: '100%' }}
                onChange={onChangeSelect}
                options={fontWeightData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                文字布局
              </div>
              <Select
                value={textLayout}
                style={{ width: '100%' }}
                onChange={onChangeSelectLayout}
                options={textLayoutData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体颜色
              </div>
              <div style={{ display: 'inline-block' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    onClick={toggleColorPicker}
                    style={{
                      width: 28,
                      height: 30,
                      backgroundColor: color,
                      border: '1px solid #ccc',
                    }}></div>
                </div>
                {displayColorPicker && (
                  <div style={{ position: 'absolute', zIndex: 2 }}>
                    <SketchPicker color={color} onChange={handleColorChange} />
                  </div>
                )}
              </div>
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                css
              </div>
              <TextArea autoSize onChange={onChangeArea} value={customCSS} />
            </div>
            <Button
              type="primary"
              block
              size="large"
              onClick={applyStyles}
              style={{ margin: '10px 0' }}>
              确认配置
            </Button>
            <Button
              type="primary"
              ghost
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={dataSourceClick}>
              设置数据源
            </Button>
          </div>
        );
      case 'subtitle':
        //修改副标题
        return (
          <div>
            <div className="page-element-props-item">
              <div className={'item-label is-required'} style={{ width: '120px' }}>
                是否启用
              </div>
              <Switch
                checkedChildren="开启"
                unCheckedChildren="关闭"
                style={{ margin: 'auto' }}
                checked={footerFlag}
                onChange={onChangeSwitch}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label is-required'} style={{ width: '120px' }}>
                内容 (回车键<br></br>自动识别为换行)
              </div>
              <TextArea autoSize onChange={(e) => onValueText(e)} value={valueText} />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体大小
              </div>
              <Slider
                value={fontSize}
                min={14}
                max={30}
                style={{ width: '100%' }}
                onChange={onChangeSlider}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体粗细
              </div>
              <Select
                value={fontWeight}
                style={{ width: '100%' }}
                onChange={onChangeSelect}
                options={fontWeightData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                文字布局
              </div>
              <Select
                value={textLayout}
                style={{ width: '100%' }}
                onChange={onChangeSelectLayout}
                options={textLayoutData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体颜色
              </div>
              <div style={{ display: 'inline-block' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    onClick={toggleColorPicker}
                    style={{
                      width: 28,
                      height: 30,
                      backgroundColor: color,
                      border: '1px solid #ccc',
                    }}></div>
                </div>
                {displayColorPicker && (
                  <div style={{ position: 'absolute', zIndex: 2 }}>
                    <SketchPicker color={color} onChange={handleColorChange} />
                  </div>
                )}
              </div>
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                css
              </div>
              <TextArea autoSize onChange={onChangeArea} value={customCSS} />
            </div>
            <Button
              type="primary"
              block
              size="large"
              onClick={applyStyles}
              style={{ margin: '10px 0' }}>
              确认配置
            </Button>
            <Button
              type="primary"
              ghost
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={dataSourceClick}>
              设置数据源
            </Button>
          </div>
        );
      case 'footerText':
        //修改底注中的文字
        return (
          <div>
            <div className="page-element-props-item">
              <div className={'item-label is-required'} style={{ width: '120px' }}>
                内容 (回车键<br></br>自动识别为换行)
              </div>
              <TextArea autoSize onChange={(e) => onValueText(e)} value={valueText} />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                高度
              </div>
              <InputNumber
                min={15}
                value={valueHeight}
                onChange={(e) => {
                  if (e !== null) {
                    onValueHeight(e);
                  }
                }}
                addonAfter="px"
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                宽度占比
              </div>
              <InputNumber
                min={1}
                max={100}
                value={valueWidth}
                onChange={(e) => {
                  if (e !== null) {
                    onValueWidth(e);
                  }
                }}
                addonAfter="%"
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体大小
              </div>
              <Slider
                value={fontSize}
                min={14}
                max={30}
                style={{ width: '100%' }}
                onChange={onChangeSlider}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                模块布局
              </div>
              <Select
                value={textDivLayout}
                style={{ width: '100%' }}
                onChange={onChangeSelectDivLayout}
                options={textDivLayoutData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                文字布局
              </div>
              <Select
                value={textLayout}
                style={{ width: '100%' }}
                onChange={onChangeSelectLayout}
                options={textLayoutData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体粗细
              </div>
              <Select
                value={fontWeight}
                style={{ width: '100%' }}
                onChange={onChangeSelect}
                options={fontWeightData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体颜色
              </div>
              <div style={{ display: 'inline-block' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    onClick={toggleColorPicker}
                    style={{
                      width: 28,
                      height: 30,
                      backgroundColor: color,
                      border: '1px solid #ccc',
                    }}></div>
                </div>
                {displayColorPicker && (
                  <div style={{ position: 'absolute', zIndex: 2 }}>
                    <SketchPicker color={color} onChange={handleColorChange} />
                  </div>
                )}
              </div>
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                css
              </div>
              <TextArea autoSize onChange={onChangeArea} value={customCSS} />
            </div>
            <Button
              type="primary"
              block
              size="large"
              onClick={applyStyles}
              style={{ margin: '10px 0' }}>
              确认配置
            </Button>
            <Button
              type="primary"
              ghost
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={() => back(type)}>
              返回上一层元素
            </Button>
            <Button
              type="primary"
              ghost
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={dataSourceClick}>
              设置数据源
            </Button>
            <Button
              type="primary"
              danger
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={delItem}>
              删除当前元素
            </Button>
          </div>
        );
      case 'subText':
        //修改副标题中的文字
        return (
          <div>
            <div className="page-element-props-item">
              <div className={'item-label is-required'} style={{ width: '120px' }}>
                内容 (回车键<br></br>自动识别为换行)
              </div>
              <TextArea autoSize onChange={(e) => onValueText(e)} value={valueText} />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                高度
              </div>
              <InputNumber
                min={15}
                value={valueHeight}
                onChange={(e) => {
                  if (e !== null) {
                    onValueHeight(e);
                  }
                }}
                addonAfter="px"
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                宽度占比
              </div>
              <InputNumber
                min={1}
                max={100}
                value={valueWidth}
                onChange={(e) => {
                  if (e !== null) {
                    onValueWidth(e);
                  }
                }}
                addonAfter="%"
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体大小
              </div>
              <Slider
                value={fontSize}
                min={14}
                max={30}
                style={{ width: '100%' }}
                onChange={onChangeSlider}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                模块布局
              </div>
              <Select
                value={textDivLayout}
                style={{ width: '100%' }}
                onChange={onChangeSelectDivLayout}
                options={textDivLayoutData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                文字布局
              </div>
              <Select
                value={textLayout}
                style={{ width: '100%' }}
                onChange={onChangeSelectLayout}
                options={textLayoutData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体粗细
              </div>
              <Select
                value={fontWeight}
                style={{ width: '100%' }}
                onChange={onChangeSelect}
                options={fontWeightData}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                字体颜色
              </div>
              <div style={{ display: 'inline-block' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    onClick={toggleColorPicker}
                    style={{
                      width: 28,
                      height: 30,
                      backgroundColor: color,
                      border: '1px solid #ccc',
                    }}></div>
                </div>
                {displayColorPicker && (
                  <div style={{ position: 'absolute', zIndex: 2 }}>
                    <SketchPicker color={color} onChange={handleColorChange} />
                  </div>
                )}
              </div>
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                css
              </div>
              <TextArea autoSize onChange={onChangeArea} value={customCSS} />
            </div>
            <Button
              type="primary"
              block
              size="large"
              onClick={applyStyles}
              style={{ margin: '10px 0' }}>
              确认配置
            </Button>
            <Button
              type="primary"
              ghost
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={() => back(type)}>
              返回上一层元素
            </Button>
            <Button
              type="primary"
              ghost
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={dataSourceClick}>
              设置数据源
            </Button>
            <Button
              type="primary"
              danger
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={delItem}>
              删除当前元素
            </Button>
          </div>
        );
      case 'qccode':
        return (
          <div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                二维码大小
              </div>
              <InputNumber
                min={10}
                addonAfter="px"
                value={items[tableIndex].qrcode![qcIndex].style.size}
                onChange={(e) => onChangeQc(e, 'size')}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                y
              </div>
              <InputNumber
                min={0}
                addonAfter="px"
                value={items[tableIndex].qrcode![qcIndex].style.top}
                onChange={(e) => onChangeQc(e, 'top')}
              />
            </div>
            <div className="page-element-props-item">
              <div className={'item-label'} style={{ width: '120px' }}>
                x
              </div>
              <InputNumber
                min={0}
                addonAfter="px"
                value={items[tableIndex].qrcode![qcIndex].style.left}
                onChange={(e) => onChangeQc(e, 'left')}
              />
            </div>
            <Button
              type="primary"
              danger
              block
              size="large"
              style={{ margin: '10px 0' }}
              onClick={delQc}>
              删除当前二维码
            </Button>
          </div>
        );
      default:
        return <></>;
    }
  }
  function typeText(type: string) {
    switch (type) {
      case 'Table-title':
        return (
          <Tag color="processing" className="header-kind">
            标题
          </Tag>
        );
      case 'subtitle':
        return (
          <Tag color="processing" className="header-kind">
            副标题
          </Tag>
        );
      case 'subText':
        return (
          <Tag color="processing" className="header-kind">
            副标题文字组件
          </Tag>
        );
      case 'footer':
        return (
          <Tag color="processing" className="header-kind">
            底注
          </Tag>
        );
      case 'tableData':
        return (
          <Tag color="processing" className="header-kind">
            数据区域
          </Tag>
        );
      case 'tableSubData':
        return (
          <Tag color="processing" className="header-kind">
            子表
          </Tag>
        );
      case 'sum':
        return (
          <Tag color="processing" className="header-kind">
            合计分类区域
          </Tag>
        );
      case 'Table':
        return (
          <Tag color="processing" className="header-kind">
            表格
          </Tag>
        );
      case 'tr':
        return (
          <Tag color="processing" className="header-kind">
            当前行
          </Tag>
        );
      case 'text':
        return (
          <Tag color="processing" className="header-kind">
            文字
          </Tag>
        );
      case 'qccode':
        return (
          <Tag color="processing" className="header-kind">
            二维码
          </Tag>
        );
      default:
        return <></>;
    }
  }
  return (
    <div className="page-element-props" style={{ width: '320px' }}>
      <div className="props-header">
        <span className="header-title">配置区域</span>
        {type ? typeText(type) : null}
      </div>
      {type && flag ? <div className="props-content">{renderComponent(type)}</div> : null}
    </div>
  );
};
interface ChildProps {
  state: boolean;
  print: string;
  printData?: itemsTable[];
  handSave: (print: object) => void;
}
const PrintCreate: React.FC<ChildProps> = ({ state, handSave, print, printData }) => {
  const [active, setActive] = useState<string>();
  const [draggedParameter, setDraggedParameter] = useState('');
  const [items, setItems] = useState<itemsTable[]>([
    {
      title: {
        name: '标题',
        style: {},
        flag: true,
      },
      data: [],
      footer: {
        name: '底注',
        style: {},
        flag: true,
        dataSource: false,
      },
      subtitle: {
        name: '副标题',
        style: {},
        flag: true,
        dataSource: false,
      },
    },
  ]);
  const [index, setIndex] = useState<number>(0);
  const [index2, setIndex2] = useState<number>(0);
  const [index3, setIndex3] = useState<number>(0);
  const [tableIndex, setTableIndex] = useState<number>(0);
  const [qcIndex, setQcIndex] = useState<number>(0);
  const [type, setType] = useState<string>('');
  const [flag, setFlag] = useState(true);
  useEffect(() => {
    if (printData!.length > 0) {
      setItems(printData as itemsTable[]);
    } else {
      setItems([
        {
          title: {
            name: '标题',
            style: {},
            flag: true,
          },
          data: [],
          footer: {
            name: '底注',
            style: {},
            flag: true,
            dataSource: false,
          },
          subtitle: {
            name: '副标题',
            style: {},
            flag: true,
            dataSource: false,
          },
        },
      ]);
    }
  }, []);
  useEffect(() => {
    handSave({
      name: print ? print : '',
      table: items,
    });
  }, [state]);
  function renderTabs() {
    return [
      {
        key: 'tree',
        label: '组件库',
        icon: <AiOutlineApartment />,
      },
      /* {
        key: 'data',
        label: 'JSON 数据',
        icon: <FileOutlined />,
      }, */
    ];
  }
  const handleDragStart = (parameter: string) => {
    setDraggedParameter(parameter);
  };
  const handleFlag = (flag: boolean) => {
    setFlag(flag);
  };
  const handleDataConfig = (items: itemsTable[]) => {
    setItems(items);
  };
  const handleIndexData = (index: number) => {
    setIndex(index);
  };
  const handleType = (type: string) => {
    setType(type);
  };
  const handleIndexData2 = (index2: number) => {
    setIndex2(index2);
  };
  const handleIndexData3 = (index3: number) => {
    setIndex3(index3);
  };
  const handleTableIndex = (index: number) => {
    setTableIndex(index);
  };
  const handleQcIndex = (index: number) => {
    setQcIndex(index);
  };
  const Configuration: { [key: string]: ReactNode } = {
    tree: (
      <Assembly
        onDragStart={handleDragStart}
        handleDataConfig={handleDataConfig}
        items={items}
        handleType={handleType}
      />
    ),
  };
  return (
    <div className={css.content} style={{ height: '100%' }}>
      <Layout.Sider collapsedWidth={60} collapsed={true}>
        <Menu
          items={renderTabs()}
          mode={'inline'}
          selectedKeys={active ? [active] : []}
          onSelect={(info) => {
            setActive(info.key);
          }}
          onDeselect={() => setActive(undefined)}
        />
      </Layout.Sider>
      <div className={`${active ? css.designConfig : ''} is-full-height`}>
        {active ? Configuration[active] : <></>}
      </div>
      <div style={{ flex: 'auto', height: '100%', overflow: 'auto' }}>
        <ContractTable
          tableIndex={tableIndex}
          handleTableIndex={handleTableIndex}
          typeDrag={draggedParameter}
          handleDataConfig={handleDataConfig}
          handleIndexData={handleIndexData}
          handleType={handleType}
          items={items}
          index={index}
          index2={index2}
          index3={index3}
          type={type}
          handleIndexData2={handleIndexData2}
          handleIndexData3={handleIndexData3}
          flag={flag}
          handleFlag={handleFlag}
          handleQcIndex={handleQcIndex}
          qcIndex={qcIndex}
        />
      </div>
      <div className="is-full-height">
        <ElementProps
          tableIndex={tableIndex}
          handleTableIndex={handleTableIndex}
          items={items}
          index={index}
          index2={index2}
          index3={index3}
          type={type}
          flag={flag}
          handleDataConfig={handleDataConfig}
          handleIndexData={handleIndexData}
          handleType={handleType}
          handleIndexData2={handleIndexData2}
          handleIndexData3={handleIndexData3}
          handleFlag={handleFlag}
          qcIndex={qcIndex}
        />
      </div>
    </div>
  );
};
export default PrintCreate;
