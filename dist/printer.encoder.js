import { Buffer } from 'buffer';
var PrinterEncoder = /** @class */ (function () {
    function PrinterEncoder(encoding) {
        this._reset();
        this._encoding = encoding;
    }
    PrinterEncoder.prototype._reset = function () {
        this._buffer = [];
    };
    PrinterEncoder.prototype._queue = function (values) {
        var _a;
        (_a = this._buffer).push.apply(_a, values);
    };
    PrinterEncoder.prototype.encode = function () {
        var result = Buffer.from(this._buffer);
        this._reset();
        return result.toString('base64');
    };
    return PrinterEncoder;
}());
export { PrinterEncoder };
