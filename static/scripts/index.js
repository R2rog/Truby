//Importing modules.
const { ipcRenderer,remote} = require('electron');
const { dialog} = require('electron').remote;
const nativeImage = require('electron').nativeImage;
const Store = require('electron-store');
const  $ = require('jquery');
const os = require('os');
const jQuery = require('jquery');

//Object instances
const store = new Store();

//-------------------------------------- Global variables ------------------------------
//Constant html elements.
const content = document.getElementById('page');
//const content = document.getElementById('content');

let directory = './data';
let filenames = 'fs.readdirSync(directory)';
let script = ''; //Current selected script.
let previousElClass = '';
let previousEl = null;
let currentIndex = 0; //Gives the position of the selected element on the NodeList. Not used
let counter = 1; //Gives a unique key to every new element added
let scale = 1.0; //Controls the scale for the content aspect of the page.
let margin = 81; //Initial margin
let unsavedChanges = 0;
let classes = ['character','text', 'dialog','parenthesis', 'location', 'transition','scene'];
let clipboard = [];
let selectedScripts = [];
let shortcuts = [];
let currentElId = 0;
let noBreak = true;

//---------------------------------------- Asyn functions -------------------------------------------
//Function that executes at the same time that the app launches
async function mainProcess(){
    await getTitles();
    await checkProcess();
    //await checkUpdates();
};

//Async function that gets the titles
async function getTitles() {
    let titles = await store.get('Titles');
    let menu = document.getElementById('menu');
    if(titles == undefined){
        titles = await store.set('Titles', []);
    }else{
        titles.map(function (file) {
            let filename = `${file.split('.json')[0]}`;
            let elemID = filename.split(" ").join("");
            let filepath = '../../data/' + filename + '.json';
            let div = document.createElement("div");
            div.setAttribute('id','div'+elemID);
            ul = document.createElement('ul');
            ul.setAttribute('class','menu-submenu accordion-content open');
            let ulId = 'scenes'+elemID;
            ul.setAttribute('id',ulId);
            let li = document.createElement("li");
            li.setAttribute('class','toggle accordion-toggle');
            li.setAttribute('id','accordion'+elemID);
            let text = document.createTextNode(filename);
            let a = document.createElement("a");
            a.setAttribute('class','menu-link');
            a.setAttribute('href', '#');
            a.appendChild(text);
            li.appendChild(a);
            let addOn = document.createElement("div");
            let i1 = document.createElement("i");
            i1.setAttribute('class', 'far fa-copy');
            i1.setAttribute('id', elemID + 'i1');
            i1.addEventListener('click', (e) => {
                changeName();
            });
            let i2 = document.createElement("i");
            i2.setAttribute('class', 'fas fa-trash');
            i2.setAttribute('id', elemID + 'i2');
            i2.addEventListener('click', (e) => {
                deleteScript();
            });
            /*let i3 = document.createElement("a");
            i3.innerHTML = 'S';
            i3.setAttribute('class','fas fa-arrow-down');*/
            let i3 = document.createElement("i");
            i3.setAttribute('class','fas fa-arrow-down');
            //let span = document.createElement('span');
            //span.setAttribute('class','tooltiptext');
            //<a class='noprint'>A</a><span class='tooltiptext'>ction (Alt+A)</span>
            //span.innerText = 'cenes';
            sentence = 'Prueba 2'.replace(/\s+/g, ' ').trim();
            i3.setAttribute('id',elemID+'i3');//Setting the dropdown menu control
            //i3.appendChild(span);
            i3.addEventListener('click',()=>{
              if($(".menu-list .accordion-content").hasClass("active")){
                    $(this).toggleClass("down");
                }else{
                    $(this).css('backgroundColor','black')
                };
              displayScenes();
              let targetElement = '#accordion'+elemID;
              let targetElement2 = "#scenes"+elemID;
              $(targetElement2).toggleClass("open").slideToggle("fast");
              $(targetElement).toggleClass("active-tab").find(".menu-link").toggleClass("active");
              $(".menu-list .accordion-content").not($(".accordion-toggle").next()).slideUp("fast").removeClass("open");
              $(".menu-list .accordion-toggle").not(jQuery(".accordion-toggle")).removeClass("active-tab").find(".menu-link").removeClass("active");
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
            displayContent(a,div, i1, i2,i3, filepath, filename);
        });
    };
    return true;
};

//Verifies the OS that the app is running on
async function checkProcess() {
    //ipcRenderer.send('check-process', 'Verifying the OS...');
    let toolbar = document.getElementById('toolbar');
    let i = 0;
    if(os.platform == 'darwin'){
        shortcuts = [
            "ction (Cmd+3)",
            "haracter (Cmd+1)",
            "ialog (Cmd+2)",
            "eather (Cmd+W)",
            "arenthesis (Cmd+E)",
            "ransition (Cmd+T)",
            "arker (Cmd+0)",
            "Change element (Alt)",
            "Zoom In (Cmd+I)",
            "Zoom Out (Cmd+O)"
        ];
    }else{
        shortcuts = [
            "ction (Alt+3)",
            "haracter (Alt+1)",
            "ialog (Alt+2)",
            "eather (Alt+W)",
            "arenthesis (Alt+E)",
            "ransition (Alt+T)",
            "arker (Alt+A)",
            "Change element (Alt+S)",
            "Zoom In (Ctrl+I)",
            "Zoom Out (Ctlr+O)"
        ];
    };
    shortcuts.forEach(shortcut => {
        text = document.createTextNode(shortcut);
        toolbar.children[i].children[1].appendChild(text);
        i = i+1;
    });
    return toolbar;
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
        $("#scripts").css("visibility","hidden");
        $("#info").css("visibility", "hidden");
      }else{
        $("#scripts").css("visibility","visible");
        $("#info").css("visibility", "visible");
      }
      $("#hamburger-menu").toggleClass("open");
      $("#menu-container .menu-list").toggleClass("active");
      //$("#script-sidebar").css("visibility","visible");
      slideMenu();
      $("body").toggleClass("overflow-hidden");
    });
  });

