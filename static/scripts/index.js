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
let unsavedChanges = 0;
let expecingPaste = 0;
let clipboard = [];
let selectedScripts = [];
let shortcuts = [];

//Function that executes at the same time that the app launches
async function mainProcess(){
    await getTitles();
    await checkProcess();
};

//Async function that gets the titles
async function getTitles() {
    let titles = await store.get('Titles');
    let menu = document.getElementById('menu');
    console.log('Titles: ',titles);
    //TODO: Split this method into two
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
            "ocation (Cmd+W)",
            "arenthesis (Cmd+E)",
            "ransition (Cmd+T)",
            "cene (Cmd+0)",
            "Shift element (Cmd+4)",
            "Zoom In (Cmd+I)",
            "Zoom Out (Cmd+O)"
        ];
    }else{
        shortcuts = [
            "ction (Alt+A)",
            "haracter (Alt+S)",
            "ialog (Alt+D)",
            "ocation (Alt+W)",
            "arenthesis (Alt+E)",
            "ransition (Alt+T)",
            "cene (Alt+0)",
            "Shift element (Alt+Z)",
            "Zoom In (Alt+I)",
            "Zoom Out (Alt+O)"
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
      }else{
        $("#scripts").css("visibility","visible");
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

//Function that gets the id of the current element.
function currentElemIndex(id) {
    let el = document.getElementById(id);
    let arr = content.childNodes;
    currentIndex = Array.prototype.indexOf.call(arr, el);
    console.log('Current index from currentElemIndex: ', currentIndex);
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

//Displays the selected script in the page when the tittle is clicked.
function displayContent(el, div, i1, i2, i3, filepath, filename) {
    el.addEventListener('click', (e) => {
        let elemID = filename.split(" ").join("");
        if (script != '') {
            document.getElementById(script.split(" ").join("") + 'i1').style.display = 'none';
            document.getElementById(script.split(" ").join("") + 'i2').style.display = 'none';
            document.getElementById(script.split(" ").join("")+ 'i3').style.display = 'none';
            document.getElementById('accordion'+script.split(" ").join("")).style = '#111';
            //console.log();
            //document.getElementById('div'+script).style.backgroundColor = '#F55D3E;';
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

//Function that shifts through the different classes for the selected element
function changeClass() {
    let el = content.childNodes[currentIndex];
    let currentClass = el.className;
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
    } else if (param == 1 && scale <= 1.5) {
        scale += 0.1;
        margin += 3;
        content.style.transform = `scale(${scale})`;
        toolbar.style.marginLeft = `${margin}%`;
    } else {
        scale = scale;
    }
};

//------------------------------------------------------- IPC renderer methods -----------------------------------------

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
    content.style.display = 'block';
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
    console.log('Content', content.childNodes[0]);
    counter = file.counter;
    currentIndex = file.dialogs.length - 2;
    if (args.cScript!= '') {
        document.getElementById(args.cScript).style.color = '#1ed760';
    }
});

ipcRenderer.on('saved', (e, args) => {
    //window.confirm(args);
    let title = document.getElementById(script);
    document.getElementById('script-title').style.color = '#1ed760';
    title.style.color = '#1ed760';
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
    //expecingPaste = 0;
    console.log('Current index: ',currentIndex);
    let contentNodes = Array.from(content.childNodes);
    let firstHalf = [];
    let secondHalf = [];
    let newContent = [];
    if(currentIndex >= contentNodes.length-1){
        let firstHalf = contentNodes.slice(0,currentIndex=1);
        newContent = firstHalf.concat(clipboard);
    }else{
        firstHalf = contentNodes.slice(0,currentIndex);
        secondHalf = contentNodes.slice(currentIndex,contentNodes.length);
        newContent = firstHalf.concat(clipboard);
        newContent = newContent.concat(secondHalf);
    }
    console.log('New content', newContent);
    console.log('Clipboard',clipboard);
    clipboard = [];
    //renderElements(newContent,'hi');
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
        console.log('first node',firstNodeId);
        console.log('last node',lastNodeId);
    };
    if(args == 'copy'){
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
        console.log('Selection to copy...', selection);
        console.log('Content nodes',content.childNodes);
        clipboard = selection;
        console.log('Id',selection[0].attributes);
    }else if(args == 'cut'){
        selection = contentNodes.slice(firstNodeId,lastNodeId+1);
        let firstHalf = contentNodes.slice(0,firstNodeId);
        let secondHalf = contentNodes.slice(lastNodeId+1,contentNodes.length);
        let newContents = firstHalf.concat(secondHalf);
        clipboard = newContents
        console.log('New Contents', newContents);
        console.log('Selection to cut...',selection);
        //renderElements(newContents,'hi');
    }else{
        console.log('Begin node index',firstNodeId);
        console.log('End node index', lastNodeId);
    }
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
    document.getElementById('script-title').style.color = 'red';
    title.style.color = "black";
};

document.getElementById('print').addEventListener('click', (e) => {
    let scenes = document.getElementsByClassName('scene');
    document.getElementById('scripts').style.visibility = 'hidden';
    for (let i = 0; i < scenes.length; i++) {
        scenes[i].style.visibility = 'hidden';
    };
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
        window.print();
        document.location.reload();
    };
});

mainProcess();