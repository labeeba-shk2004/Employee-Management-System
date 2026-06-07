# Technical Interview Guide: Employee Management System (EMS)

This guide explains the project in simple, conversational terms so you can comfortably explain it to an interviewer.

---

## 1. Project Overview (How to describe it)

*   **What is it?** 
    It is a web-based **Employee Management System (EMS)**. It helps companies manage employee records, track clock-in/clock-out attendance, handle leave requests, run payroll, and post company-wide announcements.
*   **Two User Roles:**
    1.  **Administrators:** Can register new employees, edit salaries, add/edit departments, approve/reject leaves, process payments, and write announcements.
    2.  **Employees:** Can clock in, submit leave requests, view their payroll history, and see announcements.

---

## 2. Tech Stack (What we used and why)

*   **Frontend (The Visuals):**
    *   **HTML:** For the structure of pages.
    *   **CSS:** For clean styling, sidebar menus, tables, and colors.
    *   **JavaScript:** To dynamically update tables, load data, and redirect unauthorized users.
*   **Backend (The Brains):**
    *   **Node.js & Express:** Renders static pages and handles requests (like login/logout and registering users).
*   **Database (The Memory):**
    *   **SQLite:** A lightweight, single-file database used to store employee login profiles (username, email, hashed password, role, salary).
*   **State Management (Where other data is stored):**
    *   **Browser LocalStorage:** For prototype features like attendance logs, leave requests, and payrolls.

---

## 3. How the Login System Works (Simply Explained)

1.  **Password Security:** When an admin registers an employee, we don't save the actual password in the database. We use a library called **Bcrypt** to scramble it (hashing). Even if someone hacks the database, they cannot read the passwords.
2.  **Logging In:** When you input your username and password:
    *   The backend verifies them against the database.
    *   If correct, the backend generates a random token (like an entry pass) and maps it to your user ID.
    *   The server sends this token back inside a **Secure Cookie** (specifically `HttpOnly`, which means hackers' scripts cannot steal it from the browser).
3.  **Staying Logged In:** On every new page you open, the browser automatically sends this cookie back to the server so the server knows who you are and keeps you logged in.

---

## 4. Role-Based Security (Admin vs. Employee Access)

We secure the app in two places:
1.  **On the Frontend:** JavaScript checks if you are an admin. If you are just a regular employee, it automatically hides admin links (like "Process Payroll" or "Add Department") from your sidebar.
2.  **On the Backend:** If an employee gets smart and tries to type an admin URL directly (like `/signup.html`), the backend checks their session cookie. If they aren't an admin, it blocks the request and redirects them to the main dashboard.

---

## 5. Architectural Choices (Pros & Cons)

If the interviewer asks: *"Why did you design it this way, and what would you improve?"*

*   **Storing some data in LocalStorage:**
    *   *Why we did it:* It made it very fast to build the prototype for leaves, payroll, and attendance without writing a dozen database tables.
    *   *The Limitation:* The data stays inside your specific browser. If you switch computers or clear your browser cache, the data is gone.
    *   *The Fix:* In a real production app, I would move all LocalStorage lists into SQLite tables and create API endpoints to fetch them.
*   **Storing sessions in server memory:**
    *   *Why we did it:* It's simple and requires no configuration.
    *   *The Limitation:* If the server restarts or crashes, everyone gets logged out because the memory wipes.
    *   *The Fix:* I would store sessions in an external database like **Redis** or use signed tokens called **JWTs** (JSON Web Tokens).

---

## 6. Common Interview Questions & Simple Answers

### Q1: How did you prevent database hacking (SQL Injection)?
> **Answer:** *"I used placeholder queries like `SELECT * FROM users WHERE username = ?`. Instead of pasting user input directly into the SQL string, the database driver treats the input strictly as plain text (data) and escapes any malicious code automatically."*

### Q2: What are HttpOnly cookies, and why did you use them?
> **Answer:** *"By default, cookies can be read by JavaScript. If a hacker runs a script on your website (XSS), they can steal the cookie. Setting a cookie as `HttpOnly` tells the browser that only the server can read it—JavaScript is completely blocked from touching it. This keeps the session token safe."*

### Q3: What happens to the database when the server starts up?
> **Answer:** *"The server automatically checks if the database file exists. If it doesn't, it creates the database and the `users` table. It also checks if there's a default admin account. If not, it automatically creates one (`admin`/`admin123`) so we have an account to log in with immediately."*

### Q4: What is the difference between LocalStorage and Cookies in your project?
> **Answer:** *"LocalStorage is purely for the browser to store data locally (like our leaves and attendance lists). The server cannot read it directly. Cookies, on the other hand, are automatically sent by the browser to the server on every single request. That's why we use cookies for our session tokens—so the server can constantly verify who is logged in."*

### Q5: How does the logout function work?
> **Answer:** *"When a user clicks logout, the frontend calls the `/api/auth/logout` endpoint. The server deletes the session token from its memory map so it can't be used again. It also sends back a cookie response with an expiration date set to the past, which forces the browser to delete the session cookie. Finally, the frontend clears its local user details and redirects to the home page."*

### Q6: What is CORS, and why did you have to configure it?
> **Answer:** *"CORS stands for Cross-Origin Resource Sharing. It's a security guard built into browsers that blocks scripts on one website from requesting data from a different server. Since our frontend files and backend server run together, we enabled CORS in Express to ensure the frontend could communicate with the backend APIs without being blocked by browser security."*

### Q7: What is the difference between Hashing and Encryption?
> **Answer:** *"Hashing is a one-way street. Once you hash a password (like we do with Bcrypt), you can never turn it back into the original plain text. To verify a password, you hash the incoming guess and see if it matches the stored hash. Encryption is a two-way street—you lock data with a key, and you can unlock it later using that same key. We hash passwords because we never want to know what they actually are, keeping them safe."*

### Q8: What would you change if you had to put this app in actual production?
> **Answer:** *"First, I would move leaves, payroll, and attendance data out of LocalStorage and into SQLite tables on the server so all users can see updates. Second, instead of storing active sessions in the server's memory (which clears if the server restarts), I would store them in a database or use signed JWTs (JSON Web Tokens)."*
