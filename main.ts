//% color="#900c2c" weight=10 icon="\uf1eb"
//% groups='["Connection", "REST", "Others"]'
namespace mosmpsMaker {
  const CMD_SYNC = 1;
  const CMD_RESP_V = 2;
  const CMD_RESP_CB = 3;
  const CMD_WIFISTATUS = 4;
  const CMD_WIFIINFO = 8;
  const CMD_SETHOSTNAME = 9;
  const CMD_MQTT_SETUP = 10;
  const CMD_MQTT_PUB = 11;
  const CMD_MQTT_SUB = 12;
  const CMD_MQTT_SETHOST = 15;
  const CMD_REST_SETUP = 20;
  const CMD_REST_REQ = 21;
  const CMD_REST_RET = 23;
  const CMD_SOCK_SETUP = 40;
  const CMD_SOCK_SEND = 41;
  const CMD_SOCK_DATA = 42;
  const CMD_WIFI_SELECT = 52;

  export enum Callback {
    WIFI_STATUS_CHANGED = 1,
    MQTT_CONN = 2,
    MQTT_DISCON = 3,
    MQTT_PUB = 4,
    MQTT_DATA = 5,
    UDP_SETUP = 6,
    UDP_DATA = 7
  }

  const PortSerial = [
    [SerialPin.P8, SerialPin.P0],
    [SerialPin.P12, SerialPin.P1],
    [SerialPin.P13, SerialPin.P2],
    [SerialPin.P15, SerialPin.P14]
  ]

  export enum SerialPorts {
    PORT1 = 0,
    PORT2 = 1,
    PORT3 = 2,
    PORT4 = 3
  }

  export enum HeaderType {
    Header = 0,
    ContentType = 1,
    UserAgent = 2
  }

  type EvtStr = (data: string) => void;
  type EvtAct = () => void;

  let SERIAL_TX = SerialPin.P2
  let SERIAL_RX = SerialPin.P1

  let REST_SERVER = "web1.mosmps.edu.hk/mosmpsMaker"
  let REST_PORT = 80;
  let REST_SECURE = 0;
  let REST_METHOD = "GET"

  let wifiConn: EvtAct = null;
  let wifiDisconn: EvtAct = null;

  let restRxEvt: (data: string) => void = null;

  /***** Common Function *****/
  function init_WiFiBrick() {
    serial.redirect(
      SERIAL_TX,
      SERIAL_RX,
      BaudRate.BaudRate115200
    )
    basic.pause(500)
    serial.setRxBufferSize(64);
    serial.setTxBufferSize(64);
    serial.readString()
    serial.writeString('\n\n')
    // basic.pause(1000)
    serial.writeString("WF 1 0 1\n") // sync command to add wifi status callback
    showStartLoading(500)
    // basic.pause(1000)
    serial.writeString("WF 10 4 0 2 3 4 5\n") // mqtt callback install
  }

  export function showStartLoading(time: number) {
    led.plot(2, 2)
    basic.pause(time)
  }

  export function showLoadingStage(time: number) {
    let interval = 0
    led.plot(2, 1)
    basic.pause(time)
    led.plot(3, 1)
    basic.pause(time)
    led.plot(3, 2)
    basic.pause(time)
    led.plot(3, 3)
    basic.pause(time)
    led.plot(2, 3)
    basic.pause(time)
    led.plot(1, 3)
    basic.pause(time)
    led.plot(1, 2)
    basic.pause(time)
    led.plot(1, 1)
    basic.pause(time)
  }

  /***** Connection *****/

  /** Configuration Wi-Fi Pins (TX & RX) **/
  //% blockId=initializeWiFi
  //% block="Set Wi-Fi Pins | TX: %tx| RX: %rx"
  //% group="Connection"
  //% weight=104
  export function initializeWiFi(tx: SerialPin, rx: SerialPin) {
    SERIAL_TX = tx
    SERIAL_RX = rx
  }

  /** Setup and Connect Wi-Fi using WiFiBrick **/
  //% blockId=setupWifi
  //% block="Connect Wi-Fi SSID：%ssid Password：%pass"
  //% group="Connection"
  //% weight=102
  export function setupWifi(ssid: string, pass: string) {
    init_WiFiBrick()
    isInit = true
    let cmd: string = 'WF 52 2 52 ' + ssid + ' ' + pass + '\n'
    serial.writeString(cmd)
    showLoadingStage(1000)
  }

  /** When Wi-Fi is connected **/
  //% blockId=on_wifi_connected
  //% block="When Wi-Fi is connected"
  //% group="Connection"
  //% weight=102
  //% advanced=true
  export function on_wifi_connected(handler: () => void): void {
    wifiConn = handler;
  }

  /** When Wi-Fi is disconnected **/
  //% blockId=on_wifi_disconnected
  //% block="When Wi-Fi is disconnected"
  //% group="Connection"
  //% weight=101
  //% advanced=true
  export function on_wifi_disconnected(handler: () => void): void {
    wifiDisconn = handler;
  }

  /***** REST *****/

  /** Connect to MOSMPS Maker Server with REST **/
  //% blockId=connectMOSMPSMaker
  //% block="Connect to MOSMPS Maker"
  //% weight=70
  //% group="REST"
  export function connectMOSMPSMaker(): void {
    // todo: support https connection?
    // let secure = false;
    serial.writeString("WF 20 3 20 " + REST_SERVER + " " + REST_PORT + ` ${REST_SECURE}\n`)
    basic.pause(500)
  }

  /** MOSMPS Maker REST Request **/
  //% blockId=restRequest
  //% block="MOSMPS Maker REST Request %api"
  //% weight=68
  //% group="REST"
  export function rest_request(api: string): void {
    api = api.replace("http://web1.mosmps.edu.hk/mosmpsMaker", "")
    api = api.replace("https://web1.mosmps.edu.hk/mosmpsMaker", "")
    api = api.replace("//web1.mosmps.edu.hk/mosmpsMaker", "")
    serial.writeString("WF 21 2 0 " + REST_METHOD + " " + api + "\n")
    basic.pause(10000)
  }

  /** MOSMPS Maker REST Request **/
  //% blockId=restRequestReturn
  //% block="MOSMPS Maker REST Return"
  //% weight=66
  //% draggableParameters=reporter
  //% group="REST"
  export function rest_ret(handler: (RESTData: string) => void): void {
    restRxEvt = handler;
  }

  /***** Others *****/

  /** Get Network Time **/
  //% blockId=getNTP
  //% block="Get Network Time"
  //% weight=78
  //% group="Others"
  export function getNTP(type: NtpTimeType): void {
    serial.writeString("WF 7\n")
  }
}