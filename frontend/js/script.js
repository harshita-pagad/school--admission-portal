// ============================================================
// SCHOOL ADMISSION PORTAL - script.js
// ============================================================

const API_URL = "https://school-admission-portal-yufh.onrender.com";
// ============================================================
// SEARCH STATE
// ============================================================

let teacherSearchTerm = "";
let principalSearchTerm = "";

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function isStudentUpdatedAfterTeacherReview(student) {
    if (!student || !student.student_updated_at) {
        return false;
    }

    if (!student.teacher_reviewed_at) {
        return true;
    }

    return (
        new Date(student.student_updated_at) >
        new Date(student.teacher_reviewed_at)
    );
}

function isStudentUpdatedAfterPrincipalReview(student) {
    if (!student || !student.student_updated_at) {
        return false;
    }

    if (!student.principal_reviewed_at) {
        return true;
    }

    return (
        new Date(student.student_updated_at) >
        new Date(student.principal_reviewed_at)
    );
}

function formatDateTime(dateValue) {
    if (!dateValue) {
        return "N/A";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return "N/A";
    }

    return date.toLocaleString();
}

function getStudentFromResponse(data) {
    if (data && data.student) {
        return data.student;
    }

    return data;
}

// ============================================================
// SEARCH HELPER
// ============================================================

function studentMatchesSearch(student, searchTerm) {
    if (!searchTerm) {
        return true;
    }

    const term = searchTerm.toLowerCase().trim();

    const searchableText = [
        student.student_id,
        student.full_name,
        student.username,
        student.applying_class,
        student.application_status,
        student.teacher_status,
        student.principal_status,
        student.father_name
    ]
        .filter(value => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();

    return searchableText.includes(term);
}

// ============================================================
// STUDENT REGISTRATION
// ============================================================

const studentRegisterForm =
    document.getElementById("studentRegisterForm");

if (studentRegisterForm) {

    studentRegisterForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const nameElement =
                document.getElementById("studentName");

            const usernameElement =
                document.getElementById("studentUsername");

            const passwordElement =
                document.getElementById("studentPassword");

            const confirmPasswordElement =
                document.getElementById("confirmPassword");

            const name =
                nameElement
                    ? nameElement.value.trim()
                    : "";

            const username =
                usernameElement
                    ? usernameElement.value.trim()
                    : "";

            const password =
                passwordElement
                    ? passwordElement.value
                    : "";

            const confirmPassword =
                confirmPasswordElement
                    ? confirmPasswordElement.value
                    : "";

            if (
                !name ||
                !username ||
                !password ||
                !confirmPassword
            ) {

                alert(
                    "Please fill all the required fields."
                );

                return;
            }

            if (password !== confirmPassword) {

                alert(
                    "Passwords do not match."
                );

                return;
            }

            try {

                const response =
                    await fetch(
                        API_URL +
                        "/api/student/register",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                name:
                                    name,

                                username:
                                    username,

                                password:
                                    password
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    alert(
                        data.message ||
                        "Registration failed."
                    );

                    return;
                }

                alert(
                    data.message ||
                    "Registration successful! You can now login with your username and password."
                );

                studentRegisterForm.reset();

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Student registration error:",
                    error
                );

                alert(
                    "Unable to connect to server. Please make sure the backend server is running."
                );
            }
        }
    );
}

// ============================================================
// STUDENT LOGIN
// ============================================================

const studentLoginForm =
    document.getElementById("studentLoginForm");

if (studentLoginForm) {

    studentLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const usernameElement =
                document.getElementById(
                    "studentUsername"
                );

            const passwordElement =
                document.getElementById(
                    "studentPassword"
                );

            const username =
                usernameElement
                    ? usernameElement.value.trim()
                    : "";

            const password =
                passwordElement
                    ? passwordElement.value
                    : "";

            if (!username || !password) {

                alert(
                    "Please enter username and password."
                );

                return;
            }

            try {

                const response =
                    await fetch(
                        API_URL +
                        "/api/student/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                username:
                                    username,

                                password:
                                    password
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    alert(
                        data.message ||
                        "Invalid username or password."
                    );

                    return;
                }

                const loggedInStudent =
                    getStudentFromResponse(data);

                localStorage.setItem(
                    "student",
                    JSON.stringify(
                        loggedInStudent
                    )
                );

                alert(
                    "Login successful!"
                );

                window.location.href =
                    "dashboard.html";

            } catch (error) {

                console.error(
                    "Student login error:",
                    error
                );

                alert(
                    "Unable to connect to server. Please make sure the backend server is running."
                );
            }
        }
    );
}

// ============================================================
// STUDENT ADMISSION FORM - SUBMIT / UPDATE
// ============================================================

const admissionForm =
    document.getElementById("admissionForm");

