import { Buffer } from "buffer";
import * as iconv from "iconv-lite";
// import * as Jimp from "jimp";
import BufferHelper from "./buffer-helper";
var init_printer_bytes = Buffer.from([27, 64]);
var l_start_bytes = Buffer.from([27, 97, 0]);
var l_end_bytes = Buffer.from([]);
var c_start_bytes = Buffer.from([27, 97, 1]);
var c_end_bytes = Buffer.from([]); // [ 27, 97, 0 ];
var r_start_bytes = Buffer.from([27, 97, 2]);
var r_end_bytes = Buffer.from([]);
var cr_bytes = Buffer.from([13]);
var lf_bytes = Buffer.from([10]);
var line_spacing_n180_bytes = Buffer.from([27, 51, 16]);
var line_spacing_16_bytes = Buffer.from([27, 50]);
var default_space_bytes = Buffer.from([27, 50]);
var reset_bytes = Buffer.from([27, 97, 0, 29, 33, 0, 27, 50]);
var m_start_bytes = Buffer.from([27, 33, 16, 28, 33, 8]);
var m_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);
var b_start_bytes = Buffer.from([27, 33, 48, 28, 33, 12]);
var b_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);
var cm_start_bytes = Buffer.from([27, 97, 1, 27, 33, 16, 28, 33, 8]);
var cm_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);
var cb_start_bytes = Buffer.from([27, 97, 1, 27, 33, 48, 28, 33, 12]);
var cb_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);
var cd_start_bytes = Buffer.from([27, 97, 1, 27, 33, 32, 28, 33, 4]);
var cd_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);
var d_start_bytes = Buffer.from([27, 33, 32, 28, 33, 4]);
var d_end_bytes = Buffer.from([27, 33, 0, 28, 33, 0]);
var cut_bytes = Buffer.from([27, 105]);
var beep_bytes = Buffer.from([27, 66, 3, 2]);
var line_bytes = Buffer.from([10, 10, 10, 10, 10]);
// const start_image_bytes = Buffer.from([27, 42]);
// const set_line_spacing_9pin_bytes = Buffer.from([27, 43, 52, 56]);
// const set_line_spacing_other_bytes = Buffer.from([27, 51, 50, 52]);
var options_controller = {
    cut: cut_bytes,
    beep: beep_bytes,
    tailingLine: line_bytes,
};
var controller = {
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
var default_options = {
    beep: false,
    cut: true,
    tailingLine: true,
    encoding: "UTF8",
};
export function exchange_text(text, options) {
    var m_options = options || default_options;
    var bytes = new BufferHelper();
    bytes.concat(init_printer_bytes);
    bytes.concat(default_space_bytes);
    var temp = "";
    for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        switch (ch) {
            case "<":
                bytes.concat(iconv.encode(temp, m_options.encoding));
                temp = "";
                // add bytes for changing font and justifying text
                for (var tag in controller) {
                    if (text.substring(i, i + tag.length) === tag) {
                        bytes.concat(controller[tag]);
                        i += tag.length - 1;
                    }
                }
                break;
            case "\n":
                temp = "" + temp + ch;
                bytes.concat(iconv.encode(temp, m_options.encoding));
                bytes.concat(reset_bytes);
                temp = "";
                break;
            default:
                temp = "" + temp + ch;
                break;
        }
    }
    temp.length && bytes.concat(iconv.encode(temp, m_options.encoding));
    // add option bytes
    for (var key in m_options) {
        if (typeof m_options[key] === "boolean" && options_controller[key])
            bytes.concat(options_controller[key]);
    }
    return bytes.toBuffer();
}
export function exchange_image(width, height, img) {
    // const source = Buffer.from(img);
    // const height = Math.round(source.length / 256 * 4);
    var m = 0;
    var nl = width % 256;
    var nh = Math.round(width / 256);
    var bytes = new BufferHelper();
    bytes.concat(init_printer_bytes);
    bytes.concat(default_space_bytes);
    bytes.concat(line_spacing_n180_bytes);
    var getPixel = function (x, y) {
        // console.log('getPixel', {
        //   x,y, index: (width * y) + x, value: img[((width * y) + x)] 
        // })
        return img[((width * y) + x)];
    };
    for (var j = 0; j < height / 8; j++) {
        bytes.concat(Buffer.from([27, 42, m, nl, nh]));
        var result = void 0;
        for (var i = 0; i < width; i++) {
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
        m: m, nl: nl, nh: nh, height: height, width: width, bytes: bytes
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