//Searches and displays all the scenes inside the document.
function displayScenes(){
    let nodes = Array.from(content.childNodes);
    let elemID = script.split(" ").join("");
    let ul = document.getElementById('scenes'+elemID);
    ul.innerHTML = ""; //Cleanning the ul to prevent redundancy
    let div = document.getElementById('div'+elemID);
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
            //ul.style.display = "block";
            ul.appendChild(li);
            div.appendChild(ul);
        };
    });
};

//Displays the selected script in the page when the tittle is clicked.
function displayContent(el, div, i1, i2, i3, filepath, filename) {
    el.addEventListener('click', (e) => {
        let elemID = filename.split(" ").join("");
        if (script != '') {
            document.getElementById(script.split(" ").join("") + 'i1').style.display = 'none';
            document.getElementById(script.split(" ").join("") + 'i2').style.display = 'none';
            document.getElementById(script.split(" ").join("")+ 'i3').style.display = 'none';
            document.getElementById('accordion'+script.split(" ").join("")).style = '#111';
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
            ipcRenderer.send('switch-scripts', {
                selectedScript: filename,
                currentScript: ''
            });
            document.getElementById('div'+elemID).style.backgroundColor = '#F55D3E;';
        };
        script = el.innerHTML;
        document.getElementById('script-title').innerHTML = script;
        document.getElementById('accordion'+elemID).style.backgroundColor = '#F55D3E';
        i1.style.display = 'block';
        i2.style.display = 'block';
        i3.style.display = 'block';
    });
};

//--------------------------------------- Regular mode insertion methods --------------------------------------
//Function that gets the id of the current element.
function currentElemIndex(id) {
    /*
    let arr = content.childNodes;
    currentIndex = Array.prototype.indexOf.call(arr, el);*/
    let currentEl = document.getElementById(id);
    preiviousEl = currentEl;
    previousElClass = currentEl.className;
    currentElId = id;
};

//Function that creates a character html tag
function newElement(type) {
    counter = counter + 1;
    id = counter.toString();
    getId = "currentElemIndex(" + id + ")";
    let newElement = document.createElement('DIV');
    newElement.setAttribute('class', type);
    newElement.setAttribute('id', id);
    newElement.setAttribute('data-placeholder', 'type');
    newElement.setAttribute("onclick", getId);
    switch(type){
        case 'parenthesis':
            newElement.innerText = '()';
            break;
        case 'scene':
            newElement.setAttribute('tabindex', 0);
            break;
    };
    insertElement(newElement,id,type);
};

