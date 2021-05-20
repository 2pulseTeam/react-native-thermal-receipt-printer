import { PrinterEncoder, TabData, TabHeader } from "../printer.encoder";
import { EscPosCommands } from "./commands";
import * as iconv from "iconv-lite";
import latinize from 'latinize';

    // n Character Type
    // 0PC437 (USA: Standard Europe)
    // 1Katakana
    // 2PC850(Multilingual)
    // 3PC860(Portuguese)
    // 4PC863(Canadian-French)
    // 5PC865(Nordic)
    // 16WPC1252
    // 17PC866 (Cyrillic #2)
    // 18PC852 (Latin2)
    // 19PC858
    // 255Blank page

export const CodePage = {
  'cp437': 0x00,
  'cp737': 0x40,
  'cp850': 0x02,
  'cp775': 0x5f,
  'cp852': 0x12,
  'cp855': 0x3c,
  'cp857': 0x3d,
  'cp858': 0x13,
  'cp860': 0x03,
  'cp861': 0x38,
  'cp862': 0x3e,
  'cp863': 0x04,
  'cp864': 0x1c,
  'cp865': 0x05,
  'cp866': 0x11,
  'cp869': 0x42,
  'cp936': 0xff,
  'cp949': 0xfd,
  'cp950': 0xfe,
  'cp1252': 0x10,
  'iso88596': 0x16,
  'shiftjis': 0xfc,
  'windows874': 0x1e,
  'windows1250': 0x48,
  'windows1251': 0x49,
  'windows1252': 0x47,
  'windows1253': 0x5a,
  'windows1254': 0x5b,
  'windows1255': 0x20,
  'windows1256': 0x5c,
  'windows1257': 0x19,
  'windows1258': 0x5e,
}


export class EscPosEncoder extends PrinterEncoder {

  initialize(): PrinterEncoder {

    const codepage = CodePage[this._encoding];

    if (typeof codepage !== 'number')
      throw new Error('EscPosEncoder.initialize - codepage is unknown : ' + this._encoding);

    this._queue([
      EscPosCommands.INIT_PRINTER,
      EscPosCommands.SELECT_CODE_PAGE,
      codepage
    ]);
    return this;
  }

  newline(value: number = 1): PrinterEncoder {

    if (value < 1) throw new Error('EscPosEncoder.newline - value is < 1');

    const toQueue = [];
    for (let index = 0; index < value; index++) {
      toQueue.push(EscPosCommands.CR, EscPosCommands.LF);
    }

    this._queue(toQueue);
    return this;
  }

  text(value: string): PrinterEncoder {

    const latinized = latinize(value);

    this._queue(Array.from(latinized).map(char => iconv.encode(char, this._encoding)));
    return this;
  }

  textline(value: string): PrinterEncoder {
    this.text(value);
    this.newline();
    return this;
  }


  table(headers: TabHeader[], values: TabData[]): PrinterEncoder {

    const initialWidth = headers.reduce((acc, header) => {
      acc[header.key] = 0;
      return acc;
    }, {} as {
      [key: string]: number
    });

    // get each column size = max(values[header])
    const columnsWidth = values.reduce((acc, value) => {
      headers.forEach(header => {
        if (acc[header.key] <= value[header.key].length) {
          acc[header.key] = value[header.key].length + 1; // Force 1 character margin
        }
      });

      return acc;
    }, initialWidth);

    const totalWidth = Object.keys(columnsWidth).reduce((acc, key) => {
      acc += columnsWidth[key];
      return acc;
    }, 0);

    if (totalWidth < 48) {
      const lastKey = Object.keys(columnsWidth).pop()!;
      columnsWidth[lastKey] += 48 - totalWidth;
    }

    values.forEach(value => {
      headers.forEach(header => {
        this.text(header.align === 'left'
          ? value[header.key].padEnd(columnsWidth[header.key])
          : value[header.key].padStart(columnsWidth[header.key])
        )
      });

      this.newline();
    });

    return this;
  }


  position(value: number): PrinterEncoder {

    const nl = value % 256;
    const nh = Math.round(value / 256);

    if (nh > 255) throw new Error('EscPosEncoder.position - value / 256 must be <= 255');
    if (nl > 255) throw new Error('EscPosEncoder.position - value % 256 must be <= 255');

    this._queue([EscPosCommands.ABSOLUTE_PRINT_POSITION, nl, nh]);
    return this;
  }

  bold(value: boolean): PrinterEncoder {
    this._queue([
      EscPosCommands.BOLD,
      value ? 0x01 : 0x00
    ]);
    return this;
  }

  align(value: "left" | "center" | "right"): PrinterEncoder {

    let arg = 0x30;
    switch (value) {
      case 'center':
        arg = 0x31;
        break;

      case 'right':
        arg = 0x32;
        break;
    }

    this._queue([EscPosCommands.SELECT_JUSTIFICATION, arg]);
    return this;
  }

  image(width: number, height: number, img: number[]): PrinterEncoder {

    if (width % 256 != 0) throw new Error('Width must be a multiple of 256');
    if (height % 8 != 0) throw new Error('Height must be a multiple of 8');

    const m = 0;
    const nl = width % 256;
    const nh = Math.round(width / 256);

    this._queue([
      EscPosCommands.LINE_SPACING_N180,
      0x10,
    ]);

    const getPixel = (x: number, y: number) => img[((width * y) + x)];

    for (let j = 0; j < height; j = j + 8) {

      this._queue([EscPosCommands.BIT_IMAGE, m, nl, nh]);

      let result: number;
      for (let i = 0; i < width; i++) {

        result =
          getPixel(i, j) << 7 |
          getPixel(i, j + 1) << 6 |
          getPixel(i, j + 2) << 5 |
          getPixel(i, j + 3) << 4 |
          getPixel(i, j + 4) << 3 |
          getPixel(i, j + 5) << 2 |
          getPixel(i, j + 6) << 1 |
          getPixel(i, j + 7);

        this._queue([result]);

      }

      this.newline();
    }

    this.newline();

    return this;
  }

  drawline(): PrinterEncoder {

    this._queue([EscPosCommands.BIT_IMAGE, 0, 0, 1]);

    for (let index = 0; index < 256; index++) {
      this._queue([0x10])
    }

    this.newline();

    return this;
  }

  cut(value: "full" | "partial"): PrinterEncoder {
    this.newline();
    this._queue([
      EscPosCommands.CUT,
      value === 'partial' ? 0x42 : 0x41,
      0x10,
    ]);
    return this;
  }

  fontsize(width: number, height: number): PrinterEncoder {

    if (width < 1 || width > 8) {
      throw new Error('EscPosEncoder.fontsize : width is outofbounds [1, 8]');
    }

    if (height < 1 || height > 8) {
      throw new Error('EscPosEncoder.fontsize : height is outofbounds [1, 8]');
    }

    let arg = (width - 1 << 4) + (height - 1);

    this._queue([
      EscPosCommands.SELECT_CHARACTER_SIZE,
      arg,
    ]);
    return this;
  };

  underline(value: 0 | 1 | 2 = 0): PrinterEncoder {

    let arg: number;
    switch (value) {
      case 0:
        arg = 0x30;
        break;
      case 1:
        arg = 0x31;
        break;
      case 2:
        arg = 0x32;
    }

    this._queue([EscPosCommands.UNDERLINE, arg]);

    return this;
  };

}