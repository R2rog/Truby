const { app,ipcMain,Menu } = require('electron');

let mainMenuTemplate;

if (process.platform === 'darwin') {
    // Create our menu entries so that we can use MAC shortcut
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
                    accelerator: process.platform == 'darwin' ? 'cmd+S' : 'Alt+S',
                    click() {
                        mainWindow.webContents.send('add-element', 'character');
                    }
                },
                {
                    label: 'Dialog',
                    accelerator: 'Alt+D',
                    click() {
                        //mainWindow.webContents.send('add-element', 'dialog');
                        console.log('New dialog added');
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
    template.unshift({ 'label': app.getName() });
    mainMenuTemplate = Menu.buildFromTemplate(template);
}else{
    const template = [
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
                        app.quit();
                    }
                },
                {
                    label: 'New Script',
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
                },
                {
                    label: 'Zoom in',
                    accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I' ,
                    click(){
                        mainWindow.webContents.send('zoom', 1);
                    }
                },
                {
                    label: 'Zoom out',
                    accelerator: process.platform == 'darwin' ? 'Command+O' : 'Ctrl+O',
                    click(){
                        mainWindow.webContents.send('zoom', 0);
                    }
                },
            ]
        },
        {
            label:'Elements',
            submenu:[
                {
                    label:'Character',
                    accelerator: process.platform == 'darwin' ? 'cmd+S': 'Alt+S',
                    click(){
                        mainWindow.webContents.send('add-element','character');
                    }
                },
                {
                    label:'Dialog',
                    accelerator: process.platform == 'darwin' ? 'cmd+D': 'Alt+D',
                    click(){
                        //mainWindow.webContents.send('add-element','dialog');
                        console.log('New Dialog');
                    }
                },
                {
                    label:'Transition',
                    accelerator: process.platform == 'darwin' ? 'cmd+T': 'Alt+T',
                    click(){
                        mainWindow.webContents.send('add-element','transition');
                    }
                },
                {
                    label: 'Text',
                    accelerator: process.platform == 'darwin' ? 'cmd+A': 'Alt+A',
                    click(){
                        mainWindow.webContents.send('add-element','text');
                    }
                },
                {
                    label: 'Location',
                    accelerator: process.platform == 'darwin' ? 'cmd+W': 'Alt+W',
                    click(){
                        mainWindow.webContents.send('add-element','location');
                    }
                },
                {
                    label:'Shift Element',
                    accelerator: process.platform == 'darwin' ? 'cmd+Q' : 'Alt+Q',
                    click(){
                        mainWindow.webContents.send('add-element','shift');
                    }
                },
            ]
        }
    ];
    mainMenuTemplate = Menu.buildFromTemplate(template);
}
module.exports = mainMenuTemplate;

/*const mainMenuTemplate = [
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
                    app.quit();
                }
            },
            {
                label: 'New Script',
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
            },
            {
                label: 'Zoom in',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I' ,
                click(){
                    mainWindow.webContents.send('zoom', 1);
                }
            },
            {
                label: 'Zoom out',
                role:'ZoomOut',
                accelerator: process.platform == 'darwin' ? 'Command+O' : 'Ctrl+O',
                click(){
                    mainWindow.webContents.send('zoom', 0);
                }
            },
        ]
    },
    {
        label:'Elements',
        submenu:[
            {
                label:'Character',
                accelerator: process.platform == 'darwin' ? 'cmd+S': 'Alt+S',
                click(){
                    mainWindow.webContents.send('add-element','character');
                }
            },
            {
                label:'Dialog',
                accelerator: process.platform == 'darwin' ? 'cmd+D': 'Alt+D',
                click(){
                    mainWindow.webContents.send('add-element','dialog');
                }
            },
            {
                label:'Transition',
                accelerator: process.platform == 'darwin' ? 'cmd+T': 'Alt+T',
                click(){
                    mainWindow.webContents.send('add-element','transition');
                }
            },
            {
                label: 'Text',
                accelerator: process.platform == 'darwin' ? 'cmd+A': 'Alt+A',
                click(){
                    mainWindow.webContents.send('add-element','text');
                }
            },
            {
                label: 'Location',
                accelerator: process.platform == 'darwin' ? 'cmd+W': 'Alt+W',
                click(){
                    mainWindow.webContents.send('add-element','location');
                }
            },
            {
                label:'Shift Element',
                accelerator: process.platform == 'darwin' ? 'cmd+Q' : 'Alt+Q',
                click(){
                    mainWindow.webContents.send('add-element','shift');
                }
            },
        ]
    }

          {
        label: 'Edit', submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { role: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'pasteandmatchstyle' },
          { role: 'delete' },
          { role: 'selectall' },
        ],
      },
      {
        label: 'Help', submenu: [
          { role: 'toggleFullScreen' },
          { role: 'toggleDevTools' },
        ],
      },
];

//Developer tools (not in production)
if(process.env.NODE_ENV != 'production'){
    mainMenuTemplate.push({
        label: 'DevTools',
        submenu:[
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+Shift+I': 'Ctrl+Shift+I',
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
}*/

//module.exports = {
//    Menu: Menu.buildFromTemplate(mainMenuTemplate)
//};