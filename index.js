const NodeWebcam = require( "node-webcam" );
const fs = require('fs');
const childProcess = require("child_process");
const path=require('path')
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


//Creates webcam instance
let listCam=[]


const startRecording = (url,pathCam,index) => {
    const args = [
        "-f",
        "v4l2",
        "-video_size",
        "640x480",
        "-i",
        url,
        
        "-preset",
        "fast",
        
        "-r",
        "6",
        "-crf",
        "24",
        "-f",
        "segment",
        "-segment_time",
        "200",
        "-segment_format_options",
        "movflags=frag_keyframe+empty_moov+default_base_moof",
        "-segment_list_type",
        "csv",
        "-segment_list",
        `list${index}.csv`,
        "-strftime",
        "1",
        `${path.join(pathCam, "video-%Y-%m-%dT%H-%M.mp4")}`,
        "-loglevel",
        "error"
    ];

    console.log("args", args);

    const ffmpegProcess = childProcess.spawn("ffmpeg", args, {
        detached: false,
        stdio: "pipe"
    });

    ffmpegProcess.on("exit", (code, signal) => {
        console.log("ffmpeg exited", code, signal);
    });

    ffmpegProcess.on("close", (code, signal) => {
        console.log("ffmpeg closed", code, signal);
    });

    ffmpegProcess.on("message", message => {
        console.log("ffmpeg message", message);
    });

    ffmpegProcess.on("error", error => {
        console.log("ffmpeg error process", error);
    });
    ffmpegProcess.stderr.on('data',(dt)=>{
        let err = Buffer.from(dt).toString()
        console.log('ffmpeg error stderr:',err)
        if(err.indexOf('No such device')!==-1){
            Webcam.list( function( list ){
                console.log('new list camera:',list)
                listCam=[...list]

            })
        }
    })
};
const Webcam = NodeWebcam.create( opts );
Webcam.list( function( list ) {

    //Use another device
    try{
        console.log('list camera:',list)
        listCam=[...list]
        let tmp = list.length%2===0?1:0
        for(let i=0;i<list.length;i++){
            if(i%2==tmp){
                continue
            }
            let index= Math.floor(i/2)
            console.log('begin cam '+index)
            let pathCam= path.join('/media/sonmaster/4065-2C59','cam'+index)
            if(!fs.existsSync(pathCam)){
                fs.mkdirSync(pathCam)
            }
            startRecording(list[i],pathCam,index)
        }
    }
    catch(err){
        console.log('error creat camera thread:',err)
    }
    

});

setInterval(()=>{
    Webcam.list( function( list ){
        let newList=[]
        for(let cam of list){
            let index = listCam.findIndex(el=>el===cam)
            if(index===-1){
                newList.push(cam)
            }
        }
        try{
            console.log('new camera added:',newList)
            listCam=[...list]
            let tmp = newList.length%2===0?1:0
            for(let i=0;i<newList.length;i++){
                if(i%2==tmp){
                    continue
                }
                let index= Math.floor(i/2)+Math.floor((listCam.length-newList.length)/2)
                console.log('begin cam insert '+index)
                let pathCam= path.join('/media/sonmaster/4065-2C59','cam'+index)
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
},5000)
// startRecording('/dev/video2','cam1')
