const electron = require('electron');
const Store = require('electron-store');
const Sudoer = require('electron-sudo');
const url = require('url');
const path = require('path');
const fs = require('fs');
const { ipcRenderer } = require('electron');
const { app, BrowserWindow, Menu, webFrame, ipcMain } = electron;
process.env.NODE_ENV = undefined;

//TODO:  Try both the sudo and store options

let mainWindow;
let addWindow;
let contentToSave = 0;
let currentFile = '';
let selectedScripts = 0;
let mainMenuTemplate;

const store = new Store();

//Listen for the app to be ready
app.on('ready', function () {
    /*let workingTitles = store.get('Titles');
    if(store.get('Titles') == undefined){
        store.set('Titles',{'titles':[]});
    }else{
        console.log('Titles already exists');
    }*/
    let iconRoute;
    process.platform == 'darwin' ? iconRoute = 'static/images/feather.icns' : iconRoute = 'static/images/feather.png'
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 1024,
        webPreferences: {
            nodeIntegration: true,
        },
        icon: path.join(__dirname, iconRoute)
    });
    mainWindow.setTitle('Truby');
    //Load main HTML page
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'static/views/mainWindow.html'),
        protocol: 'file',
        slashes: true
    }));
    //Saving before quiting the app if there are unsaved changes
    mainWindow.on('close', (e) => {
        if (contentToSave == 1) {
            e.preventDefault();
            saveDoc();
        } else {
            app.quit();
        }
    });

    //Quiting the app after the window was closed.
    mainWindow.on('closed', (e) => {
        app.quit();
    })

    //Build menu from the template
    //TODO: Create a Menu module and import it from a different place.
    //const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    //Insert menu
    Menu.setApplicationMenu(mainMenuTemplate);
});

module.exports = function (window) {
    return Menu.buildFromTemplate
}

//Handle create add window
function createAddWindow() {
    addWindow = new BrowserWindow({
        width: 300,
        height: 200,
        title: 'Add Shopping List Item',
        webPreferences: {
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
    addWindow.on('close', function () {
        addWindow = null;
    });
}

function changeNameWindow() {
    addWindow = new BrowserWindow({
        width: 300,
        height: 200,
        title: 'Type the new name for the script',
        webPreferences: {
            nodeIntegration: true
        }
    });
    //Load main HTML page
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'static/views/editWindow.html'),
        protocol: 'file',
        slashes: true,
    }));
    //Garbage collection
    addWindow.on('close', function () {
        addWindow = null;
    });
}

function saveDoc() {
    mainWindow.webContents.send('request-elements', 'saving file ...');
    ipcMain.on('send-elements', (e, content) => {
        if (contentToSave == 1) {
            /*
            elements = content.dialogs;
            fileDir = content.fileDir;
            counter = content.counter;
            let screenplay = require(fileDir);
            screenplay.dialogs = elements;
            screenplay.counter = counter;
            console.log('Saving this script ...', screenplay);
            screenplay = JSON.stringify(screenplay);
            
            fs.writeFile(fileDir, screenplay, (err) => {
                if (err) throw err;
                else mainWindow.webContents.send('saved', 'File saved');
                contentToSave = 0;
            });*/
            let selectedScript = store.get(content.scriptTitle);
            selectedScript.dialogs = content.dialogs;
            selectedScript.fileDir = content.fileDir;
            selectedScript.counter = content.counter;
            console.log('Selected script: ', selectedScript);
            store.set(content.scriptTitle, selectedScript);
            mainWindow.webContents.send('saved', 'File saved');
            contentToSave = 0;
        } else {
            console.log('no changes detected');
        };

    });
}

