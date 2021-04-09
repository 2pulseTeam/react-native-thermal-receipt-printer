var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
export var CodePage = {
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
};
var EscPosEncoder = /** @class */ (function (_super) {
    __extends(EscPosEncoder, _super);
    function EscPosEncoder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EscPosEncoder.prototype.initialize = function () {
        var codepage = CodePage[this._encoding];
        if (!codepage)
            throw new Error('EscPosEncoder.initialize - codepage is unknown : ' + this._encoding);
        this._queue([
            EscPosCommands.INIT_PRINTER,
            EscPosCommands.SELECT_CODE_PAGE,
            codepage
        ]);
        return this;
    };
    EscPosEncoder.prototype.newline = function (value) {
        if (value === void 0) { value = 1; }
        if (value < 1)
            throw new Error('EscPosEncoder.newline - value is < 1');
        var toQueue = [];
        for (var index = 0; index < value; index++) {
            toQueue.push(EscPosCommands.CR, EscPosCommands.LF);
        }
        this._queue(toQueue);
        return this;
    };
    EscPosEncoder.prototype.text = function (value) {
        var _this = this;
        this._queue(Array.from(value).map(function (char) { return iconv.encode(char, _this._encoding); }));
        return this;
    };
    EscPosEncoder.prototype.textline = function (value) {
        this.text(value);
        this.newline();
        return this;
    };
    EscPosEncoder.prototype.table = function (headers, values) {
        var _this = this;
        var initialWidth = headers.reduce(function (acc, header) {
            acc[header.key] = 0;
            return acc;
        }, {});
        // get each column size = max(values[header])
        var columnsWidth = values.reduce(function (acc, value) {
            headers.forEach(function (header) {
                if (acc[header.key] <= value[header.key].length) {
                    acc[header.key] = value[header.key].length + 1; // Force 1 character margin
                }
            });
            return acc;
        }, initialWidth);
        var totalWidth = Object.keys(columnsWidth).reduce(function (acc, key) {
            acc += columnsWidth[key];
            return acc;
        }, 0);
        if (totalWidth < 48) {
            var lastKey = Object.keys(columnsWidth).pop();
            columnsWidth[lastKey] += 48 - totalWidth;
        }
        values.forEach(function (value) {
            headers.forEach(function (header) {
                _this.text(header.align === 'left'
                    ? value[header.key].padEnd(columnsWidth[header.key])
                    : value[header.key].padStart(columnsWidth[header.key]));
            });
            _this.newline();
        });
        return this;
    };
    EscPosEncoder.prototype.position = function (value) {
        var nl = value % 256;
        var nh = Math.round(value / 256);
        if (nh > 255)
            throw new Error('EscPosEncoder.position - value / 256 must be <= 255');
        if (nl > 255)
            throw new Error('EscPosEncoder.position - value % 256 must be <= 255');
        this._queue([EscPosCommands.ABSOLUTE_PRINT_POSITION, nl, nh]);
        return this;
    };
    EscPosEncoder.prototype.bold = function (value) {
        this._queue([
            EscPosCommands.BOLD,
            value ? 0x01 : 0x00
        ]);
        return this;
    };
    EscPosEncoder.prototype.align = function (value) {
        var arg = 0x30;
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
    };
    EscPosEncoder.prototype.image = function (width, height, img) {
        if (width % 256 != 0)
            throw new Error('Width must be a multiple of 256');
        if (height % 8 != 0)
            throw new Error('Height must be a multiple of 8');
        var m = 0;
        var nl = width % 256;
        var nh = Math.round(width / 256);
        this._queue([
            EscPosCommands.LINE_SPACING_N180,
            0x10,
        ]);
        var getPixel = function (x, y) { return img[((width * y) + x)]; };
        for (var j = 0; j < height; j = j + 8) {
            this._queue([EscPosCommands.BIT_IMAGE, m, nl, nh]);
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
                this._queue([result]);
            }
            this.newline();
        }
        this.newline();
        return this;
    };
    EscPosEncoder.prototype.drawline = function () {
        this._queue([EscPosCommands.BIT_IMAGE, 0, 0, 1]);
        for (var index = 0; index < 256; index++) {
            this._queue([0x10]);
        }
        this.newline();
        return this;
    };
    EscPosEncoder.prototype.cut = function (value) {
        this.newline();
        this._queue([
            EscPosCommands.CUT,
            value === 'partial' ? 0x42 : 0x41,
            0x10,
        ]);
        return this;
    };
    EscPosEncoder.prototype.fontsize = function (width, height) {
        if (width < 1 || width > 8) {
            throw new Error('EscPosEncoder.fontsize : width is outofbounds [1, 8]');
        }
        if (height < 1 || height > 8) {
            throw new Error('EscPosEncoder.fontsize : height is outofbounds [1, 8]');
        }
        var arg = (width - 1 << 4) + (height - 1);
        this._queue([
            EscPosCommands.SELECT_CHARACTER_SIZE,
            arg,
        ]);
        return this;
    };
    ;
    EscPosEncoder.prototype.underline = function (value) {
        if (value === void 0) { value = 0; }
        var arg;
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
    ;
    return EscPosEncoder;
}(PrinterEncoder));
export { EscPosEncoder };
