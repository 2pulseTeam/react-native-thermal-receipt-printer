import { Buffer } from 'buffer';

export abstract class PrinterEncoder {
  
  _buffer: number[];
  _encoding: string;

  constructor(encoding: string) {
    this._reset();
    this._encoding = encoding;
  }

  private _reset(): void {
    this._buffer = [];
  }

  protected _queue(values: number[]): void {
    this._buffer.push(...values);
  }

  encode(): string {

    const result = Buffer.from(this._buffer);

    this._reset();

    return result.toString('base64');
  }

  abstract initialize(): PrinterEncoder;
  
  abstract newline(): PrinterEncoder;

  abstract text(value: string): PrinterEncoder;

  abstract italic(value: boolean): PrinterEncoder;

  abstract bold(value: boolean): PrinterEncoder;

  abstract align(value: 'left' | 'center' | 'right'): PrinterEncoder;

  abstract image(width: number, height: number, img: number[]): PrinterEncoder;

  abstract cut(value: 'full' | 'partial'): PrinterEncoder;

  abstract fontsize(width: number, height: number): PrinterEncoder;

  abstract underline(value: 0 | 1 | 2): PrinterEncoder;

}