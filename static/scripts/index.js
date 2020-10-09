//Importing modules.
const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');
const { title, defaultApp } = require('process');

// Global variables
const content = document.getElementById('content');
let directory = './data';
let filenames= fs.readdirSync(directory);
let filename = '';
let currentIndex = 0; //Gives the position of the selected element on the NodeList
let counter = 0;//Guves a unique key to every new element added


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
document.getElementById('content').onkeyup = e => { // alerting system that files have been updated
    if(!document.getElementById('script-title').innerText.endsWith("*")){ 
        document.getElementById('script-title').innerText += ' *' // add asterisk when starting to edit, BUT only once
    }; 
    ipcRenderer.send('unsaved-changes', { // alerting ./component/Menu.js
        content: 1
    })
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
        nodes.splice(currentIndex+2,0,newElement);
        renderElements(nodes,newElement);
    }
    if (currentIndex != 0) {
        currentIndex += currentIndex +2;
    }
    console.log('Nodes post-copy: ',nodes);
};

//Function that adds elements when they are not located in the last position of the Node List.
function renderElements(arr,newElement){
    content.innerHTML = "";
    arr.forEach(dialog => {
        content.innerHTML += dialog.outerHTML; 
    });
    newElement.style('border-color','black');//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
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
    });
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

ipcRenderer.on('request-elements',(e,args)=>{
    let arr = content.childNodes
    let dialogs = []
    arr.forEach(element => {
      dialogs.push(element.outerHTML);
    });
    ipcRenderer.send('send-elements',{
        elements: dialogs,
        fileDir: './data/' + filename + '.json',
        numberOfElements: counter
    });
});

ipcRenderer.on('Saved',(e,args)=>{
    /*el = document.createElement("p");
    text = document.createTextNode(args);
    el.appendChild(text)
    el.setAttribute("id", "flash");
    document.querySelector('body').prepend(el)
    setTimeout(function() { // remove notification after 1 second
    document.querySelector('body').removeChild(el);
    document.title = document.title.slice(0,-1) // remove asterisk from title
    }, 1000);*/
    window.confirm(args);
    let scriptTitle = document.getElementById('script-title');
    scriptTitle.innerText =scriptTitle.slice(0,-1) // remove asterisk from title
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

displayTitles(filenames);
