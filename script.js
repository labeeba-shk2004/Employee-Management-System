// Global admin check
window.isAdmin = function() {
    return localStorage.getItem('currentUserRole') === 'admin';
};

document.addEventListener('DOMContentLoaded', () => {
    const adminOnlyPaths = [
        '/signup.html',
        '/add_department.html',
        '/manage_leaves.html',
        '/manage_payroll.html',
        '/create_payroll.html'
    ];

    const hideAdminOnlyUiForNonAdmins = () => {
        if (window.isAdmin()) return;

        // Hide admin-only links in sidebar/topbar across all pages.
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            if (href && adminOnlyPaths.includes(href)) {
                const container = link.closest('li') || link;
                container.style.display = 'none';
            }
        });

        // Hide any direct "Add New Employee" button in headers/cards.
        document.querySelectorAll('button[onclick]').forEach(btn => {
            const onclick = btn.getAttribute('onclick') || '';
            if (onclick.includes('/signup.html')) {
                btn.style.display = 'none';
            }
        });
    };

    const protectAdminOnlyRoutes = () => {
        if (window.isAdmin()) return;
        if (adminOnlyPaths.includes(window.location.pathname)) {
            alert('Only admins can access this page.');
            window.location.href = '/dashboard.html';
        }
    };

    protectAdminOnlyRoutes();
    hideAdminOnlyUiForNonAdmins();

    // Smooth scrolling for anchor links (if any are left)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Update Dashboard Date dynamically
    const dateDisplay = document.getElementById('currentDateDisplay');
    if (dateDisplay) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
    }

    // Load user data from local storage
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        // Update Dashboard welcome message
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.textContent = 'Welcome, ' + currentUser;
        }

        // Update Avatar
        const avatar = document.getElementById('dashboardAvatar');
        if (avatar) {
            avatar.textContent = currentUser.charAt(0).toUpperCase();
        }
    }

    // Update View Employees table dynamically
    const tableBody = document.getElementById('employeeTableBody');
    if (tableBody) {
        let employeesList = JSON.parse(localStorage.getItem('employeesList') || '[]');
        
        // Backward compatibility for existing currentUser if list is empty
        if (employeesList.length === 0 && currentUser) {
            const savedDept = localStorage.getItem('updatedDept') || 'None';
            const savedExp = localStorage.getItem('updatedExp') || '0';
            const savedSalary = localStorage.getItem('updatedSalary') || '0.00';
            employeesList.push({ name: currentUser, dept: savedDept, exp: savedExp, salary: savedSalary, status: 'Approved' });
            localStorage.setItem('employeesList', JSON.stringify(employeesList));
        }

        employeesList.forEach((emp, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${emp.name}</strong></td>
                <td>${emp.dept}</td>
                <td>${emp.exp}</td>
                <td>${Number(emp.salary).toFixed(2)}</td>
                <td><span class="status-badge status-approved">${emp.status}</span></td>
                <td>
                    <a href="/edit_employee.html" class="action-edit" data-index="${index}">Edit</a>
                    <a href="#" class="action-delete delete-emp" data-index="${index}">Delete</a>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Update total employees count on dashboard
    const totalEmployeesCountEl = document.getElementById('totalEmployeesCount');
    if (totalEmployeesCountEl) {
        const employeesList = JSON.parse(localStorage.getItem('employeesList') || '[]');
        totalEmployeesCountEl.textContent = employeesList.length;
    }

    // Update total departments count on dashboard
    const totalDepartmentsCountEl = document.getElementById('totalDepartmentsCount');
    if (totalDepartmentsCountEl) {
        // Base is 6 static departments
        let deptCount = 6;
        if (localStorage.getItem('newlyAddedDept')) {
            deptCount += 1;
        }
        
        // Subtract any deleted departments
        const deletedDeptCount = parseInt(localStorage.getItem('deletedDeptCount') || '0', 10);
        deptCount = Math.max(0, deptCount - deletedDeptCount);
        
        totalDepartmentsCountEl.textContent = deptCount;
    }

    // Update on leave count on dashboard
    const onLeaveCountEl = document.getElementById('onLeaveCount');
    if (onLeaveCountEl) {
        let leavesList = JSON.parse(localStorage.getItem('leavesList') || '[]');
        let approvedLeaves = leavesList.filter(l => l.status === 'Approved').length;
        onLeaveCountEl.textContent = approvedLeaves;
    }

    // Update pending approvals count on dashboard (pending leaves + pending payrolls)
    const pendingApprovalsCountEl = document.getElementById('pendingApprovalsCount');
    if (pendingApprovalsCountEl) {
        let leavesList = JSON.parse(localStorage.getItem('leavesList') || '[]');
        let pendingLeaves = leavesList.filter(l => l.status === 'Pending').length;
        
        let payrollsList = JSON.parse(localStorage.getItem('payrollsList') || '[]');
        let pendingPayrolls = payrollsList.filter(p => p.status === 'Pending').length;
        
        pendingApprovalsCountEl.textContent = pendingLeaves + pendingPayrolls;
    }

    // Sidebar Submenu Toggle
    const submenuToggles = document.querySelectorAll('.submenu-toggle');
    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const parent = this.parentElement;
            parent.classList.toggle('open');
            const icon = this.querySelector('.arrow-icon');
            if (parent.classList.contains('open')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        });
    });

    // Handle Standalone Login Submission (from login.html)
    const standaloneLoginForm = document.getElementById("standaloneLoginForm");
    if (standaloneLoginForm) {
        standaloneLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Save to local storage for frontend persistence
                    localStorage.setItem('currentUser', data.user.username);
                    localStorage.setItem('currentUserRole', data.user.role);
                    
                    // Add to employeesList for UI if not there
                    let employeesList = JSON.parse(localStorage.getItem('employeesList') || '[]');
                    const exists = employeesList.find(emp => emp.name === data.user.username);
                    if (!exists) {
                        employeesList.push({ name: data.user.username, dept: data.user.department || 'None', exp: '0', salary: '0.00', status: 'Approved' });
                        localStorage.setItem('employeesList', JSON.stringify(employeesList));
                    }
                    
                    alert('Successfully logged into the console as ' + data.user.username + '!');
                    // Redirect to dashboard page
                    window.location.href = '/dashboard.html';
                } else {
                    alert('Login failed: ' + data.error);
                }
            })
            .catch(err => {
                console.error('Error:', err);
                alert('An error occurred during login. Please check the console.');
            });
        });
    }

    // Handle Standalone Signup Submission (from signup.html)
    const standaloneSignupForm = document.getElementById("standaloneSignupForm");
    if (standaloneSignupForm) {
        standaloneSignupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const firstname = document.getElementById('firstname').value;
            const lastname = document.getElementById('lastname').value;
            const department = document.getElementById('department').value;
            const salary = document.getElementById('salary').value || 0;
            const birthday = document.getElementById('birthday').value;
            const experience = document.getElementById('experience').value || 0;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, firstname, lastname, department, salary, birthday, experience, password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Save to local storage for frontend persistence
                    localStorage.setItem('currentUser', data.user.username);
                    localStorage.setItem('currentUserRole', data.user.role);
                    
                    // Add to employeesList
                    let employeesList = JSON.parse(localStorage.getItem('employeesList') || '[]');
                    employeesList.push({ name: data.user.username, dept: data.user.department || 'None', exp: experience, salary: salary, status: 'Approved' });
                    localStorage.setItem('employeesList', JSON.stringify(employeesList));

                    alert('Successfully registered and logged in as ' + data.user.username + '!');
                    // Redirect to dashboard page
                    window.location.href = '/dashboard.html';
                } else {
                    alert('Registration failed: ' + data.error);
                }
            })
            .catch(err => {
                console.error('Error:', err);
                alert('An error occurred during registration. Please check the console.');
            });
        });
    }

    // Handle Logout Submission (from dashboard.html)
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fetch('/api/auth/logout', { method: 'POST' })
                .finally(() => {
                    // Clear local storage
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('currentUserRole');
                    // Redirect to home page
                    window.location.href = '/';
                });
        });
    }

    // Generic Delete row handling (used for employees and static departments)
    // For dynamically generated lists (like employees, leaves, payrolls), the event delegation approach is better.
    // However, since we're mixed here, we bind to static ones and dynamic ones.
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('action-delete')) {
            e.preventDefault();
            const btn = e.target;
            
            const isDept = window.location.pathname.includes('view_departments');
            const isEmp = window.location.pathname.includes('view_employees') && btn.classList.contains('delete-emp');
            const isLeave = window.location.pathname.includes('manage_leaves') && btn.classList.contains('delete-leave');
            const isPayroll = window.location.pathname.includes('manage_payroll') && btn.classList.contains('delete-payroll');
            
            let msg = 'Are you sure you want to delete this item?';
            if (isDept) msg = 'Are you sure you want to delete this department?';
            if (isEmp) msg = 'Are you sure you want to delete this employee?';
            if (isLeave) msg = 'Are you sure you want to delete this leave request?';
            if (isPayroll) msg = 'Are you sure you want to delete this payroll?';
            
            if(confirm(msg)) {
                const row = btn.closest('tr');
                if (row) {
                    row.remove();
                    // Track deletion so storage and dashboard stay in sync
                    if (isDept) {
                        let deletedDeptCount = parseInt(localStorage.getItem('deletedDeptCount') || '0', 10);
                        localStorage.setItem('deletedDeptCount', deletedDeptCount + 1);
                    } else if (isEmp) {
                        const index = btn.getAttribute('data-index');
                        if (index !== null) {
                            let employeesList = JSON.parse(localStorage.getItem('employeesList') || '[]');
                            employeesList.splice(index, 1);
                            localStorage.setItem('employeesList', JSON.stringify(employeesList));
                        }
                    } else if (isLeave) {
                        const index = btn.getAttribute('data-index');
                        if (index !== null) {
                            let leavesList = JSON.parse(localStorage.getItem('leavesList') || '[]');
                            leavesList.splice(index, 1);
                            localStorage.setItem('leavesList', JSON.stringify(leavesList));
                        }
                    } else if (isPayroll) {
                        const index = btn.getAttribute('data-index');
                        if (index !== null) {
                            let payrollsList = JSON.parse(localStorage.getItem('payrollsList') || '[]');
                            payrollsList.splice(index, 1);
                            localStorage.setItem('payrollsList', JSON.stringify(payrollsList));
                        }
                    }
                }
            }
        }
    });

    // Edit Employee Update handling
    const updateEmployeeBtn = document.getElementById('updateEmployeeBtn');
    if (updateEmployeeBtn) {
        updateEmployeeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Get form values
            const updatedUsername = document.getElementById('username').value;
            const updatedDeptSelect = document.getElementById('department');
            const updatedDept = updatedDeptSelect.options[updatedDeptSelect.selectedIndex].text;
            const updatedExp = document.getElementById('experience').value;
            const updatedSalary = document.getElementById('salary').value;

            // Store in local storage
            localStorage.setItem('currentUser', updatedUsername);
            localStorage.setItem('updatedDept', updatedDept !== 'Select Department (Optional)' ? updatedDept : 'None');
            localStorage.setItem('updatedExp', updatedExp);
            localStorage.setItem('updatedSalary', updatedSalary);

            alert('Employee updated successfully!');
            window.location.href = '/view_employees.html';
        });
    }

    // Edit Department Update handling
    const updateDeptBtn = document.getElementById('updateDeptBtn');
    if (updateDeptBtn) {
        updateDeptBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const updatedDeptName = document.getElementById('deptName').value;
            localStorage.setItem('updatedDeptName', updatedDeptName);
            alert('Department updated successfully!');
            window.location.href = '/view_departments.html';
        });
    }

    // Load updated department name dynamically
    const dynamicDeptName1 = document.getElementById('dynamicDeptName1');
    if (dynamicDeptName1) {
        const savedDeptName = localStorage.getItem('updatedDeptName');
        if (savedDeptName) {
            dynamicDeptName1.textContent = savedDeptName;
        }
    }

    // Add Department handling
    const addDeptBtn = document.getElementById('addDeptBtn');
    if (addDeptBtn) {
        addDeptBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const newDeptName = document.getElementById('newDeptName').value;
            if(newDeptName.trim() === '') {
                alert('Please enter a department name');
                return;
            }
            
            // For demo, we just store one newly added department
            localStorage.setItem('newlyAddedDept', newDeptName);
            alert('Department added successfully!');
            window.location.href = '/view_departments.html';
        });
    }

    // Display newly added department
    const deptTableBody = document.querySelector('.table-container table tbody');
    if (deptTableBody && window.location.pathname.includes('view_departments')) {
        const addedDept = localStorage.getItem('newlyAddedDept');
        if (addedDept) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${addedDept}</strong></td>
                <td>
                    <a href="/edit_department.html" class="action-edit">Edit</a>
                    <a href="#" class="action-delete">Delete</a>
                </td>
            `;
            deptTableBody.appendChild(tr);

            // Bind delete for dynamic row
            const delBtn = tr.querySelector('.action-delete');
            if (delBtn) {
                delBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    if(confirm('Are you sure you want to delete this department?')) {
                        tr.remove();
                        localStorage.removeItem('newlyAddedDept');
                    }
                });
            }
        }
    }

    // Create Payroll handling
    const createPayrollBtn = document.getElementById('createPayrollBtn');
    if (createPayrollBtn) {
        createPayrollBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const employee = document.getElementById('payrollEmployee').value;
            const salary = document.getElementById('payrollSalary').value;
            const start = document.getElementById('payPeriodStart').value;
            const end = document.getElementById('payPeriodEnd').value;
            
            if(!employee || !salary || !start || !end) {
                alert('Please fill out all fields');
                return;
            }

            // format dates to a readable string (fallback to just putting them together if invalid date)
            let periodStr = `${start} to ${end}`;
            try {
                const sDate = new Date(start);
                const eDate = new Date(end);
                if(!isNaN(sDate) && !isNaN(eDate)) {
                    periodStr = `${sDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} to ${eDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
                }
            } catch(e) {}
            
            const newPayroll = {
                employee,
                salary: `$${parseFloat(salary).toFixed(2)}`,
                period: periodStr,
                status: 'Pending'
            };
            
            let payrollsList = JSON.parse(localStorage.getItem('payrollsList') || '[]');
            payrollsList.push(newPayroll);
            localStorage.setItem('payrollsList', JSON.stringify(payrollsList));
            
            alert('Payroll created successfully!');
            window.location.href = '/manage_payroll.html';
        });
    }

    // Add Leave handling
    const addLeaveForm = document.getElementById('addLeaveForm');
    if (addLeaveForm) {
        addLeaveForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const employee = document.getElementById('leaveEmployee').value;
            const reason = document.getElementById('leaveReason').value;
            const start = document.getElementById('leaveStart').value;
            const end = document.getElementById('leaveEnd').value;

            let startStr = start;
            let endStr = end;
            try {
                const sDate = new Date(start);
                const eDate = new Date(end);
                if(!isNaN(sDate) && !isNaN(eDate)) {
                    startStr = sDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    endStr = eDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }
            } catch(e) {}

            const newLeave = {
                employee,
                start: startStr,
                end: endStr,
                reason,
                status: 'Pending'
            };

            let leavesList = JSON.parse(localStorage.getItem('leavesList') || '[]');
            leavesList.push(newLeave);
            localStorage.setItem('leavesList', JSON.stringify(leavesList));
            
            alert('Leave request submitted successfully!');
            window.location.href = '/manage_leaves.html';
        });
    }

    // Display newly created leaves
    const leaveTableBody = document.querySelector('.table-container table tbody');
    if (leaveTableBody && window.location.pathname.includes('manage_leaves')) {
        let leavesList = JSON.parse(localStorage.getItem('leavesList') || '[]');
        if (leavesList.length > 0) {
            leaveTableBody.innerHTML = ''; // clear placeholder
            leavesList.forEach((l, index) => {
                const tr = document.createElement('tr');
                let statusClass = 'status-pending';
                if (l.status === 'Approved') statusClass = 'status-approved';
                if (l.status === 'Rejected') statusClass = 'status-rejected';

                tr.innerHTML = `
                    <td><strong>${l.employee}</strong></td>
                    <td>${l.start}</td>
                    <td>${l.end}</td>
                    <td>${l.reason}</td>
                    <td><span class="status-badge ${statusClass}">${l.status}</span></td>
                    <td>
                        ${l.status === 'Pending' ? `<a href="#" class="action-process action-approve-leave" data-index="${index}">Approve</a> | <a href="#" class="action-process action-reject-leave" style="color: #f44336;" data-index="${index}">Reject</a> | ` : ''}
                        <a href="#" class="action-delete delete-leave" data-index="${index}">Delete</a>
                    </td>
                `;
                leaveTableBody.appendChild(tr);
            });
        }
    }

    // Display newly created payroll
    const payrollTableBody = document.querySelector('.table-container table tbody');
    if (payrollTableBody && window.location.pathname.includes('manage_payroll')) {
        let payrollsList = JSON.parse(localStorage.getItem('payrollsList') || '[]');
        // Optional backward compat
        const oldPayrollStr = localStorage.getItem('newPayroll');
        if (payrollsList.length === 0 && oldPayrollStr) {
            try {
                payrollsList.push(JSON.parse(oldPayrollStr));
                localStorage.setItem('payrollsList', JSON.stringify(payrollsList));
            } catch(e) {}
        }

        if (payrollsList.length > 0) {
            payrollTableBody.innerHTML = '';
            payrollsList.forEach((p, index) => {
                const tr = document.createElement('tr');
                let badgeClass = p.status === 'Paid' ? 'status-paid' : 'status-pending';
                tr.innerHTML = `
                    <td><strong>${p.employee}</strong></td>
                    <td>${p.salary}</td>
                    <td>${p.period}</td>
                    <td><span class="status-badge ${badgeClass}">${p.status}</span></td>
                    <td>
                        ${p.status === 'Pending' ? `<a href="#" class="action-process process-payroll" data-index="${index}">Process Payment</a>` : ''}
                        <a href="#" class="action-delete delete-payroll" data-index="${index}">Delete</a>
                    </td>
                `;
                payrollTableBody.appendChild(tr);
            });
        }
    }
    
    // Handle generic document clicks for dynamic action buttons (Payrolls & Leaves)
    document.addEventListener('click', (e) => {
        // Payroll - Process
        if (e.target.classList.contains('process-payroll')) {
            e.preventDefault();
            const index = e.target.getAttribute('data-index');
            let payrollsList = JSON.parse(localStorage.getItem('payrollsList') || '[]');
            if (payrollsList[index]) {
                payrollsList[index].status = 'Paid';
                localStorage.setItem('payrollsList', JSON.stringify(payrollsList));
                alert('Payment processed successfully!');
                window.location.reload();
            }
        }
        
        // Leave - Approve
        if (e.target.classList.contains('action-approve-leave')) {
            e.preventDefault();
            const index = e.target.getAttribute('data-index');
            let leavesList = JSON.parse(localStorage.getItem('leavesList') || '[]');
            if (leavesList[index]) {
                leavesList[index].status = 'Approved';
                localStorage.setItem('leavesList', JSON.stringify(leavesList));
                alert('Leave approved!');
                window.location.reload();
            }
        }

        // Leave - Reject
        if (e.target.classList.contains('action-reject-leave')) {
            e.preventDefault();
            const index = e.target.getAttribute('data-index');
            let leavesList = JSON.parse(localStorage.getItem('leavesList') || '[]');
            if (leavesList[index]) {
                leavesList[index].status = 'Rejected';
                localStorage.setItem('leavesList', JSON.stringify(leavesList));
                alert('Leave rejected!');
                window.location.reload();
            }
        }
    });

    // Add Attendance handling
    const addAttendanceForm = document.getElementById('addAttendanceForm');
    if (addAttendanceForm) {
        addAttendanceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const employee = document.getElementById('attendanceEmployee').value;
            const date = document.getElementById('attendanceDate').value;
            const clockIn = document.getElementById('clockInTime').value;
            const clockOut = document.getElementById('clockOutTime').value;
            
            // Format date nicely
            let dateStr = date;
            try {
                const d = new Date(date);
                if(!isNaN(d)) {
                    dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }
            } catch(e) {}

            // Format times to 12h nicely
            const formatTime = (timeStr) => {
                if (!timeStr) return '';
                const [h, m] = timeStr.split(':');
                let hour = parseInt(h);
                const ampm = hour >= 12 ? 'p.m.' : 'a.m.';
                hour = hour % 12;
                hour = hour ? hour : 12; // the hour '0' should be '12'
                return `${hour}:${m} ${ampm}`;
            };

            const newAttendance = {
                employee,
                date: dateStr,
                clockIn: formatTime(clockIn),
                clockOut: formatTime(clockOut)
            };
            
            localStorage.setItem('newAttendance', JSON.stringify(newAttendance));
            alert('Attendance added successfully!');
            window.location.href = '/manage_attendance.html';
        });
    }

    // Display newly created attendance
    const attendanceTableBody = document.getElementById('attendanceTableBody');
    if (attendanceTableBody && window.location.pathname.includes('manage_attendance')) {
        const addedAttendanceStr = localStorage.getItem('newAttendance');
        if (addedAttendanceStr) {
            try {
                const a = JSON.parse(addedAttendanceStr);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${a.employee}</strong></td>
                    <td>${a.date}</td>
                    <td>${a.clockIn}</td>
                    <td>${a.clockOut}</td>
                `;
                attendanceTableBody.appendChild(tr);
            } catch(e) {}
        }
    }

    // Make time inputs show picker immediately on click
    const timeInputs = document.querySelectorAll('input[type="time"]');
    timeInputs.forEach(input => {
        input.addEventListener('click', function() {
            try {
                if (typeof this.showPicker === 'function') {
                    this.showPicker();
                }
            } catch (err) {}
        });
    });

    // --- Announcements Logic ---
    
    // 1. Handle Add Announcement
    const addAnnouncementForm = document.getElementById('addAnnouncementForm');
    if (addAnnouncementForm) {
        addAnnouncementForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('announcementTitle').value;
            const content = document.getElementById('announcementContent').value;
            
            // Get current date
            const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            
            const newAnnouncement = {
                title,
                content,
                createdAt: dateStr
            };
            
            localStorage.setItem('newAnnouncement', JSON.stringify(newAnnouncement));
            alert('Announcement added successfully!');
            window.location.href = '/manage_announcements.html';
        });
    }

    // 2. Display newly created announcement
    const announcementTableBody = document.getElementById('announcementTableBody');
    if (announcementTableBody && window.location.pathname.includes('manage_announcements')) {
        const addedAnnouncementStr = localStorage.getItem('newAnnouncement');
        if (addedAnnouncementStr) {
            try {
                const a = JSON.parse(addedAnnouncementStr);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${a.title}</strong></td>
                    <td>${a.content}</td>
                    <td>${a.createdAt}</td>
                    <td>
                        <a href="/edit_announcement.html" class="action-edit">Edit</a>
                        <a href="#" class="action-delete delete-announcement">Delete</a>
                    </td>
                `;
                announcementTableBody.appendChild(tr);

                // Handle delete for dynamic row
                const delBtn = tr.querySelector('.delete-announcement');
                if (delBtn) {
                    delBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        if(confirm('Are you sure you want to delete this announcement?')) {
                            tr.remove();
                            localStorage.removeItem('newAnnouncement');
                        }
                    });
                }
            } catch(e) {}
        }

        // Add delete logic for static rows as well
        const staticDelBtns = announcementTableBody.querySelectorAll('.action-delete:not(.delete-announcement)');
        staticDelBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                if(confirm('Are you sure you want to delete this announcement?')) {
                    const row = this.closest('tr');
                    if (row) row.remove();
                }
            });
        });
    }

    // 3. Pre-fill Edit Announcement Form
    const editAnnouncementForm = document.getElementById('editAnnouncementForm');
    if (editAnnouncementForm && window.location.pathname.includes('edit_announcement')) {
        const addedAnnouncementStr = localStorage.getItem('newAnnouncement');
        if (addedAnnouncementStr) {
            try {
                const a = JSON.parse(addedAnnouncementStr);
                document.getElementById('editAnnouncementTitle').value = a.title;
                document.getElementById('editAnnouncementContent').value = a.content;
            } catch(e) {}
        }
        
        // Handle Edit Submit
        editAnnouncementForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const updatedTitle = document.getElementById('editAnnouncementTitle').value;
            const updatedContent = document.getElementById('editAnnouncementContent').value;
            
            // Keep original created date, update title and content
            let currentData = { title: updatedTitle, content: updatedContent, createdAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) };
            
            const existingStr = localStorage.getItem('newAnnouncement');
            if (existingStr) {
                try {
                    const existing = JSON.parse(existingStr);
                    currentData.createdAt = existing.createdAt;
                } catch(e) {}
            }

            localStorage.setItem('newAnnouncement', JSON.stringify(currentData));
            alert('Announcement updated successfully!');
            window.location.href = '/manage_announcements.html';
        });
    }
});
