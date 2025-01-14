import React, { useMemo, useRef } from 'react';
import axios from 'axios';
import saveAs from 'file-saver';
import { Button, Space, Typography } from 'antd';
import { IDocumentTemplate } from '@/ts/core/thing/standard/document';
import FullScreenModal from '@/components/Common/fullScreen';

import cls from './index.module.less';
import { ViewerHost } from '@/executor/open/document/view/ViewerHost';
import ViewerManager from '@/executor/open/document/view/ViewerManager';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import _ from 'lodash';
import { $confirm } from '@/utils/react/antd';
import { PaperElement } from '@/ts/element/standard/document/model';
import { delay } from '@/ts/base/common/timer';
import { IWorkTask } from '@/ts/core';

interface Props {
  current: IDocumentTemplate,
  service: WorkFormService,
  onCancel?: () => void;
  task?: IWorkTask;
}

export function DocumentViewerModal(props: Props) {
  
  const domRef = useRef<HTMLElement>(null);
  const manager = useMemo(() => {
    if (!props.current) {
      return null;
    }
    return new ViewerManager(props.current, props.service, props.task);
  }, [props.current]);


  async function printDocument() {
    if (!manager) {
      return;
    }

    manager.page.setting ||= {};
    
    const content = await manager.getPrintHtml(domRef.current!);

    const warnings: string[] = [];

    // 检查是否有不同大小的纸张
    const papers = Object.values(manager.treeManager.allElements).filter(
      (p) => p.kind === 'paper',
    ) as PaperElement[];
    const pageInfo = papers.map((p) => `${p.props.paperSize}-${p.props.orientation}`);
    if (_.uniq(pageInfo).length > 1) {
      warnings.push('存在不同大小或方向的纸张');
    }

    // 检查是否有页眉或者页脚（页码）
    if (
      manager.page.setting.header ||
      manager.page.setting.footer ||
      manager.page.setting.pageNumber
    ) {
      warnings.push('存在页眉或者页脚（页码）');
    }

    if (warnings.length > 0) {
      await $confirm({
        type: 'warning',
        title: '功能不支持警告',
        content: (
          <Typography>
            <p>当前文档存在以下存在浏览器限制的功能：</p>
            <ul>
              {warnings.map((w) => (
                <li style={{ listStyle: 'unset' }}>{w}</li>
              ))}
            </ul>
            <div>直接打印可能会导致布局异常或者功能失效，确实要打印吗？</div>
          </Typography>
        ),
        okText: '继续打印',
      });
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.height = '100vh';
    iframe.style.width = '100vw';
    iframe.style.position = 'fixed';
    iframe.style.left = '0';
    iframe.style.top = '0';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);
    const doc = iframe.contentWindow!.document;
    doc.open();
    doc.write(content);
    doc.close();

    await delay(1000);
    
    iframe.contentWindow!.print();
    document.body.removeChild(iframe);
  }

  async function exportPdf() {
    if (!manager) {
      return;
    }

    const content = await manager.getExportModel(domRef.current!);

    const res = await axios.request<Blob>({
      url: '/orginone/render/mergePdf',
      method: 'post',
      responseType: 'blob',
      data: content,
    });
    const blob = res.data;
    const fileName = props.current.name;
    saveAs(blob, fileName + '.pdf');
  }

  return (
    <FullScreenModal
      open
      fullScreen
      destroyOnClose
      width={'80vw'}
      bodyHeight={'80vh'}
      title={props.current.name}
      footer={[]}
      onCancel={props.onCancel}>
      <div className={cls['document-viewer']}>
        <Space>
          <Button type="primary" onClick={() => printDocument()}>
            打印
          </Button>
          <Button type="primary" onClick={() => exportPdf()}>
            导出PDF
          </Button>
        </Space>

        <div className={cls['content']}>
          <ViewerHost ctx={{ view: manager! }} ref={domRef} />
        </div>
      </div>
    </FullScreenModal>
  );
}