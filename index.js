const NodeWebcam = require( "node-webcam" );
const fs = require('fs');
const childProcess = require("child_process");
const path=require('path')
const chokidar = require('chokidar');
const readLastLines = require('read-last-lines');
const disk = require('diskusage')
const MAIN_PATH='/mnt/usb'
const DISK_CMD="lsblk --noheadings --raw --output rm,tran,type,path --sort path | awk '/^1 usb disk/ {d=$4} END {print d}'"
const {exec}=require('child_process')
const USE_PI=1

const system_video=['/dev/video10','/dev/video11','/dev/video12','/dev/video13','/dev/video14','/dev/video15','/dev/video16','/dev/video18']
exec("pm2 start testGps.js --name 'gps-service'", (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log('done start gps-service');
});
const opts = {

    //Picture related

    width: 1280,

    height: 720,

    quality: 100,

    // Number of frames to capture
    // More the frames, longer it takes to capture
    // Use higher framerate for quality. Ex: 60

    frames: 30,


    //Delay in seconds to take shot
    //if the platform supports miliseconds
    //use a float (0.1)
    //Currently only on windows

    delay: 0,


    //Save shots in memory

    saveShots: true,


    // [jpeg, png] support varies
    // Webcam.OutputTypes

    output: "jpeg",


    //Which camera to use
    //Use Webcam.list() for results
    //false for default device

    device: false,


    // [location, buffer, base64]
    // Webcam.CallbackReturnTypes

    callbackReturn: "location",


    //Logging

    verbose: false

};
const executeCmd=(cmd)=>{
    return new Promise((resolve,reject)=>{
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                // console.log(`error: ${error.message}`);
                return reject(error.message)
            }
            if (stderr) {
                // console.log(`stderr: ${stderr}`);
                return reject(stderr)
            }
            // console.log(`stdout: ${stdout}`);
            resolve(stdout.trim())
        });
    })
}
//Creates webcam instance
let listCam=[]
let pathDisk=''
let sysTime=false
let count=0
let MAX_COUNT=600
let MIN_PERCENT=15
const startRecording = (url,pathCam,index) => {
    const args = [
        "-f",
        "v4l2",
        "-video_size",
        "640x320",
        "-i",
        url,
        "-preset",
        "veryfast",
        "-threads",
        "1",
        
        "-r",
        "4",
        "-crf",
        "24",
        "-f",
        "segment",
        "-segment_time",
        "120",
        // "-segment_format_options",
        // "movflags=frag_keyframe+empty_moov+default_base_moof",
        "-reset_timestamps",
        "1",
        "-segment_list_type",
        "csv",
        "-segment_list",
        `list${index}.csv`,
        "-strftime",
        "1",
        `${path.join(pathCam, "video-%Y-%m-%dT%H-%M.avi")}`,
        "-loglevel",
        "error"
    ];

    console.log("args", args);

    const ffmpegProcess = childProcess.spawn("ffmpeg", args, {
        detached: false,
        stdio: "pipe"
    });

    ffmpegProcess.on("exit", (code, signal) => {
        console.log("ffmpeg exited "+url, code, signal);
    });

    ffmpegProcess.on("close", (code, signal) => {
        console.log("ffmpeg closed "+url, code, signal);
    });

    ffmpegProcess.on("message", message => {
        console.log("ffmpeg message", message);
    });

    ffmpegProcess.on("error", error => {
        console.log("ffmpeg error process", error);
    });
    ffmpegProcess.stderr.on('data',(dt)=>{
        let err = Buffer.from(dt).toString()
        console.log(new Date().toLocaleString()+' ffmpeg error stderr '+url+':',err)
        if(err.indexOf('No such device')!==-1 || err.indexOf('No space left on device')!==-1){
            Webcam.list( function( list ){
                if(USE_PI){
                    list = list.filter(el=>!system_video.includes(el))
                }
                console.log('new list camera:',list)
                listCam=[...list]

            })
        }
        else if(err.indexOf("Input/output error")!==-1){
            console.log(new Date().toLocaleString() +" not found usb storage")
            pathDisk=''
            listCam=[]
        }

    })
};
const Webcam = NodeWebcam.create( opts );
// Webcam.list( function( list ) {

