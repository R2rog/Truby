//Importing modules.
const { ipcRenderer,remote} = require('electron');
const { dialog} = require('electron').remote;
const nativeImage = require('electron').nativeImage;
const Store = require('electron-store');
const  $ = require('jquery');
const jQuery = require('jquery');
//Object instances
const store = new Store();

// Global variables
const content = document.getElementById('content');
let directory = './data';
let filenames = 'fs.readdirSync(directory)';
let script = ''; //Current selected script.
let currentIndex = 0; //Gives the position of the selected element on the NodeList
let counter = 0; //Gives a unique key to every new element added
let classes = ['text', 'character', 'dialog', 'location', 'transition','parenthesis','scene'];
let scale = 1.0; //Controls the scale for the content aspect of the page.
let margin = 81; //Initial margin
let selectedScripts = [];
let unsavedChanges = 0;
let shortcuts = [];

//TODO: Add a scene label that helps the user navigate through the many scenes the script has

//Verifies the OS that the app is running on
function checkProcess() {
    ipcRenderer.send('check-process', 'Verifying the OS...');
};

//Menu handler using jQuery
$(function() {
    function slideMenu() {
      let activeState = $("#menu-container .menu-list").hasClass("active");
      $("#menu-container .menu-list").animate({left: activeState ? "0%" : "-100%"}, 400);
    }
    $("#menu-wrapper").click(function(event) {
      event.stopPropagation();
      activeState = $("#menu-container .menu-list").hasClass("active");
      if(activeState==true){
        $("#scripts").css("color","white");
      }else{
        $("#scripts").css("color","#F55D3E");
      }
      $("#hamburger-menu").toggleClass("open");
      $("#menu-container .menu-list").toggleClass("active");
      //$("#script-sidebar").css("visibility","visible");
      slideMenu();
      $("body").toggleClass("overflow-hidden");
    });
  });

/*Old navbar controller
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
}*/

//Searches and displays all the scenes inside the document.
function displayScenes(){
    let nodes = Array.from(content.childNodes);
    let ul = document.getElementById('scenes'+script);
    ul.innerHTML = ""; //Cleanning the ul to prevent redundancy
    //let scenes = document.getElementById('sceneTitles');
    //let firstNode = document.createElement('li');
    //firstNode.innerText = 'Scenes';
    //scenes.appendChild(firstNode);
    let div = document.getElementById('div'+script);
    nodes.forEach(element => {
        if (element.className == 'scene') {
            let text = '';
            let li = document.createElement("li");
            let a = document.createElement("a");
            let id = element.id;
            text = document.createTextNode(element.innerText);
            a.appendChild(text);
            a.setAttribute('class', 'head');
            li.appendChild(a);
            li.addEventListener('click', (e) => {
                let selectedScene = document.getElementById(id);
                selectedScene.focus({preventScroll:false});
            });
            ul.appendChild(li);
            div.appendChild(ul);
        };
    });
    //document.getElementById('scenes').style.height = '100hv';
    //scenes.style.marginTop = '2.70rem';
};

//Function that gets the id of the current element.
function currentElemIndex(id) {
    let el = document.getElementById(id);
    let arr = content.childNodes;
    currentIndex = Array.prototype.indexOf.call(arr, el);
    console.log('Current index from currentElemIndex: ', currentIndex);
};

