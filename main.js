const { app, BrowserWindow, Menu, dialog } = require("electron");
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static-electron');
const ffprobeStatic = require('ffprobe-static-electron');
const ProgressBar = require('electron-progressbar');

ffmpeg.setFfmpegPath(ffmpegStatic.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

//determine if this is running on a Mac to later adjust the Menu
const isMac = process.platafform === "darwin";

let newWindow = '';
file = {}; //global variable allows send file information across diferent menu items

//running
app.on("ready", () => {
  console.log("The app is ready");

  //create a window in our application
  newWindow = new BrowserWindow({
    height: 605,
    width: 1000,
    resizable: false,
    webPreferences: {
      preload: `${__dirname}/preload.js`,
    },
  });

  newWindow.loadURL(`file://${__dirname}/index.html`);
});

const menuTemplate = [
  {
    label: "File",
    submenu: [
      {
        label: "Video",
        submenu: [
          {
            label: "Load...",
            click() {
              dialog
                .showOpenDialog(
                  {
                    filters: [
                      {
                        name: "Movies",
                        extensions: [
                          // "mov",
                          "mp4", "webm", "avi",      //avi format is not supported to play, but we kept to allow its conversion as it is a usual (and ineffective) format
                          // "mpg", "mpeg", "wmv", ".rm", "ram", "swf", "flv", "ogg",
                        ],
                      },
                    ],
                  },
                  { properties: ["openFile"] }
                )
                .then((result) => {        //after choosing a file to load, enable convert menu and send the file path to renderer
                  if (!result.cancelled) {
                    enableConvertMenus();
                    let filePath = result.filePaths[0];
                    ffmpeg.ffprobe(result.filePaths[0], (err, result) => {
                      file = result;
                    })
                    newWindow.webContents.send("FilePathRetrieved", filePath);
                  }
                }).catch(err => {
                  console.log(err)
                });
            },
          },
          { type: "separator" },
          {
            id: "convertAVI",
            label: "Convert to AVI...",
            enabled: false,
            click() {
              if (/.avi$/.test(file.format.filename)) { //alert and avoid from trying to convert to the current format
                dialog.showErrorBox('Error', 'Format already in use.')
              }
              else {
                convert("avi"); //function receives the format as parameter 
              }
            },
          },
          {
            id: "convertMP4",
            label: "Convert to MP4...",
            enabled: false,
            click() {
              if (/.mp4$/.test(file.format.filename)) {
                dialog.showErrorBox('Error', 'Format already in use.')
              }
              else {
                convert("mp4");
              }
            },
          }, {
            id: "convertWEBM",
            label: "Convert to WEBM...",
            enabled: false,
            click() {
              if (/.webm$/.test(file.format.filename)) {
                dialog.showErrorBox('Error', 'Format already in use.')
              }
              else {
                convert("webm");
              }
            },
          }
        ],
      },
      { type: "separator" },
      {
        label: "Quit",
        accelerator: isMac ? "Cmd+Q" : "Ctrl+Q", //Could use 'CmdOrCtrl+Q'
        click() {
          app.quit();
        },
      },
    ],
  },
  {
    label: "Developer",
    submenu: [{ role: "toggleDevTools" }],
  },
];

if (isMac) {
  menuTemplate.unshift({ label: "empty" });
}
const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);



function enableConvertMenus() {
  Menu.getApplicationMenu().getMenuItemById('convertAVI').enabled = true;
  Menu.getApplicationMenu().getMenuItemById('convertMP4').enabled = true;
  Menu.getApplicationMenu().getMenuItemById('convertWEBM').enabled = true;
}

function convert(format) {      //Convert function includes asking the place/name to save new file, conversion and progress bar
  dialog.showSaveDialog(
    { defaultPath: ("Output." + format) }
  ).
    then(result => {
      if (!result.cancelled) {

        var progressBar = new ProgressBar({
          indeterminate: false,
          text: 'Preparing data...',
          detail: 'Wait...'
        });

        progressBar // this block sets the bar structure
          .on('completed', function () {
            console.info(`completed...`);
            progressBar.detail = 'Task completed. Exiting...';
          })
          .on('aborted', function (value) {
            console.info(`aborted... ${value}`);
          })
          .on('progress', function (value) {
            progressBar.detail = `Value ${value} out of ${progressBar.getOptions().maxValue}...`;
          });

        ffmpeg(file.format.filename) //the conversion code properly
          .withOutputFormat(format)
          .on("progress", function (progress) {
            console.log(progress)
            progressBar.value = parseInt(progress.percent); //sendind progress to the bar
          })
          .on("error", function (err) {
            console.log("an error happened: " + err.message);
          })
          .saveToFile(result.filePath);
        console.log("Video converted.")
      }
    })
}