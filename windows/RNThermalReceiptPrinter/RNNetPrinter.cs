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

// using ESCPOS_NET;
// using RNThermalReceiptPrinter.Utilities;
// using ESCPOS_NET.Emitters;

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

                printer = new NetworkPrinter();
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
                        printer = new NetworkPrinter();
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
                    var e = new EPSON();

                    printer.Write(
                        //ByteSplicer.Combine(
                          // e.PrintLine(text)
                          e.PrintLine(text)
                        //)
                    );
                    // promise.Resolve(new JSValueObject());
                } catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine("RNNetPrinter - PrintRawData - Exception : " + ex.Message);
                    var error = new ReactError();
                    error.Exception = ex;
                    promise.Reject(error);
                }
                System.Diagnostics.Debug.WriteLine("RNNetPrinter - PrintRawData - END : " + text);
            }

        }

        class EPSON
        {
            /* Print Commands */
            public byte[] Print(string data)
            {
                // Fix OSX or Windows-style newlines
                data = data.Replace("\r\n", "\n");
                data = data.Replace("\r", "\n");

                // TODO: Sanitize...
                // return data.ToCharArray().Select(x => (byte)x).ToArray();
                return Encoding.Unicode.GetBytes(data);
            }

            public byte[] PrintLine(string line)
            {
                if (line == null)
                {
                    return Print("\n");
                }

                return Print(line.Replace("\r", string.Empty).Replace("\n", string.Empty) + "\n");
                // return Print("BONJOUR\n"); //line.Replace("\r", string.Empty).Replace("\n", string.Empty) + "\n");
            }
        }

        class NetworkPrinter : IDisposable
        {
            private bool disposed = false;

            private volatile bool _isMonitoring;

            // private CancellationTokenSource _cancellationTokenSource;

            private readonly int _maxBytesPerWrite = 15000; // max byte chunks to write at once.

            // public PrinterStatusEventArgs Status { get; private set; } = null;

            // public event EventHandler StatusChanged;

            protected BinaryWriter Writer { get; set; }

            protected BinaryReader Reader { get; set; }

            protected System.Timers.Timer FlushTimer { get; set; }

            // protected ConcurrentQueue<byte> ReadBuffer { get; set; } = new ConcurrentQueue<byte>();

            protected int BytesWrittenSinceLastFlush { get; set; } = 0;

            // flag which allows an attempt to reconnect on timeout.
            private readonly bool _reconnectOnTimeout;
            private IPEndPoint _endPoint;
            private Socket _socket;
            private NetworkStream _sockStream;

            protected bool IsConnected => !((_socket.Poll(1000, SelectMode.SelectRead) && (_socket.Available == 0)) || !_socket.Connected);


            public NetworkPrinter(bool reconnectOnTimeout = true)
            {
                System.Diagnostics.Debug.WriteLine("NetworkPrinter Constructor");

                FlushTimer = new System.Timers.Timer(50);
                FlushTimer.Elapsed += Flush;
                FlushTimer.AutoReset = false;

                _reconnectOnTimeout = reconnectOnTimeout;
            }

            protected void Reconnect()
            {
                try
                {
                    if (_reconnectOnTimeout)
                    {
                        System.Diagnostics.Debug.WriteLine("Trying to reconnect...");
                        // StopMonitoring();
                        Writer?.Flush();
                        Writer?.Close();
                        Reader?.Close();

                        _sockStream?.Close();
                        _socket?.Close();

                        ConnectSocket();
                        System.Diagnostics.Debug.WriteLine("Reconnected!");
                        // StartMonitoring();
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"Failed to reconnect: {ex.Message}");
                    throw;
                }
            }

            public void Connect(string host, int port)
            {
                System.Diagnostics.Debug.WriteLine("START - NetworkPrinter Connect - " + host + ":" + port);

                _endPoint = new IPEndPoint(IPAddress.Parse(host), port);

                ConnectSocket();

                System.Diagnostics.Debug.WriteLine("END - NetworkPrinter Connect");
            }

            private void ConnectSocket()
            {
                _socket = new Socket(_endPoint.AddressFamily, SocketType.Stream, ProtocolType.Tcp);
                _socket.Connect(_endPoint);
                _sockStream = new NetworkStream(_socket);

                // Need to review the paramaters set here
                Writer = new BinaryWriter(_sockStream, new UTF8Encoding(), true);
                Reader = new BinaryReader(_sockStream, new UTF8Encoding(), true);
            }

            public void Write(byte[] bytes)
            {
                int bytePointer = 0;
                int bytesLeft = bytes.Length;
                bool hasFlushed = false;
                while (bytesLeft > 0)
                {
                    int count = Math.Min(_maxBytesPerWrite, bytesLeft);
                    Writer.Write(bytes, bytePointer, count);
                    BytesWrittenSinceLastFlush += count;
                    if (BytesWrittenSinceLastFlush >= 200)
                    {
                        // Immediately trigger a flush before proceeding so the output buffer will not be delayed.
                        hasFlushed = true;
                        Flush(null, null);
                    }

                    bytePointer += count;
                    bytesLeft -= count;
                }

                if (!hasFlushed)
                {
                    FlushTimer?.Start();
                }
            }

            protected void Flush(object sender, ElapsedEventArgs e)
            {
                BytesWrittenSinceLastFlush = 0;
                FlushTimer.Stop();
                Writer.Flush();
            }


            ~NetworkPrinter()
            {
                System.Diagnostics.Debug.WriteLine("NetworkPrinter Destructor");
                Dispose(false);
            }

            public void Dispose()
            {
                Dispose(true);
                GC.SuppressFinalize(this);
            }

            protected void OverridableDispose()
            {
                _sockStream?.Close();
                _sockStream?.Dispose();
                _socket?.Close();
                _socket?.Dispose();
            }

            protected void Dispose(bool disposing)
            {
                if (disposed)
                {
                    return;
                }

                if (disposing)
                {
                    // _cancellationTokenSource?.Cancel();
                    FlushTimer?.Stop();
                    if (FlushTimer != null)
                    {
                        FlushTimer.Elapsed -= Flush;
                    }

                    FlushTimer?.Dispose();
                    Reader?.Close();
                    Reader?.Dispose();
                    Writer?.Close();
                    Writer?.Dispose();

                    OverridableDispose();
                }

                disposed = true;
            }
        }
    }
}