function insertElement(newElement,id,type) {
    content.focus();
    console.log('Current el:',document.getElementById(currentElId));
    console.log('New element',newElement);
    console.log('previous el',previousEl);
    let currentEl = document.getElementById(currentElId);
    //if(currentEl==null) currentEl = previousEl;
    if(currentEl == null){
        let selObj = document.getSelection();
        selObj.removeAllRanges();
    }else{
        previousEl = currentEl;
        previousElClass = currentEl.className;
        currentEl.insertAdjacentElement('afterend',newElement);
    };
    let range = new Range();//This section is the one that allows the cursor to get placed inside the new html element
    let sel = window.getSelection();
    range.setStartBefore(newElement);
    range.isCollapsed = true;
    sel.removeAllRanges();
    sel.addRange(range);
    currentElId = newElement.id;
};

//Only used in the paste function to refresh the page
function renderElements(arr, newElement) {
    content.innerHTML = "";
    arr.forEach(dialog => {
        content.innerHTML += dialog.outerHTML;
    });
};

//------------------------------------- No Breaks mode insertion functions -------------------------------------
function noBreakFunc(){//Function that gives style to the script without the user input.
    let el = document.getElementById(currentElId);
    console.log('Current el',el);
    console.log('Previous el class:',previousElClass);
    let text = el.innerText;
    let transitions = ['FADE', 'FADE', 'CUT ', 'DISS','fade','cut ','diss'];
    let heathers = ['INT.','EXT.','INT ','EXT ', 'int.', 'ext.', 'ext ','int '];
    let subText = text.substr(0,4);
    if(text[0]=='!'){
        el.setAttribute('class','scene');
        el.setAttribute('tabindex', 0);
    }else if(text[0]== '('){
        el.setAttribute('class','parenthesis');
    }else if (heathers.includes(subText)){
        el.setAttribute('class','location');
    }else if(transitions.includes(subText)){
        el.setAttribute('class','transition');
    }else if(previousElClass == 'character'||previousElClass == 'parenthesis'){
        el.setAttribute('class','dialog');
    }else if(countWords(text)<=2){
        el.setAttribute('class','character');
    }else{
        el.setAttribute('class','text');
    };
};

function countWords(text) {
    text = text.replace(/(^\s*)|(\s*$)/gi,"");
    text = text.replace(/[ ]{2,}/gi," ");
    text = text.replace(/\n /,"\n");
    return text.split(' ').length;
 }

//Function that shifts through the different classes for the selected element
function changeClass() {
    let el = document.getElementById(currentElId);
    let currentClass = el.className;
    let i = classes.indexOf(currentClass);
    if (i + 1 >= classes.length) i = -1;
    el.setAttribute('class', classes[i + 1]);
    el.setAttribute('data-placeholder',classes[i + 1]);
};

/*------------------------------------- Internal script modification --------------------*/
function deleteScript() {
    dialog.showMessageBox({
        type: 'question',
        buttons: ['Delete', 'Cancel'],
        defaultId: 0,
        title: 'Confirmation required',
        message: `Are you sure you want to delete ${script}?`,
        icon: nativeImage.createFromPath('./static/images/feather1.png'),
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
            icon: nativeImage.createFromPath('./static/images/feather1.png'),
            detail: 'This will ensure that all your progress gets saved',
        });
    } else {
        ipcRenderer.send('change-name', 'Changing name ...');
    };    

};

//Adding a new file from the main window
function addDoc() {
    ipcRenderer.send("addDoc", "Adding new doc");
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

function zoom(param) {
    let toolbar = document.getElementById('toolbar');
    let zoomContent = document.getElementById('content');
    if (param == 0 && scale >= 0.9) {
        scale -= 0.1;
        margin -= 3;
        zoomContent.style.transform = `scale(${scale})`;
        toolbar.style.marginLeft = `${margin}%`;
    } else if (param == 1 && scale <= 1.5) {
        scale += 0.1;
        margin += 3;
        zoomContent.style.transform = `scale(${scale})`;
        toolbar.style.marginLeft = `${margin}%`;
    } else {
        scale = scale;
    }
};

//------------------------------------------------------- ipcRenderer.on methods -----------------------------------------

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
        case 'parenthesis':
            newElement('parenthesis');
            break;
        case 'text':
            newElement('text');
            break;
        case 'transition':
            newElement('transition');
            break;
        case 'scene':
            newElement('scene');
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
    let arr = content.childNodes
    let dialogs = []
    arr.forEach(element => {
        dialogs.push(element.outerHTML);
    });
    if(args=='copy'){
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
    //content.style.display = 'inline-block';TODO: Uncomment this line after experimentation
    document.getElementById('content').style.display = 'inline-block';
    selectedScripts += 1;
    document.getElementById('img-placeholder').style.display = 'none';
    //Reseting the values for a new file.
    counter = 0;
    currentIndex = 0;
    //Refreshing to the latest version of an script.
    content.innerHTML = "";
    let i = 0;
    //Filling the script elements into content HTML
    file.dialogs.forEach(dialog => {
        content.innerHTML += dialog;
        if(content.childNodes[i].className == 'scene'){
            content.childNodes[i].style.visibility = 'visible';
            i = i+1;
        }else{
            i = i+1;
        }
    });
    counter = file.counter;
    currentIndex = file.dialogs.length - 2;
    if (args.cScript!= '') {
        document.getElementById("script-title").style.color = '#1ed760';
        document.getElementById(args.cScript).style.color = '#1ed760';
    }
    unsavedChanges = 0;
});

