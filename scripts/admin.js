import { auth, getAllUsers, getAllBusinesses, addBusiness, getUserRole } from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {
    const viewUsersButton = document.getElementById("viewUsers");
    const viewBusinessesButton = document.getElementById("viewBusinesses");
    const addBusinessForm = document.getElementById("addBusinessForm");
    const userList = document.getElementById("userList");
    const businessList = document.getElementById("businessList");

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            alert("עליך להתחבר!");
            window.location.href = "login.html";
            return;
        }

        const role = await getUserRole(user.uid);
        if (role !== "superAdmin") {
            alert("אין לך גישה לדף זה!");
            window.location.href = "userProfile.html";
            return;
        }
    });

    // הצגת משתמשים
    viewUsersButton.addEventListener("click", async () => {
        const users = await getAllUsers();
        userList.innerHTML = "";
        users.forEach((user) => {
            const li = document.createElement("li");
            li.textContent = `${user.username} (${user.email}) - ${user.role}`;
            userList.appendChild(li);
        });
    });

    // הוספת עסק
    addBusinessForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const businessEmail = document.getElementById("businessEmail").value;
        const businessName = prompt("הכנס את שם העסק:");

        if (!businessName) {
            alert("שם העסק הוא חובה.");
            return;
        }

        try {
            const result = await addBusiness(businessEmail, businessName);
            if (result) {
                alert("העסק נוסף בהצלחה!");
            } else {
                alert("לא נמצא משתמש עם המייל שסופק.");
            }
            addBusinessForm.reset();
        } catch (error) {
            console.error("שגיאה בהוספת העסק:", error.message);
            alert("שגיאה בהוספת העסק: " + error.message);
        }
    });
    // הצגת עסקים
    viewBusinessesButton.addEventListener("click", async () => {
        try {
            const businesses = await getAllBusinesses();
            businessList.innerHTML = ""; // מנקה את הרשימה הקיימת
            if (businesses.length === 0) {
                businessList.innerHTML = "<li>אין עסקים להצגה</li>";
                return;
            }

            businesses.forEach((business) => {
                const li = document.createElement("li");
                li.textContent = `${business.name} (בעלים: ${business.ownerId})`;
                businessList.appendChild(li);
            });
        } catch (error) {
            console.error("שגיאה בהצגת העסקים:", error.message);
            alert("שגיאה בהצגת העסקים: " + error.message);
        }
    });
});
