// sending messages
const messageForm = document.querySelector('.messages form');
const messageContainer = document.querySelector('.received-messages');
const submitMessageButton = document.querySelector('.submit');
const messageInputElement = document.getElementById('inputText');
const chatLinks = document.querySelector('.chat-links');

// uploading images
const uploadImageButton = document.getElementById('submitImage');
const uploadImageForm = document.getElementById('image-form');
const mediaCaptureElement = document.getElementById('mediaCapture');


// template for messages
const MESSAGE_TEMPLATE =
    '<div class="message-container">' +
    '<div class="spacing"><div class="pic"></div></div>' +
    '<div class="message"></div>' +
    '<div class="name"></div>' +
    '</div>';

// loading image url
const LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';

// updates based on user click on chat links
let CURRENT_CLASS = '';
let PREVIOUS_CLASS = '';

// toggle sending message button - user cannot send if no text is present
messageInputElement.addEventListener('keyup', toggleSendButton);
messageInputElement.addEventListener('change', toggleSendButton);

// switching between class groupchats
chatLinks.addEventListener('click', e=> {
    const className = e.target.className;
    if (className) {
        CURRENT_CLASS = className;
        highlightSelectedClass();
        if (CURRENT_CLASS !== PREVIOUS_CLASS){ // only reload chat view if new class is chosen
            messageContainer.innerHTML = '';
            loadMessages(CURRENT_CLASS);
        }
        PREVIOUS_CLASS = CURRENT_CLASS;
    }
})

// triggered when the message form is submitted
messageForm.addEventListener('submit', e => {
    e.preventDefault();
    const message = messageForm.message.value;
    if (CURRENT_CLASS){ // only submit if a current class is selected
        saveMessage(message, CURRENT_CLASS).then(() => {
            messageForm.reset();
            toggleSendButton();
        });
    }
});

// image upload events
uploadImageButton.addEventListener('click', e => {
    e.preventDefault();
    mediaCaptureElement.click();
})

// when file is selected from media picker
mediaCaptureElement.addEventListener('change', e => {
    e.preventDefault();
    const file = e.target.files[0];
    uploadImageForm.reset();
    saveImageMessage(CURRENT_CLASS, file);
})

// saving text message in database
function saveMessage(sentMessage, current_class){
    return db.collection("classes").doc(current_class).collection("messages").add({
        name: getUserName(),
        text: sentMessage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        profilePicUrl: getProfilePhoto()
    }).catch(err => {
        console.log("Error:", err.message);
    });
}

// saving image message to database and cloud storage
function saveImageMessage(current_class, file){
    // upload message to cloud firestore w/ loading icon
    console.log("saving image for class:", current_class);
    db.collection("classes").doc(current_class).collection("messages").add({
        name: getUserName(),
        imageUrl: LOADING_IMAGE_URL,
        profilePicUrl: getProfilePhoto(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(messageRef => {
        // uploading image to cloud storage
        const filePath = 'messages/' + firebase.auth().currentUser.uid + '/' + messageRef.id + '/' + file.name;
        return storage.ref(filePath).put(file).then(fileSnapshot => {
            // generating public url for file
            return fileSnapshot.ref.getDownloadURL().then(url => {
                // replace placeholder w/ image url
                return messageRef.update({
                    imageUrl: url,
                    storageUri: fileSnapshot.metadata.fullPath
                })
            })
        })
    }).catch(err => {
        console.log("Error:", err.message);
    })
}

// loading message for the user
function loadMessages(current_class){
    const query = db.collection("classes").doc(current_class).collection("messages")
        .orderBy('timestamp', 'desc').limit(12);
    query.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === "removed") {
                console.log("deleting message...");
                // deleteMessage(change.doc.id) --> make function
            } else {
                const message = change.doc.data();
                displayMessage(change.doc.id, message.timestamp, message.name,
                    message.text, message.profilePicUrl, message.imageUrl);
            }
        });
    });
}

// Displays a Message in the UI.
function displayMessage(id, timestamp, name, text, profilePicUrl, imageUrl) {
    const div = document.getElementById(id) || createAndInsertMessage(id, timestamp);

    if (profilePicUrl) {
        div.querySelector('.pic').style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
    }
    div.querySelector('.name').textContent = name;
    const messageElement = div.querySelector('.message');

    // if sent item is a text or image
    if (text) {
        messageElement.textContent = text;
        // replace all line breaks w/ <br>
        messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
    } else if (imageUrl) {
        const image = document.createElement('img');
        image.addEventListener('load', function() {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        });
        image.src = imageUrl + '&' + new Date().getTime();
        messageElement.innerHTML = '';
        messageElement.appendChild(image);
    }

    // show card fading-in and scroll to view the new message
    setTimeout(function() {div.classList.add('visible')}, 0.2);
    messageContainer.scrollTop = messageContainer.scrollHeight;
    messageInputElement.focus();
}

function createAndInsertMessage(id, timestamp){
    const container = document.createElement('div');
    container.innerHTML = MESSAGE_TEMPLATE;
    const div = container.firstChild;
    div.setAttribute('id', id);

    // if timestamp is null --> new message is received
    timestamp = timestamp ? timestamp.toMillis() : Date.now();
    div.setAttribute('timestamp', timestamp);

    // where to insert message
    const existingMessages = messageContainer.children;
    if (existingMessages.length === 0) { // first message
        messageContainer.appendChild(div);
    } else {
        let messageListNode = existingMessages[0];
        while (messageListNode) {
            const messageListNodeTime = messageListNode.getAttribute('timestamp');
            if (!messageListNodeTime) {
                throw new Error(`Child ${messageListNode.id} has no 'timestamp' attribute`);
            }
            if (messageListNodeTime > timestamp) {break;}
            messageListNode = messageListNode.nextSibling;
        }
        messageContainer.insertBefore(div, messageListNode)
    }
    return div;
}

// enables/disables submit button if there is a text to send
function toggleSendButton(){
    messageForm.message.value ? submitMessageButton.removeAttribute('disabled'):
        submitMessageButton.setAttribute('disabled', 'true')
}

function highlightSelectedClass(){
    let selectedClass;
    let previousSelectedClass;
    if(CURRENT_CLASS) { selectedClass = document.getElementById('chat-' + CURRENT_CLASS) }
    if(PREVIOUS_CLASS) {previousSelectedClass = document.getElementById('chat-' + PREVIOUS_CLASS)}
    if (selectedClass) { selectedClass.parentElement.classList.add('highlight'); }
    if (previousSelectedClass) { previousSelectedClass.parentElement.classList.remove('highlight'); }
}

function addSizeToGoogleProfilePic(url){
    if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) { return url + '?sz=150'; }
    return url;
}
