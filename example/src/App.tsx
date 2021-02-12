import * as React from "react";
import {
  StyleSheet,
  View,
  Text,
  Button,
  Alert,
  TextInput,
  Platform,
  NativeModules,
  Image,
} from "react-native";
import {
  BLEPrinter,
  NetPrinter,
  USBPrinter,
  IUSBPrinter,
  IBLEPrinter,
  INetPrinter,
  EscPosEncoder,
} from "react-native-thermal-receipt-printer";

import {data as testImage} from './2pulse';

const printerList: Record<string, any> = {
  ble: BLEPrinter,
  net: NetPrinter,
  usb: USBPrinter,
};

interface SelectedPrinter 
  extends Partial<IUSBPrinter & IBLEPrinter & INetPrinter> {
  printerType?: keyof typeof printerList;
}

export default function App() {

  console.log('STARTING APP ...');

  const [selectedValue, setSelectedValue] = React.useState<
    keyof typeof printerList
  >("net");
  const [devices, setDevices] = React.useState([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [selectedPrinter, setSelectedPrinter] = React.useState<SelectedPrinter>(
    {
      host: '192.168.1.10',
      port: '9100',
      printerType: 'net',
    }
  );

  React.useEffect(() => {
    const getListDevices = async () => {
      const Printer = printerList[selectedValue];
      // get list device for net printers is support scanning in local ip but not recommended
      if (selectedValue === "net") return;
      try {
        setLoading(true);
        await Printer.init();
        const results = await Printer.getDeviceList();
        setDevices(
          results.map((item: any) => ({ ...item, printerType: selectedValue }))
        );
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    };
    getListDevices();
  }, [selectedValue]);

  const handleConnectSelectedPrinter = () => {
    if (!selectedPrinter) return;
    const connect = async () => {
      try {
        setLoading(true);
        switch (selectedPrinter.printerType) {
          case "ble":
            await BLEPrinter.connectPrinter(
              selectedPrinter?.inner_mac_address || ""
            );
            break;
          case "net":
            await NetPrinter.connectPrinter(
              selectedPrinter?.host || "",
              selectedPrinter?.port || ""
            );
            break;
          case "usb":
            await USBPrinter.connectPrinter(
              selectedPrinter?.vendor_id || "",
              selectedPrinter?.product_id || ""
            );
            break;
          default:
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    };
    connect();
  };

  const handlePrint = async () => {

    // return Promise.all(Object.keys(CodePage).map((encoding) => {
    //   return printEncoding(encoding);
    // }))

    await printEncoding('WPC1252');

  }

  async function printEncoding(encoding: string): Promise<void> {
    const Printer = printerList[selectedValue];

    const encoder = new EscPosEncoder(encoding);

    return await Printer.printRawData(
      encoder.initialize()
        .image(256, 104, testImage)
        .align('center')
        .bold(true)
        .text('Texte gras centré')
        .bold(false)
        .italic(true)
        .text('Texte centré - Lorem Ipsum')
        .italic(false)
        .align('right')
        .underline(2)
        .text('Texte double underline')
        .underline(1)
        .text('Texte single underline')
        .align('left')
        .fontsize(1, 2)
        .text('Texte taille (1, 2)')
        .fontsize(2, 1)
        .text('Texte taille (2, 1)')
        .fontsize(2, 2)
        .text('Texte taille (2, 2)')
        .fontsize(4, 4)
        .text('Texte (4, 4)')
        .fontsize(6, 6)
        .text('(6, 6)')
        .fontsize(8, 8)
        .text('(8, 8)')
        .fontsize(1, 1)
        .text('Charactères spéciaux : ')
        .text('@#&é§è!çà$€£%ù')
        .newline()
        .newline()
        .text('CODEPAGE: ' + encoding)
        .cut('full')
        .encode()
    );
  };

  const onInit = async () => {
    const Printer = printerList[selectedValue];
    await Printer.init();
  }

  const onDisconnect = async () => {
    const Printer = printerList[selectedValue];
    await Printer.closeConn();
  }

  const handleChangePrinterType = async (type: keyof typeof printerList) => {
    setSelectedValue((prev) => {
      printerList[prev].closeConn();
      return type;
    });
    setSelectedPrinter({});
  };

  const handleChangeHostAndPort = (params: string) => (text: string) =>
    setSelectedPrinter((prev) => ({
      ...prev,
      device_name: "Net Printer",
      [params]: text,
      printerType: "net",
    }));

  const _renderNet = () => (
    <View style={{ paddingVertical: 16 }}>
      <View style={styles.rowDirection}>
        <Text>Host: </Text>
        <TextInput
          value={selectedPrinter.host}
          placeholder="192.168.100.19"
          onChangeText={handleChangeHostAndPort("host")}
        />
      </View>
      <View style={styles.rowDirection}>
        <Text>Port: </Text>
        <TextInput
          value={selectedPrinter.port}
          placeholder="9100"
          onChangeText={handleChangeHostAndPort("port")}
        />
      </View>
    </View>
  );

  const _renderOther = () => (
    // <Picker selectedValue={selectedPrinter} onValueChange={setSelectedPrinter}>
    //   {devices.map((item: any, index) => (
    //     <Picker.Item
    //       label={item.device_name}
    //       value={item}
    //       key={`printer-item-${index}`}
    //     />
    //   ))}
    // </Picker>
    <></>
  );

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text>Select printer type: </Text>
        <Image source={require('./olaii-logo-black-small.png')} />
        {/* <Picker
          selectedValue={selectedValue}
          onValueChange={handleChangePrinterType}
        >
          {Object.keys(printerList).map((item, index) => (
            <Picker.Item
              label={item.toUpperCase()}
              value={item}
              key={`printer-type-item-${index}`}
            />
          ))}
        </Picker> */}
      </View>
      <View style={styles.section}>
        <Text>Select printer: </Text>
        {selectedValue === "net" ? _renderNet() : _renderOther()}
      </View>

      <View style={styles.buttons}>
        <Button 
          title="Init"
          onPress={onInit}
        />
        <Button
          // disabled={!selectedPrinter?.device_name}
          title="Connect"
          onPress={handleConnectSelectedPrinter}
        />
        <Button
          // disabled={!selectedPrinter}
          title="Print sample"
          onPress={handlePrint}
        />
        <Button
          // disabled={!selectedPrinter}
          title="Disconnect"
          onPress={onDisconnect}
        />
      </View>
      {/* <Loader loading={loading} /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  section: {
    flex: 1,
  },
  rowDirection: {
    flexDirection: "row",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
  }
});
