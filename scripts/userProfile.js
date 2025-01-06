import { auth, fetchUserData, db ,getUserAppointments, addAppointment, logoutUser, onAuthStateChangedListener,
    deleteAppointment, fetchTimeSlotsForBusiness,  deleteTimeSlot, fetchEmployeesForBusiness, getBusinessDetailsByOwner
    , getUserRole, getBusinessIdByOwner, addService, addOrSelectEmployee, addTimeSlots } from "./firebase.js";
    import { getDocs, collection, deleteDoc, doc, updateDoc, getFirestore, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
    console.log("Loading employees...");

    // ודא שהמשתמש מחובר
    if (!auth.currentUser) {
        console.error("User is not logged in.");
        return;
    }

    try {
        const businessId = await getBusinessIdByOwner(auth.currentUser.uid);
        console.log("Business ID:", businessId);

        if (!businessId) {
            console.error("No business ID found.");
            document.getElementById("employeesList").innerHTML = "<li>לא נמצא מזהה עסק.</li>";
            return;
        }

        // שליפת רשימת העובדים
        const employeesSnapshot = await getDocs(collection(db, `businesses/${businessId}/employees`));
        console.log("Employees Snapshot:", employeesSnapshot);

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
        console.error("Error loading employees:", error.message);
        document.getElementById("employeesList").innerHTML = `<li>שגיאה בטעינת העובדים: ${error.message}</li>`;
    }
}


// קריאה לפונקציה בעת טעינת הדף
window.onload = async () => {
    console.log("Window loaded!");
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

            await loadAppointments(user.uid);
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
    // טעינת תורים
    async function loadAppointments(userId) {
        const appointments = await getUserAppointments(userId);
        appointmentsList.innerHTML = ""; // ניקוי רשימה קיימת

        if (appointments.length === 0) {
            appointmentsList.innerHTML = "<li>אין תורים עתידיים</li>";
        } else {
            appointments.forEach((appointment) => {
                const li = document.createElement("li");
                li.textContent = `${appointment.service} - ${appointment.date} - ${appointment.time}`;
                // כפתור מחיקה
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "מחק";
                deleteButton.addEventListener("click", async () => {
                    if (confirm("האם אתה בטוח שברצונך למחוק את התור?")) {
                        await deleteAppointment(appointment.id);
                        await loadAppointments(userId); // טען מחדש את הרשימה
                    }
                });
                li.appendChild(deleteButton);
                appointmentsList.appendChild(li);
            });
        }
    }

    // הוספת תור חדש
    addAppointmentForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const service = document.getElementById("service").value.trim();
        const date = document.getElementById("date").value;
        const time = document.getElementById("time").value;

        if (!validateDate(date)) {
            alert("לא ניתן לבחור תאריך מהעבר!");
            return;
        }
    
        if (!service || !duration || duration <= 0) {
            alert("נא למלא את כל השדות בצורה תקינה.");
            return;
        }
    
        try {
            await addAppointment(auth.currentUser.uid, service, date, time);
            alert("התור נוסף בהצלחה!");
            await loadAppointments(auth.currentUser.uid);
        } catch (error) {
            console.error("שגיאה בהוספת תור:", error);
        }    
    });


    // הוספת עובד חדש
    addEmployeeForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const employeeName = document.getElementById("employeeName").value.trim();

        if (!employeeName) {
            alert("נא להזין שם עובד");
            return;
        }

        try {
            const businessId = await getBusinessIdByOwner(auth.currentUser.uid);
            await addOrSelectEmployee(businessId, employeeName);
            alert("העובד נוסף בהצלחה!");
        } catch (error) {
            console.error("שגיאה בהוספת עובד:", error);
        }
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
    const filterDate = document.getElementById("filterDate").value;
    const filterEmployee = document.getElementById("filterEmployee").value.toLowerCase();
    tableBody.innerHTML = ""; // נקה את התוכן הקיים

    try {
        const businessId = await getBusinessIdByOwner(auth.currentUser.uid); // קבלת מזהה העסק
        const timeSlots = await fetchTimeSlotsForBusiness(businessId); // שליפת חלונות הזמן

        if (timeSlots.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='7'>לא נמצאו חלונות זמן.</td></tr>";
            return;
        }

        // סינון חלונות הזמן לפי תאריך ושם עובד
        const filteredSlots = timeSlots.filter((slot) => {
            const matchesDate = !filterDate || slot.date === filterDate;
            const matchesEmployee =
                !filterEmployee ||
                (slot.employeeName && slot.employeeName.toLowerCase().includes(filterEmployee));
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
            const employeeRef = doc(db, `businesses/${businessId}/employees/${slot.employeeId}`);
            const employeeDoc = await getDoc(employeeRef);
            const employeeName = employeeDoc.exists() ? employeeDoc.data().name : "לא ידוע";

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${slot.date}</td>
                <td>${slot.time}</td>
                <td>${employeeName}</td>
                <td>${slot.service || "לא ידוע"}</td>
                <td>${slot.price} ₪</td>
                <td>${slot.duration} דקות</td>
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

function editTimeSlotEntry(businessId, slot) {
    const newTime = prompt("הזן זמן חדש:", slot.time);
    const newPrice = prompt("הזן מחיר חדש:", slot.price);

    if (newTime && newPrice) {
        const slotRef = doc(
            db,
            `businesses/${businessId}/employees/${slot.employeeId}/timeSlots/${slot.id}`
        );

        updateDoc(slotRef, {
            time: newTime,
            price: parseFloat(newPrice),
        })
            .then(() => {
                alert("חלון הזמן עודכן בהצלחה!");
                fetchAndDisplayTimeSlots();
            })
            .catch((error) => {
                console.error("שגיאה בעדכון חלון הזמן:", error.message);
            });
    }
}

function deleteTimeSlotEntry(businessId, employeeId, slotId) {
    if (confirm("האם אתה בטוח שברצונך למחוק את חלון הזמן?")) {
        const slotRef = doc(
            db,
            `businesses/${businessId}/employees/${employeeId}/timeSlots/${slotId}`
        );

        deleteDoc(slotRef)
            .then(() => {
                alert("חלון הזמן נמחק בהצלחה!");
                fetchAndDisplayTimeSlots();
            })
            .catch((error) => {
                console.error("שגיאה במחיקת חלון הזמן:", error.message);
            });
    }
}

document
    .getElementById("applyFiltersButton")
    .addEventListener("click", fetchAndDisplayTimeSlots);

// קריאה ראשונית להצגת חלונות הזמן
document.addEventListener("DOMContentLoaded", fetchAndDisplayTimeSlots);


window.deleteTimeSlotEntry = deleteTimeSlotEntry;
window.editTimeSlotEntry = editTimeSlotEntry;
