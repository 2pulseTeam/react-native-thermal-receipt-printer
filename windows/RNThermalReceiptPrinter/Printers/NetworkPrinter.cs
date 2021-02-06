using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Runtime.InteropServices.WindowsRuntime;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using System.Timers;

namespace RNThermalReceiptPrinter.Printers
{
    public sealed class NetworkPrinter : IDisposable
    {

        private bool disposed = false;
        private volatile bool _isMonitoring;
        private CancellationTokenSource _cancellationTokenSource;
        private readonly int _maxBytesPerWrite = 15000; // max byte chunks to write at once.
        private BinaryWriter Writer { get; set; }
        private BinaryReader Reader { get; set; }
        private System.Timers.Timer FlushTimer { get; set; }
        private ConcurrentQueue<byte> ReadBuffer { get; set; } = new ConcurrentQueue<byte>();
        private int BytesWrittenSinceLastFlush { get; set; } = 0;

        // flag which allows an attempt to reconnect on timeout.
        private readonly bool _reconnectOnTimeout;
        private IPEndPoint _endPoint;
        private Socket _socket;
        private NetworkStream _sockStream;

        private bool IsConnected => !((_socket.Poll(1000, SelectMode.SelectRead) && (_socket.Available == 0)) || !_socket.Connected);

        public NetworkPrinter(bool reconnectOnTimeout)
        {
            System.Diagnostics.Debug.WriteLine("NetworkPrinter Constructor");

            _reconnectOnTimeout = reconnectOnTimeout;

            FlushTimer = new System.Timers.Timer(50);
            FlushTimer.Elapsed += Flush;
            FlushTimer.AutoReset = false;
        }

        public void Read()
        {
            while (_isMonitoring)
            {
                try
                {
                    if (_cancellationTokenSource != null && _cancellationTokenSource.IsCancellationRequested)
                    {
                        _cancellationTokenSource.Token.ThrowIfCancellationRequested();
                    }

                    // Sometimes the serial port lib will throw an exception and read past the end of the queue if a
                    // status changes while data is being written.  We just ignore these bytes.
                    var b = Reader.ReadByte();
                    ReadBuffer.Enqueue(b);
                }
                catch (OperationCanceledException ex)
                {
                    _cancellationTokenSource.Dispose();
                    _cancellationTokenSource = null;
                    _isMonitoring = false;
                    Debug.WriteLine($"Read Cancelled Exception: {ex.Message}");
                }
                catch (IOException ex)
                {
                    // Thrown if the printer times out the socket connection
                    // default is 90 seconds
                    Thread.Sleep(100);
                    _isMonitoring = false;
                    Debug.WriteLine($"Read Exception: {ex.Message}");
                }
                catch (Exception ex)
                {
                    // Swallow the exception
                    Debug.WriteLine($"Read Exception: {ex.Message}");
                }
            }
        }

        public void Reconnect()
        {
            try
            {
                if (_reconnectOnTimeout)
                {
                    Console.WriteLine("Trying to reconnect...");
                    StopMonitoring();
                    Writer?.Flush();
                    Writer?.Close();
                    Reader?.Close();

                    _sockStream?.Close();
                    _socket?.Close();

                    ConnectSocket();
                    Console.WriteLine("Reconnected!");
                    StartMonitoring();
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Failed to reconnect: {ex.Message}");
                throw;
            }
        }

        public void Write([ReadOnlyArray()] byte[] bytes)
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

        private void Flush(object sender, ElapsedEventArgs e)
        {
            BytesWrittenSinceLastFlush = 0;
            FlushTimer.Stop();
            Writer.Flush();
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

        ~NetworkPrinter()
        {
            Dispose();
        }

        public void Dispose()
        {
            _sockStream?.Close();
            _sockStream?.Dispose();
            _socket?.Close();
            _socket?.Dispose();

            GC.SuppressFinalize(this);
        }

        public void StartMonitoring()
        {
            if (!_isMonitoring)
            {
                Console.WriteLine(nameof(StartMonitoring));
                ReadBuffer = new ConcurrentQueue<byte>();

                _isMonitoring = true;
                _cancellationTokenSource = new CancellationTokenSource();
                Task.Factory.StartNew(Read, _cancellationTokenSource.Token, TaskCreationOptions.LongRunning, TaskScheduler.Default).ConfigureAwait(false);
            }
        }

        public void StopMonitoring()
        {
            if (_isMonitoring)
            {
                Console.WriteLine(nameof(StopMonitoring));
                _isMonitoring = false;
                ReadBuffer = new ConcurrentQueue<byte>();

                if (_cancellationTokenSource != null)
                {
                    _cancellationTokenSource.Cancel();
                }
            }
        }

    }
}
