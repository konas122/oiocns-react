import { ElementHost } from '..';
import { DocumentSetting } from './model';

declare module '@/ts/base/schema' {
  interface XDocumentTemplate extends ElementHost {
    setting?: DocumentSetting;
  }
}