ipcRenderer.on('saved', (e, args) => {
    let title = document.getElementById(script);
    document.getElementById('script-title').style.color = 'aquamarine';
    title.style.color = 'aquamarine';
    unsavedChanges = 0;
    //script = selectedScript;TODO: Check this call
});

ipcRenderer.on('search',(e,args)=>{
    document.getElementById('search-module').style.visibility = 'visible';
});

ipcRenderer.on('quit', (e, args) => {
    window.alert(args);
});

//Custom paste function to prevent redundancy
ipcRenderer.on('paste',(e,args)=>{
    let contentNodes = Array.from(content.childNodes);
    let el = document.getElementById(currentElId);
    currentIndex = Array.prototype.indexOf.call(contentNodes, el);
    console.log('paste in current index',currentIndex);
    let firstHalf = [];
    let secondHalf = [];
    let newContent = [];
    if(currentIndex >= contentNodes.length-1){
        newContent = contentNodes.concat(clipboard);
    }else{
        firstHalf = contentNodes.slice(0,currentIndex+1);
        secondHalf = contentNodes.slice(currentIndex+1,contentNodes.length);
        newContent = firstHalf.concat(clipboard);
        newContent = newContent.concat(secondHalf);
    }
    //clipboard = [];
    unsavedChanges == 1;
    renderElements(newContent,'hi');
});

//Custom made cut,copy operation to prevent redundancy
ipcRenderer.on('get-selection',(e,args)=>{
    let selObj = window.getSelection();
    let contentNodes = Array.from(content.childNodes);
    let firstNode = selObj.anchorNode.parentElement;
    let firstNodeId = contentNodes.indexOf(firstNode);
    let lastNode = selObj.focusNode.parentElement;
    let lastNodeId = contentNodes.indexOf(lastNode);
    let selection =  [];
    if(firstNodeId>lastNodeId){
        tempFirst = firstNodeId;
        firstNodeId = lastNodeId;
        lastNodeId = tempFirst;
    };
    clipboard = [];
    if(args == 'copy'){
        console.log('copy elements');
        clipboard = [];//Cleaning the clipboard
        for (index = firstNodeId; index <= lastNodeId; index++){
            let newElement = document.createElement("DIV");
            let id = Math.floor((Math.random() * 1000000) + 10000);
            let getId = "currentElemIndex(" + id + ")";
            newElement.setAttribute('class', contentNodes[index].attributes[0].value);
            newElement.setAttribute('id',id );
            newElement.setAttribute('tabindex', 0);
            newElement.innerText = contentNodes[index].innerText;
            newElement.setAttribute('data-placeholder', contentNodes[index].attributes[0].value);
            newElement.setAttribute('contentEditable', 'true');
            newElement.setAttribute("onclick", getId);   
            selection.push(newElement);
        }
        clipboard = selection;
    }else if(args == 'cut'){
        console.log('cut elements');
        clipboard = []; //Cleaning clipboard
        selection = contentNodes.slice(firstNodeId,lastNodeId+1);
        let firstHalf = contentNodes.slice(0,firstNodeId);
        let secondHalf = contentNodes.slice(lastNodeId+1,contentNodes.length);
        let newContents = firstHalf.concat(secondHalf);
        clipboard = selection;
        renderElements(newContents,'hi');
        unsavedChanges == 1;
    }else{
        console.log('Begin node index',firstNodeId);
        console.log('End node index', lastNodeId);
    }
});

ipcRenderer.on('show-new-item', (e, args) => {
    document.location.reload();
});