if (admissionForm) {

    admissionForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const storedStudent =
                localStorage.getItem("student");

            if (!storedStudent) {

                alert(
                    "Please login as a student before submitting the admission form."
                );

                window.location.href = "login.html";

                return;
            }

            let student;

            try {

                student = JSON.parse(storedStudent);

            } catch (error) {

                console.error(
                    "Stored student data error:",
                    error
                );

                localStorage.removeItem("student");

                alert("Please login again.");

                window.location.href = "login.html";

                return;
            }

            if (!student.student_id) {

                alert(
                    "Student ID not found. Please login again."
                );

                return;
            }

            const fullNameElement =
                document.getElementById("fullName");

            const dobElement =
                document.getElementById("dob");

            const genderElement =
                document.getElementById("gender");

            const fatherNameElement =
                document.getElementById("fatherName");

            const classApplyingElement =
                document.getElementById("classApplying");

            const aadhaarNumberElement =
                document.getElementById("aadhaarNumber");

            const studentPhotoElement =
                document.getElementById("studentPhoto");

            const aadhaarDocumentElement =
                document.getElementById("aadhaarDocument");

            const birthCertificateElement =
                document.getElementById("birthCertificate");

            const fullName =
                fullNameElement
                    ? fullNameElement.value.trim()
                    : "";

            const dob =
                dobElement
                    ? dobElement.value
                    : "";

            const gender =
                genderElement
                    ? genderElement.value
                    : "";

            const fatherName =
                fatherNameElement
                    ? fatherNameElement.value.trim()
                    : "";

            const classApplying =
                classApplyingElement
                    ? classApplyingElement.value
                    : "";

            const aadhaarNumber =
                aadhaarNumberElement
                    ? aadhaarNumberElement.value.trim()
                    : "";

            const studentPhoto =
                studentPhotoElement &&
                studentPhotoElement.files.length > 0
                    ? studentPhotoElement.files[0]
                    : null;

            const aadhaarDocument =
                aadhaarDocumentElement &&
                aadhaarDocumentElement.files.length > 0
                    ? aadhaarDocumentElement.files[0]
                    : null;

            const birthCertificate =
                birthCertificateElement &&
                birthCertificateElement.files.length > 0
                    ? birthCertificateElement.files[0]
                    : null;

            if (
                !fullName ||
                !dob ||
                !gender ||
                !fatherName ||
                !classApplying
            ) {

                alert(
                    "Please fill all required student details."
                );

                return;
            }

            const formData = new FormData();

            formData.append(
                "student_id",
                student.student_id
            );

            formData.append(
                "full_name",
                fullName
            );

            formData.append(
                "dob",
                dob
            );

            formData.append(
                "gender",
                gender
            );

            formData.append(
                "father_name",
                fatherName
            );

            formData.append(
                "applying_class",
                classApplying
            );

            formData.append(
                "aadhaar_number",
                aadhaarNumber || "N/A"
            );

            if (studentPhoto) {
                formData.append(
                    "student_photo",
                    studentPhoto
                );
            }

            if (aadhaarDocument) {
                formData.append(
                    "aadhaar_document",
                    aadhaarDocument
                );
            }

            if (birthCertificate) {
                formData.append(
                    "birth_certificate",
                    birthCertificate
                );
            }

            try {

                const response =
                    await fetch(
                        API_URL + "/api/admissions",
                        {
                            method: "POST",
                            body: formData
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    alert(
                        data.message ||
                        "Failed to submit admission application."
                    );

                    return;
                }

                alert(
                    data.message ||
                    "Admission application saved successfully!"
                );

                try {

                    const updatedResponse =
                        await fetch(
                            API_URL +
                            "/api/students/" +
                            student.student_id
                        );

                    const updatedData =
                        await updatedResponse.json();

                    if (updatedResponse.ok) {

                        const updatedStudent =
                            getStudentFromResponse(
                                updatedData
                            );

                        localStorage.setItem(
                            "student",
                            JSON.stringify(updatedStudent)
                        );
                    }

                } catch (refreshError) {

                    console.error(
                        "Student information refresh failed:",
                        refreshError
                    );
                }

                window.location.href =
                    "application.html";

            } catch (error) {

                console.error(
                    "Admission submission error:",
                    error
                );

                alert(
                    "Unable to connect to server."
                );
            }
        }
    );
}

// ============================================================
// LOAD EXISTING DATA INTO ADMISSION FORM
// ============================================================

async function loadAdmissionFormData() {

    const form =
        document.getElementById("admissionForm");

    if (!form) {
        return;
    }

    const storedStudent =
        localStorage.getItem("student");

    if (!storedStudent) {

        alert("Please login as a student.");

        window.location.href =
            "login.html";

        return;
    }

    let student;

    try {

        student =
            JSON.parse(storedStudent);

    } catch (error) {

        console.error(
            "Stored student data error:",
            error
        );

        localStorage.removeItem("student");

        alert("Please login again.");

        window.location.href =
            "login.html";

        return;
    }

    try {

        const response =
            await fetch(
                API_URL +
                "/api/students/" +
                student.student_id
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Unable to load your application."
            );

            return;
        }

        const currentStudent =
            getStudentFromResponse(data);

        const fullName =
            document.getElementById("fullName");

        const dob =
            document.getElementById("dob");

        const gender =
            document.getElementById("gender");

        const fatherName =
            document.getElementById("fatherName");

        const classApplying =
            document.getElementById("classApplying");

        const aadhaarNumber =
            document.getElementById("aadhaarNumber");

        if (fullName) {
            fullName.value =
                currentStudent.full_name || "";
        }

        if (dob) {
            dob.value =
                currentStudent.dob
                    ? String(
                        currentStudent.dob
                    ).substring(0, 10)
                    : "";
        }

        if (gender) {
            gender.value =
                currentStudent.gender || "";
        }

        if (fatherName) {
            fatherName.value =
                currentStudent.father_name || "";
        }

        if (classApplying) {
            classApplying.value =
                currentStudent.applying_class || "";
        }

        if (aadhaarNumber) {
            aadhaarNumber.value =
                currentStudent.aadhaar_number || "";
        }

        const existingDocuments =
            document.getElementById(
                "existingDocuments"
            );

        if (existingDocuments) {

            const photoStatus =
                currentStudent.student_photo
                    ? "Uploaded ✓"
                    : "Not uploaded";

            const aadhaarStatus =
                currentStudent.aadhaar_document
                    ? "Uploaded ✓"
                    : "Not uploaded";

            const birthStatus =
                currentStudent.birth_certificate
                    ? "Uploaded ✓"
                    : "Not uploaded";

            existingDocuments.innerHTML =
                `
                <div class="step">
                    <h4>Existing Documents</h4>

                    <p>
                        <strong>Student Photo:</strong>
                        ${photoStatus}
                    </p>

                    <p>
                        <strong>Aadhaar Document:</strong>
                        ${aadhaarStatus}
                    </p>

                    <p>
                        <strong>Birth Certificate:</strong>
                        ${birthStatus}
                    </p>

                    <p>
                        <small>
                            Leave a file field empty if you want
                            to keep the previously uploaded document.
                        </small>
                    </p>
                </div>
                `;
        }

    } catch (error) {

        console.error(
            "Admission form loading error:",
            error
        );

        alert(
            "Unable to load your existing application."
        );
    }
}

loadAdmissionFormData();

// ============================================================
// MY APPLICATION PAGE
// ============================================================

