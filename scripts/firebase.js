// ייבוא הפונקציות הנדרשות מ-SDK של Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDocs, updateDoc, deleteDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// הגדרות Firebase
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

// אתחול Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// רישום משתמש חדש
export async function registerUser(username, email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("משתמש נרשם בהצלחה: ", user);

        // הוספת שם המשתמש למסד הנתונים
        await setDoc(doc(db, "users", user.uid), {
            username,
            email,
            uid: user.uid
        });

        console.log("שם המשתמש נוסף בהצלחה למסד נתונים");
        window.location.href = "userProfile.html";
    } catch (error) {
        console.error("שגיאה בהרשמה: ", error.message);
    }
}

// התחברות למערכת
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("המשתמש התחבר בהצלחה: ", user);
        window.location.href = "userProfile.html";
    } catch (error) {
        console.error("שגיאה בהתחברות: ", error.message);
    }
}

// יציאה מהמערכת
export async function logoutUser() {
    try {
        await signOut(auth);
        console.log("המשתמש יצא בהצלחה");
        window.location.href = "login.html";
    } catch (error) {
        console.error("שגיאה ביציאה: ", error.message);
    }
}

// הוספת תור
export async function addAppointment(userId, service, date, time) {
    try {
        const docRef = await addDoc(collection(db, "appointments"), {
            userId,
            service,
            date,
            time
        });
        console.log("התור נוסף בהצלחה: ", docRef.id);
    } catch (error) {
        console.error("שגיאה בהוספת התור: ", error.message);
    }
}

// קריאת תורים של משתמש
export async function getUserAppointments(userId) {
    try {
        const q = query(collection(db, "appointments"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const appointments = [];
        querySnapshot.forEach((doc) => {
            appointments.push({ id: doc.id, ...doc.data() });
        });
        return appointments;
    } catch (error) {
        console.error("שגיאה בקריאת התורים: ", error.message);
        return [];
    }
}

// קבלת פרטי משתמש
export async function fetchUserData(userId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            return userDoc.data();
        } else {
            console.log("לא נמצאו נתוני משתמש");
            return null;
        }
    } catch (error) {
        console.error("שגיאה בקבלת נתוני המשתמש: ", error.message);
        return null;
    }
}

// מעקב אחר מצב האותנטיקציה
export function onAuthStateChangedListener(callback) {
    onAuthStateChanged(auth, callback);
}
