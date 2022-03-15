const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld(
    'electronapi',
    {
        onFilePathRetrieved: function(func){
            ipcRenderer.on('FilePathRetrieved', (event, filePath) => func(filePath));
        },
    }
)