async function loadStudentApplication() {

    const applicationDetails =
        document.getElementById(
            "applicationDetails"
        );

    if (!applicationDetails) {
        return;
    }

    const storedStudent =
        localStorage.getItem("student");

    if (!storedStudent) {

        applicationDetails.innerHTML =
            "<p>Please login first.</p>";

        return;
    }

    let student;

    try {

        student =
            JSON.parse(storedStudent);

    } catch (error) {

        applicationDetails.innerHTML =
            "<p>Please login again.</p>";

        return;
    }

    try {

        const response =
            await fetch(
                API_URL +
                "/api/students/" +
                student.student_id
            );

        const data =
            await response.json();

        if (!response.ok) {

            applicationDetails.innerHTML =
                "<p>" +
                (
                    data.message ||
                    "Unable to load application."
                ) +
                "</p>";

            return;
        }

        const currentStudent =
            getStudentFromResponse(data);

        const photoLink =
            currentStudent.student_photo
                ? `<a href="${API_URL}${currentStudent.student_photo}" target="_blank">View Photo</a>`
                : "Not uploaded";

        const aadhaarLink =
            currentStudent.aadhaar_document
                ? `<a href="${API_URL}${currentStudent.aadhaar_document}" target="_blank">View Aadhaar</a>`
                : "Not uploaded";

        const birthCertificateLink =
            currentStudent.birth_certificate
                ? `<a href="${API_URL}${currentStudent.birth_certificate}" target="_blank">View Birth Certificate</a>`
                : "Not uploaded";

        applicationDetails.innerHTML =
            `
            <div class="step">

                <h2>My Application</h2>

                <p>
                    <strong>Application ID:</strong>
                    ${currentStudent.student_id || "N/A"}
                </p>

                <p>
                    <strong>Username:</strong>
                    ${currentStudent.username || "N/A"}
                </p>

                <p>
                    <strong>Name:</strong>
                    ${currentStudent.full_name || "N/A"}
                </p>

                <p>
                    <strong>Date of Birth:</strong>
                    ${
                        currentStudent.dob
                            ? new Date(
                                currentStudent.dob
                            ).toLocaleDateString()
                            : "N/A"
                    }
                </p>

                <p>
                    <strong>Gender:</strong>
                    ${currentStudent.gender || "N/A"}
                </p>

                <p>
                    <strong>Father's Name:</strong>
                    ${currentStudent.father_name || "N/A"}
                </p>

                <p>
                    <strong>Applying Class:</strong>
                    ${
                        currentStudent.applying_class ||
                        "Not Submitted"
                    }
                </p>

                <p>
                    <strong>Aadhaar Number:</strong>
                    ${
                        currentStudent.aadhaar_number ||
                        "N/A"
                    }
                </p>

                <p>
                    <strong>Application Status:</strong>
                    ${
                        currentStudent.application_status ||
                        "Pending"
                    }
                </p>

                <p>
                    <strong>Teacher Status:</strong>
                    ${
                        currentStudent.teacher_status ||
                        "Pending"
                    }
                </p>

                <p>
                    <strong>Principal Status:</strong>
                    ${
                        currentStudent.principal_status ||
                        "Pending"
                    }
                </p>

                <h3>Documents</h3>

                <p>
                    <strong>Student Photo:</strong>
                    ${photoLink}
                </p>

                <p>
                    <strong>Aadhaar Document:</strong>
                    ${aadhaarLink}
                </p>

                <p>
                    <strong>Birth Certificate:</strong>
                    ${birthCertificateLink}
                </p>

            </div>
            `;

    } catch (error) {

        console.error(
            "Application loading error:",
            error
        );

        applicationDetails.innerHTML =
            "<p>Unable to connect to server.</p>";
    }
}

loadStudentApplication();

// ============================================================
// STUDENT STATUS
// ============================================================

async function loadStudentStatus() {

    const statusContainer =
        document.getElementById(
            "studentStatus"
        );

    const statusStudentId =
        document.getElementById(
            "statusStudentId"
        );

    const applicationStatus =
        document.getElementById(
            "applicationStatus"
        );

    const teacherStatus =
        document.getElementById(
            "teacherStatus"
        );

    const principalStatus =
        document.getElementById(
            "principalStatus"
        );

    const finalDecision =
        document.getElementById(
            "finalDecision"
        );

    if (
        !statusContainer &&
        !statusStudentId &&
        !applicationStatus &&
        !teacherStatus &&
        !principalStatus &&
        !finalDecision
    ) {
        return;
    }

    const storedStudent =
        localStorage.getItem("student");

    if (!storedStudent) {

        if (statusContainer) {
            statusContainer.innerHTML =
                "<p>Please login first.</p>";
        }

        if (statusStudentId) {
            statusStudentId.textContent =
                "Not logged in";
        }

        return;
    }

    let student;

    try {

        student =
            JSON.parse(storedStudent);

    } catch (error) {

        if (statusContainer) {
            statusContainer.innerHTML =
                "<p>Please login again.</p>";
        }

        return;
    }

    try {

        const response =
            await fetch(
                API_URL +
                "/api/students/" +
                student.student_id
            );

        const data =
            await response.json();

        if (!response.ok) {

            if (statusContainer) {
                statusContainer.innerHTML =
                    "<p>" +
                    (
                        data.message ||
                        "Unable to load status."
                    ) +
                    "</p>";
            }

            return;
        }

        const currentStudent =
            getStudentFromResponse(data);

        if (statusStudentId) {
            statusStudentId.textContent =
                currentStudent.student_id || "N/A";
        }

        if (applicationStatus) {
            applicationStatus.textContent =
                currentStudent.application_status ||
                "Pending";
        }

        if (teacherStatus) {
            teacherStatus.textContent =
                currentStudent.teacher_status ||
                "Pending";
        }

        if (principalStatus) {
            principalStatus.textContent =
                currentStudent.principal_status ||
                "Pending";
        }

        if (finalDecision) {
            finalDecision.textContent =
                currentStudent.principal_status ||
                "Pending";
        }

        if (statusContainer) {
            statusContainer.innerHTML =
                `
                <h2>Application Status</h2>

                <p>
                    <strong>Student Name:</strong>
                    ${currentStudent.full_name || "N/A"}
                </p>

                <p>
                    <strong>Application Status:</strong>
                    ${
                        currentStudent.application_status ||
                        "Pending"
                    }
                </p>

                <p>
                    <strong>Teacher Status:</strong>
                    ${
                        currentStudent.teacher_status ||
                        "Pending"
                    }
                </p>

                <p>
                    <strong>Teacher Remarks:</strong>
                    ${
                        currentStudent.teacher_remarks ||
                        "No remarks"
                    }
                </p>

                <p>
                    <strong>Principal Status:</strong>
                    ${
                        currentStudent.principal_status ||
                        "Pending"
                    }
                </p>

                <p>
                    <strong>Principal Remarks:</strong>
                    ${
                        currentStudent.principal_remarks ||
                        "No remarks"
                    }
                </p>
                `;
        }

    } catch (error) {

        console.error(
            "Status loading error:",
            error
        );

        if (statusContainer) {
            statusContainer.innerHTML =
                "<p>Unable to connect to server.</p>";
        }
    }
}

loadStudentStatus();

// ============================================================
// STUDENT LOGOUT
// ============================================================

function logoutStudent() {

    localStorage.removeItem("student");

    alert(
        "You have been logged out."
    );

    window.location.href =
        "login.html";
}

// ============================================================
// TEACHER LOGIN
// ============================================================

const teacherLoginForm =
    document.getElementById(
        "teacherLoginForm"
    );

if (teacherLoginForm) {

    teacherLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const usernameElement =
                document.getElementById(
                    "teacherUsername"
                );

            const passwordElement =
                document.getElementById(
                    "teacherPassword"
                );

            const username =
                usernameElement
                    ? usernameElement.value.trim()
                    : "";

            const password =
                passwordElement
                    ? passwordElement.value
                    : "";

            if (!username || !password) {

                alert(
                    "Please enter username and password."
                );

                return;
            }

            try {

                const response =
                    await fetch(
                        API_URL +
                        "/api/teacher/login",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                username: username,
                                password: password
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    alert(
                        data.message ||
                        "Teacher login failed."
                    );

                    return;
                }

                localStorage.setItem(
                    "teacher",
                    JSON.stringify(
                        data.teacher || data
                    )
                );

                alert(
                    "Teacher login successful!"
                );

                window.location.href =
                    "dashboard.html";

            } catch (error) {

                console.error(
                    "Teacher login error:",
                    error
                );

                alert(
                    "Unable to connect to server."
                );
            }
        }
    );
}

