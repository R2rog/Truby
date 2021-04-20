const electron = require('electron');
const Store = require('electron-store');
//const Sudoer = require('electron-sudo');
const url = require('url');
const path = require('path');
const nativeImage = require('electron').nativeImage
const fs = require('fs');
const { app, BrowserWindow, Menu, ipcMain, globalShortcut } = electron;

//Instances
process.env.NODE_ENV = undefined;

let mainWindow;
let addWindow;
let contentToSave = 0;
let currentFile = '';
let selectedScripts = 0;
let mainMenuTemplate;

const store = new Store();

//Listen for the app to be ready
app.on('ready', function () {
    let iconRoute;
    //process.platform == 'darwin' ? iconRoute = 'build/feather.icns' : iconRoute = nativeImage.createFromPath(__dirname + '/static/images/feather.png')
    process.platform == 'darwin' ? iconRoute = 'build/feather.icns' : iconRoute = nativeImage.createFromPath(__filename+'build/feather_ico.ico');
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 1024,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
        //icon: iconRoute,
    });

    //Global shortcut to prevent the copy, cut and paste default methods in Windows. 
    globalShortcut.register('Control+X', ()=>{
        mainWindow.webContents.send('get-selection','cut');
    });
    globalShortcut.register('Control+C', ()=>{
        mainWindow.webContents.send('get-selection','copy');
    });
    globalShortcut.register('Control+V', ()=>{
        mainWindow.webContents.send('paste');
    });

    mainWindow.setTitle('qwerty');
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
    Menu.setApplicationMenu(mainMenuTemplate);
});

module.exports = function (window) {
    return Menu.buildFromTemplate
}

//Function that retrieves dat from a single script
async function getScript(title, currentScriptTitle) {
    let selectedScript = await store.get(title);
    console.log(selectedScript);
    mainWindow.webContents.send('switch-scripts', { selectedScript, currentScriptTitle });
    return selectedScript;
};

//Function that retrieves data when scripts are getting swithed.
async function switchScripts(cScript, sScript,content) {
    console.log('Current script title',cScript);
    let currentScript = store.get(cScript);
    let selectedScript = store.get(sScript);
    let scripts = await Promise.all([currentScript, selectedScript]);
    currentScript = scripts[0];
    selectedScript = scripts[1];
    currentScript.dialogs = content.dialogs;
    currentScript.counter = content.counter;
    store.set(cScript, currentScript);//Saving the current script.
    mainWindow.webContents.send('switch-scripts', { selectedScript, cScript });
    contentToSave = 0;
};

function saveDoc() {
    mainWindow.webContents.send('request-elements', 'save');
    ipcMain.on('send-elements-save', (e, content) => {
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
            let scriptTitle = content.scriptTitle
            console.log('---------------------------------Saving script-----------------------------');
            try {
                let selectedScript = store.get(scriptTitle);
                console.log(selectedScript);
                selectedScript.dialogs = content.dialogs;
                selectedScript.fileDir = content.fileDir;
                selectedScript.counter = content.counter;
                console.log('Sript JSON being saved ...', selectedScript);
                store.set(scriptTitle, selectedScript);
                mainWindow.webContents.send('saved', 'File saved');
                contentToSave = 0;
            } catch (error) {
                mainWindow.webContents.send('saved',error);
            };
        }else {
            console.log('no changes detected');
        };
    });
};

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
    store.set(title, { "dialogs": [], "characters": [], "locations": [], "counter": 0 });
    //workingTitles = store.get('Titles.titles');
    let workingTitles = store.get('Titles');
    workingTitles.push(title);
    store.set('Titles', workingTitles);
    e.sender.send('newDoc', "File written successfully");
    mainWindow.webContents.send('show-new-item');
});

//Saving changes to the document
ipcMain.on('unsaved-changes', (e, content) => {
    contentToSave = content.content;
    selectedScripts = content.scripts
});

ipcMain.on('delete-script', (e, content) => {
    let title = content.filename;
    store.delete(title);
    //let workingTitles = store.get('Titles.titles');
    let workingTitles = store.get('Titles');
    console.log(workingTitles);
    let newWorkingTitles = [];
    workingTitles.forEach(element => {
        if (element != title) {
            newWorkingTitles.push(element);
        } else {
            console.log('next');
        }
    });
    store.set('Titles', newWorkingTitles);
    mainWindow.webContents.send('show-new-item', 'File deleted successfully');
});

ipcMain.on('change-name', (e, content) => {
    changeNameWindow();
});

ipcMain.on('create-copy', (e, content) => {

});

ipcMain.on('name-changed', async (e, content) => {
    let title = content;
    let workingTitles = await store.get('Titles');
    if(workingTitles.includes(title)){
        e.sender.send('name-changed',{message:'The title you introduced already exits. Please enter a different one', valid:0});
    }else{
        mainWindow.webContents.send('request-elements', 'copy');
        ipcMain.on('send-elements-copy', (e, content) => {
            console.log('Content getting copied...', content);
            store.set(title,content)
            workingTitles.push(title);
            console.log('New working titles...',workingTitles);
            store.set('Titles',workingTitles);
        });
        e.sender.send('name-changed',{message:'Copy created succesfully!', valid:1});
        mainWindow.webContents.send('show-new-item');
    };
});

ipcMain.on('find-in-page',async (e,content)=>{
    let text = content.text;
    let action = content.action;
    switch (action) {
        case "search":
            let id = await mainWindow.webContents.findInPage(text);
            break;
        case "delete":
            mainWindow.webContents.stopFindInPage('clearSelection');
            break;
    };
});

