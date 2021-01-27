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

  React.useEffect(() => {
    if (Platform.OS === 'windows') {
      console.log('WINDOWS ! ');
      NativeModules.FancyMath.add(
        /* arg a */ NativeModules.FancyMath.Pi,
        /* arg b */ NativeModules.FancyMath.E,
        /* callback */ function (result: any) {
          Alert.alert(
            'FancyMath',
            `FancyMath says ${NativeModules.FancyMath.Pi} + ${NativeModules.FancyMath.E} = ${result}`,
            [{ text: 'OK' }],
            {cancelable: false});
        });
    }
  }, []);

  const [selectedValue, setSelectedValue] = React.useState<
    keyof typeof printerList
  >("net");
  const [devices, setDevices] = React.useState([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [selectedPrinter, setSelectedPrinter] = React.useState<SelectedPrinter>(
    {}
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

    if (Platform.OS === 'windows') {
      try {
        console.log('BEFORE - NativeModules.RNNetPrinter.connect');
        NativeModules.RNNetPrinter.connect('192.168.1.14', 9100, (...res: any[]) => {
          console.log('RES', res);
        });
        console.log('AFTER - NativeModules.RNNetPrinter.connect');
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const Printer = printerList[selectedValue];
        await Printer.printText("<C>sample text</C>\n");
      } catch (err) {
        console.warn(err);
      }
    }

    
  };

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
          placeholder="192.168.100.19"
          onChangeText={handleChangeHostAndPort("host")}
        />
      </View>
      <View style={styles.rowDirection}>
        <Text>Port: </Text>
        <TextInput
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
      <Button
        // disabled={!selectedPrinter?.device_name}
        title="Connect"
        onPress={handleConnectSelectedPrinter}
      />
      <Button
        // disabled={!selectedPrinter?.device_name}
        title="Print sample"
        onPress={handlePrint}
      />
      <Loader loading={loading} />
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
});