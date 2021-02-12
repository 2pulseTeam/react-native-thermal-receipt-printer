export declare abstract class PrinterEncoder {
    _buffer: number[];
    _encoding: string;
    constructor(encoding: string);
    private _reset;
    protected _queue(values: number[]): void;
    encode(): string;
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
