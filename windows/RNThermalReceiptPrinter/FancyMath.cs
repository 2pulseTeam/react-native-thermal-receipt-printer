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
// using ESCPOS_NET.Utilities;
// using ESCPOS_NET.Emitters;

namespace RNThermalReceiptPrinter
{
    namespace RNThermalReceiptPrinter
    {
        [ReactModule]
        class FancyMath
        {
            [ReactConstant]
            public double E = Math.E;

            [ReactConstant("Pi")]
            public double PI = Math.PI;

            [ReactMethod("add")]
            public double Add(double a, double b)
            {
                double result = a + b;
                AddEvent(result);
                return result;
            }

            [ReactEvent]
            public Action<double> AddEvent { get; set; }
        }

        [ReactModule]
        class RNNetPrinter
        {
            [ReactMethod("connect")]
            public void Connect(string host, int port)
            {
                NetworkPrinter printer = new NetworkPrinter(host, port, false);

                // var e = new EPSON();
                // var data = new byte[]{}; // e.PrintLine("Total Payment:         89.95"),

                // try 
                // {
                //     printer.Write(
                //         e.PrintLine("Total Payment:         89.95")
                //     );
                // } catch (Exception ex)
                // {
                //     System.Diagnostics.Debug.WriteLine($"Failed to reconnect: {ex.Message}");
                //     throw;
                // }
            }

            [ReactEvent]
            public Action<double> ConnectEvent { get; set; }
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

                // return Print(line.Replace("\r", string.Empty).Replace("\n", string.Empty) + "\n");
                return Print("BONJOUR\n"); //line.Replace("\r", string.Empty).Replace("\n", string.Empty) + "\n");
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
            private readonly IPEndPoint _endPoint;
            private Socket _socket;
            private NetworkStream _sockStream;

            protected bool IsConnected => !((_socket.Poll(1000, SelectMode.SelectRead) && (_socket.Available == 0)) || !_socket.Connected);

            public NetworkPrinter(string ipAddress, int port, bool reconnectOnTimeout)
            {
                FlushTimer = new System.Timers.Timer(50);
                FlushTimer.Elapsed += Flush;
                FlushTimer.AutoReset = false;

                _reconnectOnTimeout = reconnectOnTimeout;
                _endPoint = new IPEndPoint(IPAddress.Parse(ipAddress), port);
                Connect();
            }

            protected void Reconnect()
            {
                try
                {
                    if (_reconnectOnTimeout)
                    {
                        Console.WriteLine("Trying to reconnect...");
                        // StopMonitoring();
                        Writer?.Flush();
                        Writer?.Close();
                        Reader?.Close();

                        _sockStream?.Close();
                        _socket?.Close();

                        Connect();
                        Console.WriteLine("Reconnected!");
                        // StartMonitoring();
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"Failed to reconnect: {ex.Message}");
                    throw;
                }
            }

            private void Connect()
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
