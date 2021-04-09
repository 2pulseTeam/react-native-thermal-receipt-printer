// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics;
using System.IO;
using System.Timers;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Collections.Generic;
using Microsoft.ReactNative.Managed;
using Windows.Devices.PointOfService;

using RNThermalReceiptPrinter.Printers;

namespace RNThermalReceiptPrinter
{
    namespace RNThermalReceiptPrinter
    {

        [ReactModule]
        class RNUSBPrinter
        {
            private PosPrinter printer;
            private ClaimedPosPrinter claimedPrinter;

            [ReactMethod("init")]
            public async void Init(ReactPromise<string> promise)
            {
                System.Diagnostics.Debug.WriteLine("RNUSBPrinter - Init - START");

                printer = await PosPrinter.GetDefaultAsync();
                promise.Resolve("RNUSBPrinter - Init success");

                if (printer == null)
                {
                    System.Diagnostics.Debug.WriteLine("RNUSBPrinter - Init - WARN - printer is undefined !!");
                }

                System.Diagnostics.Debug.WriteLine("RNUSBPrinter - Init - END");
            }

            [ReactMethod("getDeviceList")]
            public void GetDeviceList(ReactPromise<JSValue> promise)
            {
                System.Diagnostics.Debug.WriteLine("RNUSBPrinter - GetDeviceList - START");
                var resultObject = new JSValueObject();

                resultObject["device_name"] = "todo";
                resultObject["host"] = "todo";
                resultObject["port"] = "todo";

                promise.Resolve(resultObject);
            }

            [ReactMethod("connectPrinter")]
            public async void ConnectPrinter(string host, int port, ReactPromise<JSValue> promise)
            {
                try
                {
                    if (printer == null)
                    {
                        System.Diagnostics.Debug.WriteLine("RNUSBPrinter - ConnectPrinter - printer is null !!!");

                        printer = await PosPrinter.GetDefaultAsync();

                    }
                    claimedPrinter = await printer.ClaimPrinterAsync();
                    await claimedPrinter.EnableAsync();

                    System.Diagnostics.Debug.WriteLine("RNUSBPrinter - ConnectPrinter - BEFORE");
                    promise.Resolve(new JSValueObject());
                    System.Diagnostics.Debug.WriteLine("RNUSBPrinter - ConnectPrinter - AFTER");
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine("RNUSBPrinter - ConnectPrinter - exception : " + ex.Message);

                    var error = new ReactError();
                    error.Exception = ex;
                    promise.Reject(error);
                }

            }

            [ReactMethod("closeConn")]
            public void closeConn()
            {
                if (printer != null) {
                    printer.Dispose();
                }
            }

            [ReactMethod("printRawData")]
            public async void printRawData(string text)
            {
                System.Diagnostics.Debug.WriteLine("RNUSBPrinter - PrintRawData - START : " + text);
                try
                {

                    if (claimedPrinter == null) {
                      System.Diagnostics.Debug.WriteLine("RNUSBPrinter - PrintRawData - Claimed Printer is undefined !");
                    }

                    // var bytes = Convert.FromBase64String(text);

                    ReceiptPrintJob job = claimedPrinter.Receipt.CreateJob();
                    // job.PrintLine(text);

                    var data = "------------------------\n"
                             + "     Printing test      \n"
                             + "------------------------\n"
                             + "End Print\n";

                    job.Print(data);

                    bool success = await job.ExecuteAsync();

                } catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine("RNUSBPrinter - PrintRawData - Exception : " + ex.Message);
                }
                System.Diagnostics.Debug.WriteLine("RNUSBPrinter - PrintRawData - END : " + text);
            }
        }
    }
}