//Function that controls the insertion of new elements
function insertElement(newElement) {
    let nodes = Array.from(content.childNodes);
    if (currentIndex + 1 == content.childNodes.length) {
        content.appendChild(newElement);
    } else {
        console.log('Current Index from insert element: ', currentIndex);
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
    if (type == 'parenthesis') {
        newElement.innerText = '()';
    }
    insertElement(newElement);
};

function searchText(action){
    let text = document.getElementById('searchBar').value;
    switch (action) {
        case "search":
            ipcRenderer.send('find-in-page',{text,action});
            break;
        case "delete":
            document.getElementById('search-module').style.visibility = 'hidden';
            ipcRenderer.send('find-in-page',{text,action});
            break;
    };
};

//Async function that gets the titles
async function getTitles() {
    let titles = await store.get('Titles');
    let menu = document.getElementById('menu');
    console.log('Titles: ',titles);
    if(titles == undefined){
        titles = await store.set('Titles', []);
    }else{
        titles.map(function (file) {
            let filename = `${file.split('.json')[0]}`;
            let filepath = '../../data/' + filename + '.json';
            let div = document.createElement("div");
            div.setAttribute('id','div'+filename);
            ul = document.createElement('ul');
            ul.setAttribute('class','menu-submenu accordion-content');
            let ulId = 'scenes'+filename;
            ul.setAttribute('id',ulId);
            let li = document.createElement("li");
            li.setAttribute('class','toggle accordion-toggle');
            li.setAttribute('id','accordion'+filename);
            let text = document.createTextNode(filename);
            let a = document.createElement("a");
            a.setAttribute('class','menu-link');
            a.setAttribute('href', '#');
            a.appendChild(text);
            li.appendChild(a);
            let addOn = document.createElement("div");
            let i1 = document.createElement("i");
            i1.setAttribute('class', 'far fa-copy');
            i1.setAttribute('id', filename.toString() + 'i1');
            i1.addEventListener('click', (e) => {
                changeName();
            });
            let i2 = document.createElement("i");
            i2.setAttribute('class', 'fas fa-trash');
            i2.setAttribute('id', filename.toString() + 'i2');
            i2.addEventListener('click', (e) => {
                deleteScript();
            });
            let i3 = document.createElement("i");
            i3.setAttribute('class','fas fa-arrow-down');
            i3.setAttribute('id',filename.toString()+'i3');//Setting the dropdown menu control
            i3.addEventListener('click',()=>{
                let targetElement = '#accordion'+script;
                if($(".menu-list .accordion-content").hasClass("active")){
                    $(this).toggleClass("down");
                }else{
                    displayScenes();
                    //$("#Prueba1i3").rotate(180);
                };
              $(targetElement).next().toggleClass("open").slideToggle("fast");
              $(targetElement).toggleClass("active-tab").find(".menu-link").toggleClass("active");
          
              $(".menu-list .accordion-content").not($(targetElement).next()).slideUp("fast").removeClass("open");
              $(".menu-list .accordion-toggle").not(jQuery(targetElement)).removeClass("active-tab").find(".menu-link").removeClass("active");
            });
            addOn.setAttribute('class', 'title-tools');
            addOn.appendChild(i1);
            addOn.appendChild(i2);
            addOn.appendChild(i3);
            a.setAttribute('id', filename);
            //el.setAttribute('class', 'side-title');
            li.appendChild(addOn);
            a.appendChild(text);
            li.appendChild(a);
            div.appendChild(li);
            div.appendChild(ul);
            menu.appendChild(div);
            //document.getElementById('titles').appendChild(el);
            displayContent(a, i1, i2,i3, filepath, filename);
        });
        console.log('Titles: ',titles);
    }
    /*try {
        titles = await store.get('Titles');
        //let titles = store.get('Titles');
    } catch (error) {
        titles = await store.set('Titles', { 'titles': [], });
        console.log(error);
    }*/
};

//Displays the titles for the available scripts
/*function displayTitles(filenames) {
    //let titles = store.get('Titles');
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
};*/

function deleteScript() {
    dialog.showMessageBox({
        type: 'question',
        buttons: ['Delete', 'Cancel'],
        defaultId: 0,
        title: 'Confirmation required',
        message: `Are you sure you want to delete ${script}?`,
        icon: nativeImage.createFromPath('./static/images/feather.png'),
        detail: 'The script will be completley removed from the internal file system',
    }).then(box => {
        if (box.response == 0) {
            ipcRenderer.send('delete-script', {
                filename: script
            });
        } else {
            console.log(box.response);
        }
    }).catch(err => {
        console.log(err)
    });
};

function changeName() {
    if (unsavedChanges == 1) {
        dialog.showMessageBox({
            type: 'question',
            buttons: ['Ok'],
            defaultId: 0,
            title: 'Unsaved changes',
            message: `Please save the current script before creating a copys`,
            icon: nativeImage.createFromPath('./static/images/feather.png'),
            detail: 'This will ensure that all your progress gets saved',
        });
    } else {
        ipcRenderer.send('change-name', 'Changing name ...');
    };    

};

/*function createCopy() {
    if (unsavedChanges == 1) {
        dialog.showMessageBox({
            type: 'question',
            buttons: ['Ok'],
            defaultId: 0,
            title: 'Unsaved changes',
            message: `Please save the current script before creating a copys`,
            icon: nativeImage.createFromPath('./static/images/feather.png'),
            detail: 'This will ensure that all your progress gets saved',
        });
    } else {
        ipcRenderer.send('create-copy', 'Creating copy... ');
    };    
}*/

//Displays the selected script in the page when the tittle is clicked.
function displayContent(el, i1, i2, i3, filepath, filename) {
    el.addEventListener('click', (e) => {
        if (script != '') {
            console.log('False');
            document.getElementById(script + 'i1').style.display = 'none';
            document.getElementById(script + 'i2').style.display = 'none';
            document.getElementById(script + 'i3').style.display = 'none';
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
        } else {
            console.log(filename);
            ipcRenderer.send('switch-scripts', {
                selectedScript: filename,
                currentScript: ''
            });
        };
        script = el.innerHTML;
        document.getElementById('script-title').innerHTML = script;
        i1.style.display = 'block';
        i2.style.display = 'block';
        i3.style.display = 'block';
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
    el.innerText = classes[i+1];
};

//Adding a new file from the main window
function addDoc() {
    ipcRenderer.send("addDoc", "Adding new doc");
};

function zoom(param) {
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

//Sends the script contents to the copy method in the main process
ipcRenderer.on('request-elements', (e, args) => {
    console.log('Args from the backend',args);
    console.log('Requesting elements from copy method...');
    let arr = content.childNodes
    let dialogs = []
    arr.forEach(element => {
        dialogs.push(element.outerHTML);
    });
    if(args=='copy'){
        console.log('Copiando');
        ipcRenderer.send('send-elements-copy', {
            scriptTitle: script,
            dialogs: dialogs,
            fileDir: './data/' + script + '.json',
            counter: counter
        });
    }else{
        ipcRenderer.send('send-elements-save', {
            scriptTitle: script,
            dialogs: dialogs,
            fileDir: './data/' + script + '.json',
            counter: counter
        });
    }
    
});

ipcRenderer.on('switch-scripts', (e, args) => {
    //let prevScript = args.prevScript;
    let file = args.selectedScript;
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
    if (args.cScript!= '') {
        document.getElementById(args.cScript).style.color = '#1ed760';
    }
});

ipcRenderer.on('saved', (e, args) => {
    //window.confirm(args);
    let title = document.getElementById(script);
    title.style.color = '#1ed760';
    unsavedChanges = 0;
    //script = selectedScript;
});

ipcRenderer.on('search',(e,args)=>{
    document.getElementById('search-module').style.visibility = 'visible';
});

ipcRenderer.on('check-process', (e, args) => {
    let toolbar = document.getElementById('toolbar');
    if (args == 'darwin') {
        shortcuts = [
            "<div class='tool' 'id'='action' onclick=newElement('text')><a class='noprint'>A</a><span class='tooltiptext'>ction (Cmd+3)</span></div>",
            "<div class='tool' onclick=newElement('character')><a class='noprint'>C</a><span class='tooltiptext'>haracter (Cmd+1)</span></div>",
            "<div class='tool' onclick=newElement('dialog')><a class='noprint'>D</a><span class='tooltiptext'>ialog (Cmd+2)</span></div>",
            "<div class='tool' onclick=newElement('location')><a class='noprint'>L</a><span class='tooltiptext'>ocation (Cmd+W)</span></div>",
            "<div class='tool' onclick=newElement('parenthesis')><a class='noprint'>P</a><span class='tooltiptext'>arenthesis (Cmd+E)</span></div>",
            "<div class='tool' onclick=newElement('transition')><a class='noprint'>T</a><span class='tooltiptext'>ransition (Cmd+T)</span></div>",
            "<div class='tool' onclick=newElement('scene')><a class='noprint'>S</a><span class='tooltiptext'>cene (Cmd+0)</span></div>",
            "<div class='tool' onclick=changeClass()><a class='noprint'>-></a><span class='tooltiptext'>Shift element (Cmd+Z)</span></div>",
            "<div class='tool' onclick=zoom(1)><a class='noprint'>+</a><span class='tooltiptext'>Zoom In (Cmd+I)</span></div>",
            "<div class='tool' onclick=zoom(0)><a class='noprint' >-</a><span class='tooltiptext'>Zoom Out (Cmd+O)</span></div>"
        ]
    } else {
        shortcuts = [
            "<div class='tool' onclick=newElement('text')><a class='noprint'>A</a><span class='tooltiptext'>ction (Alt+A)</span></div>",
            "<div class='tool' onclick=newElement('character')><a class='noprint'>C</a><span class='tooltiptext'>haracter (Alt+S)</span></div>",
            "<div class='tool' onclick=newElement('dialog')><a class='noprint'>D</a><span class='tooltiptext'>ialog (Alt+D)</span></div>",
            "<div class='tool' onclick=newElement('location')><a class='noprint'>L</a><span class='tooltiptext'>ocation (Alt+W)</span></div>",
            "<div class='tool' onclick=newElement('parenthesis')><a class='noprint'>P</a><span class='tooltiptext'>arenthesis (Alt+E)</span></div>",
            "<div class='tool' onclick=newElement('transition')><a class='noprint'>T</a><span class='tooltiptext'>ransition (Alt+T)</span></div>",
            "<div class='tool' onclick=changeClass()><a class='noprint'>-></a><span class='tooltiptext'>Shift element (Alt+Z)</span></div>",
            "<div class='tool' onclick=zoom(1)><a class='noprint'>+</a><span class='tooltiptext'>Zoom In (Alt+I)</span></div>",
            "<div class='tool' onclick=zoom(0)><a class='noprint' >-</a><span class='tooltiptext'>Zoom Out (Alt+O)</span></div>"
        ]
    };
    shortcuts.forEach(shortcut => {
        toolbar.innerHTML += shortcut;
    });
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
    if (unsavedChanges == 1) {
        dialog.showMessageBox({
            type: 'question',
            buttons: ['Ok'],
            defaultId: 0,
            title: 'Unsaved changes',
            message: `Please save the current script before printing`,
            icon: nativeImage.createFromPath('./static/images/feather.png'),
            detail: 'This will ensure that all your progress gets saved',
        });
    } else {
        content.style.padding = 0;
        closeNav();
        window.print();
        document.location.reload();
    };
});
checkProcess();
getTitles();
//displayTitles(filenames);