// ============================================================
// PRINCIPAL LOGIN
// ============================================================

const principalLoginForm =
    document.getElementById(
        "principalLoginForm"
    );

if (principalLoginForm) {

    principalLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const usernameElement =
                document.getElementById(
                    "principalUsername"
                );

            const passwordElement =
                document.getElementById(
                    "principalPassword"
                );

            const username =
                usernameElement
                    ? usernameElement.value.trim()
                    : "";

            const password =
                passwordElement
                    ? passwordElement.value
                    : "";

            if (!username || !password) {

                alert(
                    "Please enter username and password."
                );

                return;
            }

            try {

                const response =
                    await fetch(
                        API_URL +
                        "/api/principal/login",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                username: username,
                                password: password
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    alert(
                        data.message ||
                        "Principal login failed."
                    );

                    return;
                }

                localStorage.setItem(
                    "principal",
                    JSON.stringify(
                        data.principal || data
                    )
                );

                alert(
                    "Principal login successful!"
                );

                window.location.href =
                    "dashboard.html";

            } catch (error) {

                console.error(
                    "Principal login error:",
                    error
                );

                alert(
                    "Unable to connect to server."
                );
            }
        }
    );
}

// ============================================================
// COMMON STAFF LOGIN
// ============================================================

const staffLoginForm =
    document.getElementById(
        "staffLoginForm"
    );

if (staffLoginForm) {

    staffLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const schoolNameElement =
                document.getElementById(
                    "schoolName"
                );

            const schoolPlaceElement =
                document.getElementById(
                    "schoolPlace"
                );

            const schoolCodeElement =
                document.getElementById(
                    "schoolCode"
                );

            const usernameElement =
                document.getElementById(
                    "staffUsername"
                );

            const passwordElement =
                document.getElementById(
                    "staffPassword"
                );

            const message =
                document.getElementById(
                    "staffLoginMessage"
                );

            const schoolName =
                schoolNameElement
                    ? schoolNameElement.value.trim()
                    : "";

            const schoolPlace =
                schoolPlaceElement
                    ? schoolPlaceElement.value.trim()
                    : "";

            const schoolCode =
                schoolCodeElement
                    ? schoolCodeElement.value.trim()
                    : "";

            const username =
                usernameElement
                    ? usernameElement.value.trim()
                    : "";

            const password =
                passwordElement
                    ? passwordElement.value
                    : "";

            if (
                !schoolName ||
                !schoolPlace ||
                !schoolCode ||
                !username ||
                !password
            ) {

                if (message) {
                    message.textContent =
                        "Please fill all the fields.";
                }

                return;
            }

            try {

                const response =
                    await fetch(
                        API_URL +
                        "/api/staff/login",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                school_name:
                                    schoolName,

                                place:
                                    schoolPlace,

                                school_code:
                                    schoolCode,

                                username:
                                    username,

                                password:
                                    password
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    if (message) {
                        message.textContent =
                            data.message ||
                            "Staff login failed.";
                    }

                    return;
                }

                if (data.role === "principal") {

                    localStorage.setItem(
                        "principal",
                        JSON.stringify(
                            data.principal || data
                        )
                    );

                    alert(
                        "Principal login successful!"
                    );

                    window.location.href =
                        "../principal/dashboard.html";

                    return;
                }

                if (data.role === "teacher") {

                    localStorage.setItem(
                        "teacher",
                        JSON.stringify(
                            data.teacher || data
                        )
                    );

                    alert(
                        "Teacher login successful!"
                    );

                    window.location.href =
                        "../teacher/dashboard.html";

                    return;
                }

                if (message) {
                    message.textContent =
                        "Login successful, but role was not identified.";
                }

            } catch (error) {

                console.error(
                    "Staff login error:",
                    error
                );

                if (message) {
                    message.textContent =
                        "Unable to connect to server.";
                }
            }
        }
    );
}

// ============================================================
// PRINCIPAL SEARCH CONTROLS
// ============================================================

function createPrincipalSearchControls() {

    const container =
        document.getElementById(
            "principalApplications"
        );

    if (!container) {
        return;
    }

    if (
        document.getElementById(
            "principalSearchBox"
        )
    ) {
        return;
    }

    const searchWrapper =
        document.createElement("div");

    searchWrapper.id =
        "principalSearchBox";

    searchWrapper.style.marginBottom =
        "20px";

    searchWrapper.innerHTML =
        `
        <div class="step">

            <h3>Search Students</h3>

            <input
                type="text"
                id="principalStudentSearch"
                placeholder="Search by Student ID, Name, Username or Class..."
                style="
                    width:100%;
                    padding:12px;
                    border:1px solid #ccc;
                    border-radius:6px;
                    font-size:16px;
                    box-sizing:border-box;
                "
            >

            <p style="margin-top:8px;">
                Search results will update automatically.
            </p>

        </div>
        `;

    container.parentNode.insertBefore(
        searchWrapper,
        container
    );

    const searchInput =
        document.getElementById(
            "principalStudentSearch"
        );

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                principalSearchTerm =
                    searchInput.value
                        .trim()
                        .toLowerCase();

                loadPrincipalApplications(
                    currentPrincipalFilter
                );
            }
        );
    }
}

// ============================================================
// PRINCIPAL DASHBOARD
// ============================================================

let currentPrincipalFilter = "all";

