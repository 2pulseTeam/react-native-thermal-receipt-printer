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
} from "react-native";
import {
  BLEPrinter,
  NetPrinter,
  USBPrinter,
  IUSBPrinter,
  IBLEPrinter,
  INetPrinter,
} from "react-native-thermal-receipt-printer";
import Loader from "./Loader";

import img from './olaii';
const img2 = require('./olaii-logo-black-small.png');

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
      host: '192.168.1.14',
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
    const Printer = printerList[selectedValue];
    await Printer.printText("<C>C text</C>\n\n<D>D text</D>\n\n<B>B text<B>\n\n\n\n");
  };

  const onInit = async () => {
    const Printer = printerList[selectedValue];
    await Printer.init();
  }

  const onDisconnect = async () => {
    const Printer = printerList[selectedValue];
    await Printer.closeConn();
  }

  const onPrintImage = async () => {
    const Printer = printerList[selectedValue];
    await Printer.printImage(img);
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
  console.log('IMG', {img: img});

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
          title="Print image"
          onPress={onPrintImage}
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
