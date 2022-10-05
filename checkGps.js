const fs=require('fs')
const  SerialPort = require('serialport')
const  ReadlineParser  = require('@serialport/parser-readline')
const GPS = require('gps');
// const fs = require("fs")
const GPS_PORT='/dev/ttyACM0'
const GPS_FILE='gpsInfo.txt'
const MAIN_PATH='/mnt/usb'
const MAX_COUNT=250
let ser = new SerialPort(GPS_PORT,{baudRate:9600});
let port=ser.pipe(new ReadlineParser({delimiter:'\r\n'}))
const gps = new GPS;
let count=0
try{
    gps.on('data', data => {
        count++
        if(count<5){
            return
        }
        count=0
        try{
            let gpsInfo={
                time:new Date(gps.state.time).toLocaleString('vi-VN').replace(',',''),
                lat:Math.round(gps.state.lat*10000000)/10000000,
                lon:Math.round(gps.state.lon*10000000)/10000000,
                speed:Math.round((gps.state.speed*0.514*3.6*0.8)*10)/10
            }
            // console.log('gps info:', gpsInfo);
            let time = gpsInfo.time.toLocaleString()
            let data = `${time} ${gpsInfo.lat} ${gpsInfo.lon} ${gpsInfo.speed}km/h\n`
            console.log('gps data:',data)

            
            
            
            // fs.appendFileSync(GPS_FILE,data)
        }
        catch(err){
            console.log('error update gps file:'+new Date().toLocaleString(),err)
        }
        
    })
    
    port.on('data', data => {
        // 
        if(data && data.includes("$GPRMC")){
            console.log('update raw from gps')
            gps.update(data);
            
            
        }
        ser.flush()
        
    })
    ser.on('close',()=>{
        console.log(new Date().toLocaleString()+ ' gps port close!')
        // serial_connect=false
        setInterval(()=>{
            console.log('serial open:',ser.isOpen)
            
            if(!ser.isOpen){
                console.log(new Date().toLocaleString()+ ' reconnect gps port !')
                let ser = new SerialPort(GPS_PORT,{baudRate:9600});
                port=ser.pipe(new ReadlineParser({delimiter:'\r\n'}))
                port.on('data', data => {
                    // 
                    try{
                        if(data && data.includes("$GPRMC")){
                            console.log('update raw from gps:'+data)
                            gps.update(data);
                            
                            
                        }
                        ser.flush()
                    }
                    catch(err){
                        console.log(new Date().toLocaleString()+':update gps data error:',err)
                    }
                    
                    
                })
                // ser.on('open',()=>{
                //     console.log('open serial success!')
                //     serial_connect=true
                // })
                // ser.on('close',()=>{
                //     serial_connect=false
                // })
            }
        },6000)
    })

}
catch(er){
 
    console.log('gps service error:',)
}