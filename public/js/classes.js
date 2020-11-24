const requestLink = document.querySelector('.add-class'); // in nav bar
const requestModal = document.querySelector('.new-class'); // modal
const requestForm = document.querySelector('.new-class form') // form

const classLink = document.querySelector('#class-links'); // collapsible, add groupchat, access groupchat

const memberLink = document.querySelector('#members-list')
const membersModal = document.querySelector('.view-members');
const memberList = document.querySelector('.members');

const DISPLAY_MEMBERS_TEMPLATE =
    '<div class="display-member">' +
    '<div class="member-name"><a class="display-friend"/></div>' +
    '<div class="friend-button"></div></div>';

// open request-class modal (from nav bar)
requestLink.addEventListener('click', () => {
    requestModal.classList.add('open'); // makes "new-class" html section active
});

// close request-class modal
requestModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('new-class')) {
        requestModal.classList.remove('open');
        requestForm.querySelector('.error').textContent = '';
    }
});

// update HTML to display classes
function updateClasses(classinfo){
    let html = '';
    Object.keys(classinfo).sort().forEach(code => {
        html += `<li>
                     <button id="hvr-shutter-out-horizontal" type="button" class="members collapsible">
                        ${classinfo[code]}</button>
                     <div class="class-info" id="${code}"><br>
                         <button class="join-slack" id="join-slack-${code}">Join Slack Server</button>
                         <button id="show-members">View Members</button>
                         <button id="delete-class">Delete Class</button><br>
                     </div>
                 </li>`;
    });
    classList.innerHTML = html;
    collapsible(document.getElementsByClassName('members collapsible'));
}

// handling new class requests
requestForm.addEventListener('submit', e => {
    e.preventDefault();
    const userClassCode = requestForm.request.value;
    const user = firebase.auth().currentUser;

    database.ref(userClassCode).once('value').then(snapshot => { // if the code doesnt exist, the snapshot.val() is null
        if (! snapshot.val()) { // class doesn't exist
            requestForm.querySelector('.error').textContent = "Class doesn't exist.\nEnter a valid class code";
            requestForm.reset();
        }
        else {
            const class_name = snapshot.val()[0] + " " + snapshot.val()[3];
            const class_title = snapshot.val()[1];
            const teacher = snapshot.val()[2];
            const class_type = snapshot.val()[3];

            const userRef = db.collection('users').doc(user.uid);
            const classRef = db.collection('classes').doc(userClassCode);

            let promise = [];
            classRef.get().then((doc) => {
                if(doc.exists){ // update user array in class doc
                    promise.push(classRef.update({
                        members: firebase.firestore.FieldValue.arrayUnion(user.uid)
                    }));
                } else { // create doc with className and initialize user array
                    promise.push(classRef.set({
                        className: class_name,
                        members: [user.uid],
                        classTitle: class_title,
                        teacher: teacher,
                        classType: class_type,
                        classCode: userClassCode
                    }));
                }
                Promise.all(promise).then(() => {
                    userRef.update({
                        classes: firebase.firestore.FieldValue.arrayUnion(userClassCode)
                    }).then(() => {
                        requestForm.reset();
                        requestForm.querySelector('.error').textContent = '';
                    })
                });
            }).catch(error => {
                requestForm.querySelector('.error').textContent = error.message;
            });
        }
    })
});

// access links for dynamically created html for classes
classLink.addEventListener('click', e => {
   const classCode = e.target.parentElement.id;
   const getUserInfo = firebase.functions().httpsCallable('getUserInfo');

   if (e.target.id === `join-slack-${classCode}`){
       e.target.innerHTML = '<i class="fa fa-circle-o-notch fa-spin"></i>Loading';
       db.collection('classes').doc(classCode).get().then(doc => {
           joinSlackButton(classCode, doc.data().className);
       });

   } else if (e.target.id === 'delete-class'){
       db.collection('classes').doc(classCode).get().then(doc => {
           leaveSlackButton(classCode, doc.data().className);
           const uid = firebase.auth().currentUser.uid;
           db.collection('classes').doc(classCode).update({
               members: firebase.firestore.FieldValue.arrayRemove(uid)
           }).then(() => {
               db.collection('users').doc(uid).update({
                   classes: firebase.firestore.FieldValue.arrayRemove(classCode)
               }).then(() => {
                   addSnackbar(`Successfully deleted class`);
               })
           });
       });
   }

   else if (e.target.id === 'show-members'){
       memberList.innerHTML = '<div class="spinner"></div>'; // loading screen
       membersModal.classList.add('open')
       db.collection('classes').doc(classCode).get().then(doc => {
           let idList = doc.data().members
           idList.splice(idList.indexOf(firebase.auth().currentUser.uid), 1);

           getUserInfo({members:idList}).then(usernames => {
               db.collection('users').doc(firebase.auth().currentUser.uid).onSnapshot(userDoc => {
                   const friendList = userDoc.data().friends;
                   const sentRequestList = userDoc.data().sentFriendRequests;
                   let html = '';

                   Object.keys(usernames.data).sort().forEach(uid => {
                       const container = document.createElement('div');
                       container.innerHTML = DISPLAY_MEMBERS_TEMPLATE;
                       const memberHtml = container.firstChild
                       memberHtml.firstChild.firstChild.innerHTML = usernames.data[uid]["displayName"]

                       if (sentRequestList.includes(uid)) { // user has been sent a friend request
                           memberHtml.firstChild.nextSibling.innerHTML = '<a class="not-found">Friend Request Sent</a>';
                       } else if (!friendList.includes(uid)){ // user is not a friend
                           memberHtml.firstChild.nextSibling.innerHTML =
                               `<button class="add-friend" id="${uid}">Send Friend Request</button>`;
                       } else { // user is already a friend
                           memberHtml.firstChild.nextSibling.classList.add('hide')
                       }
                       html += container.innerHTML;
                   });
                   html ? memberList.innerHTML = html:
                       memberList.innerHTML = '<a class="not-found">No members yet</a>'
               });
           });
       });
   }
});

// ------------------------------------- Members -----------------------------------------------------

memberLink.addEventListener('click', e => {
    const uid = e.target.id; // id of the friend you want to add
    if (e.target.className === 'add-friend'){ // sending friend request
        db.collection('users').doc(uid).update({
            // inserting current user's ID into the friendRequest array of wanted friend
            friendRequests: firebase.firestore.FieldValue.arrayUnion(firebase.auth().currentUser.uid)
        }).then(() => {
            db.collection('users').doc(firebase.auth().currentUser.uid).update({
                sentFriendRequests: firebase.firestore.FieldValue.arrayUnion(uid)
            })
        })
    }
});

// close view members modal
membersModal.addEventListener('click', e => {
    if (e.target.classList.contains('view-members')) {
        membersModal.classList.remove('open');
    }
});