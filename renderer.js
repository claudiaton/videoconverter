window.electronapi.onFilePathRetrieved(filePath => {

    console.log(filePath)
    
    currentVideo = document.getElementById("videoFile");
    // console.log(currentVideo.src);
    currentVideo.pause();

    currentVideo.src = (filePath);
    // console.log(currentVideo.src);

    currentVideo.load();
    console.log("New video loaded.")
    // currentVideo.play();
})

