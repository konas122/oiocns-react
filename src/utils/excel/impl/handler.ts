import * as t from '../type';
import * as i from '../impl';

/**
 * 读取 Excel Sheet 配置默认实现
 */
export abstract class SheetHandler<S extends i.BaseSheet<any>>
  implements t.ISheetHandler<S>
{
  sheet: S;

  constructor(sheet: S) {
    this.sheet = sheet;
  }

  onError(error: t.Error): t.Error {
    return error;
  }

  assert(
    index: number | number[],
    asserts: { res: boolean; error: string }[],
  ): t.Error[] {
    let errors: t.Error[] = [];
    if (typeof index == 'number') {
      index += 2;
    } else {
      for (let i = 0; i < index.length; i++) {
        index[i] += 2;
      }
    }
    asserts.forEach((item) => {
      if (item.res) {
        errors.push({
          name: this.sheet.name,
          row: index,
          message: item.error,
        });
      }
    });
    return errors;
  }

  singleAssert(index: number, assert: { res: boolean; error: string }) {
    return this.assert(index, [assert]);
  }

  abstract checkData(excel: t.IExcel): t.Error[];
  abstract operating(excel: t.IExcel, onItemCompleted: () => void): Promise<void>;
  completed?(excel: t.IExcel): void;
}
