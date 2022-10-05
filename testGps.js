const fs=require('fs')
const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
const GPS = require('gps');
// const fs = require("fs");

const path = require("path");
const vtt = require('vtt-creator');
const chokidar = require('chokidar');
const readLastLines = require('read-last-lines');
const watcher_0=chokidar.watch('list0.csv',{persistent:true})
const watcher_1=chokidar.watch('list1.csv',{persistent:true})
const watcher_2=chokidar.watch('list2.csv',{persistent:true})
const watcher_3=chokidar.watch('list3.csv',{persistent:true})
const GPS_PORT='/dev/ttyACM0'
const GPS_FILE='gpsInfo.txt'
const MAIN_PATH='/mnt/usb'
const MAX_COUNT=250
const ser = new SerialPort({path:GPS_PORT,baudRate:9600});
let port=ser.pipe(new ReadlineParser({delimiter:'\r\n'}))
const gps = new GPS;
let cntArr=[0,0,0,0]
let subEnable=[false,false,false,false]
let count=0
let v0= new vtt()
let v1= new vtt()
let v2= new vtt()
let v3= new vtt()
try{
    gps.on('data', data => {
        count++
        if(count<5){
            return
        }
        count=0
        try{
            let gpsInfo={
                time:new Date(gps.state.time).toLocaleString('vi-VN'),
                lat:Math.round(gps.state.lat*10000000)/10000000,
                lon:Math.round(gps.state.lon*10000000)/10000000,
                speed:Math.round((gps.state.speed*0.514*3.6*0.8)*10)/10
            }
            // console.log('gps info:', gpsInfo);
            let time = gpsInfo.time.toLocaleString()
            let data = `${time};${gpsInfo.lat};${gpsInfo.lon};${gpsInfo.speed}\n`
            if(subEnable[0]){
                v0.add(cntArr[0],cntArr[0]+5,data)
                cntArr[0]=cntArr[0]+5
                if(cntArr[0]>MAX_COUNT){
                    cntArr[0]=0
                    v0=new vtt()
                    subEnable[0]=false
                    console.log('cam 0 disconnect!')
                }
            }
            if(subEnable[1]){

                v1.add(cntArr[1],cntArr[1]+5,data)
                cntArr[1]=cntArr[1]+5
                if(cntArr[1]>MAX_COUNT){
                    cntArr[1]=0
                    v1=new vtt()
                    subEnable[1]=false
                    console.log('cam 1 disconnect!')
                }
            }
            if(subEnable[2]){
                v2.add(cntArr[2],cntArr[2]+5,data)
                cntArr[2]=cntArr[2]+5
                if(cntArr[2]>MAX_COUNT){
                    cntArr[2]=0
                    v2=new vtt()
                    subEnable[2]=false
                    console.log('cam 2 disconnect!')
                }
            }
            if(subEnable[3]){
                v3.add(cntArr[3],cntArr[3]+5,data)
                cntArr[3]=cntArr[3]+5
                if(cntArr[3]>MAX_COUNT){
                    cntArr[3]=0
                    v3=new vtt()
                    subEnable[3]=false
                    console.log('cam 3 disconnect!')
                }
            }

            
            
            
            // fs.appendFileSync(GPS_FILE,data)
        }
        catch(err){
            console.log('error update gps file:',err)
        }
        
    })
    
    port.on('data', data => {
        // 
        if(data && data.includes("$GPRMC")){
            gps.update(data);
            // console.log('data raw from gps:',data)
        }
        
    })


    //check file
    watcher_0.on('change',(path)=>{
        console.log('path change:',path)
        readLastLines.read('list0.csv',1)
        .then((line)=>{
            console.log("new line 0 "+line)
            if(line.length<3)
            {
                console.log("start sub 0")
                v0 = new vtt()
                cntArr[0]=0
                subEnable[0]=true
            }
            else if(line.length>20)
            {
                let lengthSub = v0.toString().length;
                console.log("length sub 0: ",lengthSub)
                if(lengthSub>100)
                {
                    let fileName=line.split(",")[0]
                    let sub=fileName.split(".")[0]+".vtt";
                    let dir= MAIN_PATH+"/cam0/"+sub    
                    fs.writeFileSync(dir,v0.toString())
                    v0=new vtt();
                    cntArr[0]=0;
                    console.log("done sub 0")
                }

            }
        })
        .catch(err=>{
            console.log('error path change 0:',err)
        })
    })
    watcher_1.on('change',(path)=>{
        console.log('path change:',path)
        readLastLines.read('list1.csv',1)
        .then((line)=>{
            console.log("new line 1 "+line)
            if(line.length<3)
            {
                console.log("start sub 1")
                v1 = new vtt()
                cntArr[1]=0
                subEnable[1]=true
            }
            else if(line.length>20)
            {
                let lengthSub = v1.toString().length;
                console.log("length sub 1: ",lengthSub)
                if(lengthSub>100)
                {
                    let fileName=line.split(",")[0]
                    let sub=fileName.split(".")[0]+".vtt";
                    let dir= MAIN_PATH+"/cam1/"+sub    
                    fs.writeFileSync(dir,v1.toString())
                    v1=new vtt();
                    cntArr[1]=0;
                    console.log("done sub 1")
                }

            }
        })
        .catch(err=>{
            console.log('error path change 1:',err)
        })
    })
    watcher_2.on('change',(path)=>{
        console.log('path change:',path)
        readLastLines.read('list2.csv',1)
        .then((line)=>{
            console.log("new line 2 "+line)
            if(line.length<3)
            {
                console.log("start sub 2")
                v2 = new vtt()
                cntArr[2]=0
                subEnable[2]=true
            }
            else if(line.length>20)
            {
                let lengthSub = v2.toString().length;
                console.log("length sub 2: ",lengthSub)
                if(lengthSub>100)
                {
                    let fileName=line.split(",")[0]
                    let sub=fileName.split(".")[0]+".vtt";
                    let dir= MAIN_PATH+"/cam2/"+sub    
                    fs.writeFileSync(dir,v2.toString())
                    v2=new vtt();
                    cntArr[2]=0;
                    console.log("done sub")
                }

            }
        })
        .catch(err=>{
            console.log('error path change 2:',err)
        })
    })
    watcher_3.on('change',(path)=>{
        console.log('path change:',path)
        readLastLines.read('list3.csv',1)
        .then((line)=>{
            console.log("new line 3 "+line)
            if(line.length<3)
            {
                console.log("start sub 3")
                v3 = new vtt()
                cntArr[3]=0
                subEnable[3]=true
            }
            else if(line.length>20)
            {
                let lengthSub = v3.toString().length;
                console.log("length sub 3: ",lengthSub)
                if(lengthSub>100)
                {
                    let fileName=line.split(",")[0]
                    let sub=fileName.split(".")[0]+".vtt";
                    let dir= MAIN_PATH+"/cam3/"+sub    
                    fs.writeFileSync(dir,v3.toString())
                    v3=new vtt();
                    cntArr[3]=0;
                    console.log("done sub")
                }

            }
        })
        .catch(err=>{
            console.log('error path change 0:',err)
        })
    })

}
catch(er){
    console.log('gps service error:',)
}