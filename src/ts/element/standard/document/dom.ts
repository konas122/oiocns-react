import { DocumentSetting, PaperElement } from './model';

// CSSOM不提供方法给CSSPageRule增加子at规则，只能字符串拼接


export class PageStyleBuilder {
  readonly doc: Document;

  private style: HTMLStyleElement;
  private documentStyle = '';
  private paperStyle = '';
  private hasPaperStyle = false;
  constructor(doc: Document) {
    this.doc = doc;
    this.style = doc.createElement('style');
  }

  addDocumentStyle(s: DocumentSetting): this {
    let css = '';
    if (s.pageNumber) {
      css += `
  @bottom-center {
    content: counter(page) "/" counter(pages);
  }  
`;
    }

    if (s.header) {
      css += `
  @top-center {
    content: '${s.header}';
    font-size: ${s.fontSize || '9pt'};
    font-family: ${s.fontFamily || 'sans-serif'};
  }
`;
    }

    this.documentStyle = css;
    return this;
  }

  addPaperStyle(paperElement: PaperElement): this {
    if (this.hasPaperStyle) {
      return this;
    }

    paperElement.props.orientation ||= 'portrait';
    paperElement.props.paperSize ||= 'A4';

    const margin = (
      paperElement.props.margin || ['25.4mm', '19.1mm', '25.4mm', '19.1mm']
    ).join(' ');

    this.paperStyle = `
  size: ${paperElement.props.paperSize} ${paperElement.props.orientation};
  margin: ${margin};
`;
    this.hasPaperStyle = true;

    return this;
  }

  build() {
    this.style.innerHTML = `
@page {
  ${this.documentStyle}
  ${this.paperStyle}
}
`;  
    this.doc.body.prepend(this.style);
  }
}

export function createEmptyDocument(): Document {
  return new DOMParser().parseFromString(
    `
<html>
  <body>
  </body>
</html>`,
    'text/html',
  );
}