async function loadPrincipalApplications(
    filter = "all"
) {

    currentPrincipalFilter = filter;

    const applicationsContainer =
        document.getElementById(
            "principalApplications"
        );

    if (!applicationsContainer) {
        return;
    }

    createPrincipalSearchControls();

    applicationsContainer.innerHTML =
        `
        <div class="step">

            <h3>
                Loading Applications...
            </h3>

            <p>
                Please wait...
            </p>

        </div>
        `;

    try {

        const response =
            await fetch(
                API_URL + "/api/students"
            );

        const result =
            await response.json();

        if (!response.ok) {

            applicationsContainer.innerHTML =
                `
                <div class="step">

                    <h3>
                        Unable to load applications
                    </h3>

                    <p>
                        ${result.message || ""}
                    </p>

                </div>
                `;

            return;
        }

        const students =
            Array.isArray(result)
                ? result
                : result.students || [];

        const pendingCount =
            document.getElementById(
                "principalPendingCount"
            );

        const approvedCount =
            document.getElementById(
                "principalApprovedCount"
            );

        const rejectedCount =
            document.getElementById(
                "principalRejectedCount"
            );

        let pending = 0;
        let approved = 0;
        let rejected = 0;

        students.forEach(function (student) {

            const principalStatus =
                student.principal_status ||
                "Pending";

            const studentUpdated =
                isStudentUpdatedAfterPrincipalReview(
                    student
                );

            if (
                principalStatus === "Pending" ||
                studentUpdated
            ) {

                pending++;

            } else if (
                principalStatus === "Approved"
            ) {

                approved++;

            } else if (
                principalStatus === "Rejected"
            ) {

                rejected++;
            }
        });

        if (pendingCount) {
            pendingCount.textContent = pending;
        }

        if (approvedCount) {
            approvedCount.textContent = approved;
        }

        if (rejectedCount) {
            rejectedCount.textContent = rejected;
        }

        let filteredStudents =
            students;

        if (filter === "pending") {

            filteredStudents =
                students.filter(function (student) {

                    const updated =
                        isStudentUpdatedAfterPrincipalReview(
                            student
                        );

                    return (
                        !student.principal_status ||
                        student.principal_status ===
                            "Pending" ||
                        updated
                    );
                });
        }

        if (filter === "approved") {

            filteredStudents =
                students.filter(function (student) {

                    const updated =
                        isStudentUpdatedAfterPrincipalReview(
                            student
                        );

                    return (
                        student.principal_status ===
                            "Approved" &&
                        !updated
                    );
                });
        }

        if (filter === "rejected") {

            filteredStudents =
                students.filter(function (student) {

                    const updated =
                        isStudentUpdatedAfterPrincipalReview(
                            student
                        );

                    return (
                        student.principal_status ===
                            "Rejected" &&
                        !updated
                    );
                });
        }

        filteredStudents =
            filteredStudents.filter(function (student) {

                return studentMatchesSearch(
                    student,
                    principalSearchTerm
                );
            });

        if (filteredStudents.length === 0) {

            applicationsContainer.innerHTML =
                `
                <div class="step">

                    <h3>
                        No Applications Found
                    </h3>

                    <p>
                        ${
                            principalSearchTerm
                                ? "No students match your search."
                                : "There are no students in this category."
                        }
                    </p>

                </div>
                `;

            return;
        }

        applicationsContainer.innerHTML = "";

        filteredStudents.forEach(function (student) {

            const card =
                document.createElement("div");

            card.className =
                "step teacher-card";

            const principalStatus =
                student.principal_status ||
                "Pending";

            const studentUpdated =
                isStudentUpdatedAfterPrincipalReview(
                    student
                );

            const updateNotice =
                studentUpdated
                    ? `
                        <div style="
                            background:#fff3cd;
                            color:#856404;
                            padding:12px;
                            margin:12px 0;
                            border-radius:6px;
                            border:1px solid #ffe69c;
                            font-weight:bold;
                        ">

                            🔄 Updated by Student

                            <br>

                            <small>
                                Last updated:
                                ${formatDateTime(
                                    student.student_updated_at
                                )}
                            </small>

                        </div>
                      `
                    : "";

            const photoLink =
                student.student_photo
                    ? `<a href="${API_URL}${student.student_photo}" target="_blank">View Photo</a>`
                    : "Not uploaded";

            const aadhaarLink =
                student.aadhaar_document
                    ? `<a href="${API_URL}${student.aadhaar_document}" target="_blank">View Aadhaar</a>`
                    : "Not uploaded";

            const birthCertificateLink =
                student.birth_certificate
                    ? `<a href="${API_URL}${student.birth_certificate}" target="_blank">View Birth Certificate</a>`
                    : "Not uploaded";

            card.innerHTML =
                `
                <h3>
                    ${student.full_name || "N/A"}
                </h3>

                ${updateNotice}

                <p>
                    <strong>Application ID:</strong>
                    ${student.student_id || "N/A"}
                </p>

                <p>
                    <strong>Username:</strong>
                    ${student.username || "N/A"}
                </p>

                <p>
                    <strong>Date of Birth:</strong>
                    ${
                        student.dob
                            ? new Date(
                                student.dob
                            ).toLocaleDateString()
                            : "N/A"
                    }
                </p>

                <p>
                    <strong>Gender:</strong>
                    ${student.gender || "N/A"}
                </p>

                <p>
                    <strong>Father's Name:</strong>
                    ${student.father_name || "N/A"}
                </p>

                <p>
                    <strong>Applying Class:</strong>
                    ${
                        student.applying_class ||
                        "Not Submitted"
                    }
                </p>

                <p>
                    <strong>Teacher Review:</strong>
                    ${
                        student.teacher_status ||
                        "Pending"
                    }
                </p>

                <p>
                    <strong>Teacher Remarks:</strong>
                    ${
                        student.teacher_remarks ||
                        "No remarks"
                    }
                </p>

                <h4>
                    Uploaded Documents
                </h4>

                <p>
                    <strong>Student Photo:</strong>
                    ${photoLink}
                </p>

                <p>
                    <strong>Aadhaar Document:</strong>
                    ${aadhaarLink}
                </p>

                <p>
                    <strong>Birth Certificate:</strong>
                    ${birthCertificateLink}
                </p>

                <p>
                    <strong>Principal Review:</strong>
                    ${principalStatus}
                </p>

                <p>
                    <strong>Principal Remarks:</strong>
                    ${
                        student.principal_remarks ||
                        "No remarks"
                    }
                </p>
                `;

            if (
                principalStatus === "Pending" ||
                studentUpdated
            ) {

                const buttonContainer =
                    document.createElement("div");

                buttonContainer.innerHTML =
                    `
                    <button
                        type="button"
                        class="btn principal-approve-btn"
                        data-id="${student.student_id}">
                        Approve
                    </button>

                    <button
                        type="button"
                        class="btn principal-reject-btn"
                        data-id="${student.student_id}">
                        Reject
                    </button>
                    `;

                card.appendChild(
                    buttonContainer
                );

            } else {

                const completed =
                    document.createElement("p");

                completed.innerHTML =
                    "<strong>Review Completed</strong>";

                card.appendChild(completed);
            }

            applicationsContainer.appendChild(card);
        });

        applicationsContainer
            .querySelectorAll(
                ".principal-approve-btn"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        updatePrincipalDecision(
                            button.dataset.id,
                            "Approved"
                        );
                    }
                );
            });

        applicationsContainer
            .querySelectorAll(
                ".principal-reject-btn"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        updatePrincipalDecision(
                            button.dataset.id,
                            "Rejected"
                        );
                    }
                );
            });

    } catch (error) {

        console.error(
            "Principal applications error:",
            error
        );

        applicationsContainer.innerHTML =
            `
            <div class="step">

                <h3>
                    Unable to Load Applications
                </h3>

                <p>
                    Please make sure the backend server is running.
                </p>

            </div>
            `;
    }
}

// ============================================================
// PRINCIPAL DECISION
// ============================================================

