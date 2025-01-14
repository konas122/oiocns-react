import { MonacoEditor } from '@/components/Common/MonacoEditor';
import FullScreenModal from '@/components/Common/fullScreen';
import {
  ApartmentOutlined,
  CheckOutlined,
  // FileOutlined,
  RightCircleOutlined,
} from '@ant-design/icons';
import { Button, Form, Layout, Menu, message, Modal, Select, Switch } from 'antd';
import { FileOutlined } from '@ant-design/icons';
import HtmlEditItem from '@/components/DataStandard/WorkForm/Viewer/customItem/htmlItem';
import React, { ReactNode, useContext, useMemo, useState } from 'react';
import { ViewerHost } from '@/executor/open/page/view/ViewerHost';
import ViewerManager from '@/executor/open/page/view/ViewerManager';
import { DesignContext, PageContext } from '@/components/PageElement/render/PageContext';
import TreeManager from './TreeManager';
import ElementProps from '../pageBuilder/design/config/ElementProps';
import './designer.less';
import TextArea from 'antd/es/input/TextArea';
import { XDocumentTemplate } from '@/ts/base/schema';
import RootDesign from './RootDesign';
import { PageElement } from '@/ts/element/PageElement';
import ElementPropsItem from '../pageBuilder/design/config/ElementPropsItem';
import { TypeMeta } from '@/ts/element/ElementMeta';
export interface DesignerProps {
  ctx: DesignContext;
}

const stringify = (ctx: DesignContext) => {
  return JSON.stringify(ctx.view.rootChildren, null, 2);
};

const Coder: React.FC<{}> = () => {
  const ctx = useContext<DesignContext>(PageContext as any);
  const [data, setData] = useState<string>(stringify(ctx));
  ctx.view.subscribe((type, cmd) => {
    if (type == 'elements' && cmd == 'change') {
      setData(stringify(ctx));
    } else if (type == 'props' && cmd == 'change') {
      setData(stringify(ctx));
    }
  });
  return <MonacoEditor value={data} language="json" onChange={setData} />;
};

