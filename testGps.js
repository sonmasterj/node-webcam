const fs=require('fs')
const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
const GPS = require('gps');

const GPS_PORT='/dev/ttyACM0'
const GPS_FILE='gpsInfo.txt'
const ser = new SerialPort({path:GPS_PORT,baudRate:9600});
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
                time:new Date(gps.state.time).toLocaleString('vi-VN'),
                lat:Math.round(gps.state.lat*10000000)/10000000,
                lon:Math.round(gps.state.lon*10000000)/10000000,
                speed:Math.round((gps.state.speed*0.514*3.6*0.8)*10)/10
            }
            console.log('gps info:', gpsInfo);
            let time = gpsInfo.time.toLocaleString()
            let data = `${time};${gpsInfo.lat};${gpsInfo.lon},${gpsInfo.speed}\n`
            fs.appendFileSync(GPS_FILE,data)
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
}
catch(er){
    console.log('gps service error:',)
}
