import { Peripheral } from "react-native-ble-manager";

function median(arr:number[]){
    var sorted = arr.sort(function (a, b) {
        return a - b;
    });

    var length = sorted.length;

    if (length % 2 === 1) {
        return sorted[(length / 2) - 0.5];
    } else {
        return (sorted[length / 2] + sorted[(length / 2) - 1]) / 2;
    }
}

var DEFAULT_BLUETOOTH_STRENGTH = 0;
export class RssiReading{
    rssi:number;
    timestamp:number;
    tx_power:number;
    constructor(rssi:number,timestamp:number,tx_power?:number){
        this.rssi=rssi;
        this.timestamp=timestamp;
        if(tx_power == undefined){
            this.tx_power=DEFAULT_BLUETOOTH_STRENGTH
        }
        else{
            this.tx_power=tx_power;
        }
    }
    static peripheralToRssiReading(peripheral:Peripheral){
        let rssi = peripheral.rssi
        let tx_power = peripheral.advertising.txPowerLevel
        let date = new Date()
        let timestamp = date.getTime() 
        return new RssiReading(rssi,timestamp,tx_power) 
    }
}


export class BluetoothDevice {
    id: string;
    name?: string;
    userDefinedName?:string;
    manufacturerKey?:string;
    rssiHistory:RssiReading[];
    
    constructor(id:string,name:string,rssiHistory:RssiReading[], manufacturerKey?:string , userDefinedName?:string){
        this.id=id
        this.name=name
        this.rssiHistory = rssiHistory
        this.userDefinedName=userDefinedName;
        this.manufacturerKey=manufacturerKey
        if(this.name == "WH-CH720N"){
            this.userDefinedName="Sony headphones"
        }
        else if (this.name=="JLab GO Pop+-App"){
            this.userDefinedName="JLab Wireless Earbuds"
        }
        else if(this.id == "D8:0D:5B:39:59:E0"){
            this.userDefinedName = "Air Tag"
        }
    }
    toString(){
        let out = ""
        if(this.userDefinedName != undefined){
            out+=this.userDefinedName+":" 
        }
        else if(this.name == ""){
            out+="NO NAME"
        }
        else{
            out+=this.name
        }
        out+= " rssi:"+this.getMostRecentRssiReading().rssi.toString() 
        out+= ", txPower:"+this.getMostRecentRssiReading().tx_power.toString()+ " number of rssi readings:"+this.rssiHistory.length.toString();
        //out+=" distance:"+this.getRecentDistance().toString()
        out+= " average distance:"+ this.get_average_distance().toString()
        //console.log(out);
        return out
    }
    setName(name:string){
        this.userDefinedName=name
    }
    addRssiReading(reading:RssiReading){
        this.rssiHistory.push(reading)
    }
    saveDeviceInfo(path:string){
        //save logic
        return 
    }
    getRssiHistoryGraphData(){
        //return list of rssi values frmo rssiHistory
        //but return averages
        return this.rssiHistory 
    }
    getMostRecentRssiReading(){
        return this.rssiHistory[this.rssiHistory.length-1]
    }
    getRssiDistance(rssi:number,txPowerLevel?:number){
        //var DEFAULTPOWER=-50
        //var MINPOWERLEVEL=-100
        //var MAXPOWERLEVEL=30
        //let n =2
        //if (txPowerLevel == undefined || txPowerLevel < MINPOWERLEVEL || txPowerLevel > MAXPOWERLEVEL){
        //    txPowerLevel=DEFAULTPOWER
        //}
        //return Math.pow(10, -1 * ( ( rssi+ 66.67) / 15.58) )
        // 0.00005258 == 10^(-(66.67/15.58)
        // 0.8627 == 10^(-1/15.58)
        // therefore the output is a derivation of 10^(-(rssi+66.67)/15.58)
        // allowing for less computation each iteration since only doing one power then a multiplication
//

        return 0.00005258 * Math.pow(0.8627,rssi)

        //return Math.pow(10,(txPowerLevel-rssi)/(10*n))
    }

