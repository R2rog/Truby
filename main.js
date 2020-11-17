const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');
const { ipcRenderer } = require('electron');

const {app, BrowserWindow, Menu, webFrame, ipcMain} = electron;

let mainWindow;
let addWindow;
let contentToSave = 0;
let currentFile = '';

//Listen for the app to be ready
app.on('ready', function(){
    mainWindow = new BrowserWindow({
        webPreferences:{
            nodeIntegration: true
        },
        icon:path.join(__dirname, 'static/images/feather.png')
    });
    mainWindow.setTitle('Truby');
    //Load main HTML page
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'static/views/mainWindow.html'),
        protocol: 'file',
        slashes: true
    }));
    //Saving before quiting the app if there are unsaved changes
    mainWindow.on('close', (e)=>{
        if (contentToSave.content==1) {
            saveDoc();
            e.preventDefault();
        } else {
            app.quit();   
        }
    });

    //Quiting the app after the window was closed.
    mainWindow.on('closed',(e)=>{
        app.quit();
    })

    //Build menu from the template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    //Insert menu
    Menu.setApplicationMenu(mainMenu);
});

module.exports = function(window){
    return Menu.buildFromTemplate
}

//Handle create add window
function createAddWindow(){
    addWindow = new BrowserWindow({
        width: 300,
        height: 200,
        title: 'Add Shopping List Item',
        webPreferences:{
            nodeIntegration: true
        }
    });
    //Load main HTML page
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'static/views/addWindow.html'),
        protocol: 'file',
        slashes: true,
    }));
    //Garbage collection
    addWindow.on('close',function(){
        addWindow = null;
    });

}

function saveDoc(){
    mainWindow.webContents.send('request-elements','saving file ...');
    ipcMain.on('send-elements',(e,content)=>{
        if (contentToSave.content ==1) {
            elements = content.elements;
            fileDir = content.fileDir;
            numberOfElements = content.numberOfElements;
            let screenplay = require(fileDir);
            screenplay.dialogs = elements;
            screenplay.counter = numberOfElements;
            console.log(screenplay);
            screenplay = JSON.stringify(screenplay);
            fs.writeFile(fileDir,screenplay, (err)=>{
                if(err) throw err;
                else mainWindow.webContents.send('Saved','File saved');
                contentToSave.content = 0;
            });
        }else {
            mainWindow.webContents.send('Saved','No changes detected');
        };

    });
}

//Create a new document template
function createDocument(){
    let createDocument = new BrowserWindow({
        width: 300,
        height: 200,
        title: 'New Script',
        webPreferences:{
            nodeIntegration: true
        }
    });
    createDocument.setTitle('New Document');
        //Load main HTML page
        createDocument.loadURL(url.format({
            pathname: path.join(__dirname, 'static/views/addWindow.html'),
            protocol: 'file',
            slashes: true,
        }));
        //Garbage collection
        createDocument.on('close',function(){
            addWindow = null;
        });
}

//Adding a new file from the main window
ipcMain.on('addDoc',(e,args)=>{
    createAddWindow();
})

//Adding a new file from the addWindow
ipcMain.on('newDoc', (e,title)=>{
    filepath = './data/' + title;
    fs.writeFile(filepath,'{"script": "Hello World","dialogs":[],"characters":[],"locations":[],"counter":0}',(err) => { 
        if (err){
            e.sender.send('newDoc',err);
        }
        else {
            e.sender.send('newDoc',"File written successfully");
            mainWindow.webContents.send('show-new-item');
        } 
      }); 
});

//Saving changes to the document
ipcMain.on('unsaved-changes', (e,content)=>{
    contentToSave = content;
});

//Menu template
const mainMenuTemplate = [
    {
        label:'File',
        submenu:[
            {
                label: 'Add Item',
                click(){
                    createAddWindow();
                }
            },
            {
                label: 'Clear Items'
            },
            {
                label:'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q': 'Ctrl+Q',
                click(){
                    if (contentToSave.content == 1){
                        mainWindow.webContents.send('quit','Unsaved changes. Are you sure you want to leave?');
                    } else {
                        app.quit();
                    }
                }
            },
            {
                label: 'New Doc',
                accelerator:process.platform == 'darwin' ? 'Command+N': 'Ctrl+N',
                click(){
                    createDocument();
                }
            },
            {
                label : 'Save Doc',
                accelerator: process.platform == 'darwin' ? 'Command+S': 'Ctrl+S',
                click(){
                    saveDoc();
                }
            }
        ]
    },
    {
        label:'Actions',
        submenu:[
            {
                label:'Character',
                accelerator: process.platform == 'darwin' ? 'Command+S': 'Alt+S',
                click(){
                    mainWindow.webContents.send('character','Add Character');
                }
            },
            {
                label:'Dialog',
                accelerator: process.platform == 'darwin' ? 'Command+D': 'Alt+D',
                click(){
                    mainWindow.webContents.send('dialog','Add Dialog');
                }
            },
            {
                label:'Transition',
                accelerator: process.platform == 'darwin' ? 'Command+T': 'Alt+T',
                click(){
                    mainWindow.webContents.send('transition','Add transition');
                }
            },
            {
                label: 'Text',
                accelerator: process.platform == 'darwin' ? 'Command+A': 'Alt+A',
                click(){
                    mainWindow.webContents.send('text','Add text');
                }
            },
            {
                label: 'Location',
                accelerator: process.platform == 'darwin' ? 'Command+W': 'Alt+W',
                click(){
                    mainWindow.webContents.send('location','Add location');
                }
            },
            {
                label:'Shift Action',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Alt+Q',
                click(){
                    mainWindow.webContents.send('changeAction','Change Action');
                }
            },
        ]
    }
];

//Developer tools (not in production)
if(process.env.NODE_ENV != 'production'){
    mainMenuTemplate.push({
        label: 'DevTools',
        submenu:[
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+I': 'Ctrl+I',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    })
}

//If running in mac add emtpy object to menu
if(process.platform == 'darwin'){
   mainMenuTemplate.unshift({}); 
}
