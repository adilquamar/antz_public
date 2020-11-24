// --------------------------------
// Contains functions used by other js files
// and nav bar toggling
// --------------------------------

// toggle nav bar for mobile use
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav-links');
const navLinks = document.querySelectorAll('.nav-links li')

// app info DOMs
const appInfoButton = document.getElementById('info-button'); // button
const appInfoModal = document.querySelector('.get-suggestion'); // modal

burger.addEventListener('click', () => {
    nav.classList.toggle('nav-active') // toggle nav
    navLinks.forEach((link, index) => { // animate links
        link.style.animation ? link.style.animation = '':
            link.style.animation = `navLinkFade 0.5s ease forwards ${index/7 + 0.5}s`;
    });
    burger.classList.toggle('toggle'); // burger animation
});

function collapsible(coll){
    let i;
    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            let content = this.nextElementSibling;
            if (content.style.maxHeight){
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }
}

function updateChatLinks(classinfo){
    let html = '';
    Object.keys(classinfo).sort().forEach(code => {
        html += `<div class="cl" id="${code}"><a class="${code}" id="chat-${code}">${classinfo[code]}</a></div>`;
    });
    chatLinks.innerHTML = html;
}

// populate classes
function populateClasses(data){
    const userClassCodes = data.classes;
    if (userClassCodes.length > 0){
        const classInfo = {};
        db.collection('classes').where('classCode', 'in', userClassCodes).get().then(querySnapshot => {
            // populate classInfo object
            querySnapshot.forEach(doc => {
                const classData = doc.data();
                classInfo[classData.classCode] = classData.className
            });
            // update HTML
            updateClasses(classInfo);
            updateChatLinks(classInfo);
        })
    } else {
        chatLinks.innerHTML = '<li class="not-found"><a>Add classes to access groupchats</a></li>';
        classList.innerHTML = '<a class="not-found">Add classes with their codes to get started.</a>';
    }
}

// get user profile picture
function getProfilePhoto(){
    return firebase.auth().currentUser.photoURL || '../images/defaultProfPic.png';
}

// get user display name
function getUserName(){
    return firebase.auth().currentUser.displayName;
}

// clearing HTML to give each user a fresh start
function clearHTML(){
    classList.innerHTML = '';
    chatLinks.innerHTML = '';
    currentFriendsContainer.innerHTML = '';
    friendRequestContainer.innerHTML = '';
    messageContainer.innerHTML = '';
}

// generate snackbar
function addSnackbar(message){
    const el = document.createElement('div');
    el.className = "snackbar";
    const snackbar_container = document.getElementById('snackbar-container');
    el.innerHTML = message;
    snackbar_container.append(el)
    el.className = "snackbar show";
    setTimeout(function ()
    {el.className = el.className.replace("snackbar show", "snackbar");}, 3000)
}

// opening app info modal
appInfoButton.addEventListener('click', () => {
    appInfoModal.classList.add('open')
});
appInfoModal.addEventListener('click', e => {
    if (e.target.classList.contains('get-suggestion')){
        appInfoModal.classList.remove('open');
    }
});