    getRecentDistance(decimalPoints:number=2):number{
        var SAMPLESIZE=25
        let noSamples =0
        let rssiSum=0
        for(let i=0; i<this.rssiHistory.length && i<SAMPLESIZE;i++){

            rssiSum+=this.rssiHistory[this.rssiHistory.length-(i+1)].rssi
            noSamples++
        }
        let rssiAvg = rssiSum/noSamples
        return Number(this.getRssiDistance(rssiAvg,this.getMostRecentRssiReading().tx_power).toFixed(decimalPoints))
        
    }

    comp(device:BluetoothDevice){
        //let deviceRssi = device.getMostRecentRssiReading().rssi
        //let thisRssi = this.getMostRecentRssiReading().rssi
        let deviceDist= device.getRecentDistance()
        let thisDist = this.getRecentDistance()
        return thisDist-deviceDist
    }


    getRssiHistoryString(){
        let out =""
        for(let val of this.rssiHistory){
            out+="timeStamp:"+ val.timestamp.toString() + ",rssi:"+val.rssi.toString()+", txPower:"+val.tx_power.toString()+"\n"
        }
        return out
    }
    get_average_rssi(){
        let vals = []
        for(let val of this.rssiHistory){
            vals.push(val.rssi)
        }
        return median(vals)
    }
    get_average_distance(){
        return this.getRssiDistance(this.get_average_rssi(), this.get_TX_POWER())
    }

    get_TX_POWER(){
        for(let val of this.rssiHistory){
            if(val.tx_power != undefined){
                return val.tx_power
            }
        }
        return undefined
    }
}


export class BluetoothDeviceContainer{
    namedDevices:BluetoothDevice[];
    unNamedDevices:BluetoothDevice[];
    constructor(namedDevices:BluetoothDevice[],unNamedDevices?:BluetoothDevice[]){
        if(unNamedDevices != undefined){
            this.namedDevices=namedDevices
            this.unNamedDevices=unNamedDevices
        }
        else{
            this.namedDevices = []
            this.unNamedDevices=[]
            namedDevices.forEach((device) => this.addDevice(device))    
        }
    }
    length(){
        return this.namedDevices.length + this.unNamedDevices.length
    }
    insert(index:number,namedDevice:boolean,device:BluetoothDevice){
        if(namedDevice){
        
            this.namedDevices.splice(index,0,device)
        }
        else{
            this.unNamedDevices.splice(index,0,device)
        }

    }

    addDevice(device:BluetoothDevice){
        //will overwrite device if it already exists in database
        if(this.getDevice(device.id)){
            console.error("adding device in bluetoothdevice.tsx deviceContainer with id:"+device.id+" already in container so will replace current value")
        }
        let devices = this.unNamedDevices
        let namedDevice = device.userDefinedName != undefined
        if(namedDevice){
            devices=this.namedDevices
        }
        for(let i=0;i<devices.length;i++){
            if(devices[i].id == device.id){
                devices[i]=device
                return
            }
            else if(device.id > devices[i].id){
                this.insert(i,namedDevice,device)
                return
            }
        }
        if(namedDevice){
            this.namedDevices.push(device)
        }
        else{
            this.unNamedDevices.push(device)
        }
    }
    getDevice(id:string){
        for(let i=0;i<this.namedDevices.length;i++){
            if(this.namedDevices[i].id == id){
                return this.namedDevices[i]
            }
        }
        for(let i=0;i<this.unNamedDevices.length;i++){
            if(this.unNamedDevices[i].id == id){
                return this.unNamedDevices[i]
            }
        }
        return undefined
    }
    setDevice(device:BluetoothDevice){
        this.addDevice(device)
        return this
    }
    copy(){
        let container =new BluetoothDeviceContainer([])
        container.namedDevices=this.namedDevices
        container.unNamedDevices=this.unNamedDevices
        return container
    }
    getRssiSortedNamedDevices(){
        let out = this.namedDevices
        out.sort( (a,b) => a.comp(b))
        return out
    }
    getRssiSortedUnNamedDevices(){
        let out:BluetoothDevice[] = []
        let unNamed:BluetoothDevice[] = []
        for(let i=0;i<this.unNamedDevices.length;i++){
            if(this.unNamedDevices[i].name != ""){
                out.push(this.unNamedDevices[i])
            }
            else{
                unNamed.push(this.unNamedDevices[i])
            }
        }
        out.sort( (a,b) => a.comp(b))
        unNamed.sort((a,b) => a.comp(b))
        out = out.concat(unNamed)
        return out
    }
}