//Create a new document template
function createDocument() {
    let createDocument = new BrowserWindow({
        width: 300,
        height: 200,
        title: 'New Script',
        webPreferences: {
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
    createDocument.on('close', function () {
        addWindow = null;
    });
};

//Adding a new file from the main window
ipcMain.on('addDoc', (e, args) => {
    createAddWindow();
});

//Adding a new file from the addWindow
ipcMain.on('newDoc', (e, title) => {
    /*
    filepath = './data/' + title;
    fs.writeFile(filepath, '{"dialogs":[],"characters":[],"locations":[],"counter":0}', (err) => {
        if (err) {
            e.sender.send('newDoc', err);
        }
        else {
            e.sender.send('newDoc', "File written successfully");
            mainWindow.webContents.send('show-new-item');
        }
    });*/
    store.set(title,'{"dialogs":[],"characters":[],"locations":[],"counter":0}');
    let workingTitles = store.get('Titles');
    workingTitles.titles.push(title);
    store.set('Titles',workingTitles);
    e.sender.send('newDoc', "File written successfully");
    mainWindow.webContents.send('show-new-item');
});

//Saving changes to the document
ipcMain.on('unsaved-changes', (e, content) => {
    contentToSave = content.content;
    selectedScripts = content.scripts
});

/*Saving the elements
ipcMain.on('send-elements', (e, content) => {
    if (contentToSave == 1) {
        elements = content.dialogs;
        fileDir = content.fileDir;
        numberOfElements = content.counter;
        let screenplay = require(fileDir);
        screenplay.dialogs = elements;
        screenplay.counter = numberOfElements;
        screenplay = JSON.stringify(screenplay);
        fs.writeFile(fileDir, screenplay, (err) => {
            if (err) throw err;
            else mainWindow.webContents.send('saved', 'File saved');
            contentToSave = 0;
        });
    } else {
        console.log('no changes detected');
    };

});*/

ipcMain.on('delete-script', (e, content) => {
    /*
    let filepath = 'data/' + content.filename + '.json';
    fs.unlink(filepath, (err) => {
        if (err) throw err;
        else {
            mainWindow.webContents.send('show-new-item', 'File deleted successfully');
        };
    });*/
    let title = content.filename;
    store.delete(title);
    let workingTitles = store.get('Titles');
    let i = workingTitles.indexOf(title);
    workingTitles.splice(i,1);
    store.set('Title', workingTitles);
    mainWindow.webContents.send('show-new-item', 'File deleted successfully');
});

ipcMain.on('change-name', (e, content) => {
    changeNameWindow();
});

ipcMain.on('name-changed', (e, content) => {
    let title = content;
    //let fileDir = 'data/' + content;
    mainWindow.webContents.send('request-elements', 'saving file ...');
    ipcMain.on('send-elements', (e, content) => {
        /*
        fs.writeFile(fileDir, screenplay, (err) => {
            if (err) throw err;
            else mainWindow.webContents.send('saved', 'File saved');
        });
        screenplay = JSON.stringify(content);*/
        store.set(title,content)
    });
    e.sender.send('name-changed', 'Name changed successfully');
    mainWindow.webContents.send('show-new-item', 'New element added!');
});

//TODO: Jumtar todo en este mismo método sin tener que llamar a la función de saveDoc();
ipcMain.on('switch-scripts', (e, content) => {
    /*
    let filepath = 'data/' + content.selectedScript + '.json';
    let selectedScript = fs.readFileSync(filepath, 'utf8');
    let prevScript = content.prevScript
    let fileDir = './data/' + prevScript + '.json';
    if (prevScript != '') {
        let screenplay = require(fileDir);
        screenplay.dialogs = content.dialogs;
        screenplay.counter = content.counter;
        screenplay = JSON.stringify(screenplay);
        fs.writeFile(fileDir, screenplay, (err) => {
            if (err) throw err;
            else mainWindow.webContents.send('saved', 'File saved');
            contentToSave = 0;
        });
        mainWindow.webContents.send('switch-scripts', { selectedScript, prevScript });
    } else {
        mainWindow.webContents.send('switch-scripts', { selectedScript, prevScript });
    };*/
    //Getting the current script.
    let currentScriptTitle = content.currentScript;
    if(currentScriptTitle =! ''){
        let currentScript = store.get(currentScriptTitle);
        currentScript.dialogs = content.dialogs;
        currentScript.counter = content.counter;
        store.set(currentScriptTitle,currentScript);//Saving the current script.
        //Retrieving the selected script from the internal file system.
        let selectedScript = store.get(content.selectedScript);
        mainWindow.webContents.send('switch-scripts', { selectedScript, currentScriptTitle});
    }else{
        mainWindow.webContents.send('switch-scripts', { selectedScript, currentScriptTitle});
    }
});

//Creating the menu template
if (process.platform === 'darwin') {//Checking if running in MacOs
    const template = [
        {
            label: app.getName(), submenu: [
                { role: 'quit' },
            ],
        },
        {
            label: 'File',
            submenu: [
                {
                    label: 'Add Item',
                    click() {
                        createAddWindow();
                    }
                },
                {
                    label: 'Clear Items'
                },
                {
                    label: 'Quit',
                    accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                    click() {
                        app.quit();
                    }
                },
                {
                    label: 'New Script',
                    accelerator: process.platform == 'darwin' ? 'Command+N' : 'Ctrl+N',
                    click() {
                        createDocument();
                    }
                },
                {
                    label: 'Save Doc',
                    accelerator: process.platform == 'darwin' ? 'Command+S' : 'Ctrl+S',
                    click() {
                        saveDoc();
                    }
                },
                {
                    label: 'Zoom in',
                    role: 'ZoomIn',
                    accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                    click() {
                        mainWindow.webContents.send('zoom', 1);
                    }
                },
                {
                    label: 'Zoom out',
                    role: 'ZoomOut',
                    accelerator: process.platform == 'darwin' ? 'Command+O' : 'Ctrl+O',
                    click() {
                        mainWindow.webContents.send('zoom', 0);
                    }
                },
            ]
        },
        {
            label: 'Elements',
            submenu: [
                {
                    label: 'Character',
                    accelerator: process.platform == 'darwin' ? 'cmd+1' : 'Alt+S',
                    click() {
                        mainWindow.webContents.send('add-element', 'character');
                    }
                },
                {
                    label: 'Dialog',
                    accelerator: process.platform == 'darwin' ? 'cmd+D' :'Alt+D',
                    click() {
                        mainWindow.webContents.send('add-element', 'dialog');
                    }
                },
                {
                    label: 'Transition',
                    accelerator: process.platform == 'darwin' ? 'cmd+T' : 'Alt+T',
                    click() {
                        mainWindow.webContents.send('add-element', 'transition');
                    }
                },
                {
                    label: 'Text',
                    accelerator: process.platform == 'darwin' ? 'cmd+A' : 'Alt+A',
                    click() {
                        mainWindow.webContents.send('add-element', 'text');
                    }
                },
                {
                    label: 'Location',
                    accelerator: process.platform == 'darwin' ? 'cmd+W' : 'Alt+W',
                    click() {
                        mainWindow.webContents.send('add-element', 'location');
                    }
                },
                {
                    label: 'Shift Element',
                    accelerator: process.platform == 'darwin' ? 'cmd+Q' : 'Alt+Q',
                    click() {
                        mainWindow.webContents.send('add-element', 'shift');
                    }
                },
            ]
        }
    ];
    //Developer tools (not in production)
    if (process.env.NODE_ENV != 'production') {
        template.push({
            label: 'DevTools',
            submenu: [
                {
                    label: 'Toggle DevTools',
                    accelerator: process.platform == 'darwin' ? 'Command+Shift+I' : 'Ctrl+Shift+I',
                    click(item, focusedWindow) {
                        focusedWindow.toggleDevTools();
                    }
                },
                {
                    role: 'reload'
                }
            ]
        })
    }
    template.unshift({ 'label': app.getName() });
    mainMenuTemplate = Menu.buildFromTemplate(template);
} else {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Add Item',
                    click() {
                        createAddWindow();
                    }
                },
                {
                    label: 'Clear Items'
                },
                {
                    label: 'Quit',
                    accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                    click() {
                        app.quit();
                    }
                },
                {
                    label: 'New Script',
                    accelerator: process.platform == 'darwin' ? 'Command+N' : 'Ctrl+N',
                    click() {
                        createDocument();
                    }
                },
                {
                    label: 'Save Doc',
                    accelerator: process.platform == 'darwin' ? 'Command+S' : 'Ctrl+S',
                    click() {
                        saveDoc();
                    }
                },
                {
                    label: 'Zoom in',
                    accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                    click() {
                        mainWindow.webContents.send('zoom', 1);
                    }
                },
                {
                    label: 'Zoom out',
                    accelerator: process.platform == 'darwin' ? 'Command+O' : 'Ctrl+O',
                    click() {
                        mainWindow.webContents.send('zoom', 0);
                    }
                },
            ]
        },
        {
            label: 'Elements',
            submenu: [
                {
                    label: 'Character',
                    accelerator: process.platform == 'darwin' ? 'cmd+S' : 'Alt+S',
                    click() {
                        mainWindow.webContents.send('add-element', 'character');
                    }
                },
                {
                    label: 'Dialog',
                    accelerator: process.platform == 'darwin' ? 'cmd+D' : 'Alt+D',
                    click() {
                        //mainWindow.webContents.send('add-element','dialog');
                        console.log('New Dialog');
                    }
                },
                {
                    label: 'Transition',
                    accelerator: process.platform == 'darwin' ? 'cmd+T' : 'Alt+T',
                    click() {
                        mainWindow.webContents.send('add-element', 'transition');
                    }
                },
                {
                    label: 'Text',
                    accelerator: process.platform == 'darwin' ? 'cmd+A' : 'Alt+A',
                    click() {
                        mainWindow.webContents.send('add-element', 'text');
                    }
                },
                {
                    label: 'Location',
                    accelerator: process.platform == 'darwin' ? 'cmd+W' : 'Alt+W',
                    click() {
                        mainWindow.webContents.send('add-element', 'location');
                    }
                },
                {
                    label: 'Shift Element',
                    accelerator: process.platform == 'darwin' ? 'cmd+Q' : 'Alt+Q',
                    click() {
                        mainWindow.webContents.send('add-element', 'shift');
                    }
                },
            ]
        }
    ];
    //Developer tools (not in production)
    if (process.env.NODE_ENV != 'production') {
        template.push({
            label: 'DevTools',
            submenu: [
                {
                    label: 'Toggle DevTools',
                    accelerator: process.platform == 'darwin' ? 'Command+Shift+I' : 'Ctrl+Shift+I',
                    click(item, focusedWindow) {
                        focusedWindow.toggleDevTools();
                    }
                },
                {
                    role: 'reload'
                }
            ]
        })
    }
    mainMenuTemplate = Menu.buildFromTemplate(template);
}

