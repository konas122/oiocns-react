import * as i from '../impl';
import * as t from '../type';

export class AnySheet extends i.BaseSheet {}

export class AnyHandler extends i.SheetHandler<AnySheet> {
  checkData(_: t.IExcel): t.Error[] {
    return [];
  }
  async operating(_: t.IExcel, __: () => void): Promise<void> {
    return;
  }
}
