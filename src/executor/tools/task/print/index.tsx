import { IWorkTask, IPrint } from '@/ts/core';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import React, { memo, useEffect, useState } from 'react';
import { DocumentContent } from '../document';
import { SelectBox } from 'devextreme-react';
import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { createRoot } from 'react-dom/client';
import PrintTemplate from '@/components/Common/FlowDesign/Config/Components/PrintNode/printTemplate';
import OpenFileDialog from '@/components/OpenFileDialog';
import PrintConfigModal from '@/components/Common/FlowDesign/Config/Components/PrintNode/PrintModal';
import orgCtrl from '@/ts/controller';
import { XPrint } from '@/ts/base/schema';

interface IPrintProp {
  current: IWorkTask;
  service: WorkFormService | null;
}

const Print = ({ current, service }: IPrintProp) => {
  const [printModalCreate, setPrintModalCreate] = useState(false);
  const [printType, setPrintType] = useState<string>('');
  const [print, setPrint] = useState<any>([]);
  const [printModal, setPrintModal] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const resource = JSON.parse(current.instanceData?.node.resource ?? '{}');
  const removePrintIframe = () => {
    const oldIframe = document.getElementById('printedIframe');
    if (oldIframe) {
      oldIframe.remove();
    }
  };
  const fetchData = async () => {
    try {
      if (current.instanceData?.node.resource) {
        setPrint(JSON.parse(current.instanceData?.node.resource).print);
        setPrintType(JSON.parse(current.instanceData?.node.resource).printData.type);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  useEffect(() => {
    try {
      fetchData();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    return () => {
      removePrintIframe();
    };
  }, [current.instanceData]);
  useEffect(() => {
    try {
      fetchData();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    return () => {
      removePrintIframe();
    };
  }, []);
  const handleRemoveItem = (
    e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
    data: { id: string },
  ) => {
    e.stopPropagation();
    const newPrintData = print.filter((option: { id: string }) => option.id !== data.id);
    //删除保存
    const parsedResource = JSON.parse(current.instanceData!.node.resource);
    let newAttributes = [...parsedResource.printData.attributes].filter(
      (option: { title: string }) => option.title !== data.id,
    );
    let newPrints = [...parsedResource.print].filter(
      (option: { id: string }) => option.id !== data.id,
    );
    parsedResource.printData.attributes = newAttributes;
    parsedResource.print = newPrints;
    const updatedResourceString = JSON.stringify(parsedResource);
    current.instanceData!.node.resource = updatedResourceString;
    setPrint(newPrintData);
  };
  return (
    <div style={{ display: 'flex' }}>
      {current.instanceData && <DocumentContent current={current} service={service!} />}
      {(resource.print?.length > 0 || resource.print?.length == 0) && (
        <a
          style={{ display: 'flex', alignItems: 'center', marginRight: '30px' }}
          onClick={() => {
            setPrintModalCreate(true);
          }}>
          添加打印模板
        </a>
      )}
      {(resource.print?.length > 0 || resource.print?.length == 0) && (
        <SelectBox
          style={{ marginRight: '30px' }}
          showClearButton
          value={printType}
          placeholder="请选择打印模板"
          dataSource={print}
          displayExpr={'name'}
          valueExpr={'id'}
          onFocusIn={() => {
            setPrintType('');
          }}
          onValueChange={(e) => {
            if (!e) return false;
            setPrintType(e);
            if (e == '默认无') return false;
            //保存
            const parsedResource = JSON.parse(current.instanceData!.node.resource);
            parsedResource.printData.type = e;
            const updatedResourceString = JSON.stringify(parsedResource);
            current.instanceData!.node.resource = updatedResourceString;
            setPrintModal(true);
          }}
          itemRender={(data) => (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}>
              <span
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  wordWrap: 'break-word',
                }}>
                {data.name}
              </span>
              <CloseOutlined onClick={(e) => handleRemoveItem(e, data)} />
            </div>
          )}
        />
      )}
      {(resource.print?.length > 0 || resource.print?.length == 0) && (
        <Button
          loading={btnLoading}
          onClick={async () => {
            setBtnLoading(true);
            try {
              const IPrints = await orgCtrl.loadFindPrint(
                resource.printData.type,
                current.metadata.shareId,
              );
              let newPrint: XPrint[] = [];
              let name = '';
              if (IPrints) {
                newPrint = [IPrints as XPrint];
                name = (IPrints as XPrint).table![0].title.name;
              }
              const originalTitle = document.title;
              document.title = name ? name : document.title; // 设置自定义标题
              removePrintIframe();
              const iframe = document.createElement('IFRAME') as HTMLIFrameElement;
              iframe.setAttribute(
                'style',
                'position:fixed;width:100%;height:100%;left:0px;top:0px; z-index: 1000; background: rgba(0, 0, 0, 0); display: none;',
              );
              iframe.setAttribute('id', 'printedIframe');
              iframe.onload = () => {
                let doc = iframe.contentWindow?.document;
                const loading = () => {
                  setTimeout(() => {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                    document.title = originalTitle; // 打印后恢复原始标题
                  }, 1000);
                  if (navigator.userAgent.indexOf('MSIE') > 0) {
                    document.body.removeChild(iframe);
                  }
                };
                createRoot(doc as unknown as Element | DocumentFragment).render(
                  <PrintTemplate
                    printData={resource.printData}
                    print={newPrint}
                    current={current}
                    loading={loading}
                  />,
                );
              };
              document.body.appendChild(iframe);
            } catch (error) {
              console.error('打印请求失败:', error);
            } finally {
              setBtnLoading(false);
            }
          }}>
          打印
        </Button>
      )}
      {printModalCreate && (
        <OpenFileDialog
          multiple
          title={`选择打印模板`}
          accepts={['打印模板']}
          rootKey={''}
          excludeIds={print.filter((i: any) => i.id).map((file: any) => file.id)}
          onCancel={() => setPrintModalCreate(false)}
          onOk={(files) => {
            //保存到办事上
            setPrint([...print, ...files]);
            //保存
            setPrintModalCreate(false);
          }}
        />
      )}
      {printModal && (
        <PrintConfigModal
          refresh={(cur) => {
            current.instanceData!.node.resource = JSON.stringify(cur);
            setPrintModal(false);
          }}
          resource={JSON.parse(current.instanceData!.node.resource)}
          printType={printType}
          print={print}
          work={current}
          type="work"
          primaryForms={current.instanceData!.node.primaryForms}
          detailForms={current.instanceData!.node.detailForms}
        />
      )}
    </div>
  );
};

export default memo(Print);
