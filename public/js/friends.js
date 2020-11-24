// friends section on main content page
const currentFriendButton = document.getElementById('current-friends'); // show current friends button
const friendRequestsButton = document.getElementById('friend-requests'); // friend requests button
const currentFriendsContainer = document.querySelector('.current-friends-container');
const friendRequestContainer = document.querySelector('.friend-requests-container');

const getUserInfo = functions.httpsCallable('getUserInfo');

// display current friends
currentFriendButton.addEventListener('click', () => {

    friendRequestsButton.classList.remove('highlight');
    currentFriendButton.classList.add('highlight');
    friendRequestContainer.classList.remove('open')
    currentFriendsContainer.classList.add('open')

    currentFriendsContainer.innerHTML = '<div class="spinner"></div>'; // display loader
    db.collection('users').doc(firebase.auth().currentUser.uid).onSnapshot(doc => { // getting user's friends
        if (doc.data().friends.length > 0) { // gather friend information
            getUserInfo({members:doc.data().friends}).then(usernames => { // load individually for each friend later on
                let html = '';
                Object.keys(usernames.data).sort().forEach(uid => {
                    html += `
                    <li>
                        <button type="button" class="friends collapsible" id="hvr-shutter-out-horizontal">
                                                            ${usernames.data[uid]["displayName"]}</button>
                        <div class="friend-info" id="${uid}">
                            <div class="friend-contact-${uid}"><br><br><br></div>
                            <br><img src=${usernames.data[uid]["photoURL"]} alt="Friend's Profile Picture">
                            <br><button id="remove-friend" class="remove-friend">Remove Friend</button>
                        </div>
                    </li>`;
                });
                currentFriendsContainer.innerHTML = html;
                collapsible(document.getElementsByClassName("friends collapsible"));
            });
        } else {
            currentFriendsContainer.innerHTML = '<a class="not-found">Add friends from classes</a>'
        }
    });
})

// display friend requests
friendRequestsButton.addEventListener('click', () =>{

    friendRequestsButton.classList.add('highlight');
    currentFriendButton.classList.remove('highlight');
    friendRequestContainer.classList.add('open')
    currentFriendsContainer.classList.remove('open')


    friendRequestContainer.innerHTML = '<div class="spinner"></div>';
    db.collection('users').doc(firebase.auth().currentUser.uid).onSnapshot(doc => {
        const friendRequestList = doc.data().friendRequests
        getUserInfo({members:friendRequestList}).then(usernames => {
            let html = '';
            Object.keys(usernames.data).sort().forEach(uid => {
                html += `
                <div class="friend-request" id="${uid}">
                    <a>${usernames.data[uid]["displayName"]}</a>
                    <button id="accept">Accept Request</button>
                    <button id="ignore">Ignore</button>
                </div>`;
            });
            html ? friendRequestContainer.innerHTML = html:
                friendRequestContainer.innerHTML = '<a class="not-found">No Friend Requests</a>'
        });
    });
});


currentFriendsContainer.addEventListener('click', e => {
   if (e.target.className === 'remove-friend'){ // remove friends
       const friendID = e.target.parentElement.id;
       db.collection('users').doc(firebase.auth().currentUser.uid).update({
           friends: firebase.firestore.FieldValue.arrayRemove(friendID)
       }).then(() => {
           db.collection('users').doc(friendID).update({
               friends: firebase.firestore.FieldValue.arrayRemove(firebase.auth().currentUser.uid)
           })
       })

   } else if (e.target.id === "hvr-shutter-out-horizontal"){ // load in contact info
       const friendID = e.target.nextSibling.nextSibling.id;
       const contactInfo = document.querySelector(`.friend-contact-${friendID}`);

       if (contactInfo.innerHTML === "<br><br><br>") {
           contactInfo.innerHTML = '<div class="spinner"></div>';
           db.collection('users').doc(friendID).get().then(doc => {
               contactInfo.innerHTML = '';
               doc.data().phoneNumber ? contactInfo.innerHTML += `<br><a>Phone Number: ${doc.data().phoneNumber}</a>`:
                   contactInfo.innerHTML += '<br><a>No phone number given</a>'
               doc.data().snapchat ? contactInfo.innerHTML += `<br><a>Snapchat: ${doc.data().snapchat}</a>`:
                   contactInfo.innerHTML += '<br><a>No snapchat given</a>'
           });
       }
   }
});

friendRequestContainer.addEventListener('click', e => {
    if (e.target.id === "accept") { // accept friend request
        const friendID = e.target.parentElement.id; // user who has sent the request

        // updating current user's parameters
        db.collection('users').doc(firebase.auth().currentUser.uid).update({
            friendRequests: firebase.firestore.FieldValue.arrayRemove(friendID),
            friends: firebase.firestore.FieldValue.arrayUnion(friendID)
        }).then(() => {
            // updating friend's parameters
            db.collection('users').doc(friendID).update({
                friends: firebase.firestore.FieldValue.arrayUnion(firebase.auth().currentUser.uid),
                sentFriendRequests: firebase.firestore.FieldValue.arrayRemove(firebase.auth().currentUser.uid)
            });
        });

    } else if (e.target.id === "ignore") { // ignore friend request
        const friendID = e.target.parentElement.id;
        // remove id from requests
        db.collection('users').doc(firebase.auth().currentUser.uid).update({
            friendRequests: firebase.firestore.FieldValue.arrayRemove(friendID),
        }).then(() => {
            db.collection('users').doc(friendID).update({
                sentFriendRequests: firebase.firestore.FieldValue.arrayRemove(firebase.auth().currentUser.uid)
            });
        });
    }
});

