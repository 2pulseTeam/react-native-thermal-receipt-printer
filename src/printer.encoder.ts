import { Platform } from "react-native";
import { Buffer } from 'buffer';

export abstract class PrinterEncoder {

  _buffers: Buffer[];
  _encoding: string;

  constructor(encoding: string) {
    this._reset();
    this._encoding = encoding;
  }

  private _reset(): void {
    this._buffers = [];
  }

  protected _queue(values: Array<Buffer | number>): void {
    this._buffers.push(
      ...values.map(value => typeof value === 'number'
        ? Buffer.of(value)
        : value as any
      )
    );
  }

  encode() {

    const result = Buffer.concat(this._buffers);

    this._reset();

    return Platform.OS === 'ios'
      ? result.toString('hex')
      : result.toString('base64');

  }

  abstract initialize(): PrinterEncoder;

  abstract newline(value?: number): PrinterEncoder;

  abstract text(value: string): PrinterEncoder;

  abstract textline(value: string): PrinterEncoder;

  abstract position(value: number): PrinterEncoder;

  abstract table(headers: TabHeader[], values: TabData[]): PrinterEncoder;

  abstract bold(value: boolean): PrinterEncoder;

  abstract align(value: 'left' | 'center' | 'right'): PrinterEncoder;

  abstract image(width: number, height: number, img: number[]): PrinterEncoder;

  abstract cut(value: 'full' | 'partial'): PrinterEncoder;

  abstract fontsize(width: number, height: number): PrinterEncoder;

  abstract underline(value: 0 | 1 | 2): PrinterEncoder;

  abstract drawline(): PrinterEncoder;

}

export interface TabData {
  [key: string]: string;
}

export interface TabHeader {
  align: string; //'left' | 'right';
  label: string;
  key: string;
}