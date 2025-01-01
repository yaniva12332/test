// פונקציה להירשם למערכת
function registerUser(event) {
    event.preventDefault();
    
    const form = event.target;
    const username = form.username.value;
    const email = form.email.value;
    const password = form.password.value;
    
    if (!username || !email || !password) {
        alert("נא למלא את כל השדות");
        return;
    }

    // חיבור ל- Firebase או כל מערכת ניהול משתמשים
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            alert("ההרשמה בוצעה בהצלחה!");
            window.location.href = "login.html";
        })
        .catch((error) => {
            alert(error.message);
        });
}

// פונקציה להתחברות
function loginUser(event) {
    event.preventDefault();

    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;

    if (!email || !password) {
        alert("נא למלא את כל השדות");
        return;
    }

    // חיבור ל- Firebase
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            alert("ההתחברות בוצעה בהצלחה!");
            window.location.href = "userProfile.html";
        })
        .catch((error) => {
            alert(error.message);
        });
}

// פונקציה להוספת תור חדש
function addAppointment(event) {
    event.preventDefault();

    const form = event.target;
    const name = form.name.value;
    const service = form.service.value;
    const date = form.date.value;
    const time = form.time.value;

    if (!name || !service || !date || !time) {
        alert("נא למלא את כל השדות");
        return;
    }

    // חיבור למסד נתונים או מערכת לניהול תורים (Firebase או SQL)
    const appointmentRef = firebase.firestore().collection("appointments");
    appointmentRef.add({
        name: name,
        service: service,
        date: date,
        time: time
    })
    .then(() => {
        alert("התור נוסף בהצלחה!");
        window.location.href = "appointments.html";
    })
    .catch((error) => {
        alert("שגיאה בהוספת התור: " + error.message);
    });
}

// פונקציה לשליחת הודעות SMS באמצעות Twilio
function sendSms(phoneNumber, message) {
    const accountSid = 'YOUR_TWILIO_ACCOUNT_SID';
    const authToken = 'YOUR_TWILIO_AUTH_TOKEN';

    const client = require('twilio')(accountSid, authToken);

    client.messages
        .create({
            body: message,
            from: '+1234567890', // מספר טלפון של Twilio
            to: phoneNumber
        })
        .then(message => console.log(message.sid))
        .catch(error => console.error("שגיאה בשליחת SMS:", error));
}

// פונקציה למילוי טופס ההזמנה
function fillBookingForm(service, date, time) {
    document.querySelector("#service").value = service;
    document.querySelector("#date").value = date;
    document.querySelector("#time").value = time;
}

// דינמיקה של הצגת/הסתרת פורמטים (כמו טופס הוספת תור)
function toggleForm() {
    const form = document.getElementById("appointment-form");
    form.style.display = form.style.display === "none" ? "block" : "none";
}

// פונקציה לעדכון התורים בעסק
function updateAppointment(appointmentId, newDetails) {
    // חיבור למסד נתונים (כמו Firebase או SQL)
    const appointmentRef = firebase.firestore().collection("appointments").doc(appointmentId);
    appointmentRef.update(newDetails)
        .then(() => {
            alert("התור עודכן בהצלחה!");
            window.location.href = "appointments.html";
        })
        .catch((error) => {
            alert("שגיאה בעדכון התור: " + error.message);
        });
}

// פונקציה להורדת פרטי פרופיל המשתמש
function getUserProfile() {
    const user = firebase.auth().currentUser;

    if (user) {
        document.querySelector("#user-name").textContent = user.displayName;
        document.querySelector("#user-email").textContent = user.email;
    } else {
        alert("לא התחברת. נא התחבר כדי לראות את פרטי הפרופיל.");
    }
}
