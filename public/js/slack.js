const addGroupchatModal = document.querySelector('.add-groupchat'); // modal
let token = '';
const getSlackKey = functions.httpsCallable('getSlackKey');
const joinSlackServerLink = document.getElementById('slack-server-link');

function joinSlackButton(classCode, divId) {
    setUpVars(classCode, divId);
    getSlackKey().then(key => {
        token = key.data;
        getUserConversations().then(grabChannelId).then(lookUpUser).then(grabUserId).then(addUser).then(updateModal);
    });
}

function leaveSlackButton(classCode, divId) {
    setUpVars(classCode, divId);
    getSlackKey().then(key => {
        token = key.data;
        getUserConversations().then(grabChannelId).then(lookUpUser).then(grabUserId).then(delUser);
    });
}

function setUpVars(classCode, divId) {
    channelId = "null";
    userId = "null";
    userEmail = firebase.auth().currentUser.email;
    defaultClassName = divId;
    className = (divId + ' ' + classCode).replace(/\W+/g, "-").toLowerCase();
    code = classCode;
}

function updateModal(data) {
    let status = (data.ok) ? "success" : data.error;
    const slack_button = document.getElementById(`join-slack-${code}`);
    switch(status) {
        case "success":
            slack_button.innerHTML = 'Joined Slack channel';
            addSnackbar(`Added to Slack channel for ${defaultClassName}`);
            break;
        case "already_in_channel":
            slack_button.innerHTML = 'Joined Slack channel';
            addSnackbar(`Already in the channel for ${defaultClassName}`);
            break;
        default:
            addGroupchatModal.classList.add('open');
    }
}

function getUserConversations() {
    return $.ajax({
        url: 'https://slack.com/api/users.conversations',
        type: 'get',
        data: {
            'token': token,
            'types': 'private_channel'
        }
    });
}

function grabChannelId(data) {
    $.each(data.channels, function() {
        if (this.name === className) {
            channelId = this.id;
            return false;
        }
    });

    if (channelId === "null") { // if no channelId is found
        let promises = [];
        promises.push(createChannel().then(data => {
            channelId = data.channel.id;
        }));
        return Promise.all(promises).then(() => {
            return channelId;
        });
    } else {
        return channelId;
    }
}

function addUser() {
    return $.ajax({
        url: 'https://slack.com/api/conversations.invite',
        type: 'post',
        data: {
            'token': token,
            'channel': channelId,
            'users': userId
        }
    });
}

function delUser() {
    return $.ajax({
        url: 'https://slack.com/api/conversations.kick',
        type: 'post',
        data: {
            'token': token,
            'channel': channelId,
            'user': userId
        }
    });
}

function createChannel() {
    return $.ajax({
        url: 'https://slack.com/api/conversations.create',
        type: 'post',
        data: {
            'token': token,
            'name': className,
            'is_private': 'true'
        },
        dataType: 'json'
    });
}

function lookUpUser() {
    return $.ajax({
        url: 'https://slack.com/api/users.lookupByEmail',
        type: 'get',
        data: {
            'token': token,
            'email': userEmail
        }
    });
}

function grabUserId(data) {
    if (data.ok) {
        userId = data.user.id;
    }
}

// close add groupchat modal
addGroupchatModal.addEventListener('click', e => {
    if (e.target.classList.contains('add-groupchat')) {
        addGroupchatModal.classList.remove('open');
    }
});

joinSlackServerLink.addEventListener('click', () => {
    const slack_button = document.getElementById(`join-slack-${defaultClassName}`);
    slack_button.innerHTML = 'Join Slack Channel';
    addGroupchatModal.classList.remove('open');
});