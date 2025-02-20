import { StringPako } from '../common';
/** @private */
export class TxtMessageFormat {
  public RecordSeparatorCode = 0x1e;
  public RecordSeparator = String.fromCharCode(this.RecordSeparatorCode);

  public write(out: string): ArrayBuffer {
    const output = StringPako.gzip(out);
    let size = output.byteLength || output.length;
    const lenBuffer: any = [];
    do {
      let sizePart = size & 0x7f;
      size = size >> 7;
      if (size > 0) {
        sizePart |= 0x80;
      }
      lenBuffer.push(sizePart);
    } while (size > 0);
    const buffer = new Uint8Array(lenBuffer.length + (output.byteLength || output.length));
    buffer.set(lenBuffer, 0);
    buffer.set(
      output.map((item) => 0xff - item),
      lenBuffer.length,
    );
    return buffer.buffer;
  }

  public parse(input: ArrayBuffer): string[] {
    const result: string[] = [];
    const uint8Array = new Uint8Array(input);
    const maxLengthPrefixSize = 5;
    const numBitsToShift = [0, 7, 14, 21, 28];

    for (let offset = 0; offset < input.byteLength; ) {
      let numBytes = 0;
      let size = 0;
      let byteRead;
      do {
        byteRead = uint8Array[offset + numBytes];
        size = size | ((byteRead & 0x7f) << numBitsToShift[numBytes]);
        numBytes++;
      } while (
        numBytes < Math.min(maxLengthPrefixSize, input.byteLength - offset) &&
        (byteRead & 0x80) !== 0
      );

      if ((byteRead & 0x80) !== 0 && numBytes < maxLengthPrefixSize) {
        throw new Error('Cannot read message size.');
      }

      if (numBytes === maxLengthPrefixSize && byteRead > 7) {
        throw new Error('Messages bigger than 2GB are not supported.');
      }

      if (uint8Array.byteLength >= offset + numBytes + size) {
        // IE does not support .slice() so use subarray
        let buffer = uint8Array.slice
          ? uint8Array.slice(offset + numBytes, offset + numBytes + size)
          : uint8Array.subarray(offset + numBytes, offset + numBytes + size);
        result.push(StringPako.ungzip(buffer.map((item) => 0xff - item)));
      } else {
        throw new Error('Incomplete message.');
      }
      offset = offset + numBytes + size;
    }
    return result;
  }
}
