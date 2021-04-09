import { NativeModules, NativeEventEmitter, Platform } from "react-native";
import { PrinterEncoder, TabData } from "./printer.encoder";
import { CodePage, EscPosEncoder } from "./escpos/escpos.encoder";

const RNUSBPrinter = NativeModules.RNUSBPrinter;
const RNBLEPrinter = NativeModules.RNBLEPrinter;
const RNNetPrinter = NativeModules.RNNetPrinter;

export {EscPosEncoder, PrinterEncoder, CodePage, TabData};

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

export const USBPrinter = {
  init: (): Promise<void> => {
    
    if (Platform.OS === "windows") {
      return RNUSBPrinter.init();
    } 

    return new Promise<void>((resolve, reject) =>
      RNUSBPrinter.init(
        () => resolve(),
        (error: Error) => reject(error)
      )
    );
  },

  getDeviceList: (): Promise<IUSBPrinter[]> =>
    new Promise((resolve, reject) =>
      RNUSBPrinter.getDeviceList(
        (printers: IUSBPrinter[]) => resolve(printers),
        (error: Error) => reject(error)
      )
    ),

  connectPrinter: (/*vendorId: string, productId: string*/): Promise<IUSBPrinter> => {

    if (Platform.OS === "windows") {
      return RNUSBPrinter.connectPrinter();
    } 

    return new Promise((resolve, reject) =>
      RNUSBPrinter.connectPrinter(
        //vendorId,
        //productId,
        (printer: IUSBPrinter) => resolve(printer),
        (error: Error) => reject(error)
      )
    );
  },

  closeConn: (): Promise<void> =>
    new Promise((resolve) => {
      RNUSBPrinter.closeConn();
      resolve();
    }),

  printRawData: (text: string): void => {
    return RNUSBPrinter.printRawData(text, (error: Error) =>
      console.warn(error)
    );
  },

};

export const BLEPrinter = {
  init: (): Promise<void> =>
    new Promise((resolve, reject) =>
      RNBLEPrinter.init(
        () => resolve(),
        (error: Error) => reject(error)
      )
    ),

  getDeviceList: (): Promise<IBLEPrinter[]> =>
    new Promise((resolve, reject) =>
      RNBLEPrinter.getDeviceList(
        (printers: IBLEPrinter[]) => resolve(printers),
        (error: Error) => reject(error)
      )
    ),

  connectPrinter: (inner_mac_address: string): Promise<IBLEPrinter> =>
    new Promise((resolve, reject) =>
      RNBLEPrinter.connectPrinter(
        inner_mac_address,
        (printer: IBLEPrinter) => resolve(printer),
        (error: Error) => reject(error)
      )
    ),

  closeConn: (): Promise<void> =>
    new Promise((resolve) => {
      RNBLEPrinter.closeConn();
      resolve();
    }),

  printRawData: (text: string): void => {
    RNBLEPrinter.printRawData(text, (error: Error) =>
      console.warn(error)
    );
  },
};

export const NetPrinter = {
  init: async (): Promise<void> => {
    if (Platform.OS === "windows") {
      return RNNetPrinter.init();
    } 
    
    return new Promise<void>((resolve, reject) =>
      RNNetPrinter.init(
        () => resolve(),
        (error: Error) => reject(error)
      )
    );
  },


  getDeviceList: (): Promise<INetPrinter[]> =>
    new Promise((resolve, reject) =>
      RNNetPrinter.getDeviceList(
        (printers: INetPrinter[]) => resolve(printers),
        (error: Error) => reject(error)
      )
    ),

  connectPrinter: async (host: string, port: string): Promise<INetPrinter> => {

    if (Platform.OS === 'windows') {
      return RNNetPrinter.connectPrinter(host, port);
    }

    return new Promise((resolve, reject) =>
      RNNetPrinter.connectPrinter(
        host,
        port,
        (printer: INetPrinter) => resolve(printer),
        (error: Error) => reject(error)
      )
    );
  },
  
  closeConn: (): Promise<void> =>
    new Promise((resolve) => {
      RNNetPrinter.closeConn();
      resolve();
    }),

  printRawData: (text: string) => {
    return RNNetPrinter.printRawData(text, (error: Error) => {
      console.log('printRawData error', {error});
    });
  },

};

export const NetPrinterEventEmitter = new NativeEventEmitter(RNNetPrinter);

export enum RN_THERMAL_RECEIPT_PRINTER_EVENTS {
  EVENT_NET_PRINTER_SCANNED_SUCCESS = "scannerResolved",
  EVENT_NET_PRINTER_SCANNING = "scannerRunning",
  EVENT_NET_PRINTER_SCANNED_ERROR = "registerError",
}
