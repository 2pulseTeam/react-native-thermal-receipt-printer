import { Buffer } from "buffer";
import * as iconv from "iconv-lite";
// import * as Jimp from "jimp";

import BufferHelper from "./buffer-helper";

const init_printer_bytes = Buffer.from([27, 64]);
const l_start_bytes = Buffer.from([27, 97, 0]);
const l_end_bytes = Buffer.from([]);
const c_start_bytes = Buffer.from([27, 97, 1]);
const c_end_bytes = Buffer.from([]); // [ 27, 97, 0 ];
const r_start_bytes = Buffer.from([27, 97, 2]);
const r_end_bytes = Buffer.from([]);

const cr_bytes = Buffer.from([13]);
const lf_bytes = Buffer.from([10]);
const line_spacing_n180_bytes = Buffer.from([27, 51, 16]);
const line_spacing_16_bytes = Buffer.from([27, 50]);

const default_space_bytes = Buffer.from([27, 50]);

const reset_bytes = Buffer.from([27, 97, 0, 29, 33, 0, 27, 50]);
const m_start_bytes = Buffer.from([27, 33, 16, 28, 33, 8]);
const m_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);
const b_start_bytes = Buffer.from([27, 33, 48, 28, 33, 12]);
const b_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);
const cm_start_bytes = Buffer.from([27, 97, 1, 27, 33, 16, 28, 33, 8]);
const cm_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);
const cb_start_bytes = Buffer.from([27, 97, 1, 27, 33, 48, 28, 33, 12]);
const cb_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);
const cd_start_bytes = Buffer.from([27, 97, 1, 27, 33, 32, 28, 33, 4]);
const cd_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);
const d_start_bytes = Buffer.from([27, 33, 32, 28, 33, 4]);
const d_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);

const cut_bytes = Buffer.from([27, 105]);
const beep_bytes = Buffer.from([27, 66, 3, 2]);
const line_bytes = Buffer.from([10, 10, 10, 10, 10]);


// const start_image_bytes = Buffer.from([27, 42]);

// const set_line_spacing_9pin_bytes = Buffer.from([27, 43, 52, 56]);
// const set_line_spacing_other_bytes = Buffer.from([27, 51, 50, 52]);

const options_controller = {
  cut: cut_bytes,
  beep: beep_bytes,
  tailingLine: line_bytes,
};

const controller = {
  "<M>": m_start_bytes,
  "</M>": m_end_bytes,
  "<B>": b_start_bytes,
  "</B>": b_end_bytes,
  "<D>": d_start_bytes,
  "</D>": d_end_bytes,
  "<C>": c_start_bytes,
  "</C>": c_end_bytes,
  "<CM>": cm_start_bytes,
  "</CM>": cm_end_bytes,
  "<CD>": cd_start_bytes,
  "</CD>": cd_end_bytes,
  "<CB>": cb_start_bytes,
  "</CB>": cb_end_bytes,
  "<L>": l_start_bytes,
  "</L>": l_end_bytes,
  "<R>": r_start_bytes,
  "</R>": r_end_bytes,
};

type IOptions = {
  beep: boolean;
  cut: boolean;
  tailingLine: boolean;
  encoding: string;
};

const default_options: IOptions = {
  beep: false,
  cut: true,
  tailingLine: true,
  encoding: "UTF8",
};

export function exchange_text(text: string, options: IOptions): Buffer {
  const m_options = options || default_options;

  let bytes = new BufferHelper();
  bytes.concat(init_printer_bytes);
  bytes.concat(default_space_bytes);
  let temp = "";
  for (let i = 0; i < text.length; i++) {
    let ch = text[i];
    switch (ch) {
      case "<":
        bytes.concat(iconv.encode(temp, m_options.encoding));
        temp = "";
        // add bytes for changing font and justifying text
        for (const tag in controller) {
          if (text.substring(i, i + tag.length) === tag) {
            bytes.concat(controller[tag]);
            i += tag.length - 1;
          }
        }
        break;
      case "\n":
        temp = `${temp}${ch}`;
        bytes.concat(iconv.encode(temp, m_options.encoding));
        bytes.concat(reset_bytes);
        temp = "";
        break;
      default:
        temp = `${temp}${ch}`;
        break;
    }
  }
  temp.length && bytes.concat(iconv.encode(temp, m_options.encoding));

  // add option bytes
  for (const key in m_options) {
    if (typeof m_options[key] === "boolean" && options_controller[key])
      bytes.concat(options_controller[key]);
  }
  return bytes.toBuffer();
}

export function exchange_image(
  width: number,
  height: number,
  img: number[],
): Buffer {

    // const source = Buffer.from(img);
    // const height = Math.round(source.length / 256 * 4);

    const m = 0;
    const nl = width % 256;
    const nh = Math.round(width / 256);
    const bytes = new BufferHelper();
    bytes.concat(init_printer_bytes);
    bytes.concat(default_space_bytes);
    bytes.concat(line_spacing_n180_bytes);

    const getPixel = (x: number, y: number) => {
      // console.log('getPixel', {
      //   x,y, index: (width * y) + x, value: img[((width * y) + x)] 
      // })
      return img[((width * y) + x)]
    };

    for (let j = 0; j < height / 8; j = j + 8) {

      bytes.concat(Buffer.from([27, 42, m, nl, nh]));
      let result;
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

        bytes.concat(Buffer.of(result));
        
          // const offset = k % 8;
          // bytes.concat(0x80 >> offset);
      }

      bytes.concat(cr_bytes);
      bytes.concat(lf_bytes);
    }

    // bytes.concat(Buffer.from(result));

    bytes.concat(cr_bytes);
    bytes.concat(lf_bytes); 

    console.log('exchange_image', {
        m, nl, nh, height, width, bytes
    });
    bytes.concat(line_spacing_16_bytes);
    return bytes.toBuffer();
}


// const getPixel = (x: number, y: number) => source[((width * y) + x) * 4] > 0 ? 0 : 1;

// const result = new Uint8Array((width * height) >> 3);

// console.log('result', {result});

// for (let y = 0; y < height; y++) {
//   for (let x = 0; x < width; x = x + 8) {
//     const i = (y * (width >> 3)) + (x >> 3);

    
//     result[i] =
//                 getPixel(x + 0, y) << 7 |
//                 getPixel(x + 1, y) << 6 |
//                 getPixel(x + 2, y) << 5 |
//                 getPixel(x + 3, y) << 4 |
//                 getPixel(x + 4, y) << 3 |
//                 getPixel(x + 5, y) << 2 |
//                 getPixel(x + 6, y) << 1 |
//                 getPixel(x + 7, y);
  
//     console.log('i', {x, y, i, res: result[i]});
//   }
// }