async function updatePrincipalDecision(
    studentId,
    status
) {

    let remarks;

    if (status === "Approved") {

        remarks =
            "Application approved by principal.";

    } else {

        remarks =
            "Application rejected by principal.";
    }

    try {

        const response =
            await fetch(
                API_URL +
                "/api/students/" +
                studentId +
                "/principal-review",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        principal_status:
                            status,

                        principal_remarks:
                            remarks
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Failed to update application."
            );

            return;
        }

        alert(
            data.message ||
            "Principal decision saved successfully!"
        );

        loadPrincipalApplications(
            currentPrincipalFilter
        );

    } catch (error) {

        console.error(
            "Principal decision error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}

// ============================================================
// PRINCIPAL STATUS CARDS
// ============================================================

const principalPendingCard =
    document.getElementById(
        "principalPendingCard"
    );

const principalApprovedCard =
    document.getElementById(
        "principalApprovedCard"
    );

const principalRejectedCard =
    document.getElementById(
        "principalRejectedCard"
    );

if (principalPendingCard) {

    principalPendingCard.style.cursor =
        "pointer";

    principalPendingCard.addEventListener(
        "click",
        function () {

            loadPrincipalApplications(
                "pending"
            );
        }
    );
}

if (principalApprovedCard) {

    principalApprovedCard.style.cursor =
        "pointer";

    principalApprovedCard.addEventListener(
        "click",
        function () {

            loadPrincipalApplications(
                "approved"
            );
        }
    );
}

if (principalRejectedCard) {

    principalRejectedCard.style.cursor =
        "pointer";

    principalRejectedCard.addEventListener(
        "click",
        function () {

            loadPrincipalApplications(
                "rejected"
            );
        }
    );
}

// ============================================================
// CREATE TEACHER ACCOUNT
// ============================================================

const createTeacherForm =
    document.getElementById(
        "createTeacherForm"
    );

if (createTeacherForm) {

    createTeacherForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const teacherNameElement =
                document.getElementById(
                    "teacherName"
                );

            const teacherUsernameElement =
                document.getElementById(
                    "teacherUsername"
                );

            const teacherPasswordElement =
                document.getElementById(
                    "teacherPassword"
                );

            const teacherName =
                teacherNameElement
                    ? teacherNameElement.value.trim()
                    : "";

            const teacherUsername =
                teacherUsernameElement
                    ? teacherUsernameElement.value.trim()
                    : "";

            const teacherPassword =
                teacherPasswordElement
                    ? teacherPasswordElement.value
                    : "";

            if (
                !teacherName ||
                !teacherUsername ||
                !teacherPassword
            ) {

                alert(
                    "Please fill all teacher fields."
                );

                return;
            }

            const principalData =
                localStorage.getItem(
                    "principal"
                );

            if (!principalData) {

                alert(
                    "Principal login is required."
                );

                return;
            }

            let principal;

            try {

                principal =
                    JSON.parse(principalData);

            } catch (error) {

                alert(
                    "Please login as principal again."
                );

                return;
            }

            try {

                const response =
                    await fetch(
                        API_URL +
                        "/api/teachers",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                teacher_name:
                                    teacherName,

                                username:
                                    teacherUsername,

                                password:
                                    teacherPassword,

                                school_id:
                                    principal.school_id
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    alert(
                        data.message ||
                        "Failed to create teacher."
                    );

                    return;
                }

                alert(
                    data.message ||
                    "Teacher account created successfully!"
                );

                createTeacherForm.reset();

                loadTeachers();

            } catch (error) {

                console.error(
                    "Teacher creation error:",
                    error
                );

                alert(
                    "Unable to connect to server."
                );
            }
        }
    );
}

// ============================================================
// LOAD TEACHERS
// ============================================================

async function loadTeachers() {

    const teacherList =
        document.getElementById(
            "teacherList"
        );

    if (!teacherList) {
        return;
    }

    try {

        const response =
            await fetch(
                API_URL +
                "/api/teachers"
            );

        const result =
            await response.json();

        if (!response.ok) {

            teacherList.innerHTML =
                "<p>Failed to load teachers.</p>";

            return;
        }

        const teachers =
            Array.isArray(result)
                ? result
                : result.teachers || [];

        if (
            !teachers ||
            teachers.length === 0
        ) {

            teacherList.innerHTML =
                "<p>No teacher accounts found.</p>";

            return;
        }

        teacherList.innerHTML = "";

        teachers.forEach(function (teacher) {

            const card =
                document.createElement("div");

            card.className =
                "step";

            const accountStatus =
                teacher.account_status ||
                teacher.status ||
                "Pending";

            card.innerHTML =
                `
                <h3>
                    ${
                        teacher.teacher_name ||
                        "Teacher"
                    }
                </h3>

                <p>
                    <strong>Username:</strong>
                    ${
                        teacher.username ||
                        "N/A"
                    }
                </p>

                <p>
                    <strong>Status:</strong>
                    ${accountStatus}
                </p>

                ${
                    accountStatus === "Pending"
                        ? `
                            <button
                                type="button"
                                class="btn teacher-approve-btn"
                                data-id="${teacher.teacher_id}">
                                Approve
                            </button>

                            <button
                                type="button"
                                class="btn teacher-reject-btn"
                                data-id="${teacher.teacher_id}">
                                Reject
                            </button>
                          `
                        : ""
                }
                `;

            teacherList.appendChild(card);
        });

        teacherList
            .querySelectorAll(
                ".teacher-approve-btn"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        approveTeacher(
                            button.dataset.id
                        );
                    }
                );
            });

        teacherList
            .querySelectorAll(
                ".teacher-reject-btn"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        rejectTeacher(
                            button.dataset.id
                        );
                    }
                );
            });

    } catch (error) {

        console.error(
            "Teacher loading error:",
            error
        );

        teacherList.innerHTML =
            "<p>Unable to connect to server.</p>";
    }
}

loadTeachers();

// ============================================================
// APPROVE TEACHER
// ============================================================

