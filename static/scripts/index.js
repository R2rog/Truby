//Importing modules.
const fs = require('fs');
//const path = require('path');
const {
    ipcRenderer
} = require('electron');
const {
    dialog
} = require('electron').remote;
const {
    title
} = require('process');
const nativeImage = require('electron').nativeImage


const Store = require('electron-store');
const { type } = require('os');
const store = new Store();

// Global variables
const content = document.getElementById('content');
let directory = './data';
let filenames = 'fs.readdirSync(directory)';
let script = ''; //Current selected script.
let currentIndex = 0; //Gives the position of the selected element on the NodeList
let counter = 0; //Gives a unique key to every new element added
let classes = ['text', 'character', 'dialog', 'location', 'transition'];
let scale = 1.0; //Controls the scale for the content aspect of the page.
let margin = 81; //Initial margin
let selectedScripts = [];
let unsavedChanges = 0;

function openNav() {
    document.getElementById("mySidebar").style.width = "15rem";
    document.getElementById("scripts").style.background = "#F55D3E";
    document.getElementById("script-sidebar").style.visibility = "visible";
}

function closeNav() {
    document.getElementById("mySidebar").style.width = "0";
    document.getElementById("scripts").style.background = "#111";
    document.getElementById("script-sidebar").style.color = "#fff"
    document.getElementById("script-sidebar").style.visibility = "hidden";
}

//Function that gets the id of the current element.
function currentElemIndex(id) {
    let el = document.getElementById(id);
    let arr = content.childNodes;
    currentIndex = Array.prototype.indexOf.call(arr, el);
    console.log('Current index from currentElemIndex: ',currentIndex);
};

//Function that controls the insertion of new elements
function insertElement(newElement) {
    let nodes = Array.from(content.childNodes);
    if (currentIndex + 2 == content.childNodes.length) {
        content.appendChild(newElement);
    } else {
        console.log('Current Index from insert element: ',currentIndex);
        nodes.splice(currentIndex + 1, 0, newElement);
        renderElements(nodes, newElement);
    }
    if (currentIndex != 0) {
        currentIndex += currentIndex + 1;
    }
};

//Function that adds elements when they are not located in the last position of the Node List.
function renderElements(arr, newElement) {
    content.innerHTML = "";
    arr.forEach(dialog => {
        content.innerHTML += dialog.outerHTML;
    });
    console.log('Focus event...',newElement.focus());
};

//Function that creates a character html tag
function newElement(type) {
    console.log("Current counter: ", counter);
    counter = counter + 1;
    id = counter.toString();
    getId = "currentElemIndex(" + id + ")";
    let newElement = document.createElement("DIV");
    newElement.setAttribute('class', type);
    newElement.setAttribute('id', id);
    newElement.setAttribute('tabindex', 0);
    newElement.setAttribute('data-placeholder', type)
    newElement.setAttribute('contentEditable', 'true');
    newElement.setAttribute("onclick", getId);
    if(type == 'parenthesis'){
        newElement.innerText = '()';
    }
    insertElement(newElement);
};

//Displays the titles for the available scripts
function displayTitles(filenames) {
    let titles = store.get('Titles');
    console.log('Titles',titles);
    titles.map(function (file) {
        filename = `${file.split('.json')[0]}`;
        filepath = '../../data/' + filename + '.json';
        el = document.createElement("li");
        localTitle = document.createElement("a");
        addOn = document.createElement("div");
        text = document.createTextNode(filename);
        i1 = document.createElement("i");
        i1.setAttribute('class','far fa-copy');
        i1.setAttribute('id',filename.toString()+'i1');
        i1.addEventListener('click',(e)=>{
            changeName();
        });
        i2 = document.createElement("i");
        i2.setAttribute('class','fas fa-trash');
        i2.setAttribute('id',filename.toString()+'i2');
        i2.addEventListener('click',(e)=>{
            deleteScript();
        });
        i3 = document.createElement("i");
        i3.setAttribute('class','fas fa-edit');
        i3.setAttribute('id',filename.toString()+'i3');
        i3.addEventListener('click',(e)=>{
            //changeName();
        });
        addOn.setAttribute('class','title-tools');
        addOn.appendChild(i1);
        addOn.appendChild(i3);
        addOn.appendChild(i2);
        localTitle.setAttribute('id', filename);
        el.setAttribute('class', 'side-title');
        el.appendChild(addOn);
        localTitle.appendChild(text);
        el.appendChild(localTitle);
        document.getElementById('titles').appendChild(el);
        displayContent(localTitle,i1,i2,i3,filepath, filename);
    });
};

function deleteScript(){
    dialog.showMessageBox({ 
        type: 'question', 
        buttons: ['Delete','Cancel'], 
        defaultId: 0, 
        title: 'Confirmation required', 
        message: `Are you sure you want to delete ${script}?`,
        icon:  nativeImage.createFromPath('./static/images/feather.png'),
        detail: 'The script will be completley removed from the internal file system', 
    }).then(box => { 
        if(box.response == 0){
            ipcRenderer.send('delete-script',{
                filename: script
            });
        }else{
            console.log(box.response);
        }
    }).catch(err => { 
        console.log(err) 
    });  
};

function changeName(){
    ipcRenderer.send('change-name','Changing name ...');
};


function createCopy(){
    console.log('Creating copy');
    ipcRenderer.send('create-copy', 'Creating copy... ');
}

