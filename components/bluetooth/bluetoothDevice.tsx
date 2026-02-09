import { Peripheral } from "react-native-ble-manager";

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
    rssiHistory:RssiReading[];
    constructor(id:string,name:string,rssiHistory:RssiReading[], userDefinedName?:string){
        this.id=id
        this.name=name
        this.rssiHistory = rssiHistory
        this.userDefinedName=userDefinedName;
        if(this.name == "WH-CH720N"){
            this.userDefinedName="Sony headphones"
        }
        else if (this.name=="JLab GO Pop+-App"){
            this.userDefinedName="JLab Wireless Earbuds"
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
        out+=" distance:"+this.getRecentDistance().toString()
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
    getRssiDistance(rssi:number,txPowerLevel:number){
        var MINPOWERLEVEL=-100
        var MAXPOWERLEVEL=100
        var DEFAULTPOWER=-50
        let n =2


        if (txPowerLevel == undefined || txPowerLevel < MINPOWERLEVEL || txPowerLevel > MAXPOWERLEVEL){
            txPowerLevel=DEFAULTPOWER

        }
        return Math.pow(10,(txPowerLevel-rssi)/(10*n))
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
    insert(index:number,namedDevice:boolean,device:BluetoothDevice){
        if(namedDevice){
        
            this.namedDevices.splice(index,0,device)
        }
        else{
            this.unNamedDevices.splice(index,0,device)
        }

    }

    addDevice(device:BluetoothDevice){
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
