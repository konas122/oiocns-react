import React, { FC, useEffect, useState } from 'react';
import './index.less';
import css from './designer.module.less';
import orgCtrl from '@/ts/controller';
import { schema } from '@/ts/base';
import QrCode from 'qrcode.react';
import { formatZhDate } from '@/utils/tools';

interface IProps {
  printData: any;
  current: any;
  print: any;
  loading: () => void;
  styleTemplate: string;
}

const Template1: FC<IProps> = ({ printData, current, loading, styleTemplate, print }) => {
  const [sameRenderType] = useState<string[]>(['货币型', '描述型', '时间型']);
  const [items, setItems] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<{ [key: string]: any }>({});
  useEffect(() => {
    //打印样式和数据源处理
    print &&
      print.forEach((item: any) => {
        if (item.id === printData.type) {
          let newItems = [];
          for (let i = 0; i < current.length; i++) {
            newItems.push(...item.table); // 将数组数据添加到重复数组中
          }
          setItems(newItems);
          let newAttributes: { [key: string]: any } = {};
          printData.attributes.forEach((item: any) => {
            if (item.title === printData.type) {
              for (let i = 0; i < current.length; i++) {
                // 将数据源修改后添加到数据中
                Object.entries(item).forEach(([key, value]) => {
                  if (key !== 'title') {
                    const index = key.substring(4);
                    const indexArr = index.split('_');
                    if (Number(indexArr[0]) == i) {
                      //如果有这页的数据的，那么照常给数据
                      newAttributes[key] = value;
                    } else {
                      //如果目前没有页数据的，那么添加这页数据
                      newAttributes[
                        `attr${i}_${Number(indexArr[1])}_${Number(indexArr[2])}`
                      ] = value;
                    }
                  }
                });
              }
            }
          });
          setAttributes(newAttributes);
        }
      });
  }, []);
  const formatNumber = (num: Number) => {
    return Number(Number(num).toFixed(2));
  };
  const Tab: FC<any> = ({ value, index }) => {
    const attrsObj = attributes[value];
    if (!attrsObj) {
      return <span></span>;
    }
    const [userDetail, setUserDetail] = useState<{ [key: string]: string }>({});
    const type = attrsObj['valueType'];
    useEffect(() => {
      if (type === '用户型') {
        (async () => {
          const res = orgCtrl.user.findMetadata<schema.XEntity>(
            current[index][attrsObj['id']],
          );
          setUserDetail({ ...userDetail, [current[index][attrsObj['id']]]: res?.name });
        })();
      }
    }, []);
    if (type === '数值型') {
      return (
        <span>
          {current[index][attrsObj['id']] !== undefined
            ? formatNumber(current[index][attrsObj['id']])
            : ''}
        </span>
      );
    }
    if (~sameRenderType.indexOf(type)) {
      return <span>{current[index][attrsObj['id']]}</span>;
    }
    if (type == '日期型') {
      return (
        <span>
          {current[index][attrsObj['id']]
            ? formatZhDate(current[index][attrsObj['id']], 'YYYY年MM月DD日')
            : ''}
        </span>
      );
    } else if (type === '引用型') {
      const parentObj = JSON.parse(current[index][attrsObj['id']]);
      const newParentObj = parentObj.map((item: any) => {
        return item.name;
      });
      const parentNodeText = newParentObj.join('、');
      return <span>{parentNodeText}</span>;
    } else if (type === '选择型') {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {attrsObj.lookups
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
                      ? current[index][attrsObj['id']].includes(lookup.value)
                      : current[index][attrsObj['id']] === lookup.value
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
      let flText = '';
      attrsObj.lookups.forEach((item: any) => {
        if (item.value == current[index][attrsObj['id']]) {
          flText = item.text;
        }
      });
      return <span>{flText}</span>;
    } else if (type === '用户型') {
      return <span>{userDetail[current[index][attrsObj['id']]]}</span>;
    }
  };
  useEffect(() => {
    if (loading) {
      loading();
    }
  }, []);
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
                            <Tab value={`attr${index}_subtitle`} index={index} />
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
                                      index={index}
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
                <table
                  style={{ width: '100%' }}
                  className={'printContent'}
                  border={1}
                  cellSpacing=""
                  cellPadding="10">
                  <tbody style={item.style}>
                    {item.data.map((item2: any, index2: number) => (
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
                                  <Tab
                                    value={`attr${index}_${index2}_${index3}`}
                                    index={index}
                                  />
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
                                          index={index}
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
