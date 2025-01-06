
// ייבוא הפונקציות הנדרשות מ-SDK של Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, writeBatch, addDoc, doc, setDoc, getDocs, updateDoc, deleteDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";



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

export async function getBusinessDetailsByOwner(ownerId) {
    try {
        const businessesCollection = collection(db, "businesses");
        const q = query(businessesCollection, where("ownerId", "==", ownerId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const businessDoc = querySnapshot.docs[0];
            return { id: businessDoc.id, ...businessDoc.data() };
        } else {
            console.error("לא נמצא עסק עבור הבעלים.");
            return null;
        }
    } catch (error) {
        console.error("שגיאה בשליפת פרטי העסק:", error.message);
        throw error;
    }
}

export async function fetchEmployeesForBusiness(businessId) {
    try {
        // גישה לאוסף העובדים של העסק
        const employeesRef = collection(db, `businesses/${businessId}/employees`);
        const querySnapshot = await getDocs(employeesRef);

        if (querySnapshot.empty) {
            console.log("לא נמצאו עובדים לעסק זה.");
            return [];
        }

        // יצירת מערך של עובדים
        const employees = [];
        querySnapshot.forEach((doc) => {
            employees.push({
                id: doc.id, // מזהה העובד
                ...doc.data(), // נתונים נוספים על העובד
            });
        });

        console.log("רשימת העובדים שנשלפו:", employees);
        return employees;
    } catch (error) {
        console.error("שגיאה בשליפת רשימת העובדים:", error.message);
        return [];
    }
}


// שליפת תורים עבור עסק
export async function fetchTimeSlotsForBusiness(businessId) {
    try {
        console.log("שליפת חלונות עבור עסק:", businessId);
        const employeesSnapshot = await getDocs(collection(db, `businesses/${businessId}/employees`));
        if (employeesSnapshot.empty) {
            console.error("לא נמצאו עובדים לעסק זה.");
            return [];
        }

        const timeSlots = [];
        for (const employeeDoc of employeesSnapshot.docs) {
            const employeeId = employeeDoc.id;
            console.log("מזהה עובד:", employeeId);

            const slotsSnapshot = await getDocs(collection(db, `businesses/${businessId}/employees/${employeeId}/timeSlots`));
            if (slotsSnapshot.empty) {
                console.log(`לא נמצאו חלונות זמינים לעובד ${employeeId}`);
                continue;
            }

            slotsSnapshot.forEach((slotDoc) => {
                const slotData = slotDoc.data();
                console.log("חלון שנמצא:", slotData);
                timeSlots.push({ id: slotDoc.id, employeeId, ...slotData });
            });
        }

        console.log("חלונות שנשלפו:", timeSlots);
        return timeSlots;
    } catch (error) {
        console.error("שגיאה בשליפת חלונות הזמן:", error.message);
        return [];
    }
}

export async function deleteTimeSlot(businessId, employeeId, slotId) {
    try {
        const slotRef = doc(db, `businesses/${businessId}/employees/${employeeId}/timeSlots/${slotId}`);
        await deleteDoc(slotRef);
        console.log(`חלון הזמן ${slotId} נמחק בהצלחה.`);
    } catch (error) {
        console.error("שגיאה במחיקת חלון הזמן:", error.message);
    }
}

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
export async function addAppointment(userId, service, date, time, duration) {
    try {
        const docRef = await addDoc(collection(db, "appointments"), {
            userId,
            service,
            date,
            time,
            duration // הוספת משך הזמן למסד
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
        throw error;
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
        throw error;
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
        return null;
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
        throw error;
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
        throw error;
    }
}

// פונקציה למחיקת משתמש ממסד הנתונים
export async function deleteUserFromDatabase(userId) {
    try {
        await deleteDoc(doc(db, "users", userId));
        console.log(`המשתמש ${userId} נמחק בהצלחה ממסד הנתונים.`);
    } catch (error) {
        console.error("שגיאה במחיקת המשתמש ממסד הנתונים:", error.message);
        throw error;
    }
}

// פונקציה לחסימת משתמש במסד הנתונים
export async function blockUserInDatabase(userId, isBlocked) {
    try {
        await updateDoc(doc(db, "users", userId), { isBlocked });
        console.log(`המשתמש ${userId} ${isBlocked ? "נחסם" : "שוחרר"} בהצלחה.`);
    } catch (error) {
        console.error("שגיאה בחסימת המשתמש במסד הנתונים:", error.message);
        throw error;
    }
}
//פונקציה לשליפת מזהה עסק לפי בעל עסק
export async function getBusinessIdByOwner(ownerId) {
    try {
        const q = query(collection(db, "businesses"), where("ownerId", "==", ownerId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].id; // מזהה העסק
        }
        throw new Error("לא נמצא עסק המשויך למשתמש.");
    } catch (error) {
        console.error("שגיאה בשליפת זהות העסק:", error.message);
        throw error;
    }
}
//פונקציה לשליפת שירותים של עסק
export async function getBusinessServices(businessId) {
    try {
        const servicesRef = collection(db, `businesses/${businessId}/services`);
        const querySnapshot = await getDocs(servicesRef);
        const services = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log("שירותים שנשלפו:", services);
        return services;
    } catch (error) {
        console.error("שגיאה בשליפת שירותים:", error.message);
        return [];
    }
}

export async function getEmployeesForService(businessId, serviceId) {
    try {
        const docRef = doc(db, "businesses", businessId);
        const businessDoc = await getDoc(docRef);
        if (businessDoc.exists()) {
            const employees = businessDoc.data().employees || [];
            return employees.filter(employee => employee.services?.includes(serviceId)) || [];
        }
        return [];
    } catch (error) {
        console.error("שגיאה בשליפת עובדים לשירות:", error.message);
        return [];
    }
}
export async function addOrSelectService(businessId, serviceName) {
    try {
        const servicesRef = collection(db, `businesses/${businessId}/services`);
        const q = query(servicesRef, where("name", "==", serviceName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const serviceDoc = querySnapshot.docs[0];
            return { id: serviceDoc.id, ...serviceDoc.data() }; // שירות קיים
        }

        // הוספת שירות חדש
        const docRef = await addDoc(servicesRef, { name: serviceName });
        return { id: docRef.id, name: serviceName };
    } catch (error) {
        console.error("שגיאה בהוספת שירות:", error.message);
        throw error;
    }
}
export async function addOrSelectEmployee(businessId, employeeName) {
    try {
        const employeesRef = collection(db, `businesses/${businessId}/employees`);
        const q = query(employeesRef, where("name", "==", employeeName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const employeeDoc = querySnapshot.docs[0];
            return { id: employeeDoc.id, ...employeeDoc.data() }; // עובד קיים
        }

        // הוספת עובד חדש
        const docRef = await addDoc(employeesRef, { name: employeeName, timeSlots: [] });
        return { id: docRef.id, name: employeeName };
    } catch (error) {
        console.error("שגיאה בהוספת עובד:", error.message);
        throw error;
    }
}



// עדכון פונקציה להוספת חלונות זמן עם isBooked ו-service
export async function addTimeSlots(businessId, employeeId, date, slots) {
    try {
        const batch = writeBatch(db); // פעולת כתיבה מרובה
        const slotsRef = collection(db, `businesses/${businessId}/employees/${employeeId}/timeSlots`);

        slots.forEach((slot) => {
            const docRef = doc(slotsRef);
            batch.set(docRef, {
                date,
                time: slot.time,
                price: slot.price,
                isBooked: slot.isBooked, // ערך ברירת מחדל: false
                service: slot.service, // שם השירות
                duration: slot.duration // משך זמן
            });
        });

        await batch.commit();
        console.log("חלונות הזמן נוספו בהצלחה עם משך זמן.");
    } catch (error) {
        console.error("שגיאה בהוספת חלונות זמינים:", error.message);
        throw error;
    }
}
// הוספת שירות חדש
export async function addService(businessId, name) {
    try {
        const servicesRef = collection(db, `businesses/${businessId}/services`);
        const docRef = await addDoc(servicesRef, {
            name,
            createdAt: new Date(),
        });
        console.log(`השירות ${name} נוסף בהצלחה עם מזהה: ${docRef.id}`);
    } catch (error) {
        console.error("שגיאה בהוספת שירות:", error.message);
        throw error;
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
    onAuthStateChanged(auth, callback);
}