async function approveTeacher(
    teacherId
) {

    try {

        const response =
            await fetch(
                API_URL +
                "/api/teachers/" +
                teacherId +
                "/approve",
                {
                    method: "PUT"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Failed to approve teacher."
            );

            return;
        }

        alert(
            data.message ||
            "Teacher approved successfully!"
        );

        loadTeachers();

    } catch (error) {

        console.error(
            "Teacher approval error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}

// ============================================================
// REJECT TEACHER
// ============================================================

async function rejectTeacher(
    teacherId
) {

    try {

        const response =
            await fetch(
                API_URL +
                "/api/teachers/" +
                teacherId +
                "/reject",
                {
                    method: "PUT"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Failed to reject teacher."
            );

            return;
        }

        alert(
            data.message ||
            "Teacher rejected successfully!"
        );

        loadTeachers();

    } catch (error) {

        console.error(
            "Teacher rejection error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}

// ============================================================
// TEACHER APPLICATION FILTER
// ============================================================

let teacherApplicationFilter = "all";

// ============================================================
// TEACHER SEARCH BAR
// Uses the existing search input.
// ============================================================

const teacherStudentSearch =
    document.getElementById(
        "teacherStudentSearch"
    );

if (teacherStudentSearch) {

    teacherStudentSearch.addEventListener(
        "input",
        function () {

            teacherSearchTerm =
                teacherStudentSearch.value
                    .trim()
                    .toLowerCase();

            loadTeacherDashboard();
        }
    );
}

// ============================================================
// TEACHER DASHBOARD
// ============================================================

async function loadTeacherDashboard() {

    const pendingCount =
        document.getElementById(
            "pendingCount"
        );

    const reviewedCount =
        document.getElementById(
            "reviewedCount"
        );

    const principalCount =
        document.getElementById(
            "principalCount"
        );

    const classes1to7 =
        document.getElementById(
            "classes1to7"
        );

    const classes8to10 =
        document.getElementById(
            "classes8to10"
        );

    const classNotSubmitted =
        document.getElementById(
            "classNotSubmitted"
        );

    const teacherSearchResult =
        document.getElementById(
            "teacherSearchResult"
        );

    if (
        !pendingCount &&
        !reviewedCount &&
        !principalCount &&
        !classes1to7 &&
        !classes8to10 &&
        !classNotSubmitted
    ) {
        return;
    }

    const storedTeacher =
        localStorage.getItem(
            "teacher"
        );

    if (!storedTeacher) {

        alert(
            "Please login as a teacher."
        );

        window.location.href =
            "login.html";

        return;
    }

    try {

        const response =
            await fetch(
                API_URL +
                "/api/students"
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to load students"
            );
        }

        const students =
            Array.isArray(result)
                ? result
                : result.students || [];

        let pending = 0;
        let reviewed = 0;
        let sentToPrincipal = 0;

        students.forEach(function (student) {

            const status =
                student.teacher_status ||
                "Pending";

            const studentUpdated =
                isStudentUpdatedAfterTeacherReview(
                    student
                );

            if (
                status === "Pending" ||
                studentUpdated
            ) {

                pending++;

            } else {

                reviewed++;
            }

            if (
                status === "Suitable" &&
                !studentUpdated
            ) {

                sentToPrincipal++;
            }
        });

        if (pendingCount) {
            pendingCount.textContent =
                pending;
        }

        if (reviewedCount) {
            reviewedCount.textContent =
                reviewed;
        }

        if (principalCount) {
            principalCount.textContent =
                sentToPrincipal;
        }

        let filteredStudents =
            students.filter(function (student) {

                const status =
                    student.teacher_status ||
                    "Pending";

                const studentUpdated =
                    isStudentUpdatedAfterTeacherReview(
                        student
                    );

                if (
                    teacherApplicationFilter ===
                    "pending"
                ) {

                    return (
                        status === "Pending" ||
                        studentUpdated
                    );
                }

                if (
                    teacherApplicationFilter ===
                    "reviewed"
                ) {

                    return (
                        status !== "Pending" &&
                        !studentUpdated
                    );
                }

                if (
                    teacherApplicationFilter ===
                    "principal"
                ) {

                    return (
                        status === "Suitable" &&
                        !studentUpdated
                    );
                }

                return true;
            });

        const searchableStudents =
            filteredStudents.filter(
                function (student) {

                    return studentMatchesSearch(
                        student,
                        teacherSearchTerm
                    );
                }
            );

        if (teacherSearchResult) {

            let filterText =
                "all applications";

            if (
                teacherApplicationFilter ===
                "pending"
            ) {

                filterText =
                    "pending applications";

            } else if (
                teacherApplicationFilter ===
                "reviewed"
            ) {

                filterText =
                    "reviewed applications";

            } else if (
                teacherApplicationFilter ===
                "principal"
            ) {

                filterText =
                    "applications sent to principal";
            }

            if (teacherSearchTerm) {

                teacherSearchResult.textContent =
                    `Showing ${searchableStudents.length} matching ${filterText}`;

            } else {

                teacherSearchResult.textContent =
                    `Showing ${searchableStudents.length} ${filterText}`;
            }
        }

        const class1to7 =
            searchableStudents.filter(
                function (student) {

                    const classValue =
                        parseInt(
                            student.applying_class,
                            10
                        );

                    return (
                        classValue >= 1 &&
                        classValue <= 7
                    );
                }
            );

        const class8to10 =
            searchableStudents.filter(
                function (student) {

                    const classValue =
                        parseInt(
                            student.applying_class,
                            10
                        );

                    return (
                        classValue >= 8 &&
                        classValue <= 10
                    );
                }
            );

        const classNotSubmittedStudents =
            searchableStudents.filter(
                function (student) {

                    return (
                        !student.applying_class ||
                        student.applying_class === "" ||
                        student.applying_class === null
                    );
                }
            );

        displayTeacherApplications(
            class1to7,
            classes1to7
        );

        displayTeacherApplications(
            class8to10,
            classes8to10
        );

        displayTeacherApplications(
            classNotSubmittedStudents,
            classNotSubmitted
        );

    } catch (error) {

        console.error(
            "Teacher dashboard error:",
            error
        );

        const errorHTML =
            `
            <div class="step">

                <h3>
                    Unable to load applications
                </h3>

                <p>
                    Please make sure the backend server is running.
                </p>

            </div>
            `;

        if (classes1to7) {
            classes1to7.innerHTML =
                errorHTML;
        }

        if (classes8to10) {
            classes8to10.innerHTML =
                errorHTML;
        }

        if (classNotSubmitted) {
            classNotSubmitted.innerHTML =
                errorHTML;
        }
    }
}

// ============================================================
// TEACHER APPLICATION CARD FILTERS
// ============================================================

function showTeacherApplications(filter) {

    teacherApplicationFilter =
        filter;

    loadTeacherDashboard();
}

// ============================================================
// PENDING APPLICATIONS CARD
// ============================================================

const pendingCard =
    document.getElementById(
        "pendingCard"
    );

if (pendingCard) {

    pendingCard.addEventListener(
        "click",
        function () {

            showTeacherApplications(
                "pending"
            );
        }
    );
}

// ============================================================
// REVIEWED APPLICATIONS CARD
// ============================================================

const reviewedCard =
    document.getElementById(
        "reviewedCard"
    );

if (reviewedCard) {

    reviewedCard.addEventListener(
        "click",
        function () {

            showTeacherApplications(
                "reviewed"
            );
        }
    );
}

// ============================================================
// SENT TO PRINCIPAL CARD
// ============================================================

const principalCard =
    document.getElementById(
        "principalCard"
    );

if (principalCard) {

    principalCard.addEventListener(
        "click",
        function () {

            showTeacherApplications(
                "principal"
            );
        }
    );
}

// ============================================================
// DISPLAY TEACHER APPLICATIONS
// ============================================================

function displayTeacherApplications(
    students,
    container
) {

    if (!container) {
        return;
    }

    if (!students || students.length === 0) {

        let message =
            "No student applications found.";

        if (teacherSearchTerm) {

            message =
                "No students match your search.";

        } else if (
            teacherApplicationFilter ===
            "pending"
        ) {

            message =
                "No pending applications found.";

        } else if (
            teacherApplicationFilter ===
            "reviewed"
        ) {

            message =
                "No reviewed applications found.";

        } else if (
            teacherApplicationFilter ===
            "principal"
        ) {

            message =
                "No applications have been sent to the principal.";
        }

        container.innerHTML =
            `
            <div class="step">

                <h3>
                    No Applications
                </h3>

                <p>
                    ${message}
                </p>

            </div>
            `;

        return;
    }

    container.innerHTML = "";

    students.forEach(function (student) {

        const card =
            document.createElement("div");

        card.className =
            "step teacher-card";

        const teacherStatus =
            student.teacher_status ||
            "Pending";

        const studentUpdated =
            isStudentUpdatedAfterTeacherReview(
                student
            );

        const updateNotice =
            studentUpdated
                ? `
                    <div style="
                        background:#fff3cd;
                        color:#856404;
                        padding:12px;
                        margin:12px 0;
                        border-radius:6px;
                        border:1px solid #ffe69c;
                        font-weight:bold;
                    ">

                        🔄 Updated by Student

                        <br>

                        <small>
                            Last updated:
                            ${formatDateTime(
                                student.student_updated_at
                            )}
                        </small>

                    </div>
                  `
                : "";

        const photoLink =
            student.student_photo
                ? `
                    <a
                        href="${API_URL}${student.student_photo}"
                        target="_blank"
                    >
                        View Photo
                    </a>
                  `
                : "Not uploaded";

        const aadhaarLink =
            student.aadhaar_document
                ? `
                    <a
                        href="${API_URL}${student.aadhaar_document}"
                        target="_blank"
                    >
                        View Aadhaar
                    </a>
                  `
                : "Not uploaded";

        const birthCertificateLink =
            student.birth_certificate
                ? `
                    <a
                        href="${API_URL}${student.birth_certificate}"
                        target="_blank"
                    >
                        View Birth Certificate
                    </a>
                  `
                : "Not uploaded";

        card.innerHTML =
            `
            <h3>
                ${student.full_name || "N/A"}
            </h3>

            ${updateNotice}

            <p>
                <strong>Application ID:</strong>
                ${student.student_id || "N/A"}
            </p>

            <p>
                <strong>Username:</strong>
                ${student.username || "N/A"}
            </p>

            <p>
                <strong>Date of Birth:</strong>
                ${
                    student.dob
                        ? new Date(
                            student.dob
                        ).toLocaleDateString()
                        : "N/A"
                }
            </p>

            <p>
                <strong>Gender:</strong>
                ${student.gender || "N/A"}
            </p>

            <p>
                <strong>Father's Name:</strong>
                ${student.father_name || "N/A"}
            </p>

            <p>
                <strong>Applying Class:</strong>
                ${
                    student.applying_class ||
                    "Not Submitted"
                }
            </p>

            <h4>
                Uploaded Documents
            </h4>

            <p>
                <strong>Student Photo:</strong>
                ${photoLink}
            </p>

            <p>
                <strong>Aadhaar Document:</strong>
                ${aadhaarLink}
            </p>

            <p>
                <strong>Birth Certificate:</strong>
                ${birthCertificateLink}
            </p>

            <p>
                <strong>Teacher Status:</strong>
                ${teacherStatus}
            </p>

            <p>
                <strong>Teacher Remarks:</strong>
                ${
                    student.teacher_remarks ||
                    "No remarks"
                }
            </p>

            <p>
                <strong>Principal Status:</strong>
                ${
                    student.principal_status ||
                    "Pending"
                }
            </p>
            `;

        if (
            teacherStatus === "Pending" ||
            studentUpdated
        ) {

            const buttonContainer =
                document.createElement("div");

            buttonContainer.innerHTML =
                `
                <button
                    type="button"
                    class="btn teacher-suitable-btn"
                    data-id="${student.student_id}"
                >
                    Suitable
                </button>

                <button
                    type="button"
                    class="btn teacher-not-suitable-btn"
                    data-id="${student.student_id}"
                >
                    Not Suitable
                </button>
                `;

            card.appendChild(
                buttonContainer
            );

        } else {

            const completed =
                document.createElement("p");

            completed.innerHTML =
                `
                <strong>
                    Review Completed
                </strong>
                `;

            card.appendChild(
                completed
            );
        }

        container.appendChild(
            card
        );
    });

    container
        .querySelectorAll(
            ".teacher-suitable-btn"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    submitTeacherReview(
                        button.dataset.id,
                        "Suitable"
                    );
                }
            );
        });

    container
        .querySelectorAll(
            ".teacher-not-suitable-btn"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    submitTeacherReview(
                        button.dataset.id,
                        "Not Suitable"
                    );
                }
            );
        });
}

