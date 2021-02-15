/// <reference types="node" />
export declare abstract class PrinterEncoder {
    _buffers: Buffer[];
    _encoding: string;
    constructor(encoding: string);
    private _reset;
    protected _queue(values: Array<Buffer | number>): void;
    encode(): string;
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
    align: string;
    label: string;
    key: string;
}
