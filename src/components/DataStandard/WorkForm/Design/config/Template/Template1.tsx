import React, { FC, useEffect, useState } from 'react';
import './index.less';
import css from './designer.module.less';
import { IPrint } from '@/ts/core';
import { Button, Modal, Space, Transfer } from 'antd';
import { SelectBox } from 'devextreme-react';
import { itemsTable } from '@/ts/base/model';
import QrCode from 'qrcode.react';
import { XForm } from '@/ts/base/schema';
interface IProps {
  current: XForm;
  printType: string;
  fields: any;
  print: IPrint;
}
const Template1: FC<IProps> = ({ fields, printType, print, current }) => {
  const [attrShow, setAttrShow] = useState(false);
  const [checkAttrShow, setCheckAttrShow] = useState(false);
  const [target, setTarget] = useState();
  const [nowkey, setNowkey] = useState('');
  const [title, setTitle] = useState('');
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [mockData, setMockData] = useState<any[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const onChange = (nextTargetKeys: string[]) => {
    setTargetKeys(nextTargetKeys);
  };

  const onSelectChange = (sourceSelectedKeys: string[], targetSelectedKeys: string[]) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
  };

  const showDialog = (key: string) => {
    setNowkey(key);
    setAttrShow(true);
  };
  const changeCheckAttrShow = (flag: boolean, lookups: any) => {
    const newData = lookups.filter((item: any) => item.hide).map((item: any) => item.id);
    setTargetKeys([...newData]);
    setMockData(lookups);
    setCheckAttrShow(flag);
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
        return obj.name;
      case '输出型':
        return obj.name;
      default:
        return <></>;
    }
  }
  useEffect(() => {
    current.printData.attributes.forEach((item: any) => {
      if (item.title == printType) {
        setTemplateMap(item);
      }
    });
  }, []);
  useEffect(() => {
    setTitle(printType);
    if (print && print.id === printType) {
      setItems(print.table);
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
                    <tr key={index2} data-index={index2} className={'dynamic-row'}>
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
        destroyOnClose
        title={'选择表单属性'}
        open={attrShow}
        bodyStyle={{
          border: 'none',
          padding: 0,
          marginLeft: '32px',
          marginRight: '32px',
        }}
        onOk={() => {
          const parintCurrentData = current.printData.attributes.filter((item: any) => {
            return item.title == title;
          });
          if (parintCurrentData.length > 0) {
            current.printData.attributes.forEach((item: any) => {
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
              current.printData.attributes.push({ [nowkey]: target, title: title });
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
            width={400}
            searchEnabled={true}
            searchMode="contains"
            displayExpr={(item) => {
              return item?.xfield?.caption;
            }}
            valueExpr={(item) => {
              return item?.xfield?.caption;
            }}
            dataSource={fields}
            onSelectionChanged={(e) => {
              //判断是否是选择框，如果是选择框的话那么再来一个弹窗可以选择字段隐藏和显示的。
              if (e.selectedItem && e.selectedItem.valueType == '选择型') {
                //给一个弹窗
                changeCheckAttrShow(true, e.selectedItem.lookups);
              }
              setTarget(e.selectedItem);
            }}
          />
        </Space>
      </Modal>
    </>
  );
};
export default Template1;
