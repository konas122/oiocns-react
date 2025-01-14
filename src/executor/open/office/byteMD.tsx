import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileItemShare } from '@/ts/base/model';
import { Spin, Tooltip} from 'antd';
import { shareOpenLink } from '@/utils/tools';
import { useReactToPrint } from 'react-to-print';
import gfm from '@bytemd/plugin-gfm';
import { Editor, Viewer } from '@bytemd/react';
import breaks from '@bytemd/plugin-breaks';
import gemoji from '@bytemd/plugin-gemoji';
import highlight from '@bytemd/plugin-highlight';
import math from '@bytemd/plugin-math-ssr';
import medium from '@bytemd/plugin-medium-zoom';
import mermaid from '@bytemd/plugin-mermaid';
import frontmatter from '@bytemd/plugin-frontmatter';
import zhHans from 'bytemd/locales/zh_Hans.json';
import { ContainerOutlined,PictureOutlined } from '@ant-design/icons';
import 'bytemd/dist/index.min.css';
import 'highlight.js/styles/vs.css';
import './index.less';
import OpenFileDialog from '@/components/OpenFileDialog';
import { IDirectory } from '@/ts/core';
interface IProps {
  current:IDirectory
  share: FileItemShare;
  getHtml: (html: any) => void;
}

const PrintButtonPlugin = () => {
  const handlePrint = useReactToPrint({
    content: () => document.querySelector('.markdown-body') as HTMLElement,
  });
  return (
    <Tooltip placement="top" title={'打印'} arrowPointAtCenter>
      <ContainerOutlined
        onClick={handlePrint}
        style={{
          position: 'absolute',
          right: '236px',
          top: '70px',
          width: '24px',
          height: '24px',
        }}
      />
    </Tooltip>
  );
};
const PrintButtonPluginaa = (props:any) => {
  return (
    <Tooltip placement="top" title={'获取本地图片'} arrowPointAtCenter>
      <PictureOutlined
        onClick={props.onclick}
        style={{
          position: 'absolute',
          right: '266px',
          top: '70px',
          width: '24px',
          height: '24px',
        }}
      />
    </Tooltip>
  );
};


const plugins = [
  gfm({
    locale: {
      strike: '删除线',
      strikeText: '文本',
      task: '任务列表',
      taskText: '待办事项',
      table: '表格',
      tableHeading: '标题',
    },
  }),
  gemoji(),
  highlight(),
  medium(),
  mermaid({
    locale: {
      class: '类图',
      er: '关系图',
      flowchart: '流程图',
      gantt: '甘特图',
      mermaid: 'Mermaid图表',
      mindmap: '思维导图',
      pie: '饼状图',
      sequence: '时序图',
      state: '状态图',
      timeline: '时间轴',
      uj: '旅程图',
    },
  }),
  math({
    locale: {
      inline: '行内公式',
      inlineText: '公式',
      block: '块级公式',
      blockText: '公式',
    },
  }),
  breaks(),
  frontmatter(),
];
const ByteMD: React.FC<IProps> = ({ share, getHtml,current }) => {
  const [loaded, setLoaded] = useState(false);
  const [html, setHtml] = useState(`<p></p>`);
  const [uploadmodal, setuploadmodal] = useState(false)
  getHtml(html);
 
  useEffect(() => {
    axios.get(shareOpenLink(share.shareLink)).then((res) => {
      setLoaded(true);
      if (res.status === 200) {
        setHtml(res.data);
      }
    });
  }, []);
  if (!loaded) {
    return (
      <Spin
        tip="加载中,请稍后..."
        size="large"
        style={{ marginTop: 'calc(50vh - 50px)', marginLeft: '50vw' }}></Spin>
    );
  }
  const uploadImages = async(files:any) => {
    let directory = current.directory;
    const res= await directory.createFile(files[0].name, files[0]);
    setHtml(html+`<img src='${window.location.origin+res?.filedata.shareLink}' ></img>`)
  }
  const getlocalImages=()=>{
    setuploadmodal(true)
  }
  return (
    <>
      <div style={{ border: '1px solid #ccc', zIndex: 100, marginTop: '15px' }}>
        <PrintButtonPlugin />
        <PrintButtonPluginaa onclick={getlocalImages} />
        {uploadmodal && (
          <OpenFileDialog
            multiple
            title={`选择图片`}
            accepts={['图片']}
            rootKey={''}
            onCancel={() => setuploadmodal(false)}
            onOk={(files: any) => {
              setHtml(html+`<img src='${window.location.origin+'/'+files[0]._metadata.id}' ></img>`)
              setuploadmodal(false)
            }}
          />)}
        <Editor
          uploadImages={uploadImages}
          value={html}
          locale={zhHans}
          plugins={plugins}
          onChange={(v) => {
            setHtml(v);
          }}
        />
        <div id="preview-content" style={{ display: 'none' }}>
          <Viewer value={html} />
        </div>
      </div>
    </>
  );
};

export default ByteMD;