//TODO: Entender como se están guardando los scripts en esta parte para evitar que haya redundancias
ipcMain.on('switch-scripts', (e, content) => {
    let currentScriptTitle = content.currentScript;
    let selectedScript = ''
    if (currentScriptTitle != '') {
        selectedScript = content.selectedScript;
        switchScripts(currentScriptTitle, selectedScript,content);
    } else {
        selectedScript = content.selectedScript
        getScript(selectedScript, currentScriptTitle);
    };
});

//Creating the menu template
if (process.platform === 'darwin') {//Checking if running in MacOs
    const template = [
        {
            label: 'File',
            submenu: [
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
                        console.log('-----------------------Save Doc Keybind------------------------');
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
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { 
                    //role: 'paste'
                    label: 'Paste',
                    accelerator: 'Command+V',
                    click(){
                        mainWindow.webContents.send('paste');
                    }
                },
                { 
                    //role: 'copy'
                    label:'Copy',
                    accelerator: 'Command+C',
                    click(){
                        mainWindow.webContents.send('get-selection','copy');
                    }
                },
                { 
                    //role: 'cut' 
                    label: 'Cut',
                    accelerator: 'Command+X',
                    click(){
                        mainWindow.webContents.send('get-selection','cut');
                    }
                },
                { 
                    label: 'Find',//TODO: Implement electron-find to navigate the script more easily
                    accelerator: 'Command+F',
                    click(){
                        mainWindow.webContents.send('search');
                        //const inPageSearch = searchInPage(mainWindow.webContents);
                        //inPageSearch.openSearchWindow();
                    }
                }
            ]
        },
        {
            label: 'Elements',
            submenu: [
                {
                    label: 'Character',
                    accelerator: 'Command+1',
                    click() {
                        mainWindow.webContents.send('add-element', 'character');
                    }
                },
                {
                    label: 'Dialog',
                    accelerator: 'Command+2',
                    click() {
                        mainWindow.webContents.send('add-element', 'dialog');
                    }
                },
                {
                    label: 'Transition',
                    accelerator: 'Command+T',
                    click() {
                        mainWindow.webContents.send('add-element', 'transition');
                    }
                },
                {
                    label: 'Text',
                    accelerator: 'Command+3',
                    click() {
                        mainWindow.webContents.send('add-element', 'text');
                    }
                },
                {
                    label: 'Parenthesis',
                    accelerator: 'Command+E',
                    click() {
                        mainWindow.webContents.send('add-element', 'parenthesis')
                    }
                },
                {
                    label: 'Location',
                    accelerator: 'Command+W',
                    click() {
                        mainWindow.webContents.send('add-element', 'location');
                    }
                },
                {
                    label: 'Scene',
                    accelerator: 'Command+0',
                    click(){
                        mainWindow.webContents.send('add-element','scene');
                    }
                },
                {
                    label: 'Shift Element',
                    accelerator: 'Command+4',
                    click() {
                        mainWindow.webContents.send('add-element', 'shift');
                    }
                },
                {
                    label:'Selector',
                    accelerator: 'Command+9',
                    click(){
                        mainWindow.webContents.send('get-selection','debug');
                    }
                }
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
} else {// Linux and Windows keybindings
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
                        console.log('------------------Save Doc Keybind------------------------');
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
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { 
                    //role: 'paste'
                    label: 'Paste',
                    accelerator: 'Alt+V',
                    click(){
                        mainWindow.webContents.send('paste');
                    }
                },
                { 
                    //role: 'copy'
                    label:'Copy',
                    accelerator: 'Alt+C',
                    click(){
                        console.log('Copying ...');
                        mainWindow.webContents.send('get-selection','copy');
                    }
                },
                { 
                    //role: 'cut' 
                    label: 'Cut',
                    accelerator: 'Alt+X',
                    click(){
                        console.log('Cutting ....');
                        mainWindow.webContents.send('get-selection','cut');
                    }
                },
                { 
                    label: 'Find',//TODO: Implement electron-find to navigate the script more easily
                    accelerator: 'Ctrl+F',
                    click(){
                        mainWindow.webContents.send('search');
                    }
                }
            ]
        },
        {
            label: 'Elements',
            submenu: [
                {
                    label: 'Character',
                    accelerator: 'Alt+S',
                    click() {
                        mainWindow.webContents.send('add-element', 'character');
                    }
                },
                {
                    label: 'Dialog',
                    accelerator: 'Alt+D',
                    click() {
                        mainWindow.webContents.send('add-element', 'dialog');
                        console.log('New Dialog');
                    }
                },
                {
                    label: 'Transition',
                    accelerator: 'Alt+T',
                    click() {
                        mainWindow.webContents.send('add-element', 'transition');
                    }
                },
                {
                    label: 'Text',
                    accelerator: 'Alt+A',
                    click() {
                        mainWindow.webContents.send('add-element', 'text');
                    }
                },
                {
                    label: 'Location',
                    accelerator: 'Alt+W',
                    click() {
                        mainWindow.webContents.send('add-element', 'location');
                    }
                },
                {
                    label: 'Parenthesis',
                    accelerator: 'Alt+E',
                    click() {
                        mainWindow.webContents.send('add-element', 'parenthesis');
                    }
                },
                {
                    label: 'Scene',
                    accelerator: 'Alt+0',
                    click(){
                        mainWindow.webContents.send('add-element','scene');
                    }
                },
                {
                    label: 'Shift Element',
                    accelerator: 'Alt+Q',
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

