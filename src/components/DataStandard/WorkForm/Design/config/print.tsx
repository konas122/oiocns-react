import React, { useState, useEffect } from 'react';
import { useEffectOnce } from 'react-use';
import QrCode from 'qrcode.react';
import { SelectBox, Form } from 'devextreme-react';
import { GroupItem, SimpleItem } from 'devextreme-react/form';
import { Button, Modal, Card } from 'antd';
import orgCtrl from '@/ts/controller';
import { PlusCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { IForm } from '@/ts/core';
import { deepClone } from '@/ts/base/common';
import cls from './index.module.less';

interface Iprops {
  current: IForm;
}

const INITLABELPRINTFORM = {
  hide: false,
  qrcodeSize: '55',
  fontSize: '9',
  leaveNote: '0',
  qrcodeSource: 'id',
  width: '60',
  height: '35',
  unitVertical: 3,
  unitLevel: 3,
  unitSize: '20',
  unitbr: false,
  unitbrSize: '60'
};

const INITLABELPRINTCOUNT = ['资产编号', '资产名称', '存放地点', '规格型号'];

/** 条码打印配置 */
const PrintConfig: React.FC<Iprops> = ({ current }) => {
  const [formData, setFormData] = useState<{ [key: string]: string | boolean }>(
    current.metadata.print?.config,
  );
  const [count, setCount] = useState<{ label: string; value: string; type: string }[]>(
    current.metadata.print?.qrcodeConfig || [],
  );
  const values = deepClone(current?.attributes);
  values.unshift({
    id: 'id',
    name: '唯一标识',
    code: 'id',
    valueType: '描述型',
    remark: '唯一标识',
  } as any);
  const unitVerticalList = [
    { id: 1, name: '与二维码对齐', value: 1 },
    { id: 2, name: '与属性对齐', value: 2 },
    { id: 3, name: '不对齐', value: 3 }
  ]
  const unitLevelList = [
    { id: 1, name: '居左', value: 'left' },
    { id: 2, name: '居中', value: 'center' },
    { id: 3, name: '居右', value: 'right' }
  ]

  useEffectOnce(() => {
    if (!formData || JSON.stringify(formData) === '{}') {
      setFormData(INITLABELPRINTFORM);
    }
    if (count.length === 0) {
      const countArr: { label: string; value: string; type: string }[] = [];
      INITLABELPRINTCOUNT.map((item) => {
        const curItem = findItem(item);
        if (curItem) {
          countArr.push({
            label: curItem.name || '',
            type: curItem.valueType || '',
            value: curItem.id || '',
          });
        }
        setCount(countArr);
      });
    }
  });

  const findItem = (title: string) => {
    const attribute = current.attributes.find((i) => i.name === title);
    if (attribute) return attribute;
    return '';
  };

  useEffect(() => {
    current.metadata.print = {
      config: formData,
      qrcodeConfig: count || [],
    };
  }, [count, formData]);

  /** 预览渲染 */
  const renderPreview = () => {
    Modal.info({
      icon: <></>,
      title: '模板打印预览',
      okText: '关闭',
      closeIcon: <CloseOutlined />,
      maskClosable: true,
      content: (
        <>
          {formData && (
            <div
              className={cls['print-preview']}
              style={{
                width: `${formData.width}mm`,
                height: `${formData.height}mm`,
              }}>
              <div className={cls['print-preview-top']}>
                <div style={{
                  textAlign: formData.qrcodeCompanyName !== undefined ? unitLevelList[Number(formData.unitLevel) - 1].value : '',
                }}>
                  <QrCode
                    level="H"
                    size={Number(formData.qrcodeSize)}
                    renderAs="canvas"
                    value={current.id}
                  />
                  <div
                    className={cls['print-list']}
                    style={{
                      fontSize: `${formData.fontSize}px`,
                      marginTop: `${Number(formData.unitSize)}px`,
                      textAlign: formData.qrcodeCompanyName !== undefined ? (unitLevelList[Number(formData.unitLevel) - 1].value) : '',
                      display: formData.qrcodeCompanyName !== undefined ? (unitVerticalList[Number(formData.unitVertical) - 1].value == 1 ? 'block' : 'none') : '',
                      textWrap: formData.unitbr == false ? 'nowrap' : 'wrap',
                      width: `${Number(formData.unitbrSize)}px`,
                    }}
                  >
                    {
                      orgCtrl.user.companys.find((i) => i.id === formData.qrcodeCompanyName)
                        ?.name
                    }
                  </div>
                </div>
                <div>
                  {count.map((item) => {
                    return (
                      <div
                        className={cls['print-list']}
                        key={item.value}
                        style={{
                          fontSize: `${formData.fontSize}px`,
                        }}>
                        {item.label}: {item.label}
                      </div>
                    );
                  })}
                  <div
                    className={cls['print-list']}
                    style={{
                      fontSize: `${formData.fontSize}px`,
                      marginTop: `${Number(formData.unitSize)}px`,
                      textAlign: formData.qrcodeCompanyName !== undefined ? (unitLevelList[Number(formData.unitLevel) - 1].value) : '',
                      display: formData.qrcodeCompanyName !== undefined ? (unitVerticalList[Number(formData.unitVertical) - 1].value == 2 ? 'block' : 'none') : '',
                      textWrap: formData.unitbr == false ? 'nowrap' : 'wrap',
                      width: `${Number(formData.unitbrSize)}px`,
                    }}>
                    {
                      orgCtrl.user.companys.find((i) => i.id === formData.qrcodeCompanyName)
                        ?.name
                    }
                  </div>
                </div>
              </div>
              <div
                className={cls['print-list']}
                style={{
                  fontSize: `${formData.fontSize}px`,
                  marginTop: `${Number(formData.unitSize)}px`,
                  textAlign: formData.qrcodeCompanyName !== undefined ? (unitLevelList[Number(formData.unitLevel) - 1].value) : '',
                  display: formData.qrcodeCompanyName !== undefined ? (unitVerticalList[Number(formData.unitVertical) - 1].value == 3 ? 'block' : 'none') : '',
                  textWrap: formData.unitbr == false ? 'nowrap' : 'wrap',
                  width: `${Number(formData.unitbrSize)}px`,
                }}>
                {
                  orgCtrl.user.companys.find((i) => i.id === formData.qrcodeCompanyName)
                    ?.name
                }
              </div>
            </div>
          )}
        </>
      ),
    });
  };

  /** 打印基础信息配置 */
  const renderBaseConfig = () => {
    return (
      <Card
        title="标签打印设置"
        extra={
          <Button type="link" onClick={() => renderPreview()}>
            预览
          </Button>
        }>
        <Form
          scrollingEnabled
          formData={formData}
          onFieldDataChanged={(e) => {
            console.log(e)
            setFormData({ ...formData, [e.dataField as string]: e.value });
          }}>
          <GroupItem>
            <SimpleItem
              dataField="hide"
              editorType="dxCheckBox"
              label={{ text: '是否隐藏打印按钮' }}
            />
            <SimpleItem
              dataField="width"
              editorType="dxNumberBox"
              label={{ text: '模板长度(mm)' }}
            />
            <SimpleItem
              dataField="height"
              editorType="dxNumberBox"
              label={{ text: '模板高度(mm)' }}
            />
            <SimpleItem
              dataField="qrcodeSource"
              editorType="dxSelectBox"
              label={{ text: '二维码绑定字段' }}
              editorOptions={{
                displayExpr: 'name',
                valueExpr: 'id',
                dataSource: values || [],
              }}
            />
            <SimpleItem
              dataField="qrcodeSize"
              editorType="dxNumberBox"
              label={{ text: '二维码大小(px)' }}
            />
            <SimpleItem
              dataField="fontSize"
              editorType="dxNumberBox"
              label={{ text: '字体大小(px)' }}
            />
            <SimpleItem
              dataField="leaveNote"
              editorType="dxNumberBox"
              label={{ text: '顶部留白高度(mm)' }}
            />
            <SimpleItem
              dataField="unitbr"
              editorType="dxCheckBox"
              label={{ text: '绑定单位名称是否换行' }}
            />
            <SimpleItem
              dataField="unitbrSize"
              editorType="dxNumberBox"
              label={{ text: '绑定单位名称换行宽度(px)' }}
            />
            <SimpleItem
              dataField="unitVertical"
              editorType="dxSelectBox"
              label={{ text: '绑定单位名称垂直对齐方式' }}
              editorOptions={{
                displayExpr: 'name',
                valueExpr: 'id',
                dataSource: unitVerticalList,
              }}
            />
            <SimpleItem
              dataField="unitLevel"
              editorType="dxSelectBox"
              label={{ text: '绑定单位名称水平对齐方式' }}
              editorOptions={{
                displayExpr: 'name',
                valueExpr: 'id',
                dataSource: unitLevelList,
              }}
            />
            <SimpleItem
              dataField="unitSize"
              editorType="dxNumberBox"
              label={{ text: '绑定单位名称距离顶部位置(px)' }}
            />
          </GroupItem>
        </Form>
      </Card>
    );
  };

  /** 二维码信息配置 */
  const rederQrCodeConfig = () => {
    return (
      <Card>
        <div className={cls['print-code-config']}>
          <div className={cls['print-code-content']}>
            <div className={cls['print-code-content-data']}>
              <QrCode level="H" size={150} renderAs="canvas" value={current.id} />
              <div>
                {count.map((item, index) => {
                  return (
                    <div key={index} className={cls['print-code-list']}>
                      <SelectBox
                        style={{ fontStyle: { size: 50 } }}
                        label={`属性-${index + 1}`}
                        searchMode="contains"
                        searchExpr={'name'}
                        value={item.value}
                        dataSource={current.attributes}
                        displayExpr={'name'}
                        valueExpr={'id'}
                        onValueChanged={(value) => {
                          setCount((prev) => {
                            const data = [...prev];
                            data[index] = {
                              label:
                                current.attributes.find((a) => a.id === value.value)
                                  ?.name || '',
                              type:
                                current.attributes.find((a) => a.id === value.value)
                                  ?.property?.valueType || '',
                              value: value.value,
                            };
                            return data;
                          });
                        }}
                      />
                      <CloseOutlined
                        className={cls['print-code-closeicon']}
                        onClick={() => {
                          setCount((prev) => {
                            const data = [...prev];
                            data.splice(index, 1);
                            return data;
                          });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={cls['print-code-content-comp']}>
              <Form
                scrollingEnabled
                formData={formData}
                onFieldDataChanged={(e) => {
                  setFormData({ ...formData, [e.dataField as string]: e.value });
                }}>
                <GroupItem>
                  <SimpleItem
                    dataField="qrcodeCompanyName"
                    editorType="dxSelectBox"
                    label={{ text: '绑定单位名称' }}
                    editorOptions={{
                      displayExpr: 'name',
                      valueExpr: 'id',
                      showClearButton: true,
                      dataSource:
                        orgCtrl.user.companys.map((item) => {
                          return {
                            id: item.id,
                            name: item.name,
                          };
                        }) || [],
                    }}
                  />
                </GroupItem>
              </Form>
            </div>
          </div>
          <PlusCircleOutlined
            className={cls['print-code-plusicon']}
            onClick={() =>
              setCount([
                ...count,
                {
                  label: '',
                  type: '',
                  value: '',
                },
              ])
            }
          />
        </div>
      </Card>
    );
  };

  return (
    <>
      {renderBaseConfig()}
      {rederQrCodeConfig()}
    </>
  );
};
export default PrintConfig;
