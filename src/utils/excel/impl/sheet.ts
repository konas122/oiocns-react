import { Worksheet } from 'exceljs';
import * as t from '../type';

interface Recursion {
  columns: t.model.Column[];
}

interface RecursionHeaders extends Recursion {
  level: number;
  offset: number;
  result: string[][];
}

interface RecursionRow<T> extends Recursion {
  data: T;
  result: any[];
}

/**
 * Sheet 表抽象的基类
 */
export class BaseSheet<T = { [key: string]: any }> implements t.model.Sheet<T> {
  id: string;
  name: string;
  columns: t.model.Column[];
  data: T[];
  extract?: () => Promise<T[]>;
  append?: (sheet: Worksheet) => void;

  constructor(
    id: string,
    name: string,
    columns: t.model.Column[],
    data?: T[],
    extract?: () => Promise<T[]>,
    append?: (sheet: Worksheet) => void,
  ) {
    this.id = id;
    this.name = name;
    this.columns = columns;
    this.data = data ?? [];
    this.extract = extract;
    this.append = append;
  }

  getHeaders(): string[][] {
    const result: string[][] = [];
    this.recursionHeader({
      columns: this.columns,
      level: 0,
      offset: 0,
      result,
    });
    return result;
  }

  getRows(data: T[]): any[][] {
    const rows: any[][] = [];
    for (const item of data) {
      const result: any[] = [];
      this.recursionRow({
        columns: this.columns,
        data: item,
        result,
      });
      rows.push(result);
    }
    return rows;
  }

  recursionColumn(columns: t.model.Column[]) {
    const result: t.model.Column[] = [];
    for (const column of columns) {
      if (column.options?.hideField || column.options?.readOnly) {
        continue;
      }
      if (column.children) {
        result.push(...this.recursionColumn(column.children));
      } else {
        result.push(column);
      }
    }
    return result;
  }

  private recursionHeader(params: RecursionHeaders) {
    if (params.level >= params.result.length) {
      params.result.push([]);
    }
    const current = params.result[params.level];
    for (let index = current.length; current.length < params.offset; index++) {
      current.push('');
    }
    let count = 0;
    for (const column of params.columns) {
      if (column.options?.hideField || column.options?.readOnly) {
        continue;
      }
      if (column.hidden) {
        continue;
      }
      current.push(column.title);
      if (column.children) {
        const positions = this.recursionHeader({
          columns: column.children,
          level: params.level + 1,
          result: params.result,
          offset: params.offset + count,
        });
        for (let i = 0; i < positions - 1; i++) {
          current.push('');
        }
        count += positions;
      } else {
        count += 1;
      }
    }
    return count;
  }

  private recursionRow(params: RecursionRow<T>) {
    for (const column of params.columns) {
      if (column.hidden) {
        continue;
      }
      if (column.children) {
        this.recursionRow({
          columns: column.children,
          data: params.data,
          result: params.result,
        });
      } else {
        let value: any = '';
        if (column.format) {
          value = column.format(params.data);
        } else if (column.dataIndex) {
          value = (params.data as any)[column.dataIndex];
        }
        params.result.push(value);
      }
    }
  }

  getMerges(): string[] {
    const result: string[] = [];
    const rows = this.getHeaders();
    const tags: string[] = [];
    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < rows[i].length; j++) {
        if (rows[i][j] == '') {
          let k = j + 1;
          for (; k < rows[i].length; k++) {
            if (rows[i][k] != '') {
              break;
            }
            tags.push(`${i}:${k}`);
          }
          if (k == j + 1) {
            continue;
          }
          tags.push(`${i}:${j}`);
          result.push(`${this.toLetter(j)}${i + 1}:${this.toLetter(k)}${i + 1}`);
          j = k - 1;
        }
      }
    }
    if (rows.length > 0) {
      for (let i = 0; i < rows[0].length; i++) {
        for (let j = 0; j < rows.length; j++) {
          if (rows[j][i] == '' && !tags.includes(`${j}:${i}`)) {
            let k = j + 1;
            for (; k < rows.length; k++) {
              if (rows[k][i] != '') {
                break;
              }
            }
            result.push(`${this.toLetter(i + 1)}${j}:${this.toLetter(i + 1)}${k}`);
            j = k - 1;
          }
        }
      }
    }
    return result;
  }

  toLetter(column: number) {
    let temp;
    let letter = '';
    while (column > 0) {
      temp = (column - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      column = (column - temp - 1) / 26;
    }
    return letter;
  }

  async stream(consumer: (data: any[][]) => void): Promise<void> {
    while (true) {
      const data = await this.extract?.();
      if (!data || data.length == 0) {
        break;
      }
      consumer(this.getRows(data));
    }
  }
}

/**
 * Sheet 表抽象的默认实现
 */
export class Sheet<T> extends BaseSheet<T> {
  dir: t.IDirectory;

  constructor(id: string, name: string, columns: t.model.Column[], dir: t.IDirectory) {
    super(id, name, columns);
    this.dir = dir;
  }
}
