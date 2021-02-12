import { PrinterEncoder } from "../printer.encoder";
export declare const CodePage: {
    PC437: number;
    PC850: number;
    PC860: number;
    PC863: number;
    PC865: number;
    WPC1252: number;
    PC866: number;
    PC852: number;
    PC858: number;
};
export declare class EscPosEncoder extends PrinterEncoder {
    initialize(): PrinterEncoder;
    newline(): PrinterEncoder;
    text(value: string): PrinterEncoder;
    italic(value: boolean): PrinterEncoder;
    bold(value: boolean): PrinterEncoder;
    align(value: "left" | "center" | "right"): PrinterEncoder;
    image(width: number, height: number, img: number[]): PrinterEncoder;
    cut(value: "full" | "partial"): PrinterEncoder;
    fontsize(width: number, height: number): PrinterEncoder;
    underline(value?: 0 | 1 | 2): PrinterEncoder;
}