ipcRenderer.on('update_available', () => {
    ipcRenderer.removeAllListeners('update_available');
    message.innerText = 'A new update is available. Downloading now...';
    notification.classList.remove('hidden');
  });

ipcRenderer.on('update_downloaded', () => {
    ipcRenderer.removeAllListeners('update_downloaded');
    message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
    restartButton.classList.remove('hidden');
    notification.classList.remove('hidden');
});


//------------------------------------------ DOM related events ----------------------------------
//Function that detects changes on the document. 
document.getElementById('content').addEventListener('keypress', e =>{
    if(e.keyCode != 91 || e.key=='Control'){ //Escaping ctrl/cmd keyboard events
        unsavedChanges = 1;
        ipcRenderer.send('unsaved-changes', { // alerting ./component/Menu.js
            content: 1,
            scripts: selectedScripts
        });
        let title = document.getElementById(script);
        document.getElementById('script-title').style.color = 'red';
        title.style.color = "black";
    };
});

document.getElementById('content').addEventListener('click',e =>{
    unsavedChanges = 1;
    ipcRenderer.send('unsaved-changes', { // alerting ./component/Menu.js
        content: 1,
        scripts: selectedScripts
    });
    let title = document.getElementById(script);
    document.getElementById('script-title').style.color = 'red';
    title.style.color = "black";
});

//Specific keyboard events that are not keybindings
document.getElementById('content').onkeypress = e =>{
    let keyCode = e.key;
    let currentEl = document.getElementById(currentElId);
    let noBreak= document.getElementById('mode').checked;
    if(currentEl == null)currentEl=previousEl;
    if(keyCode=='Enter' && noBreak==true){
        e.preventDefault();
        if(classes.includes(currentEl.className)){ //This bit prevents the app to parse an element that already has a class.
            newElement('neutral');
        }else{
            noBreakFunc();
            newElement('neutral');
        };
        unsavedChanges = 1;
    }else if(keyCode=='Enter' && noBreak==false){
        e.preventDefault();
        if(currentEl.className == 'character'||currentEl.className == 'parenthesis') newElement('dialog');
        else if(currentEl.className == 'dialog') newElement('character');
        else newElement('text');
        unsavedChanges = 1;
    };
};

//This section handles the enter event so it parses the file element correctly
document.getElementById('content').onkeyup = e =>{
    let keyCode = e.key;
    if(process.platform=='darwin'){
        if(keyCode=='Alt'){
            e.preventDefault();
            changeClass();
            unsavedChanges = 1;
        };  
    };
};


document.getElementById('print').addEventListener('click', (e) => {
    let scenes = document.getElementsByClassName('scene');
    document.getElementById('scripts').style.visibility = 'hidden';
    document.getElementById('info').style.visibility = 'hidden';
    for (let i = 0; i < scenes.length; i++) {
        scenes[i].style.visibility = 'hidden';
    };
    console.log('Unsaved changes', unsavedChanges);
    if (unsavedChanges == 1) {
        dialog.showMessageBox({
            type: 'question',
            buttons: ['Ok'],
            defaultId: 0,
            title: 'Unsaved changes',
            message: `Please save the current script before printing`,
            icon: nativeImage.createFromPath('./static/images/feather1.png'),
            detail: 'This will ensure that all your progress gets saved',
        });
    } else {
        window.print();
    };
});

/*Handles the event when the user erase one or more elements through selection
document.onselectionchange = () => {
    let selObj = document.getSelection();
    let contentNodes = Array.from(content.childNodes);
    let lastNode = selObj.focusNode.parentElement;
    let lastNodeId = contentNodes.indexOf(lastNode);
    let tempPreviousEl = contentNodes[lastNodeId-1]
    let range = new Range();//This section is the one that allows the cursor to get placed inside the new html element
    //currentElId = tempPreviousEl.id;
    //TODO: Only set the previousEl and insertElement function will do the rest
};*/

//------------------------------------ Window related events --------------------------------------
//Method that checks if main window is focused so that the global shortcuts dont intervene with other apps
window.addEventListener('focus',e =>{
    ipcRenderer.send('window-focus',1);
});

window.addEventListener("blur", e=>{
    ipcRenderer.send('window-focus',0);
});

window.onafterprint = (event) => {
    let scenes = document.getElementsByClassName('scene');
    //content.style.padding = 0;
    document.getElementById('info').style.visibility = 'visible';
    for (let i = 0; i < scenes.length; i++) {
        scenes[i].style.visibility = 'visible';
    };
};

mainProcess();
