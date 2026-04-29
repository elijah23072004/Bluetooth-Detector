import {File, Directory, Paths} from 'expo-file-system';
const CONFIG_PATH_NAME = "settings.json"
export class ConfigData {
    scan_frequency: number = 15;
    maximum_scan_distance:number = 15;
    scan_duration:number = 30;
    threshold_for_suspicius_device = 2;
}

export function readConfigFromFile(path?:string){
    if(path == undefined){
        path=CONFIG_PATH_NAME
    }

    let config_info: ConfigData = new ConfigData()
    const file = new File(Paths.cache, path);
    if (!file.exists){
        file.create()
        file.write(JSON.stringify(config_info))
        return config_info
    }
    config_info = JSON.parse(file.textSync())
    return config_info
}


export function saveConfigData(config:ConfigData, path?:string){
    if(path == undefined){
        path=CONFIG_PATH_NAME
    }


    const file = new File(Paths.cache, path)
    if(!file.exists){
        file.create()
    }
    file.write(JSON.stringify(config))
    return 
    
}