export function DocumentDesignerHost({ ctx }: DesignerProps) {
  const [active, setActive] = useState<string>();
  const [status, setStatus] = useState(false);
  const [center, setCenter] = useState(<></>);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState('12pt');
  const [fontFamily, setFontFamily] = useState('');
  const [pageNumber, setshowcheck] = useState(false);
  const [header, setpagecontent] = useState('');
  const [showProps, setShowProps] = useState(ctx.view.showProps);
  ctx.view.subscribe((type, cmd, args) => {
    if (type == 'elements' && cmd == 'change') {
      setStatus(!status);
    } else if (type == 'current' && cmd == 'showProps') {
      setShowProps(args);
    }
  });
  const showModal = () => {
    const setting = (ctx.view.page as XDocumentTemplate).setting || {};
    setFontSize(setting.fontSize || '12pt');
    setFontFamily(setting.fontFamily || '');
    setshowcheck(setting.pageNumber || false);
    setpagecontent(setting.header || '');
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
    (ctx.view.page as XDocumentTemplate).setting = {
      fontSize: fontSize,
      fontFamily: fontFamily,
      pageNumber: pageNumber,
      header: header,
    };
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  function renderTabs() {
    return [
      {
        key: 'tree',
        label: '元素树',
        icon: <ApartmentOutlined />,
      },
      // {
      //   key: 'data',
      //   label: 'JSON 数据',
      //   icon: <FileOutlined />,
      // },
      {
        key: 'preview',
        label: '预览',
        icon: <RightCircleOutlined />,
      },
      {
        key: 'save',
        label: '保存',
        icon: <CheckOutlined />,
      },
    ];
  }

  const Configuration: { [key: string]: ReactNode } = {
    tree: <TreeManager />,
    data: <Coder />,
  };
  const fontSizeArray: any = [
    { label: '9（小五）', value: '9pt' },
    { label: '10.5（五号）', value: '10.5pt' },
    { label: '12（小四）', value: '12pt' },
    { label: '14（四号）', value: '14pt' },
    { label: '15（小三）', value: '15pt' },
    { label: '16（三号）', value: '16pt' },
    { label: '18（小二）', value: '18pt' },
    { label: '22（二号）', value: '22pt' },
    { label: '24（小一）', value: '24pt' },
    { label: '26（一号）', value: '26pt' },
    { label: '28', value: '28pt' },
    { label: '32', value: '32pt' },
    { label: '36（小初）', value: '36pt' },
    { label: '40', value: '40pt' },
    { label: '42（初号）', value: '42pt' },
    { label: '44', value: '44pt' },
    { label: '48', value: '48pt' },
    { label: '52', value: '52pt' },
    { label: '60', value: '60pt' },
    { label: '64', value: '64pt' },
    { label: '72', value: '72pt' },
  ];
  const fontsizeChange = (value: string) => {
    setFontSize(value);
  };
  const fontFamilyArray: any = [
    { label: '(默认)', value: '' },
    { label: '宋体', value: '宋体' },
    { label: '黑体', value: '黑体' },
    { label: '楷体', value: '楷体' },
    { label: '仿宋', value: '仿宋' },
  ];
  const fontfamilyChange = (value: string) => {
    setFontFamily(value);
  };
  const oncheckChange = (checked: boolean) => {
    setshowcheck(checked);
  };
  const ontextChange = (e: any) => {
    setpagecontent(e.target.value);
  };

  // const RootRender = ctx.view.components.rootRender as any;
  return (
    <PageContext.Provider value={ctx}>
      <div className="document-designer">
        <Layout.Sider collapsedWidth={60} collapsed={true}>
          <Menu
            items={renderTabs()}
            mode={'inline'}
            selectedKeys={active ? [active] : []}
            onSelect={(info) => {
              switch (info.key) {
                case 'save':
                  ctx.view.update().then(() => message.success('保存成功！'));
                  break;
                case 'preview':
                  setCenter(
                    <FullScreenModal
                      open
                      centered
                      fullScreen
                      destroyOnClose
                      width={'80vw'}
                      bodyHeight={'80vh'}
                      title={'页面预览'}
                      onCancel={() => setCenter(<></>)}>
                      <ViewerHost ctx={{ view: new ViewerManager(ctx.view.pageInfo) }} />
                    </FullScreenModal>,
                  );
                  break;
                default:
                  setActive(info.key);
                  break;
              }
            }}
            onDeselect={() => setActive(undefined)}
          />
        </Layout.Sider>
        <div className="is-full-height" style={{ width: active ? 'width: 400px;' : '' }}>
          {active ? Configuration[active] : <></>}
        </div>
        <div className="o-page-host" style={{ flex: 'auto' }}>
          <div className="o-page-tools">
            <Button icon={<FileOutlined />} onClick={showModal}>
              页面设置
            </Button>
          </div>
          <Modal
            title="页面设置"
            open={isModalOpen}
            onOk={handleOk}
            onCancel={handleCancel}
            width={800}>
            <Form labelCol={{ span: 3 }} layout="horizontal">
              <Form.Item label="页码" name="size">
                <Switch
                  checked={pageNumber}
                  checkedChildren="开启"
                  unCheckedChildren="关闭"
                  onChange={oncheckChange}
                />
              </Form.Item>
              <Form.Item label="页眉内容">
                {/* <HtmlEditItem {...mixOptions} style={{width:'100%'}}  /> */}
                <TextArea
                  value={header}
                  placeholder="请输入页眉内容"
                  onChange={ontextChange}
                  style={{ height: 200 }}
                />
              </Form.Item>
              <Form.Item label="页眉字体">
                <Select
                  value={fontFamily}
                  style={{ width: 120 }}
                  onChange={fontfamilyChange}
                  options={fontFamilyArray}
                />
              </Form.Item>
              <Form.Item label="字体大小">
                <Select
                  value={fontSize}
                  defaultValue="9pt"
                  style={{ width: 120 }}
                  onChange={fontsizeChange}
                  options={fontSizeArray}
                />
              </Form.Item>
            </Form>
          </Modal>
          <RootDesign {...(ctx.view.rootElement as any)} />
        </div>
        {showProps && (
          <div className="is-full-height">
            <ElementProps />
          </div>
        )}
      </div>
      {center}
    </PageContext.Provider>
  );
}