//Displays the selected script in the page when the tittle is clicked.
function displayContent(el,i1,i2,i3, filepath, filename) {
    el.addEventListener('click', (e) => {
        console.log(script != '');
        if(script != ''){        
            console.log('False');
            document.getElementById(script+'i1').style.display = 'none';
            document.getElementById(script+'i2').style.display = 'none';
            document.getElementById(script+'i3').style.display = 'none';
            let dialogs = [];
            let arr = content.childNodes;
            arr.forEach(element => {
                dialogs.push(element.outerHTML);
            });
            ipcRenderer.send('switch-scripts', {
                selectedScript: filename,
                currentScript: script,
                dialogs: dialogs,
                counter: counter
            });
        }else{
            console.log(filename);
            ipcRenderer.send('switch-scripts', {
                selectedScript: filename,
                currentScript: ''
            });
        }
        script = el.innerHTML;
        document.getElementById('script-title').innerHTML = script;
        i1.style.display = 'block';
        i2.style.display = 'block';
        //i3.style.display = 'block';
    });
};

//Function that shifts through the different classes for the selected element
function changeClass() {
    let el = content.childNodes[currentIndex];
    let currentClass = el.className;
    console.log('Current class of the element', currentClass);
    let i = classes.indexOf(currentClass);
    if (i + 1 >= classes.length) i = -1;
    el.setAttribute('class', classes[i + 1]);
    console.log('New class of the element', el.className);
};

//Adding a new file from the main window
function addDoc() {
    ipcRenderer.send("addDoc", "Adding new doc");
};

function zoom(param){
    let toolbar = document.getElementById('toolbar');
    if (param == 0 && scale >= 0.9) {
        scale -= 0.1;
        margin -= 3;
        content.style.transform = `scale(${scale})`;
        toolbar.style.marginLeft = `${margin}%`;
        console.log("Zooming out: ", scale);
        console.log("New margin: ", margin);
    } else if (param == 1 && scale <= 1.5) {
        scale += 0.1;
        margin += 3;
        content.style.transform = `scale(${scale})`;
        closeNav();
        toolbar.style.marginLeft = `${margin}%`;
        console.log("Zooming in: ", scale);
        console.log("New margin: ", margin);
    } else {
        scale = scale;
    }
}

//Macro Key Bindings to add new elements

ipcRenderer.on('add-element', (e, args) => {
    switch (args) {
        case 'character':
            newElement('character');
            break;
        case 'dialog':
            newElement('dialog');
            break;
        case 'location':
            newElement('location');
            break;
        case 'text':
            newElement('text');
            break;
        case 'transition':
            newElement('transition');
            break;
        case 'parenthesis':
            newElement('parenthesis');
            break;
        case 'shift':
            changeClass();
            break;
    }
});

//Zoom in function
ipcRenderer.on('zoom', (e, args) => {
    zoom(args);
});

ipcRenderer.on('request-elements', (e, args) => {
    console.log('Requesting elements...');
    let arr = content.childNodes
    let dialogs = []
    arr.forEach(element => {
        dialogs.push(element.outerHTML);
    });
    ipcRenderer.send('send-elements', {
        scriptTitle: script,
        dialogs: dialogs,
        fileDir: './data/' + script + '.json',
        counter: counter
    });
});

ipcRenderer.on('switch-scripts', (e, args) => {
    //let prevScript = args.prevScript;
    console.log('Args: ',args);
    let file = args.selectedScript;
    let dialogs = [];
    //autosave(el, prevScript);
    content.style.display = 'block';
    selectedScripts += 1;
    document.getElementById('img-placeholder').style.display = 'none';
    //Reseting the values for a new file.
    counter = 0;
    currentIndex = 0;
    //Refreshing to the latest version of an script.
    content.innerHTML = "";
    //Filling the script elements into content HTML
    file.dialogs.forEach(dialog => {
        content.innerHTML += dialog;
    });
    counter = file.counter;
    currentIndex = file.dialogs.length - 2;
    if(args.currentScriptTitle!=''){
        document.getElementById(args.currentScriptTitle).style.color = '#1ed760';
    }
});

ipcRenderer.on('saved', (e, args) => {
    //window.confirm(args);
    let title = document.getElementById(script);
    title.style.color = '#1ed760';
    unsavedChanges = 0;
    //script = selectedScript;
});

ipcRenderer.on('quit', (e, args) => {
    window.alert(args);
});

ipcRenderer.on('show-new-item', (e, args) => {
    document.location.reload();
});

//Function that detects changes on the document. 
document.getElementById('content').onclick = e => { // alerting system that files have been updated
    unsavedChanges = 1;
    ipcRenderer.send('unsaved-changes', { // alerting ./component/Menu.js
        content: 1,
        scripts: selectedScripts
    });
    let title = document.getElementById(script);
    title.style.color = "red";
};

document.getElementById('print').addEventListener('click', (e) => {
    if(unsavedChanges == 1){
        dialog.showMessageBox({ 
            type: 'question', 
            buttons: ['Ok'], 
            defaultId: 0, 
            title: 'Unsaved changes', 
            message: `Please save the current script before printing`,
            icon:  nativeImage.createFromPath('./static/images/feather.png'),
            detail: 'This will ensure that all your progress gets saved', 
        });
    }else{
        content.style.padding = 0;
        closeNav();
        window.print();
        document.location.reload();
    };
});

displayTitles(filenames);