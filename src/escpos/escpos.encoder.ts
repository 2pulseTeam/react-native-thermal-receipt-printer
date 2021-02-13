import { PrinterEncoder } from "../printer.encoder";
import { EscPosCommands } from "./commands";
import * as iconv from "iconv-lite";

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
  PC437: 0x00,
  PC850: 0x02,
  PC860: 0x03,
  PC863: 0x04,
  PC865: 0x05,
  WPC1252: 0x10,
  1252: 0x10, 
  PC866: 0x11,
  PC852: 0x12,
  852: 0x12,
  PC858: 0x13,
}


export class EscPosEncoder extends PrinterEncoder {

  initialize(): PrinterEncoder {

    const codepage = CodePage[this._encoding];

    if (!codepage)
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
    console.log('Text queueing', Array.from(value).map(char => iconv.encode(char, this._encoding)));
    this._queue(Array.from(value).map(char => iconv.encode(char, this._encoding)));
    this.newline();
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