const profileLink = document.querySelector('.profile'); // nav bar profile link
const profileModal = document.querySelector('.view-profile'); // modal, showing info and edit profile link

const editProfileLink = document.querySelector('.view-edit-profile') // link inside modal to go to edit profile page
const editProfilePage = document.querySelector('.edit-prof'); // edit profile page
const editProfilePageForm = document.querySelector('.edit-prof form'); // edit profile form
const cancelEditProfile = document.querySelector('.cancel'); // leave from edit profile form if no changes were made
// const deleteProfile = document.querySelector('.delete-profile'); // delete profile link in edit profile

const profileDetails = document.querySelector('.profile-details'); // displaying profile details
const editProfileHTML = document.querySelector('.profile-loader'); // displaying loader
const spinner = document.querySelector('.edit-prof .spinner'); // spinner div

// open profile modal (from nav bar)
profileDetails.innerHTML = '<div class="spinner"></div>';
profileLink.addEventListener('click', () => {
    const user = firebase.auth().currentUser;
    profileDetails.innerHTML = `
            <div>Logged in as ${user.email}</div>
            <div>Display Name: ${user.displayName}</div>
            <img src=${user.photoURL} alt="Profile Picture">`;
    profileModal.classList.add('open'); // makes "view-profile" html section active
});

// close profile modal (showing profile info and edit profile link)
profileModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('view-profile')) {
        profileModal.classList.remove('open');
    }
});

// open edit profile link from modal
editProfileLink.addEventListener('click', () =>{
   editProfilePage.classList.add('open');
});


// add/edit profile info
editProfilePageForm.addEventListener('submit', e => { // start the loading
    e.preventDefault();
    editProfileHTML.classList.remove('open');
    spinner.classList.remove('false');

    const user = firebase.auth().currentUser;
    const photoRef = storage.ref(`userProfilePics/${user.uid}ProfPic.jpg`);
    const displayName = editProfilePageForm.name.value || user.displayName;
    const docRef = db.collection('users').doc(user.uid);

    function editDatabase(){
        docRef.get().then((doc) => {
            const data = doc.data();
            const editProfile = firebase.functions().httpsCallable('editProfile');
            const number = editProfilePageForm.phoneNumber.value || data.phoneNumber;
            const snapchat = editProfilePageForm.snapchat.value || data.snapchat;

            editProfile({
                phoneNumber:number,
                snapchat:snapchat
            }).then(() => {
                editProfilePageForm.reset();
                editProfilePage.classList.remove('open');
                profileModal.classList.remove('open');
                editProfileHTML.classList.add('open');
                spinner.classList.add('false');
            });
        });
    }

    photoRef.getDownloadURL().then(onResolve, onReject);
    function onResolve(foundUrl){
        return user.updateProfile({
            displayName: displayName,
            photoURL: foundUrl
        }).then( () =>{
            editDatabase();
        })
    }
    function onReject(error){
        return user.updateProfile({
            displayName: displayName
        }).then( () =>{
            editDatabase();
        })
    }
});

// closing edit profile page (cancel button)
cancelEditProfile.addEventListener('click', () => {
    editProfilePage.classList.remove('open');
    profileModal.classList.remove('open');
});