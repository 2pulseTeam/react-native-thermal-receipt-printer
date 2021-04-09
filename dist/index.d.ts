import { NativeEventEmitter } from "react-native";
import { PrinterEncoder, TabData } from "./printer.encoder";
import { CodePage, EscPosEncoder } from "./escpos/escpos.encoder";
export { EscPosEncoder, PrinterEncoder, CodePage, TabData };
export interface PrinterOptions {
    beep?: boolean;
    cut?: boolean;
    tailingLine?: boolean;
    encoding?: string;
}
export interface IUSBPrinter {
    device_name: string;
    vendor_id: string;
    product_id: string;
}
export interface IBLEPrinter {
    device_name: string;
    inner_mac_address: string;
}
export interface INetPrinter {
    device_name: string;
    host: string;
    port: string;
}
export declare const USBPrinter: {
    init: () => Promise<void>;
    getDeviceList: () => Promise<IUSBPrinter[]>;
    connectPrinter: () => Promise<IUSBPrinter>;
    closeConn: () => Promise<void>;
    printRawData: (text: string) => void;
};
export declare const BLEPrinter: {
    init: () => Promise<void>;
    getDeviceList: () => Promise<IBLEPrinter[]>;
    connectPrinter: (inner_mac_address: string) => Promise<IBLEPrinter>;
    closeConn: () => Promise<void>;
    printRawData: (text: string) => void;
};
export declare const NetPrinter: {
    init: () => Promise<void>;
    getDeviceList: () => Promise<INetPrinter[]>;
    connectPrinter: (host: string, port: string) => Promise<INetPrinter>;
    closeConn: () => Promise<void>;
    printRawData: (text: string) => any;
};
export declare const NetPrinterEventEmitter: NativeEventEmitter;
export declare enum RN_THERMAL_RECEIPT_PRINTER_EVENTS {
    EVENT_NET_PRINTER_SCANNED_SUCCESS = "scannerResolved",
    EVENT_NET_PRINTER_SCANNING = "scannerRunning",
    EVENT_NET_PRINTER_SCANNED_ERROR = "registerError"
}
