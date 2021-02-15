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

using RNThermalReceiptPrinter.Printers;

namespace RNThermalReceiptPrinter
{
    namespace RNThermalReceiptPrinter
    {

        [ReactModule]
        class RNNetPrinter
        {
            private NetworkPrinter printer;

            [ReactMethod("init")]
            public void Init(ReactPromise<string> promise)
            {
                System.Diagnostics.Debug.WriteLine("RNNetPrinter - Init - START");

                printer = new NetworkPrinter(false);
                promise.Resolve("RNNetPrinter - Init success");

                if (printer != null)
                {
                    System.Diagnostics.Debug.WriteLine("RNNetPrinter - Init - printer is defined");
                }

                System.Diagnostics.Debug.WriteLine("RNNetPrinter - Init - END");
            }

            [ReactMethod("getDeviceList")]
            public void GetDeviceList(ReactPromise<JSValue> promise)
            {
                System.Diagnostics.Debug.WriteLine("RNNetPrinter - GetDeviceList - START");
                var resultObject = new JSValueObject();

                resultObject["device_name"] = "todo";
                resultObject["host"] = "todo";
                resultObject["port"] = "todo";

                promise.Resolve(resultObject);
            }

            [ReactMethod("connectPrinter")]
            public void ConnectPrinter(string host, int port, ReactPromise<JSValue> promise)
            {
                try
                {
                    if (printer == null)
                    {
                        System.Diagnostics.Debug.WriteLine("RNNetPrinter - ConnectPrinter - printer is null !!!");
                        printer = new NetworkPrinter(false);
                        //var error = new ReactError();
                        //error.Message = "Aucune imprimante de selectionnée";
                        //promise.Reject(error);
                        //return;
                    }

                    System.Diagnostics.Debug.WriteLine("RNNetPrinter - ConnectPrinter - BEFORE");
                    printer.Connect(host, port);
                    promise.Resolve(new JSValueObject());
                    System.Diagnostics.Debug.WriteLine("RNNetPrinter - ConnectPrinter - AFTER");
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine("RNNetPrinter - ConnectPrinter - exception : " + ex.Message);

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
            public void printRawData(string text)
            {
                System.Diagnostics.Debug.WriteLine("RNNetPrinter - PrintRawData - START : " + text);
                try
                {
                    var bytes = Convert.FromBase64String(text);

                    printer.Write(
                        bytes
                    );
                } catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine("RNNetPrinter - PrintRawData - Exception : " + ex.Message);
                }
                System.Diagnostics.Debug.WriteLine("RNNetPrinter - PrintRawData - END : " + text);
            }
        }
    }
}
