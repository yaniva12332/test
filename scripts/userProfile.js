import { auth, fetchUserData, getUserAppointments, addAppointment, logoutUser, onAuthStateChangedListener,
    deleteAppointment, fetchTimeSlotsForBusiness,  deleteTimeSlot, fetchEmployeesForBusiness
    , getUserRole, getBusinessIdByOwner, addService, addOrSelectEmployee, addTimeSlots } from "./firebase.js";

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

    // הוספת שירות חדש
    addServiceForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const serviceName = document.getElementById("serviceName").value.trim();

        if (!serviceName) {
            alert("נא להזין שם שירות");
            return;
        }

        try {
            const businessId = await getBusinessIdByOwner(auth.currentUser.uid);
            await addService(businessId, serviceName);
            alert("השירות נוסף בהצלחה!");
        } catch (error) {
            console.error("שגיאה בהוספת שירות:", error);
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