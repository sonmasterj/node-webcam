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
        stdio: "inherit"
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
        console.log("ffmpeg error", error);
    });
};
const Webcam = NodeWebcam.create( opts );
Webcam.list( function( list ) {

    //Use another device
    try{
        console.log('list camera:',list)

        for(let i=0;i<list.length;i++){
            if(i%2==0){
                continue
            }
            let index= Math.floor(i/2)
            console.log('begin cam '+index)
            let pathCam= path.join(__dirname,'cam'+index)
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
// startRecording('/dev/video2','cam1')
