import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { doc, getDoc, collection, query, where, getDocs }from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBl5OFssavusVyq6obQk6lzpeGhTOKPjVg",
    authDomain: "timemaster-fdd5b.firebaseapp.com",
    databaseURL: "https://timemaster-fdd5b-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "timemaster-fdd5b",
    storageBucket: "timemaster-fdd5b.firebasestorage.app",
    messagingSenderId: "536960942402",
    appId: "1:536960942402:web:e8f3393df514b48650c8db",
    measurementId: "G-XQR4XYFESB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


// פונקציה לרישום משתמש חדש
export function registerUser(username, email, password) {
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("משתמש נרשם בהצלחה: ", user);

            // הוספת שם המשתמש למסד הנתונים של Firestore
            setDoc(doc(db, "users", user.uid), {
                username: username,  // הוספת שם המשתמש
                email: email,
                uid: user.uid
            })
            .then(() => {
                console.log("שם המשתמש נוסף בהצלחה למסד נתונים");
                window.location.href = "https://timemaster-fdd5b.web.app/userProfile.html";
            })
            .catch((error) => {
                console.error("שגיאה בהוספת שם המשתמש למסד הנתונים: ", error.message);
            });

        })
        .catch((error) => {
            console.error("שגיאה בהרשמה: ", error.message);
        });
}

// פונקציות נוספות כאן (למשל login, logout, וכו')

// פונקציה להתחברות למערכת
export function loginUser(email, password) {
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("המשתמש התחבר בהצלחה: ", user);
        })
        .catch((error) => {
            console.error("שגיאה בהתחברות: ", error.message);
        });
}

// פונקציה לצאת מהמערכת
export function logoutUser() {
    auth.signOut().then(() => {
        console.log("המשתמש יצא בהצלחה");
    }).catch((error) => {
        console.error("שגיאה ביציאה: ", error.message);
    });
}

// פונקציה להוספת תור למסד נתונים
export function addAppointment(name, service, date, time) {
    db.collection("appointments").add({
        name: name,
        service: service,
        date: date,
        time: time
    })
    .then((docRef) => {
        console.log("התור נוסף בהצלחה: ", docRef.id);
    })
    .catch((error) => {
        console.error("שגיאה בהוספת התור: ", error.message);
    });
}

// פונקציה לקרוא את כל התורים מהמסד נתונים
export function getAppointments() {
    db.collection("appointments").get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                console.log(doc.id, " => ", doc.data());
            });
        })
        .catch((error) => {
            console.error("שגיאה בקריאת התורים: ", error.message);
        });
}

// פונקציה לעדכן תור קיים
export function updateAppointment(appointmentId, newDetails) {
    const appointmentRef = db.collection("appointments").doc(appointmentId);
    appointmentRef.update(newDetails)
        .then(() => {
            console.log("התור עודכן בהצלחה");
        })
        .catch((error) => {
            console.error("שגיאה בעדכון התור: ", error.message);
        });
}

// פונקציה למחוק תור
export function deleteAppointment(appointmentId) {
    const appointmentRef = db.collection("appointments").doc(appointmentId);
    appointmentRef.delete()
        .then(() => {
            console.log("התור נמחק בהצלחה");
        })
        .catch((error) => {
            console.error("שגיאה בהסרת התור: ", error.message);
        });
}

// פונקציה לקבלת פרטי המשתמש הנוכחי
export function getCurrentUser() {
    const user = auth.currentUser;
    if (user) {
        console.log("המשתמש המחובר: ", user);
    } else {
        console.log("לא מחובר");
    }
}

// שליפת נתוני משתמש
export async function fetchUserData(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            return userDoc.data();
        } else {
            throw new Error("User not found");
        }
    } catch (error) {
        console.error("Error fetching user data: ", error.message);
        throw error;
    }
}

// שליפת תורים של המשתמש
export async function fetchAppointments(uid) {
    try {
        const appointmentsQuery = query(
            collection(db, "appointments"),
            where("userId", "==", uid)
        );
        const querySnapshot = await getDocs(appointmentsQuery);
        const appointments = [];
        querySnapshot.forEach((doc) => {
            appointments.push(doc.data());
        });
        return appointments;
    } catch (error) {
        console.error("Error fetching appointments: ", error.message);
        throw error;
    }
}


// חיבור עם Firebase Analytics (אם יש צורך)
//firebase.analytics();
