const functions = require('firebase-functions');
const admin = require('firebase-admin');
require('dotenv').config();
admin.initializeApp();

// ----------------------------------- CLOUD FUNCTIONS AND TRIGGERS -------------------------------------
// to update, write "firebase deploy --only functions" to command line

// -------------- background triggers ----------------------
// auth trigger (new user signup)
exports.newUserSignUp = functions.auth.user().onCreate(user => {
    // if collection doesn't exist, firestore will create it
    return admin.firestore().collection('users').doc(user.uid).set({
        // user firebase attributes
        email: user.email,
        classes: [],
        friends: [],
        friendRequests: [],
        sentFriendRequests: []
    });
});

// auth trigger (user deleted)
exports.userDeleted = functions.auth.user().onDelete(user => {
    const doc = admin.firestore().collection('users').doc(user.uid); // database
    return doc.delete();
});

exports.editProfile = functions.https.onCall((data, context) => {
    const uid = context.auth.uid;
    return admin.firestore().collection('users').doc(uid).update({
        phoneNumber: data.phoneNumber,
        snapchat: data.snapchat
    });
});

// get displayName and photoURL for list of users
exports.getUserInfo = functions.https.onCall((data) => {
    const idList = data.members;
    let promises = [];
    let usernames = {}; // object to populate and return

    idList.forEach(uid => {
        promises.push( admin.auth().getUser(uid).then(userRecord =>
            usernames[uid] = {"displayName":userRecord.displayName, "photoURL":userRecord.photoURL}
        ));
    });

    return Promise.all(promises).then(() => {
        return usernames;
    });
});

exports.getSlackKey = functions.https.onCall(() => {
    return process.env.SLACK_KEY;
});
