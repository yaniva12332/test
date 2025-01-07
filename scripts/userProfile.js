import { auth, fetchUserData, db ,getUserAppointments, addAppointment, logoutUser, onAuthStateChangedListener,
    deleteAppointment, fetchTimeSlotsForBusiness,  deleteTimeSlot, fetchEmployeesForBusiness, getBusinessDetailsByOwner
    , getUserRole, getBusinessIdByOwner, addService, addOrSelectEmployee, addTimeSlots } from "./firebase.js";
    import { getDocs, collection, deleteDoc, setDoc, doc, updateDoc, query, where, getFirestore, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
    import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const emailSpan = document.getElementById("email");
    const usernameSpan = document.getElementById("username");
    const appointmentsList = document.getElementById("appointments-list");
    const adminSection = document.getElementById("adminSection");
    const appointmentsTableBody = document.getElementById("appointmentsTableBody");
    const addAppointmentForm = document.getElementById("addAppointmentForm");
    const addServiceForm = document.getElementById("addServiceForm");
    const addEmployeeForm = document.getElementById("addEmployeeForm");
    const addTimeSlotForm = document.getElementById("addTimeSlotForm");

    const businessNameElement = document.getElementById("businessName");

    onAuthStateChangedListener(async (user) => {
        if (!user) {
            alert("משתמש לא מחובר. מפנה לדף התחברות...");
            window.location.href = "login.html";
            return;
        }

        try {
            // שליפת פרטי העסק לפי מזהה המשתמש
            const businessDetails = await getBusinessDetailsByOwner(user.uid);

            if (!businessDetails || !businessDetails.name) {
                businessNameElement.textContent = "שם העסק לא נמצא.";
            } else {
                businessNameElement.textContent = businessDetails.name;
            }
        } catch (error) {
            console.error("שגיאה בשליפת פרטי העסק:", error.message);
            businessNameElement.textContent = "שגיאה בטעינת פרטי העסק.";
        }
    });
async function loadEmployees() {

    // ודא שהמשתמש מחובר
    if (!auth.currentUser) {
        return;
    }

    try {
        const businessId = await getBusinessIdByOwner(auth.currentUser.uid);
        if (!businessId) {
            console.error("No business ID found.");
            document.getElementById("employeesList").innerHTML = "<li>לא נמצא מזהה עסק.</li>";
            return;
        }

        // שליפת רשימת העובדים
        const employeesSnapshot = await getDocs(collection(db, `businesses/${businessId}/employees`));
        if (employeesSnapshot.empty) {
            console.log("No employees found.");
            document.getElementById("employeesList").innerHTML = "<li>לא נמצאו עובדים.</li>";
            return;
        }

        // תצוגת העובדים
        const employeesList = document.getElementById("employeesList");
        employeesList.innerHTML = ""; // ניקוי הרשימה הקיימת

        employeesSnapshot.forEach((doc) => {
            const employeeData = doc.data();
            console.log("Employee Data:", employeeData);

            const listItem = document.createElement("li");
            listItem.textContent = `שם העובד: ${employeeData.name}`;
            employeesList.appendChild(listItem);
        });
    } catch (error) {
    }
}


// קריאה לפונקציה בעת טעינת הדף
window.onload = async () => {
    await loadEmployees();
};

    onAuthStateChangedListener(async (user) => {
        if (!user) {
            alert("לא מחובר! מפנה לדף התחברות...");
            window.location.href = "login.html";
            return;
        }

        try {
            const role = await getUserRole(user.uid);
            if (role === "admin") {
                adminSection.style.display = "block"; // הצגת אזור מנהלים
                loadEmployees();
                await fetchAndDisplayTimeSlots();
            }

            emailSpan.textContent = user.email;
            const userData = await fetchUserData(user.uid);
            usernameSpan.textContent = userData?.username || "לא נמצא שם משתמש";

        } catch (error) {
            console.error("שגיאה בטעינת הנתונים:", error);
        }
    });

    async function displayEmployees() {
        const businessId = await getBusinessIdByOwner(auth.currentUser.uid); // קבלת מזהה העסק
        if (!businessId) {
            console.error("לא נמצא מזהה עסק למשתמש זה.");
            return;
        }
    
        const employees = await fetchEmployeesForBusiness(businessId);
    
        const employeeList = document.getElementById("employeeList");
        employeeList.innerHTML = ""; // ניקוי הרשימה הקיימת
    
        if (employees.length === 0) {
            employeeList.innerHTML = "<li>לא נמצאו עובדים</li>";
            return;
        }
    
        employees.forEach((employee) => {
            const listItem = document.createElement("li");
            listItem.textContent = `שם: ${employee.name || "ללא שם"}, מזהה: ${employee.id}`;
            employeeList.appendChild(listItem);
        });
    }
    
    document.addEventListener("DOMContentLoaded", async () => {
        await displayEmployees();
    });

    async function loadTimeSlotsAsList() {
        console.log("Loading time slots as a list...");
        const businessId = await getBusinessIdByOwner(auth.currentUser.uid);
        console.log("Business ID:", businessId);
    
        if (!businessId) {
            console.error("No business ID found for the user.");
            return;
        }
    
        const timeSlotsList = document.getElementById("timeSlotsList");
        timeSlotsList.innerHTML = ""; // נקה את הרשימה הקיימת
    
        try {
            const timeSlots = await fetchTimeSlotsForBusiness(businessId);
            console.log("Fetched Time Slots:", timeSlots);
    
            if (timeSlots.length === 0) {
                timeSlotsList.innerHTML = "<li>לא נמצאו חלונות זמן זמינים.</li>";
                return;
            }
    
            timeSlots.forEach((timeSlot) => {
                const listItem = document.createElement("li");
    
                // שימוש ישיר בשדות מתוך timeSlot
                const { date, time, service, price, duration, isBooked } = timeSlot;
    
                listItem.textContent = `
                    תאריך: ${date || "לא צוין תאריך"}, 
                    שעה: ${time || "לא צוין זמן"}, 
                    שירות: ${service || "לא צוין שירות"}, 
                    מחיר: ${price || "0"} ₪, 
                    משך: ${duration || "לא צוין משך"} דקות, 
                    סטטוס: ${isBooked ? "תפוס" : "פנוי"}
                `;
    
                // הוספת כפתור מחיקה
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "מחק";
                deleteButton.addEventListener("click", async () => {
                    if (confirm("האם למחוק את חלון הזמן?")) {
                        await deleteTimeSlot(businessId, timeSlot.employeeId, timeSlot.id);
                        await loadTimeSlotsAsList(); // טען מחדש
                    }
                });
    
                listItem.appendChild(deleteButton);
                timeSlotsList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Error loading time slots:", error.message);
        }
    }
    
    async function testBusinessId() {
        try {
            const businessId = await getBusinessIdByOwner(auth.currentUser.uid);
            console.log("Business ID:", businessId);
    
            if (!businessId) {
                console.error("מזהה העסק לא נמצא!");
            }
        } catch (error) {
            console.error("שגיאה בשליפת מזהה העסק:", error.message);
        }
    }
    
    document.addEventListener("DOMContentLoaded", async () => {
        await testBusinessId();
    });
    // קריאה לפונקציה בעת טעינת הדף
    document.addEventListener("DOMContentLoaded", async () => {
        await loadTimeSlotsAsList();
    });




    addTimeSlotForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        // קריאת הערכים מהטופס
        const serviceName = document.getElementById("service2").value.trim();
        const employeeName = document.getElementById("employee2").value.trim();
        const date = document.getElementById("date2").value;
        const startTime = document.getElementById("startTime").value;
        const endTime = document.getElementById("endTime").value;
        const duration = parseInt(document.getElementById("duration").value, 10); // משך זמן (בדקות)
        const price = parseFloat(document.getElementById("price").value);
    
        if (!validateDate(date)) {
            alert("לא ניתן לבחור תאריך מהעבר!");
            return;
        }
    
        if (!serviceName || !employeeName || !price || duration <= 0) {
            alert("נא למלא את כל השדות");
            return;
        }
    
        try {
            const businessId = await getBusinessIdByOwner(auth.currentUser.uid); // קבלת מזהה העסק
            const employee = await addOrSelectEmployee(businessId, employeeName); // הוספה/שליפת עובד
    
            // יצירת חלונות הזמן
            const slots = generateTimeSlotsWithDefaults(startTime, endTime, price, serviceName, duration);
            await addTimeSlots(businessId, employee.id, date, slots);
            alert("חלונות הזמן נוספו בהצלחה!");
        } catch (error) {
            console.error("שגיאה בהוספת חלונות זמן:", error);
        }
    });
    
    

    // יציאה מהמערכת
    document.getElementById("logoutButton").addEventListener("click", async () => {
        try {
            await logoutUser();
            window.location.href = "login.html";
        } catch (error) {
            console.error("שגיאה ביציאה:", error);
        }
    });

    // פונקציות עזר
    function validateDate(date) {
        const selectedDate = new Date(date);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // איפוס שעה
        return selectedDate >= currentDate;
    }

    
    // פונקציה ליצירת חלונות זמן עם משך זמן
function generateTimeSlotsWithDefaults(startTime, endTime, price, serviceName, duration) {
    const slots = [];
    let currentTime = new Date(`1970-01-01T${startTime}:00`);
    const endTimeObj = new Date(`1970-01-01T${endTime}:00`);

    while (currentTime < endTimeObj) {
        slots.push({
            time: currentTime.toTimeString().slice(0, 5),
            price,
            isBooked: false, // ערך ברירת מחדל
            service: serviceName, // הוספת שם השירות
            duration // הוספת משך זמן
        });
        currentTime.setMinutes(currentTime.getMinutes() + duration); // יצירת חלון זמן לפי משך הזמן
    }
    return slots;
}
    // טעינת תורים לעסק
    async function loadTimeSlots() {
        const businessId = await getBusinessIdByOwner(auth.currentUser.uid); // קבלת מזהה העסק
        const tableBody = document.getElementById("timeSlotsTableBody");
        tableBody.innerHTML = ""; // נקה את התוכן הקיים
    
        try {
            const timeSlots = await fetchTimeSlotsForBusiness(businessId); // שליפת חלונות הזמן
    
            if (timeSlots.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='6'>לא נמצאו חלונות זמן.</td></tr>";
                return;
            }
    
            // יצירת שורות עבור כל חלון זמן
            timeSlots.forEach((slot) => {
                const row = document.createElement("tr");
    
                row.innerHTML = `
                    <td>${slot.date}</td>
                    <td>${slot.time}</td>
                    <td>${slot.service || "לא ידוע"}</td>
                    <td>${slot.price} ₪</td>
                    <td>${slot.duration} דקות</td>
                    <td>${slot.isBooked ? "תפוס" : "פנוי"}</td>
                `;
    
                // הוספת כפתור מחיקה
                const deleteCell = document.createElement("td");
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "מחק";
                deleteButton.addEventListener("click", async () => {
                    if (confirm("האם אתה בטוח שברצונך למחוק את חלון הזמן?")) {
                        await deleteTimeSlot(businessId, slot.employeeId, slot.id);
                        loadTimeSlots(); // טען מחדש את הטבלה
                    }
                });
                deleteCell.appendChild(deleteButton);
                row.appendChild(deleteCell);
    
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error("שגיאה בטעינת חלונות הזמן:", error.message);
        }
    }
    
    // קריאה לפונקציה בעת טעינת הדף
    document.addEventListener("DOMContentLoaded", async () => {
        await loadTimeSlots();
    });
});
async function fetchAllTimeSlots(businessId) {
    const allSlots = [];
    try {
        const employeesSnapshot = await getDocs(
            collection(db, `businesses/${businessId}/employees`)
        );

        for (const employeeDoc of employeesSnapshot.docs) {
            const employeeId = employeeDoc.id;
            const slotsSnapshot = await getDocs(
                collection(db, `businesses/${businessId}/employees/${employeeId}/timeSlots`)
            );

            slotsSnapshot.forEach((slotDoc) => {
                allSlots.push({
                    id: slotDoc.id,
                    employeeId,
                    employeeName: employeeDoc.data().name, // שם העובד
                    ...slotDoc.data(),
                });
            });
        }
    } catch (error) {
        console.error("שגיאה בשליפת חלונות הזמן:", error.message);
    }
    return allSlots;
}

async function fetchAndDisplayTimeSlots() {
    const tableBody = document.getElementById("timeSlotsTableBody");
    const filterDate = document.getElementById("filterDate").value; // ערך לסינון לפי תאריך
    const filterEmployee = document.getElementById("filterEmployee").value.toLowerCase(); // ערך לסינון לפי שם עובד
    tableBody.innerHTML = ""; // נקה את תוכן הטבלה

    try {
        const businessId = await getBusinessIdByOwner(auth.currentUser.uid); // קבלת מזהה העסק
        if (!businessId) {
            console.error("מזהה עסק לא נמצא עבור המשתמש המחובר.");
            tableBody.innerHTML = "<tr><td colspan='7'>לא נמצא מזהה עסק.</td></tr>";
            return;
        }

        const timeSlots = await fetchTimeSlotsForBusiness(businessId); // שליפת חלונות הזמן
        if (timeSlots.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='7'>לא נמצאו חלונות זמן.</td></tr>";
            return;
        }

        // סינון חלונות הזמן לפי תאריך ושם עובד
        const filteredSlots = timeSlots.filter((slot) => {
            const matchesDate = !filterDate || slot.date === filterDate; // סינון לפי תאריך
            const matchesEmployee = 
                !filterEmployee || 
                (slot.employeeName && slot.employeeName.toLowerCase().includes(filterEmployee)); // סינון לפי שם עובד
            return matchesDate && matchesEmployee;
        });

        if (filteredSlots.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='7'>לא נמצאו חלונות זמן תואמים.</td></tr>";
            return;
        }

        // סידור חלונות הזמן לפי שעה
        filteredSlots.sort((a, b) => {
            const timeA = new Date(`1970-01-01T${a.time}:00`);
            const timeB = new Date(`1970-01-01T${b.time}:00`);
            return timeA - timeB;
        });

        // יצירת השורות בטבלה
        for (const slot of filteredSlots) {
            if (!slot.employeeId) {
                console.error("Missing employeeId for slot:", slot);
                continue; // דלג על חלון הזמן אם אין employeeId
            }

            const employeeRef = doc(db, `businesses/${businessId}/employees/${slot.employeeId}`);
            const employeeDoc = await getDoc(employeeRef);
            const employeeName = employeeDoc.exists() ? employeeDoc.data().name : "לא ידוע"; // שם העובד או "לא ידוע"

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${slot.date}</td>
                <td>${slot.time}</td>
                <td>${employeeName}</td>
                <td>${slot.service || "לא ידוע"}</td>
                <td>${slot.price || 0} ₪</td>
                <td>${slot.duration || "לא צוין"} דקות</td>
                <td>${slot.isBooked ? "תפוס" : "פנוי"}</td>
                <td>
                    <button onclick="editTimeSlotEntry('${businessId}', '${slot.employeeId}', '${slot.id}')">ערוך</button>
                    <button onclick="deleteTimeSlotEntry('${businessId}', '${slot.employeeId}', '${slot.id}')">מחק</button>
                </td>
            `;

            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error("שגיאה בטעינת חלונות הזמן:", error.message);
        tableBody.innerHTML = "<tr><td colspan='7'>שגיאה בטעינת חלונות הזמן.</td></tr>";
    }
}
async function editTimeSlotEntry(businessId, employeeId, timeSlotId) {
    try {
        // שליפת הנתונים של חלון הזמן
        const timeSlotRef = doc(db, `businesses/${businessId}/employees/${employeeId}/timeSlots/${timeSlotId}`);
        const timeSlotDoc = await getDoc(timeSlotRef);

        if (!timeSlotDoc.exists()) {
            alert("חלון הזמן לא נמצא.");
            return;
        }

        const timeSlotData = timeSlotDoc.data();

        // בקשת פרטים חדשים מהמשתמש
        const newDate = prompt("הזן תאריך חדש (yyyy-mm-dd):", timeSlotData.date || "");
        const newTime = prompt("הזן זמן חדש (hh:mm):", timeSlotData.time || "");
        const newService = prompt("הזן שירות חדש:", timeSlotData.service || "");
        const newPrice = prompt("הזן מחיר חדש:", timeSlotData.price || "");

        // בדיקה אם כל השדות מולאו
        if (!newDate || !newTime || !newService || !newPrice) {
            alert("יש למלא את כל השדות!");
            return;
        }

        // עדכון חלון הזמן ב-Firebase
        await updateDoc(timeSlotRef, {
            date: newDate,
            time: newTime,
            service: newService,
            price: parseFloat(newPrice),
        });

        // עדכון התור גם אצל הלקוח (אם התור קיים אצל לקוח)
        if (timeSlotData.clientId) {
            const clientAppointmentRef = doc(
                db,
                `users/${timeSlotData.clientId}/appointments/${businessId}_${timeSlotId}`
            );
            await updateDoc(clientAppointmentRef, {
                date: newDate,
                time: newTime,
                service: newService,
                price: parseFloat(newPrice),
            });
        }

        alert("חלון הזמן עודכן בהצלחה!");
        fetchAndDisplayTimeSlots(); // רענון הטבלה לאחר העדכון
    } catch (error) {
        console.error("שגיאה בעדכון חלון הזמן:", error.message);
        alert("שגיאה בעדכון חלון הזמן. נסה שוב מאוחר יותר.");
    }
}

async function deleteTimeSlotEntry(businessId, employeeId, slotId) {
    if (confirm("האם אתה בטוח שברצונך למחוק את חלון הזמן?")) {
        try {
            // שליפת פרטי חלון הזמן לפני המחיקה
            const slotRef = doc(db, `businesses/${businessId}/employees/${employeeId}/timeSlots/${slotId}`);
            const slotDoc = await getDoc(slotRef);

            if (!slotDoc.exists()) {
                alert("חלון הזמן לא נמצא.");
                return;
            }

            const slotData = slotDoc.data();

            // מחיקת התור ממסד הנתונים של הלקוח
            if (slotData.clientId) {
                const clientId = slotData.clientId;
                const clientAppointmentId = `${businessId}_${slotId}`;
                const clientAppointmentRef = doc(db, `users/${clientId}/appointments/${clientAppointmentId}`);

                await deleteDoc(clientAppointmentRef);
                console.log("התור הוסר גם אצל הלקוח.");
            }

            // מחיקת חלון הזמן ממסד הנתונים של העסק
            await deleteDoc(slotRef);

            alert("חלון הזמן נמחק בהצלחה!");
            fetchAndDisplayTimeSlots(); // עדכון הטבלה לאחר המחיקה
        } catch (error) {
            console.error("שגיאה במחיקת חלון הזמן:", error.message);
            alert("שגיאה במחיקת חלון הזמן. נסה שוב מאוחר יותר.");
        }
    }
}

document
    .getElementById("applyFiltersButton")
    .addEventListener("click", fetchAndDisplayTimeSlots);

// קריאה ראשונית להצגת חלונות הזמן
document.addEventListener("DOMContentLoaded", fetchAndDisplayTimeSlots);


window.deleteTimeSlotEntry = deleteTimeSlotEntry;
window.editTimeSlotEntry = editTimeSlotEntry;

// פונקציה לטעינת לקוחות
async function loadClients() {
    try {
        // וידוא שמשתמש מחובר
        if (!auth.currentUser) {
            console.error("משתמש לא מחובר.");
            return;
        }

        // שליפת מזהה העסק
        const businessId = await getBusinessIdByOwner(auth.currentUser.uid);
        if (!businessId) {
            alert("מזהה עסק לא נמצא.");
            return;
        }

        // שליפת רשימת הלקוחות
        const clientsRef = collection(db, `businesses/${businessId}/clients`);
        const querySnapshot = await getDocs(clientsRef);

        // עדכון הרשימה
        const clientsList = document.getElementById("clientsList");
        clientsList.innerHTML = ""; // ניקוי רשימה קיימת
        if (querySnapshot.empty) {
            clientsList.innerHTML = "<li>לא נמצאו לקוחות</li>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const clientData = doc.data();
            const listItem = document.createElement("li");
            listItem.textContent = clientData.email;
            clientsList.appendChild(listItem);
        });
    } catch (error) {
        console.error("שגיאה בטעינת לקוחות:", error.message);
    }
}

// פונקציה להסרת לקוח לפי מייל
async function removeClient(email) {
    try {
        // חיפוש הלקוח במערכת לפי המייל
        const userQuery = query(collection(db, "users"), where("email", "==", email));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            alert("הלקוח לא נמצא במערכת.");
            return;
        }

        // שליפת מזהה הלקוח מתוך התוצאות
        const userDoc = userSnapshot.docs[0];
        const clientId = userDoc.id;

        // שליפת מזהה העסק
        const businessId = await getBusinessIdByOwner(auth.currentUser.uid);
        if (!businessId) {
            alert("מזהה עסק לא נמצא.");
            return;
        }

        // הסרת הלקוח ממאגר הלקוחות של העסק
        await deleteDoc(doc(db, `businesses/${businessId}/clients/${clientId}`));

        // הסרת העסק ממאגר של הלקוח
        await deleteDoc(doc(db, `users/${clientId}/businesses/${businessId}`));

        alert("הלקוח הוסר בהצלחה!");
        await loadClients(); // טוען מחדש את הרשימה
    } catch (error) {
        console.error("שגיאה בהסרת לקוח:", error.message);
    }
}

// פתיחה/סגירה של רשימת לקוחות
document.getElementById("toggleClientsButton").addEventListener("click", () => {
    const clientsList = document.getElementById("clientsList");
    if (clientsList.style.display === "none") {
        clientsList.style.display = "block";
        document.getElementById("toggleClientsButton").textContent = "הסתר לקוחות";
        loadClients();
    } else {
        clientsList.style.display = "none";
        document.getElementById("toggleClientsButton").textContent = "הצג לקוחות";
    }
});
//פונקציה להוספת לקוח
async function addClient(email) {
    try {
        // חיפוש הלקוח לפי מייל
        const userQuery = query(collection(db, "users"), where("email", "==", email));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            alert("הלקוח לא נמצא במערכת.");
            return;
        }

        // שליפת מזהה הלקוח
        const userDoc = userSnapshot.docs[0];
        const clientId = userDoc.id;

        // שליפת מזהה העסק של בעל העסק המחובר
        const businessId = await getBusinessIdByOwner(auth.currentUser.uid);
        if (!businessId) {
            alert("מזהה עסק לא נמצא.");
            return;
        }

        // עדכון העסק במסד הנתונים של הלקוח
        await setDoc(doc(db, `users/${clientId}/businesses/${businessId}`), { businessId });

        // עדכון הלקוח במסד הנתונים של העסק
        await setDoc(doc(db, `businesses/${businessId}/clients/${clientId}`), { email });

        alert("הלקוח נוסף בהצלחה!");
        loadClients(); // טוען מחדש את רשימת הלקוחות
    } catch (error) {
        console.error("שגיאה בהוספת לקוח:", error.message);
    }
}
// התחברות לטפסים להוספה והסרה
document.getElementById("addClientForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("clientEmail").value.trim();
    if (!email) {
        alert("נא להזין כתובת מייל תקינה.");
        return;
    }

    await addClient(email); // הוספת לקוח
    await loadClients(); // טעינת רשימת הלקוחות מחדש
});

document.getElementById("removeClientButton").addEventListener("click", async () => {
    const email = document.getElementById("clientEmail").value.trim();
    if (!email) {
        alert("נא להזין כתובת מייל להסרה.");
        return;
    }

    await removeClient(email); // הסרת לקוח
});

// 1. פונקציה לטעינת רשימת העסקים
async function loadBusinesses() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const clientId = user.uid;

                // שליפת העסקים לפי מזהה המשתמש
                const businessesRef = collection(db, `users/${clientId}/businesses`);
                const querySnapshot = await getDocs(businessesRef);

                if (querySnapshot.empty) {
                    alert("לא נמצאו עסקים עבור המשתמש.");
                    return;
                }

                // עדכון הרשימה בממשק
                const businessSelect = document.getElementById("businessSelect");
                businessSelect.innerHTML = ""; // ניקוי הרשימה הקיימת

                let firstBusinessId = null;

                // שימוש בלולאת for...of במקום forEach
                for (const docSnap of querySnapshot.docs) {
                    const businessData = docSnap.data();
                    const businessId = businessData.businessId;

                    // וידוא שה-businessId תקין
                    if (!businessId) {
                        console.warn("businessId חסר במסמך:", docSnap.id);
                        continue;
                    }

                    // שליפת פרטי העסק מהקולקציה הראשית
                    const businessDocRef = doc(db, `businesses/${businessId}`);
                    const businessDoc = await getDoc(businessDocRef);

                    if (!businessDoc.exists()) {
                        console.warn(`לא נמצא מסמך לעסק עם מזהה: ${businessId}`);
                        continue;
                    }

                    // שליפת שם העסק
                    const businessName = businessDoc.data().name || "שם עסק לא זמין";

                    // הוספת אפשרות לרשימה
                    const option = document.createElement("option");
                    option.value = businessId;
                    option.textContent = businessName;
                    businessSelect.appendChild(option);

                    // שמירה על המזהה של העסק הראשון
                    if (!firstBusinessId) {
                        firstBusinessId = businessId;
                    }
                }

                // אם יש עסקים, טען את השירותים לעסק הראשון
                if (firstBusinessId) {
                    await loadServices(firstBusinessId);
                }
            } catch (error) {
                console.error("שגיאה בטעינת העסקים:", error.message);
            }
        } else {
            console.error("משתמש לא מחובר.");
            alert("אנא התחבר מחדש.");
            window.location.href = "login.html"; // הפניה לעמוד התחברות
        }
    });
}

// 2. פונקציה לטעינת רשימת שירותים לפי עסק
async function loadServices(businessId) {
    const serviceSelect = document.getElementById("serviceSelect");
    serviceSelect.innerHTML = "<option value=''>טוען שירותים...</option>";
    serviceSelect.disabled = true; // נטרול התיבה בזמן הטעינה

    try {
        const employeesRef = collection(db, `businesses/${businessId}/employees`);
        const employeesSnapshot = await getDocs(employeesRef);

        if (employeesSnapshot.empty) {
            console.warn("לא נמצאו עובדים עבור העסק.");
            serviceSelect.innerHTML = "<option value=''>לא נמצאו שירותים</option>";
            serviceSelect.disabled = true;
            return;
        }

        const serviceSet = new Set();
        for (const employeeDoc of employeesSnapshot.docs) {
            const timeSlotsRef = collection(
                db,
                `businesses/${businessId}/employees/${employeeDoc.id}/timeSlots`
            );
            const timeSlotsSnapshot = await getDocs(timeSlotsRef);

            timeSlotsSnapshot.forEach((timeSlotDoc) => {
                const timeSlotData = timeSlotDoc.data();
                if (timeSlotData.service) {
                    serviceSet.add(timeSlotData.service);
                }
            });
        }

        serviceSelect.innerHTML = "";
        if (serviceSet.size === 0) {
            serviceSelect.innerHTML = "<option>לא נמצאו שירותים</option>";
            serviceSelect.disabled = true;
            return;
        }

        // הוספת שירותים לרשימה
        serviceSet.forEach((service) => {
            const option = document.createElement("option");
            option.value = service;
            option.textContent = service;
            serviceSelect.appendChild(option);
        });

        serviceSelect.disabled = false;

        // בחירת השירות הראשון כברירת מחדל וטעינת העובדים עבורו
        const firstService = serviceSelect.value;
        if (firstService) {
            await loadEmployees(businessId, firstService); // קריאה לטעינת עובדים
        }
    } catch (error) {
        console.error("שגיאה בטעינת השירותים:", error.message);
        serviceSelect.innerHTML = "<option>שגיאה בטעינת השירותים</option>";
        serviceSelect.disabled = true;
    }
}
// 3. פונקציה לטעינת עובדים לפי שירות
async function loadEmployees(businessId, serviceId) {
    const employeeSelect = document.getElementById("employeeSelect");
    employeeSelect.innerHTML = "<option value=''>טוען עובדים...</option>";
    employeeSelect.disabled = true;

    try {
        if (!businessId || !serviceId) {
            console.warn("לא נבחרו עסק או שירות.");
            employeeSelect.innerHTML = "<option value=''>לא נבחרו עסק או שירות</option>";
            employeeSelect.disabled = true;
            return;
        }

        // שליפת העובדים
        const employeesRef = collection(db, `businesses/${businessId}/employees`);
        const employeesSnapshot = await getDocs(employeesRef);

        if (employeesSnapshot.empty) {
            console.warn("לא נמצאו עובדים בעסק.");
            employeeSelect.innerHTML = "<option value=''>לא נמצאו עובדים</option>";
            employeeSelect.disabled = true;
            return;
        }

        // שימוש במפה (Map) כדי למנוע כפילויות
        const validEmployeesMap = new Map();

        // בדיקת שירותים בכל חלונות הזמן של העובדים
        for (const employeeDoc of employeesSnapshot.docs) {
            const employeeId = employeeDoc.id;
            const employeeName = employeeDoc.data().name || "עובד ללא שם";

            const timeSlotsRef = collection(
                db,
                `businesses/${businessId}/employees/${employeeId}/timeSlots`
            );
            const timeSlotsSnapshot = await getDocs(timeSlotsRef);

            timeSlotsSnapshot.forEach((timeSlotDoc) => {
                const timeSlotData = timeSlotDoc.data();
                if (timeSlotData.service === serviceId) {
                    // הוספת עובד למפה (אם לא קיים כבר)
                    if (!validEmployeesMap.has(employeeId)) {
                        validEmployeesMap.set(employeeId, employeeName);
                    }
                }
            });
        }

        // עדכון רשימת העובדים
        employeeSelect.innerHTML = ""; // ניקוי הרשימה
        if (validEmployeesMap.size === 0) {
            console.warn("לא נמצאו עובדים המספקים את השירות.");
            employeeSelect.innerHTML = "<option value=''>לא נמצאו עובדים המספקים את השירות</option>";
            employeeSelect.disabled = true;
            return;
        }

        validEmployeesMap.forEach((name, id) => {
            const option = document.createElement("option");
            option.value = id;
            option.textContent = name;
            employeeSelect.appendChild(option);
        });

        employeeSelect.disabled = false; // הפיכת הרשימה לפעילה

        // בחירת העובד הראשון כברירת מחדל והפעלת הפונקציה של חלונות הזמן
        const firstEmployeeId = employeeSelect.options[0]?.value;
        if (firstEmployeeId) {
            await loadAvailableDatesAndTimeSlots(businessId, firstEmployeeId); // קריאה לטעינת חלונות הזמן
        }
    } catch (error) {
        console.error("שגיאה בטעינת עובדים:", error.message);
        employeeSelect.innerHTML = "<option value=''>שגיאה בטעינת עובדים</option>";
        employeeSelect.disabled = true;
    }
}
async function loadAvailableDatesAndTimeSlots(businessId, employeeId) {
    const dateSelect = document.getElementById("dateSelect");
    const timeSlotSelect = document.getElementById("timeSlotSelect");

    dateSelect.innerHTML = "<option value=''>טוען תאריכים...</option>";
    timeSlotSelect.innerHTML = "<option value=''>בחר חלון זמן</option>";
    dateSelect.disabled = true;
    timeSlotSelect.disabled = true;

    try {
        if (!businessId || !employeeId) {
            console.warn("לא נבחרו עסק או עובד.");
            dateSelect.innerHTML = "<option value=''>לא נבחרו עסק או עובד</option>";
            dateSelect.disabled = true;
            return;
        }

        // שליפת חלונות הזמן
        const timeSlotsRef = collection(
            db,
            `businesses/${businessId}/employees/${employeeId}/timeSlots`
        );
        const timeSlotsSnapshot = await getDocs(timeSlotsRef);

        if (timeSlotsSnapshot.empty) {
            console.warn("לא נמצאו חלונות זמן פנויים לעובד.");
            dateSelect.innerHTML = "<option value=''>לא נמצאו תאריכים</option>";
            dateSelect.disabled = true;
            return;
        }

        // יצירת סט של תאריכים ייחודיים
        const availableDates = new Set();
        const timeSlotsByDate = {};

        timeSlotsSnapshot.forEach((timeSlotDoc) => {
            const timeSlotData = timeSlotDoc.data();
            if (!timeSlotData.isBooked) {
                const date = timeSlotData.date;
                availableDates.add(date);

                // שמירת חלונות הזמן לפי תאריך
                if (!timeSlotsByDate[date]) {
                    timeSlotsByDate[date] = [];
                }
                timeSlotsByDate[date].push({
                    id: timeSlotDoc.id,
                    time: timeSlotData.time,
                });
            }
        });

        // עדכון רשימת התאריכים
        dateSelect.innerHTML = ""; // ניקוי הרשימה
        if (availableDates.size === 0) {
            console.warn("לא נמצאו תאריכים זמינים.");
            dateSelect.innerHTML = "<option value=''>לא נמצאו תאריכים זמינים</option>";
            dateSelect.disabled = true;
            return;
        }

        // הוספת התאריכים לרשימה
        let firstDate = null;
        availableDates.forEach((date) => {
            const option = document.createElement("option");
            option.value = date;
            option.textContent = date;
            dateSelect.appendChild(option);

            if (!firstDate) {
                firstDate = date; // שמירת התאריך הראשון כברירת מחדל
            }
        });

        dateSelect.disabled = false; // הפיכת הרשימה לפעילה

        // אם יש תאריך ראשון, טען אוטומטית את השעות עבורו
        if (firstDate) {
            dateSelect.value = firstDate; // בחירת התאריך הראשון
            loadTimeSlotsByDate(timeSlotsByDate, firstDate); // קריאה לפונקציה לטעינת חלונות הזמן
        }

        // אירוע לשינוי תאריך
        dateSelect.addEventListener("change", () => {
            const selectedDate = dateSelect.value;
            loadTimeSlotsByDate(timeSlotsByDate, selectedDate);
        });
    } catch (error) {
        console.error("שגיאה בטעינת תאריכים וחלונות זמן:", error.message);
        dateSelect.innerHTML = "<option value=''>שגיאה בטעינת תאריכים</option>";
        dateSelect.disabled = true;
    }
}
function loadTimeSlotsByDate(timeSlotsByDate, selectedDate) {
    const timeSlotSelect = document.getElementById("timeSlotSelect");
    timeSlotSelect.innerHTML = "<option value=''>טוען חלונות זמן...</option>";
    timeSlotSelect.disabled = true;

    if (!selectedDate || !timeSlotsByDate[selectedDate]) {
        console.warn("לא נבחר תאריך תקין או אין חלונות זמן עבור התאריך.");
        timeSlotSelect.innerHTML = "<option value=''>לא נמצאו חלונות זמן</option>";
        timeSlotSelect.disabled = true;
        return;
    }

    const timeSlots = timeSlotsByDate[selectedDate];
    timeSlotSelect.innerHTML = ""; // ניקוי הרשימה

    timeSlots
        .sort((a, b) => a.time.localeCompare(b.time)) // סידור השעות בסדר עולה
        .forEach((timeSlot) => {
            const option = document.createElement("option");
            option.value = timeSlot.id;
            option.textContent = timeSlot.time;
            timeSlotSelect.appendChild(option);
        });

    timeSlotSelect.disabled = false; // הפיכת הרשימה לפעילה
}
async function calculateAndDisplayPrice() {
    const businessId = document.getElementById("businessSelect").value;
    const serviceId = document.getElementById("serviceSelect").value;
    const employeeId = document.getElementById("employeeSelect").value;
    const date = document.getElementById("dateSelect").value;
    const timeSlotId = document.getElementById("timeSlotSelect").value;
    const priceElement = document.getElementById("appointmentPrice");

    // בדיקת תקינות של כל הערכים
    if (!businessId || !serviceId || !employeeId || !date || !timeSlotId) {
        alert("נא לבחור את כל הערכים לפני בדיקת המחיר.");
        return;
    }

    try {
        // שליפת פרטי חלון הזמן כדי לקבל את המחיר
        const timeSlotRef = doc(
            db,
            `businesses/${businessId}/employees/${employeeId}/timeSlots/${timeSlotId}`
        );
        const timeSlotDoc = await getDoc(timeSlotRef);

        if (timeSlotDoc.exists()) {
            const timeSlotData = timeSlotDoc.data();
            const price = timeSlotData.price || 0; // ברירת מחדל למחיר אם אינו מוגדר
            priceElement.textContent = `מחיר כולל: ${price} ₪`;
        } else {
            console.error("לא נמצא מסמך עבור חלון הזמן שנבחר.");
            priceElement.textContent = "מחיר כולל: שגיאה";
        }
    } catch (error) {
        console.error("שגיאה בחישוב המחיר:", error.message);
        priceElement.textContent = "מחיר כולל: שגיאה";
    }
}
document.getElementById("checkPriceButton").addEventListener("click", async () => {
    await calculateAndDisplayPrice();
});

function resetPrice() {
    const priceElement = document.getElementById("appointmentPrice");
    priceElement.textContent = "מחיר כולל: 0 ₪";
}



// מאזינים לכל תיבות הבחירה
document.getElementById("businessSelect").addEventListener("change", resetPrice);
document.getElementById("serviceSelect").addEventListener("change", resetPrice);
document.getElementById("employeeSelect").addEventListener("change", resetPrice);
document.getElementById("dateSelect").addEventListener("change", resetPrice);
document.getElementById("timeSlotSelect").addEventListener("change", resetPrice);

// 6. פונקציה להוספת תור
async function addAppointmentForClient() {
    const clientId = auth.currentUser.uid; // מזהה המשתמש המחובר
    const businessId = document.getElementById("businessSelect").value; // מזהה העסק
    const serviceId = document.getElementById("serviceSelect").value; // מזהה השירות
    const employeeId = document.getElementById("employeeSelect").value; // מזהה העובד
    const date = document.getElementById("dateSelect").value; // תאריך שנבחר
    const timeSlotId = document.getElementById("timeSlotSelect").value; // מזהה חלון הזמן

    // בדיקת תקינות של כל הערכים
    if (!clientId || !businessId || !serviceId || !employeeId || !date || !timeSlotId) {
        alert("נא למלא את כל השדות לפני הוספת התור.");
        return;
    }

    try {
        // שליפת פרטי חלון הזמן
        const timeSlotRef = doc(
            db,
            `businesses/${businessId}/employees/${employeeId}/timeSlots/${timeSlotId}`
        );
        const timeSlotDoc = await getDoc(timeSlotRef);

        if (!timeSlotDoc.exists()) {
            alert("חלון הזמן לא קיים.");
            return;
        }

        const timeSlotData = timeSlotDoc.data();

        if (timeSlotData.isBooked) {
            alert("חלון הזמן כבר תפוס.");
            return;
        }

        // הוספת התור אצל הלקוח
        await setDoc(doc(db, `users/${clientId}/appointments/${businessId}_${timeSlotId}`), {
            businessId,
            serviceId,
            employeeId,
            date: timeSlotData.date,
            time: timeSlotData.time,
            price: timeSlotData.price,
            status: "הוזמן",
        });

        // עדכון חלון הזמן אצל בעל העסק
        await updateDoc(timeSlotRef, {
            isBooked: true, // סימון חלון הזמן כ"תפוס"
            clientId: clientId, // שמירת מזהה הלקוח
        });

        alert("התור נוסף בהצלחה!");
        // רענון הדף לאחר ההוספה
        window.location.reload();
    } catch (error) {
        console.error("שגיאה בהוספת התור:", error.message);
        alert("שגיאה בהוספת התור. נסה שוב מאוחר יותר.");
    }
}
// 7. חיבור אירועים לטופס
document.getElementById("businessSelect").addEventListener("change", async () => {
    const businessId = document.getElementById("businessSelect").value;
    if (!businessId) return;

    await loadServices(businessId);
});

document.getElementById("serviceSelect").addEventListener("change", async () => {
    const businessId = document.getElementById("businessSelect").value;
    const serviceId = document.getElementById("serviceSelect").value;
    if (!businessId || !serviceId) return;
    await loadEmployees(businessId, serviceId);
});

document.getElementById("employeeSelect").addEventListener("change", async () => {
    const businessId = document.getElementById("businessSelect").value;
    const employeeId = document.getElementById("employeeSelect").value;
    if (!businessId || !employeeId) return;

    await loadAvailableTimeSlots(businessId, employeeId);
});

document.getElementById("addAppointmentButton").addEventListener("click", async () => {
    const clientId = auth.currentUser.uid;
    const businessId = document.getElementById("businessSelect").value;
    const serviceId = document.getElementById("serviceSelect").value;
    const employeeId = document.getElementById("employeeSelect").value;
    const timeSlotId = document.getElementById("timeSlotSelect").value;

    if (!clientId || !businessId || !serviceId || !employeeId || !timeSlotId) {
        alert("נא למלא את כל השדות.");
        return;
    }

    await addAppointmentForClient(clientId, businessId, serviceId, employeeId, timeSlotId);
});

// 8. קריאה לטעינת רשימת העסקים בזמן טעינת הדף
document.addEventListener("DOMContentLoaded", async () => {
    await loadBusinesses();
});

// פונקציה לטעינת התורים של הלקוח
async function initializeAppointments() {
    const appointmentsList = document.getElementById("appointments-list");
    appointmentsList.innerHTML = "<li>טוען תורים...</li>";

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("משתמש מחובר:", user.uid);
            try {
                const clientId = user.uid;

                // שליפת התורים ממסד הנתונים
                const appointmentsRef = collection(db, `users/${clientId}/appointments`);
                const querySnapshot = await getDocs(appointmentsRef);

                // ניקוי הרשימה
                appointmentsList.innerHTML = "";

                if (querySnapshot.empty) {
                    appointmentsList.innerHTML = "<li>אין תורים עתידיים.</li>";
                    return;
                }

                // מעבר על כל התורים והוספתם לרשימה
                for (const docSnap of querySnapshot.docs) {
                    const appointmentData = docSnap.data();

                    // שליפת שם העובד
                    const employeeRef = doc(db, `businesses/${appointmentData.businessId}/employees/${appointmentData.employeeId}`);
                    const employeeDoc = await getDoc(employeeRef);

                    const employeeName = employeeDoc.exists() ? employeeDoc.data().name : "לא ידוע";

                    // יצירת אלמנט עבור כל תור
                    const li = document.createElement("li");
                    li.textContent = `
                        תאריך: ${appointmentData.date} 
                        | שעה: ${appointmentData.time} 
                        | שירות: ${appointmentData.serviceId} 
                        | עובד: ${employeeName} 
                        | מחיר: ${appointmentData.price || "לא זמין"} ₪
                    `;

                    // הוספת כפתור מחיקה
                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = "מחק";
                    deleteButton.addEventListener("click", async () => {
                        if (confirm("האם אתה בטוח שברצונך למחוק את התור?")) {
                            await deleteAppointmentForClient(docSnap.id);
                        }
                    });

                    li.appendChild(deleteButton); // הוספת כפתור מחיקה
                    appointmentsList.appendChild(li); // הוספת התור לרשימה
                }
            } catch (error) {
                console.error("שגיאה בטעינת התורים:", error.message);
                appointmentsList.innerHTML = "<li>שגיאה בטעינת התורים. נסה שוב מאוחר יותר.</li>";
            }
        } else {
            console.error("משתמש לא מחובר.");
            appointmentsList.innerHTML = "<li>אנא התחבר כדי לראות את התורים שלך.</li>";
        }
    });
}

// קריאה לפונקציה בעת טעינת הדף
document.addEventListener("DOMContentLoaded", initializeAppointments);

async function deleteAppointmentForClient(appointmentId) {
    const clientId = auth.currentUser.uid; // מזהה המשתמש המחובר

    try {
        // שליפת פרטי התור ממסד הנתונים של הלקוח
        const appointmentRef = doc(db, `users/${clientId}/appointments/${appointmentId}`);
        const appointmentDoc = await getDoc(appointmentRef);

        if (!appointmentDoc.exists()) {
            alert("התור לא נמצא.");
            return;
        }

        const appointmentData = appointmentDoc.data(); // נתוני התור

        // פרטי חלון הזמן הקשור לתור
        const businessId = appointmentData.businessId;
        const employeeId = appointmentData.employeeId;
        const timeSlotId = appointmentId.split("_")[1]; // ה-ID של חלון הזמן

        // מחיקת התור ממסד הנתונים של הלקוח
        await deleteDoc(appointmentRef);

        // עדכון חלון הזמן אצל בעל העסק כ"פנוי"
        const timeSlotRef = doc(
            db,
            `businesses/${businessId}/employees/${employeeId}/timeSlots/${timeSlotId}`
        );

        await updateDoc(timeSlotRef, {
            isBooked: false, // סימון חלון הזמן כ"פנוי"
            clientId: null, // מחיקת מזהה הלקוח 
        });

        alert("התור נמחק בהצלחה!");
        initializeAppointments(); // טען מחדש את רשימת התורים
    } catch (error) {
        console.error("שגיאה במחיקת התור:", error.message);
        alert("שגיאה במחיקת התור. נסה שוב מאוחר יותר.");
    }
}
//פונקציה למחיקת תורים עד יום אחד לפני
async function deleteOldAppointmentsAndBusinessAppointments() {
    try {
        const today = new Date();
        today.setDate(today.getDate() - 1); // יום אחד אחורה
        today.setHours(0, 0, 0, 0);

        // מחיקת תורים ישנים של לקוחות
        const usersRef = collection(db, users);
        const usersSnapshot = await getDocs(usersRef);

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userAppointmentsRef = collection(db, `users/${userId}/appointments`);
            const appointmentsSnapshot = await getDocs(userAppointmentsRef);

            for (const appointmentDoc of appointmentsSnapshot.docs) {
                const appointmentData = appointmentDoc.data();
                const appointmentDate = new Date(appointmentData.date);

                if (appointmentDate < today) {
                    await deleteDoc(doc(db, `users/${userId}/appointments/${appointmentDoc.id}`));
                }
            }
        }

        console.log("תורים ישנים נמחקו אצל לקוחות.");

        // מחיקת תורים ישנים של בעלי עסקים
        const businessesRef = collection(db, businesses);
        const businessesSnapshot = await getDocs(businessesRef);

        for (const businessDoc of businessesSnapshot.docs) {
            const businessId = businessDoc.id;
            const employeesRef = collection(db, `businesses/${businessId}/employees`);
            const employeesSnapshot = await getDocs(employeesRef);

            for (const employeeDoc of employeesSnapshot.docs) {
                const employeeId = employeeDoc.id;
                const timeSlotsRef = collection(db, `businesses/${businessId}/employees/${employeeId}/timeSlots`);
                const timeSlotsSnapshot = await getDocs(timeSlotsRef);

                for (const timeSlotDoc of timeSlotsSnapshot.docs) {
                    const timeSlotData = timeSlotDoc.data();
                    const timeSlotDate = new Date(timeSlotData.date);

                    if (timeSlotDate < today) {
                        await deleteDoc(doc(db, `businesses/${businessId}/employees/${employeeId}/timeSlots/${timeSlotDoc.id}`));
                    }
                }
            }
        }

        console.log("תורים ישנים נמחקו אצל בעלי עסקים.");
    } catch (error) {
        console.error("שגיאה במחיקת תורים ישנים:", error.message);
    }
}
//להפעלת הפונקציה למחיקת תורים מהעבר
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await deleteOldAppointmentsAndBusinessAppointments();
    } catch (error) {
        console.error("שגיאה במהלך טעינת הדף או מחיקת תורים:", error.message);
    }
});

// פונקציה להחלפת מצב הצגת הטבלה
document.getElementById("toggleTimeSlotsButton").addEventListener("click", async () => {
    const tableContainer = document.getElementById("timeSlotsTableContainer");
    const toggleButton = document.getElementById("toggleTimeSlotsButton");

    if (tableContainer.style.display === "none") {
        tableContainer.style.display = "block";
        toggleButton.textContent = "הסתר טבלת חלונות זמן";
    } else {
        tableContainer.style.display = "none";
        toggleButton.textContent = "הצג טבלת חלונות זמן";
    }
});
