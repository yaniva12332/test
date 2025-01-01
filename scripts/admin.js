// הגדרת Firebase
const db = firebase.firestore();
const auth = firebase.auth();

// פונקציה להוסיף עסק חדש
function addBusiness(event) {
    event.preventDefault();

    const form = event.target;
    const businessName = form.businessName.value;
    const businessDescription = form.businessDescription.value;
    const businessOwner = form.businessOwner.value;

    if (!businessName || !businessDescription || !businessOwner) {
        alert("נא למלא את כל השדות");
        return;
    }

    // הוספת עסק למסד הנתונים
    db.collection("businesses").add({
        name: businessName,
        description: businessDescription,
        owner: businessOwner
    })
    .then(() => {
        alert("העסק נוסף בהצלחה");
        window.location.href = "businesses.html"; // דף שמציג את רשימת העסקים
    })
    .catch((error) => {
        alert("שגיאה בהוספת העסק: " + error.message);
    });
}

// פונקציה לעדכון פרטי עסק
function updateBusiness(event, businessId) {
    event.preventDefault();

    const form = event.target;
    const businessName = form.businessName.value;
    const businessDescription = form.businessDescription.value;
    const businessOwner = form.businessOwner.value;

    if (!businessName || !businessDescription || !businessOwner) {
        alert("נא למלא את כל השדות");
        return;
    }

    // עדכון העסק במסד הנתונים
    const businessRef = db.collection("businesses").doc(businessId);
    businessRef.update({
        name: businessName,
        description: businessDescription,
        owner: businessOwner
    })
    .then(() => {
        alert("העסק עודכן בהצלחה");
        window.location.href = "businesses.html"; // דף שמציג את רשימת העסקים
    })
    .catch((error) => {
        alert("שגיאה בעדכון העסק: " + error.message);
    });
}

// פונקציה למחיקת עסק
function deleteBusiness(businessId) {
    if (confirm("האם אתה בטוח שברצונך למחוק את העסק?")) {
        const businessRef = db.collection("businesses").doc(businessId);
        businessRef.delete()
        .then(() => {
            alert("העסק נמחק בהצלחה");
            window.location.reload();
        })
        .catch((error) => {
            alert("שגיאה בהסרת העסק: " + error.message);
        });
    }
}

// פונקציה להצגת פרטי משתמש
function displayUserProfile() {
    const user = auth.currentUser;

    if (user) {
        document.getElementById('user-name').textContent = user.displayName || "לא נקבע שם";
        document.getElementById('user-email').textContent = user.email;
    } else {
        alert("לא מחובר. נא להתחבר כדי לראות את פרטי המשתמש.");
    }
}

// פונקציה להוספת משתמש חדש
function addUser(event) {
    event.preventDefault();

    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;
    const role = form.role.value;

    if (!email || !password || !role) {
        alert("נא למלא את כל השדות");
        return;
    }

    // יצירת משתמש חדש ב-Firebase
    auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
        const user = userCredential.user;

        // הוספת תפקיד למשתמש במסד נתונים
        db.collection("users").add({
            email: email,
            role: role,
            uid: user.uid
        })
        .then(() => {
            alert("המשתמש נוסף בהצלחה");
            window.location.href = "users.html"; // דף שמציג את רשימת המשתמשים
        })
        .catch((error) => {
            alert("שגיאה בהוספת המשתמש: " + error.message);
        });
    })
    .catch((error) => {
        alert("שגיאה ביצירת המשתמש: " + error.message);
    });
}

// פונקציה לעדכון פרטי משתמש
function updateUser(event, userId) {
    event.preventDefault();

    const form = event.target;
    const email = form.email.value;
    const role = form.role.value;

    if (!email || !role) {
        alert("נא למלא את כל השדות");
        return;
    }

    // עדכון פרטי המשתמש במסד הנתונים
    const userRef = db.collection("users").doc(userId);
    userRef.update({
        email: email,
        role: role
    })
    .then(() => {
        alert("המשתמש עודכן בהצלחה");
        window.location.href = "users.html"; // דף שמציג את רשימת המשתמשים
    })
    .catch((error) => {
        alert("שגיאה בעדכון המשתמש: " + error.message);
    });
}

// פונקציה למחיקת משתמש
function deleteUser(userId) {
    if (confirm("האם אתה בטוח שברצונך למחוק את המשתמש?")) {
        const userRef = db.collection("users").doc(userId);
        userRef.delete()
        .then(() => {
            alert("המשתמש נמחק בהצלחה");
            window.location.reload();
        })
        .catch((error) => {
            alert("שגיאה בהסרת המשתמש: " + error.message);
        });
    }
}

// פונקציה ליצירת דוח על כל התורים
function generateAppointmentsReport() {
    db.collection("appointments").get()
    .then((querySnapshot) => {
        let appointments = [];
        querySnapshot.forEach((doc) => {
            appointments.push(doc.data());
        });
        // הצגת הדוח על התורים (למשל כ-CSV או כ-Dashboard)
        console.log(appointments);
        alert("הדוח על התורים ייצא בהצלחה!");
    })
    .catch((error) => {
        alert("שגיאה ביצירת הדוח: " + error.message);
    });
}