//     //Use another device
//     try{
//         console.log('list camera:',list)
//         listCam=[...list]
//         let tmp = list.length%2===0?1:0
//         for(let i=0;i<list.length;i++){
//             if(i%2==tmp){
//                 continue
//             }
//             let index= Math.floor(i/2)
//             console.log('begin cam '+index)
//             let pathCam= path.join('/media/sonmaster/USB','cam'+index)
//             if(!fs.existsSync(pathCam)){
//                 fs.mkdirSync(pathCam)
//             }
//             startRecording(list[i],pathCam,index)
//         }
//     }
//     catch(err){
//         console.log('error creat camera thread:',err)
//     }
    

// });
const watcher_0=chokidar.watch('time.txt',{persistent:true})
watcher_0.on('change',(path)=>{
    // console.log('time change:',path)
    readLastLines.read('time.txt',1)
    .then(async(line)=>{
        console.log("new line time: "+line)
        if(line.length<5)
        {
            return
        }
        let cmd=`timedatectl set-time "${line}"`
        await executeCmd(cmd)
        console.log(new Date().toLocaleString()+':sync time successfully!')
        sysTime=true

        
    })
    .catch(err=>{
        console.log('error path time change:',err)
    })
})
setInterval(async()=>{
    let tmp=''
    try{
        if(!sysTime){
            console.log('waitting for syncing time from gps data!')
            return
        }
        let listDisk = await executeCmd(DISK_CMD)
        tmp=listDisk
        
        if(listDisk.length<3){
            console.log('no usb disk plug!')
            pathDisk=''
            return
        }
        if(pathDisk===''){
            console.log('list usb disk:',listDisk)
            console.log('begin mount usb disk!')
            let cmd = 'mount '+listDisk+'1 ' +MAIN_PATH
            console.log(cmd)
            await executeCmd(cmd)
            console.log('success mount usb disk ',listDisk)
            pathDisk=listDisk
        }
        if(pathDisk!==''){
            if(count===0 || count===MAX_COUNT){
                let info = await disk.check(MAIN_PATH)
                let freePercent = Math.round(info.free*100/info.total)
                console.log(new Date().toLocaleString()+' free space percent:',freePercent)
                //delete oldest file
                if(freePercent<=MIN_PERCENT){
                    for(let i=0;i<4;i++){
                        let pathCam= path.join(MAIN_PATH,'cam'+i)
                        if(!fs.existsSync(pathCam)){
                            continue
                        }
                        let lastFile = await executeCmd(`ls -t ${pathCam} | tail -1`)
                        if(lastFile===''){
                            continue
                        }
                        let fileRegex = lastFile.split('T')
                        let dayRegex= fileRegex[0]
                        let hourRegex = fileRegex[1].split('-')[0]
                        let deleteRegex = dayRegex+'T'+hourRegex
                        console.log('last day video of cam '+i,deleteRegex)
                        let cmd = 'rm -rf '+pathCam+'/'+deleteRegex.trim()+'*'
                        console.log(new Date().toLocaleString()+' begin delete file of cam '+i,cmd)
                        await executeCmd(cmd)
                        console.log(new Date().toLocaleString()+' successfully delete file of cam '+i)
                    }
                }

            }
            count=count+1
            if(count>MAX_COUNT){
                count=1
            }
        }
        

    }
    catch(err){
        console.log('check storage error:',err)
        if(err.toString().indexOf('already mounted on')!==-1){
            pathDisk=tmp
        }
        else{
            return
        }
        
    }

    
    Webcam.list( function( list ){
        if(USE_PI){
            list = list.filter(el=>!system_video.includes(el))
        }
        
        let newList=[]
        for(let cam of list){
            let index = listCam.findIndex(el=>el===cam)
            if(index===-1){
                newList.push(cam)
            }
        }
        try{
            if(newList.length===0){
                return
            }
            console.log(new Date().toLocaleString()+' new camera added:',newList)
            listCam=[...list]
            let tmp = newList.length%2===0?1:0
            for(let i=0;i<newList.length;i++){
                if(i%2==tmp){
                    continue
                }
                let index= Math.floor(i/2)+Math.floor((listCam.length-newList.length)/2)
                console.log(new Date().toLocaleString() +' begin cam insert '+index)
                let pathCam= path.join(MAIN_PATH,'cam'+index)
                if(!fs.existsSync(pathCam)){
                    fs.mkdirSync(pathCam)
                }
                startRecording(newList[i],pathCam,index)
            }
        }
        catch(err){
            console.log('error creat camera thread:',err)
        }

    })
},6000)
// startRecording('/dev/video2','cam1')
