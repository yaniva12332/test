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
export async function registerUser(username, email, password, role = 'user') {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("משתמש נרשם בהצלחה: ", user);

        // הוספת שם המשתמש ותפקיד למסד הנתונים
        await setDoc(doc(db, "users", user.uid), {
            username,
            email,
            uid: user.uid,
            role: "user" // התפקיד המוגדר (ברירת מחדל: user)
        });

        console.log("שם המשתמש והתפקיד נוספו בהצלחה למסד נתונים");
        window.location.href = "userProfile.html"; // מעבר לעמוד פרופיל
    } catch (error) {
        console.error("שגיאה בהרשמה: ", error.message);
    }
}
// התחברות למערכת
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("המשתמש התחבר בהצלחה:", user);

        // קבלת התפקיד של המשתמש
        const userDoc = await fetchUserData(user.uid);
        const role = userDoc?.role || "user";

        console.log("תפקיד המשתמש:", role);

        // הפניה על בסיס התפקיד
        if (role === "superAdmin") {
            window.location.href = "admin.html"; // הפניה לדף הניהול
        } else {
            window.location.href = "userProfile.html"; // הפניה לדף משתמש רגיל
        }
    } catch (error) {
        console.error("שגיאה בהתחברות:", error.message);
        alert("שגיאה בהתחברות: " + error.message);
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
// מחיקת תור
export async function deleteAppointment(appointmentId) {
    try {
        await deleteDoc(doc(db, "appointments", appointmentId));
        console.log("תור נמחק בהצלחה.");
    } catch (error) {
        console.error("שגיאה במחיקת התור:", error.message);
        throw error;
    }
}

export async function updateAppointment(appointmentId, service, date, time) {
    try {
        const appointmentRef = doc(db, "appointments", appointmentId);
        await updateDoc(appointmentRef, {
            service,
            date,
            time,
        });
        console.log("התור עודכן בהצלחה");
    } catch (error) {
        console.error("שגיאה בעדכון התור:", error.message);
        throw error;
    }
}
//קבלת תפקיד משתמש
export async function getUserRole(userId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            return userDoc.data().role; // מחזיר את התפקיד
        } else {
            console.log("משתמש לא נמצא");
            return null;
        }
    } catch (error) {
        console.error("שגיאה בקבלת תפקיד המשתמש: ", error.message);
        return null;
    }
}

//קבלת כל המשתמשים
export async function getAllUsers() {
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = [];
        usersSnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    } catch (error) {
        console.error("שגיאה בקבלת רשימת המשתמשים:", error.message);
        throw error;
    }
}

// הוספת עסק למסד הנתונים
export async function addBusiness(ownerEmail, businessName) {
    try {
        // חיפוש המשתמש לפי אימייל
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", ownerEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const ownerId = userDoc.id;

            // הוספת עסק למסד הנתונים
            const docRef = await addDoc(collection(db, "businesses"), {
                ownerId,
                name: businessName,
                services: [],
                timeSlots: [],
            });

            // עדכון תפקיד המשתמש ל-admin
            await updateDoc(doc(db, "users", ownerId), { role: "admin" });

            console.log(`העסק ${businessName} נוסף בהצלחה והמשתמש עודכן ל-admin.`);
            return true;
        } else {
            console.error(`לא נמצא משתמש עם המייל: ${ownerEmail}`);
            return false;
        }
    } catch (error) {
        console.error("שגיאה בהוספת עסק:", error.message);
        throw error;
    }
}

// קבלת כל העסקים
export async function getAllBusinesses() {
    try {
        const businessesSnapshot = await getDocs(collection(db, "businesses"));
        const businesses = [];
        businessesSnapshot.forEach((doc) => {
            businesses.push({ id: doc.id, ...doc.data() });
        });
        return businesses;
    } catch (error) {
        console.error("שגיאה בקבלת רשימת העסקים:", error.message);
        throw error;
    }
}

// עדכון תפקיד המשתמש
export async function updateUserRole(email, newRole) {
    try {
        // חיפוש המשתמש לפי המייל
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // עדכון התפקיד של המשתמש הראשון שנמצא
            const userDoc = querySnapshot.docs[0];
            const userRef = doc(db, "users", userDoc.id);

            await updateDoc(userRef, { role: newRole });
            console.log(`התפקיד של המשתמש ${email} עודכן ל-${newRole}`);
            return true;
        } else {
            console.log(`משתמש עם המייל ${email} לא נמצא`);
            return false;
        }
    } catch (error) {
        console.error("שגיאה בעדכון תפקיד המשתמש:", error.message);
        throw error;
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
