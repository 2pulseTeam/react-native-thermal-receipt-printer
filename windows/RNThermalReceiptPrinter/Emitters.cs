using System.Text;

namespace ESCPOS_NET.Emitters
{
    public class EPSON
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
        }
    }
        
}