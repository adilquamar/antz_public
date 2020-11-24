const uploader = document.getElementById('uploader')
const fileButton = document.getElementById('fileButton')
const fileText = document.getElementById('fileText')

fileButton.addEventListener('change', e => {

    if (fileButton.value) {
        fileText.innerHTML = fileButton.value.match(
            /[\/\\]([\w\d\s\.\-\(\)]+)$/
        )[1];
    } else {
        fileText.innerHTML = "No file chosen, yet.";
    }

    const file = e.target.files[0];
    const user = firebase.auth().currentUser;
    const storageRef = storage.ref(`userProfilePics/${user.uid}ProfPic.jpg`);
    const task = storageRef.put(file); // Upload File

    // Update progress bar
    task.on('state_changed',
        function progress(snapshot){
            uploader.value = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        function error(err){
            const message = err.message;
            console.log(message)
        },
        function complete(){
            console.log('upload is complete');
        }
    );
});