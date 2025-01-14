import { TableCellMeta } from "@/ts/element/standard/document/model";

export default class CellLocationError extends Error {
  readonly cell: TableCellMeta;
  constructor(message: string, location: TableCellMeta) {
    super(message);
    this.cell = location
  }
}