import HostManagerBase from '@/components/PageElement/render/HostManager';
import { IDisposable } from '@/ts/base/common';
import { XDocumentTemplate, XWorkInstance } from '@/ts/base/schema';
import { IDocumentTemplate } from '@/ts/core/thing/standard/document';
import { DocumentDataset } from '@/ts/element/standard/document/data';
import { DocumentExportModel, PaperElement } from '@/ts/element/standard/document/model';
import WorkFormService from '@/ts/scripting/core/services/WorkFormService';
import css from '@/components/PageElement/elements/document/style';
import { PageStyleBuilder, createEmptyDocument } from '@/ts/element/standard/document/dom';
import { IWorkTask } from '@/ts/core';

export default class DocumentViewerManager
  extends HostManagerBase<'view', XDocumentTemplate>
  implements IDisposable
{
  readonly dataset: DocumentDataset;

  constructor(pageFile: IDocumentTemplate, service: WorkFormService, task?: IWorkTask) {
    super('view', pageFile);
    this.dataset = new DocumentDataset(this, service, task);
  }

  async loadData() {
    try {
      await this.dataset.loadData();
      return this.dataset.data;
    } catch (error) {
      this.error(error instanceof Error ? error.message : String(error));
      return {};
    }
  }

  async getPrintHtml(dom: HTMLElement) {
    const pages = dom.querySelectorAll<HTMLElement>('section.document-paper');

    const doc = createEmptyDocument();

    const style = doc.createElement('style');
    style.innerHTML = css;
    doc.head.appendChild(style);

    const builder = new PageStyleBuilder(doc).addDocumentStyle(this.page.setting || {});

    for (const page of pages) {
      const id = page.id;
      const paperElement = this.treeManager.allElements[id] as PaperElement;
      if (!paperElement) {
        console.warn(`找不到页面元素 ${id}`);
        continue;
      }

      //#region 添加内容

      const newPage = doc.importNode(page, true);
      // 清除所有页面大小和边距信息
      newPage.style.cssText = '';
      doc.body.appendChild(newPage);

      //#endregion

      builder.addPaperStyle(paperElement);
    }

    builder.build();

    return doc.documentElement.outerHTML;
  }

  async getExportModel(dom: HTMLElement) {
    const ret: DocumentExportModel = {
      pages: [],
      setting: this.page.setting || {},
      style: css,
    };

    const pages = dom.querySelectorAll<HTMLElement>('section.document-paper');

    for (const page of pages) {
      const id = page.id;
      const paperElement = this.treeManager.allElements[id] as PaperElement;
      if (!paperElement) {
        console.warn(`找不到页面元素 ${id}`);
        continue;
      }

      const doc = createEmptyDocument();
      const newPage = doc.importNode(page, true);
      // 清除所有页面大小和边距信息
      newPage.style.cssText = '';
      const html = newPage.outerHTML;

      ret.pages.push({
        id,
        html,
        setting: paperElement.props,
      });
    }

    return ret;
  }

  dispose() {
    console.info('ViewerManager disposed');
  }
}
