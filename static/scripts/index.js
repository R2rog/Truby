//Importing modules.
const fs = require('fs');
//const path = require('path');
const { ipcRenderer } = require('electron');
//const { title, defaultApp } = require('process');
//const { default: EditorJS } = require('@editorjs/editorjs');
const { dialog } = require('electron')

// Global variables
const content = document.getElementById('content');
let directory = './data';
let filenames= fs.readdirSync(directory);
let script ='';
let currentIndex = 0; //Gives the position of the selected element on the NodeList
let counter = 0;//Guves a unique key to every new element added
let classes = ['text','character','dialog','location','transition'];
let unsavedChanges = 0;


function openNav() {
    document.getElementById("mySidebar").style.width = "15rem";
    document.getElementById("scripts").style.background = "#F55D3E";
    document.getElementById("script-sidebar").style.color = "#111"
    //document.getElementById("main").style.marginLeft = "250px";
}

function closeNav() {
    document.getElementById("mySidebar").style.width = "0";
    document.getElementById("scripts").style.background = "#111";
    document.getElementById("script-sidebar").style.color = "#fff"
}

//Function that detects un-saved changes. 
document.getElementById('content').onclick = e => { // alerting system that files have been updated
    unsavedChanges = 1;
    ipcRenderer.send('unsaved-changes', { // alerting ./component/Menu.js
        content: 1
    })
    let title = document.getElementById(script);
    title.style.color = "red";
}
//Function that gets the id of the current element.
function currentElemIndex(id){
    let el = document.getElementById(id);
    let arr = content.childNodes;
    currentIndex = Array.prototype.indexOf.call(arr, el);
}

//Function that controls the insertion of new elements
function insertElement(newElement,newBr){
    let nodes = Array.from(content.childNodes);
    console.log('Nodes pre-copy: ',nodes);
    if (currentIndex +2 == content.childNodes.length){
        content.appendChild(newElement);
        //content.innerHTML += '<br>';
    }else{
        //nodes.splice(currentIndex+2,0,newElement,newBr);
        nodes.splice(currentIndex+1,0,newElement);
        renderElements(nodes,newElement);
    }
    if (currentIndex != 0) {
        currentIndex += currentIndex +1;
    }
    //document.getElementById(currentIndex).focus();
    console.log('Nodes post-copy: ',nodes);
};

//Function that adds elements when they are not located in the last position of the Node List.
function renderElements(arr,newElement){
    content.innerHTML = "";
    arr.forEach(dialog => {
        content.innerHTML += dialog.outerHTML; 
    });
    //newElement.style('border-color','black');//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
}

//Function that creates a character html tag
function newElement(type){
    console.log("Current counter: ",counter,"CurrentIndex: ", currentIndex);
    counter = counter +1;
    id = counter.toString();
    getId = "currentElemIndex("+id+")";
    let newElement = document.createElement("DIV");
    let newBr = document.createElement("BR");
    newElement.setAttribute('class',type);
    newElement.setAttribute('id',id);
    newElement.setAttribute('tabindex',0);
    newElement.setAttribute('data-placeholder',type)
    newElement.setAttribute('contentEditable','true');
    newElement.setAttribute("onclick", getId);
    insertElement(newElement,newBr);
}

function displayTitles(filenames){
    filenames.map(function(file){
        el = document.createElement("li");
        //el.setAttribute('class','li-title');
        filename = `${file.split('.json')[0]}`;
        el.setAttribute('id',filename)
        text = document.createTextNode(filename);
        el.appendChild(text);
        filepath = '../../data/' + filename + '.json';
        displayContent(el,filepath, filename);
        document.getElementById('titles').appendChild(el);
    });
};

function displayContent(el, filepath, filename){
    el.addEventListener('click',(e)=>{
            let file = require(filepath);
            script = el.innerHTML;
            //Reseting the values for a new file.
            counter = 0;
            currentIndex = 0;
            document.getElementById('script-title').innerHTML = filename;
            content.innerHTML = "";
            file.dialogs.forEach(dialog => {
                content.innerHTML += dialog; 
            });
            counter = file.counter;
            currentIndex = file.dialogs.length-2;
            console.log('JSON counter: ',counter,' JSON currentIndex: ',currentIndex);
            console.log('Selected script: ',script);
    });
};

//Function that shifts through the different classes for the selected element
function changeClass(){ 
    let el = content.childNodes[currentIndex];
    let currentClass = el.className;
    console.log('Current class of the element',currentClass);
    let i = classes.indexOf(currentClass);
    if (i +1 >= classes.length) i = -1;
    el.setAttribute('class',classes[i + 1]);
    console.log('New class of the element', el.className);
};

//Adding a new file from the main window
function addDoc(){
    ipcRenderer.send("addDoc","Adding new doc");
};

//Macro Key Bindings
ipcRenderer.on('character',(e,args)=>{
    newElement('character');
});

ipcRenderer.on('dialog',(e,args)=>{
    newElement('dialog');
});

ipcRenderer.on('location',(e,args)=>{
    newElement('location');
});

ipcRenderer.on('text',(e,args)=>{
    newElement('text');
});

ipcRenderer.on('transition',(e,args)=>{
    newElement('transition');
});

ipcRenderer.on('changeAction',(e,args)=>{
    changeClass();
});

ipcRenderer.on('request-elements',(e,args)=>{
    let arr = content.childNodes
    let dialogs = []
    arr.forEach(element => {
      dialogs.push(element.outerHTML);
    });
    ipcRenderer.send('send-elements',{
        elements: dialogs,
        fileDir: './data/' + script + '.json',
        numberOfElements: counter
    });
});

ipcRenderer.on('Saved',(e,args)=>{
    //window.confirm(args);
    let title = document.getElementById(script);
    title.style.color = '#1ed760';
    unsavedChanges = 0;
});

ipcRenderer.on('quit',(e,args) =>{
    window.confirm(args);
});

ipcRenderer.on('show-new-item',(e,args)=>{
    document.location.reload();
});

document.getElementById('print').addEventListener('click',(e)=>{
    window.print();
});
/*
window.addEventListener('beforeunload',()=>{
    console.log(unsavedChanges);
    if (unsavedChanges == 1) {
        return 'Unsaved changes'
    } else {
        window.close();
    }
});
window.addEventListener('beforeunload',(e)=>{
    if (unsavedChanges == 1) {
        e.preventDefault();
        dialog.showMessageBox(mainWindow, {
            title: 'Application is not responding',
            buttons: ['Dismiss'],
            type: 'warning',
            message: 'Application is not responding…',
           });
    } else {
        window.close();
    }
});*/

displayTitles(filenames);
