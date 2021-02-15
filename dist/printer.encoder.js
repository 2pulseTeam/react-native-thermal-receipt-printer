import { Buffer } from 'buffer';
var PrinterEncoder = /** @class */ (function () {
    function PrinterEncoder(encoding) {
        this._reset();
        this._encoding = encoding;
    }
    PrinterEncoder.prototype._reset = function () {
        this._buffers = [];
    };
    PrinterEncoder.prototype._queue = function (values) {
        var _a;
        (_a = this._buffers).push.apply(_a, values.map(function (value) { return typeof value === 'number'
            ? Buffer.of(value)
            : value; }));
    };
    PrinterEncoder.prototype.encode = function () {
        var result = Buffer.concat(this._buffers);
        this._reset();
        return result.toString('base64');
    };
    return PrinterEncoder;
}());
export { PrinterEncoder };