// ============================================================
// SUBMIT TEACHER REVIEW
// ============================================================

async function submitTeacherReview(
    studentId,
    status
) {

    let remarks;

    if (status === "Suitable") {

        remarks =
            "Student is suitable for admission.";

    } else {

        remarks =
            "Student is not suitable for admission.";
    }

    try {

        const response =
            await fetch(
                API_URL +
                "/api/students/" +
                studentId +
                "/teacher-review",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        teacher_status:
                            status,

                        teacher_remarks:
                            remarks
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Failed to submit teacher review."
            );

            return;
        }

        alert(
            data.message ||
            "Teacher review submitted successfully!"
        );

        loadTeacherDashboard();

    } catch (error) {

        console.error(
            "Teacher review error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}

// ============================================================
// TEACHER LOGOUT
// ============================================================

function teacherLogout() {

    localStorage.removeItem(
        "teacher"
    );

    alert(
        "You have been logged out."
    );

    window.location.href =
        "login.html";
}

// ============================================================
// PRINCIPAL LOGOUT
// ============================================================

function principalLogout() {

    localStorage.removeItem(
        "principal"
    );

    alert(
        "You have been logged out."
    );

    window.location.href =
        "login.html";
}

// ============================================================
// LOAD PRINCIPAL DASHBOARD
// ============================================================

if (
    document.getElementById(
        "principalApplications"
    )
) {

    createPrincipalSearchControls();

    loadPrincipalApplications(
        "all"
    );
}

// ============================================================
// RUN TEACHER DASHBOARD
// ============================================================

loadTeacherDashboard();

// ============================================================
// END OF script.js
// ============================================================