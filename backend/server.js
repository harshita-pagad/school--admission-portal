const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// ============================================================
// BASIC CONFIGURATION
// ============================================================

const PORT = process.env.PORT || 3000;
// Keep your real MySQL password locally.
// You can also set it as an environment variable:
// Windows PowerShell:
// $env:DB_PASSWORD="your_password"
const DB_PASSWORD =
    process.env.DB_PASSWORD;

// ============================================================
// FILE UPLOAD CONFIGURATION
// ============================================================

const uploadDirectory = path.join(__dirname, "../uploads");
console.log("UPLOAD DIRECTORY:", uploadDirectory);
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}

// ============================================================
// MULTER STORAGE
// ============================================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, uploadDirectory);
    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname).toLowerCase();

        cb(null, uniqueName);
    }

});

// ============================================================
// FILE FILTER
// ============================================================

const fileFilter = function (req, file, cb) {

    const allowedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".pdf"
    ];

    const extension =
        path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(extension)) {

        cb(null, true);

    } else {

        cb(
            new Error(
                "Only JPG, JPEG, PNG, WEBP and PDF files are allowed."
            )
        );

    }
};

// ============================================================
// MULTER
// ============================================================

const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }

});

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
    cors()
);

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);

// Make uploaded files accessible from browser
app.use(
    "/uploads",
    express.static(uploadDirectory)
);


// ============================================================
// MYSQL CONNECTION
// ======//
 console.log("DB_SSL enabled:", process.env.DB_SSL === "true");
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "school_admission",
    port: Number(process.env.DB_PORT) || 3307,

    ssl: process.env.DB_SSL === "true"
        ? { minVersion: "TLSv1.2" }
        : undefined
});

// ============================================================
// MYSQL CONNECT
// ============================================================

db.connect((err) => {
    if (err) {
        console.error("MYSQL CONNECTION FAILED:", err.message);
        return;
    }

    console.log("MySQL connected successfully!");
});


// ============================================================
// TEST ROUTE
// ============================================================

app.get("/", (req, res) => {

    res.json({
        message:
            "School Admission Portal backend is running!"
    });

});
// ============================================================
// STUDENT REGISTRATION
// ============================================================

app.post(
    "/api/student/register",
    async (req, res) => {

        const {
            name,
            username,
            password
        } = req.body;

        if (
            !name ||
            !username ||
            !password
        ) {
            return res.status(400).json({
                message:
                    "Name, username and password are required"
            });
        }

        try {

            // Check whether username already exists
            const checkSql = `
                SELECT student_id
                FROM students
                WHERE username = ?
            `;

            db.query(
                checkSql,
                [username.trim()],
                async (checkErr, results) => {

                    if (checkErr) {

                        console.error(
                            "Username check error:",
                            checkErr
                        );

                        return res.status(500).json({
                            message: "Database error"
                        });
                    }

                    if (results.length > 0) {

                        return res.status(409).json({
                            message:
                                "Username already registered"
                        });
                    }

                    // Hash password
                    const hashedPassword =
                        await bcrypt.hash(
                            password,
                            10
                        );

                    const sql = `
                        INSERT INTO students
                        (
                            full_name,
                            username,
                            password
                        )
                        VALUES (?, ?, ?)
                    `;

                    db.query(
                        sql,
                        [
                            name.trim(),
                            username.trim(),
                            hashedPassword
                        ],
                        (err, result) => {

                            if (err) {

                                console.error(
                                    "Student registration error:",
                                    err
                                );

                                return res.status(500).json({
                                    message:
                                        "Registration failed",
                                    error: err.message
                                });
                            }

                            res.status(201).json({

                                message:
                                    "Registration successful!",

                                student_id:
                                    result.insertId
                            });
                        }
                    );
                }
            );

        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);

// ============================================================
// STUDENT LOGIN
// ============================================================

app.post(
    "/api/student/login",
    async (req, res) => {

        const {
            username,
            password
        } = req.body;

        if (
            !username ||
            !password
        ) {
            return res.status(400).json({
                message:
                    "Username and password are required"
            });
        }

        const sql = `
            SELECT *
            FROM students
            WHERE username = ?
        `;

        db.query(
            sql,
            [username.trim()],
            async (err, results) => {

                if (err) {

                    console.error(
                        "Student login database error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Login failed",
                        error:
                            err.message
                    });
                }

                if (results.length === 0) {

                    return res.status(401).json({
                        message:
                            "Invalid username or password"
                    });
                }

                const student =
                    results[0];

                const passwordMatch =
                    await bcrypt.compare(
                        password,
                        student.password
                    );

                if (!passwordMatch) {

                    return res.status(401).json({
                        message:
                            "Invalid username or password"
                    });
                }

                res.json({

                    message:
                        "Login successful!",

                    student: {

                        student_id:
                            student.student_id,

                        full_name:
                            student.full_name,

                        username:
                            student.username
                    }
                });
            }
        );
    }
);
// ============================================================
// PRINCIPAL REGISTRATION
// ============================================================

app.post(
    "/api/principal/register",
    async (req, res) => {
        const {
            principal_name,
            username,
            password,
            school_code
        } = req.body;

        if (!principal_name || !username || !password || !school_code) {
            return res.status(400).json({
                message:
                    "Principal name, username, password and school code are required"
            });
        }

        try {
            const schoolSql = `
                SELECT school_id, school_name, place, school_code
                FROM schools
                WHERE school_code = ?
            `;

            db.query(
                schoolSql,
                [school_code.trim()],
                async (schoolErr, schools) => {
                    if (schoolErr) {
                        console.error("School lookup error:", schoolErr);

                        return res.status(500).json({
                            message: "Failed to find school"
                        });
                    }

                    if (schools.length === 0) {
                        return res.status(404).json({
                            message: "School code not found"
                        });
                    }

                    const school = schools[0];

                    const checkSql = `
                        SELECT principal_id
                        FROM principals
                        WHERE username = ?
                    `;

                    db.query(
                        checkSql,
                        [username.trim()],
                        async (checkErr, results) => {
                            if (checkErr) {
                                console.error(
                                    "Principal username check error:",
                                    checkErr
                                );

                                return res.status(500).json({
                                    message: "Failed to check username"
                                });
                            }

                            if (results.length > 0) {
                                return res.status(409).json({
                                    message: "Principal username already exists"
                                });
                            }

                            try {
                                const hashedPassword = await bcrypt.hash(
                                    password,
                                    10
                                );

                                const insertSql = `
                                    INSERT INTO principals
                                    (
                                        principal_name,
                                        username,
                                        password,
                                        school_id
                                    )
                                    VALUES (?, ?, ?, ?)
                                `;

                                db.query(
                                    insertSql,
                                    [
                                        principal_name.trim(),
                                        username.trim(),
                                        hashedPassword,
                                        school.school_id
                                    ],
                                    (insertErr, result) => {
                                        if (insertErr) {
                                            console.error(
                                                "Principal registration error:",
                                                insertErr
                                            );

                                            return res.status(500).json({
                                                message:
                                                    "Principal registration failed"
                                            });
                                        }

                                        return res.status(201).json({
                                            message:
                                                "Principal registered successfully!",
                                            principal_id: result.insertId,
                                            principal_name:
                                                principal_name.trim(),
                                            school: {
                                                school_id: school.school_id,
                                                school_name: school.school_name,
                                                place: school.place,
                                                school_code: school.school_code
                                            }
                                        });
                                    }
                                );
                            } catch (hashErr) {
                                console.error(
                                    "Principal password hashing error:",
                                    hashErr
                                );

                                return res.status(500).json({
                                    message:
                                        "Failed to create principal account"
                                });
                            }
                        }
                    );
                }
            );
        } catch (error) {
            console.error("Principal registration error:", error);

            return res.status(500).json({
                message: "Principal registration failed"
            });
        }
    }
);
// ============================================================
// PRINCIPAL LOGIN
// ============================================================

app.post(
    "/api/principal/login",
    async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        const sql = `
            SELECT
                principal_id,
                principal_name,
                username,
                password,
                school_id
            FROM principals
            WHERE username = ?
        `;

        db.query(
            sql,
            [username.trim()],
            async (err, results) => {
                if (err) {
                    console.error("Principal login database error:", err);

                    return res.status(500).json({
                        message: "Principal login failed"
                    });
                }

                if (results.length === 0) {
                    return res.status(401).json({
                        message: "Invalid username or password"
                    });
                }

                try {
                    const principal = results[0];

                    const passwordMatch = await bcrypt.compare(
                        password,
                        principal.password
                    );

                    if (!passwordMatch) {
                        return res.status(401).json({
                            message: "Invalid username or password"
                        });
                    }

                    return res.json({
                        message: "Principal login successful!",
                        principal: {
                            principal_id: principal.principal_id,
                            principal_name: principal.principal_name,
                            username: principal.username,
                            school_id: principal.school_id
                        }
                    });
                } catch (compareErr) {
                    console.error(
                        "Principal password verification error:",
                        compareErr
                    );

                    return res.status(500).json({
                        message: "Principal login failed"
                    });
                }
            }
        );
    }
);

// ============================================================
// CREATE TEACHER
// ============================================================

app.post(
    "/api/teachers",
    async (req, res) => {

        const {
            teacher_name,
            username,
            password,
            school_id
        } = req.body;

        if (
            !teacher_name ||
            !username ||
            !password ||
            !school_id
        ) {

            return res.status(400).json({
                message:
                    "Teacher name, username, password and school ID are required"
            });

        }

        try {

            const checkSql = `
                SELECT teacher_id
                FROM teachers
                WHERE username = ?
            `;

            db.query(
                checkSql,
                [username],
                async (err, results) => {

                    if (err) {

                        console.error(
                            "Teacher username check error:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                "Failed to check teacher username",
                            error:
                                err.message
                        });

                    }

                    if (
                        results.length > 0
                    ) {

                        return res.status(409).json({
                            message:
                                "Teacher username already exists"
                        });

                    }

                    const hashedPassword =
                        await bcrypt.hash(
                            password,
                            10
                        );

                    const insertSql = `
                        INSERT INTO teachers
                        (
                            teacher_name,
                            username,
                            password,
                            account_status,
                            school_id
                        )
                        VALUES (?, ?, ?, 'Pending', ?)
                    `;

                    db.query(
                        insertSql,
                        [
                            teacher_name,
                            username,
                            hashedPassword,
                            school_id
                        ],
                        (err, result) => {

                            if (err) {

                                console.error(
                                    "Teacher creation error:",
                                    err
                                );

                                return res.status(500).json({
                                    message:
                                        "Failed to create teacher",
                                    error:
                                        err.message
                                });

                            }

                            res.status(201).json({

                                message:
                                    "Teacher account created successfully. Waiting for principal approval.",

                                teacher_id:
                                    result.insertId

                            });

                        }
                    );

                }
            );

        } catch (error) {

            console.error(
                "Teacher creation error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to create teacher",
                error:
                    error.message
            });

        }

    }
);

// ============================================================
// TEACHER LOGIN
// ============================================================

app.post(
    "/api/teacher/login",
    async (req, res) => {

        const {
            username,
            password
        } = req.body;

        if (
            !username ||
            !password
        ) {

            return res.status(400).json({
                message:
                    "Username and password are required"
            });

        }

        const sql = `
            SELECT *
            FROM teachers
            WHERE username = ?
        `;

        db.query(
            sql,
            [username],
            async (err, results) => {

                if (err) {

                    console.error(
                        "Teacher login database error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Teacher login failed",
                        error:
                            err.message
                    });

                }

                if (
                    results.length === 0
                ) {

                    return res.status(401).json({
                        message:
                            "Invalid username or password"
                    });

                }

                const teacher =
                    results[0];

                if (
                    teacher.account_status !==
                    "Approved"
                ) {

                    return res.status(403).json({
                        message:
                            "Your teacher account is not approved by the principal yet."
                    });

                }

                const passwordMatch =
                    await bcrypt.compare(
                        password,
                        teacher.password
                    );

                if (!passwordMatch) {

                    return res.status(401).json({
                        message:
                            "Invalid username or password"
                    });

                }

                res.json({

                    message:
                        "Teacher login successful!",

                    teacher: {

                        teacher_id:
                            teacher.teacher_id,

                        teacher_name:
                            teacher.teacher_name,

                        username:
                            teacher.username,

                        school_id:
                            teacher.school_id

                    }

                });

            }
        );

    }
);

// ============================================================
// GET ALL TEACHERS
// ============================================================

app.get(
    "/api/teachers",
    (req, res) => {

        const sql = `
            SELECT
                teacher_id,
                teacher_name,
                username,
                account_status,
                school_id
            FROM teachers
            ORDER BY teacher_id DESC
        `;

        db.query(
            sql,
            (err, results) => {

                if (err) {

                    console.error(
                        "Teacher fetch database error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Failed to fetch teachers",
                        error:
                            err.message
                    });

                }

                res.json(results);

            }
        );

    }
);

// ============================================================
// APPROVE TEACHER
// ============================================================

app.put(
    "/api/teachers/:id/approve",
    (req, res) => {

        const teacherId =
            req.params.id;

        const sql = `
            UPDATE teachers
            SET account_status = 'Approved'
            WHERE teacher_id = ?
        `;

        db.query(
            sql,
            [teacherId],
            (err, result) => {

                if (err) {

                    console.error(
                        "Teacher approval database error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Failed to approve teacher",
                        error:
                            err.message
                    });

                }

                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({
                        message:
                            "Teacher not found"
                    });

                }

                res.json({
                    message:
                        "Teacher approved successfully!"
                });

            }
        );

    }
);

// ============================================================
// REJECT TEACHER
// ============================================================

app.put(
    "/api/teachers/:id/reject",
    (req, res) => {

        const teacherId =
            req.params.id;

        const sql = `
            UPDATE teachers
            SET account_status = 'Rejected'
            WHERE teacher_id = ?
        `;

        db.query(
            sql,
            [teacherId],
            (err, result) => {

                if (err) {

                    console.error(
                        "Teacher rejection database error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Failed to reject teacher",
                        error:
                            err.message
                    });

                }

                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({
                        message:
                            "Teacher not found"
                    });

                }

                res.json({
                    message:
                        "Teacher rejected successfully!"
                });

            }
        );

    }
);

// ============================================================
// STUDENT ADMISSION + DOCUMENT UPLOAD + EDIT
// ============================================================

app.post(
    "/api/admissions",

    upload.fields([

        {
            name: "student_photo",
            maxCount: 1
        },

        {
            name: "aadhaar_document",
            maxCount: 1
        },

        {
            name: "birth_certificate",
            maxCount: 1
        }

    ]),

    (req, res) => {

        const {
            student_id,
            full_name,
            dob,
            gender,
            father_name,
            applying_class,
            aadhaar_number
        } = req.body;

        if (!student_id) {

            return res.status(400).json({
                message:
                    "Student ID is required"
            });

        }

        const studentPhoto =
            req.files &&
            req.files.student_photo
                ? req.files.student_photo[0]
                : null;

        const aadhaarDocument =
            req.files &&
            req.files.aadhaar_document
                ? req.files.aadhaar_document[0]
                : null;

        const birthCertificate =
            req.files &&
            req.files.birth_certificate
                ? req.files.birth_certificate[0]
                : null;

        const studentPhotoPath =
            studentPhoto
                ? "/uploads/" + studentPhoto.filename
                : null;

        const aadhaarDocumentPath =
            aadhaarDocument
                ? "/uploads/" + aadhaarDocument.filename
                : null;

        const birthCertificatePath =
            birthCertificate
                ? "/uploads/" + birthCertificate.filename
                : null;

        const sql = `
            UPDATE students
            SET
                full_name = ?,
                dob = ?,
                gender = ?,
                father_name = ?,
                applying_class = ?,
                aadhaar_number = ?,
                student_photo =
                    COALESCE(?, student_photo),
                aadhaar_document =
                    COALESCE(?, aadhaar_document),
                birth_certificate =
                    COALESCE(?, birth_certificate),
                student_updated_at = NOW()
            WHERE student_id = ?
        `;

        const values = [

            full_name || null,

            dob || null,

            gender || null,

            father_name || null,

            applying_class || null,

            aadhaar_number || null,

            studentPhotoPath,

            aadhaarDocumentPath,

            birthCertificatePath,

            student_id

        ];

        db.query(
            sql,
            values,
            (err, result) => {

                if (err) {

                    console.error(
                        "Admission database error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Failed to save admission",
                        error:
                            err.message
                    });

                }

                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({
                        message:
                            "Student not found"
                    });

                }

                res.json({

                    message:
                        "Admission application updated successfully!",

                    student_id:
                        student_id

                });

            }
        );

    }
);

// ============================================================
// TEACHER REVIEW
// ============================================================

app.put(
    "/api/students/:id/teacher-review",
    (req, res) => {

        console.log(
            "========================================"
        );

        console.log(
            "TEACHER REVIEW ROUTE HIT"
        );

        console.log(
            "========================================"
        );

        const studentId =
            req.params.id;

        const {
            teacher_status,
            teacher_remarks
        } = req.body;

        console.log(
            "Student ID:",
            studentId
        );

        console.log(
            "Teacher Status:",
            teacher_status
        );

        console.log(
            "Teacher Remarks:",
            teacher_remarks
        );

        if (!teacher_status) {

            return res.status(400).json({
                message:
                    "Teacher status is required"
            });

        }

        const sql = `
            UPDATE students
            SET
                teacher_status = ?,
                teacher_remarks = ?,
                teacher_reviewed_at = NOW()
            WHERE student_id = ?
        `;

        const values = [
            teacher_status,
            teacher_remarks || null,
            studentId
        ];

        db.query(
            sql,
            values,
            (err, result) => {

                if (err) {

                    console.error(
                        "TEACHER DATABASE ERROR:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Failed to save teacher review",
                        error:
                            err.message
                    });

                }

                console.log(
                    "TEACHER UPDATE RESULT:",
                    result
                );

                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({
                        message:
                            "Student not found"
                    });

                }

                console.log(
                    "Teacher review saved successfully!"
                );

                res.json({
                    message:
                        "Teacher review submitted successfully!"
                });

            }
        );

    }
);

// ============================================================
// PRINCIPAL FINAL DECISION
// ============================================================

app.put(
    "/api/students/:id/principal-review",
    (req, res) => {

        console.log(
            "========================================"
        );

        console.log(
            "PRINCIPAL REVIEW ROUTE HIT"
        );

        console.log(
            "========================================"
        );

        const studentId =
            req.params.id;

        const {
            principal_status,
            principal_remarks
        } = req.body;

        console.log(
            "Student ID:",
            studentId
        );

        console.log(
            "Principal Status:",
            principal_status
        );

        console.log(
            "Principal Remarks:",
            principal_remarks
        );

        if (!principal_status) {

            console.log(
                "ERROR: Principal status is missing"
            );

            return res.status(400).json({
                message:
                    "Principal status is required"
            });

        }

        // Only allow the expected decisions
        const allowedStatuses = [
            "Approved",
            "Rejected"
        ];

        if (
            !allowedStatuses.includes(
                principal_status
            )
        ) {

            return res.status(400).json({
                message:
                    "Invalid principal status"
            });

        }

        const sql = `
            UPDATE students
            SET
                principal_status = ?,
                principal_remarks = ?,
                principal_reviewed_at = NOW(),
                application_status = ?
            WHERE student_id = ?
        `;

        const values = [

            principal_status,

            principal_remarks || null,

            principal_status,

            studentId

        ];

        console.log(
            "SQL values:",
            values
        );

        db.query(
            sql,
            values,
            (err, result) => {

                if (err) {

                    console.error(
                        "========================================"
                    );

                    console.error(
                        "PRINCIPAL DATABASE ERROR"
                    );

                    console.error(
                        err
                    );

                    console.error(
                        "========================================"
                    );

                    return res.status(500).json({

                        message:
                            "Failed to save principal decision",

                        error:
                            err.message

                    });

                }

                console.log(
                    "PRINCIPAL UPDATE RESULT:",
                    result
                );

                if (
                    result.affectedRows === 0
                ) {

                    console.log(
                        "Student not found:",
                        studentId
                    );

                    return res.status(404).json({
                        message:
                            "Student not found"
                    });

                }

                console.log(
                    "Principal decision saved successfully!"
                );

                res.json({

                    message:
                        "Principal decision submitted successfully!",

                    student_id:
                        studentId,

                    principal_status:
                        principal_status

                });

            }
        );

    }
);

// ============================================================
// GET ALL STUDENTS
// ============================================================

app.get(
    "/api/students",
    (req, res) => {

        const sql = `
            SELECT *
            FROM students
            ORDER BY student_id DESC
        `;

        db.query(
            sql,
            (err, results) => {

                if (err) {

                    console.error(
                        "Student fetch database error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Failed to fetch students",
                        error:
                            err.message
                    });

                }

                res.json(results);

            }
        );

    }
);

// ============================================================
// GET SINGLE STUDENT
// ============================================================

app.get(
    "/api/students/:id",
    (req, res) => {

        const studentId =
            req.params.id;

        const sql = `
            SELECT
                student_id,
                full_name,
                username,
                dob,
                gender,
                father_name,
                applying_class,
                application_status,
                teacher_status,
                teacher_remarks,
                principal_status,
                principal_remarks,
                aadhaar_number,
                student_photo,
                aadhaar_document,
                birth_certificate,
                student_updated_at,
                teacher_reviewed_at,
                principal_reviewed_at,
                created_at
            FROM students
            WHERE student_id = ?
        `;

        db.query(
            sql,
            [studentId],
            (err, results) => {

                if (err) {

                    console.error(
                        "Student status fetch error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Failed to fetch student application",
                        error:
                            err.message
                    });

                }

                if (
                    results.length === 0
                ) {

                    return res.status(404).json({
                        message:
                            "Student not found"
                    });

                }

                res.json(
                    results[0]
                );

            }
        );

    }
);

// ============================================================
// COMMON STAFF LOGIN
// ============================================================

app.post(
    "/api/staff/login",
    async (req, res) => {

        const {
            school_name,
            place,
            school_code,
            username,
            password
        } = req.body;

        if (
            !school_name ||
            !place ||
            !school_code ||
            !username ||
            !password
        ) {

            return res.status(400).json({
                message:
                    "School details, username and password are required"
            });

        }

        try {

            const schoolSql = `
                SELECT
                    school_id,
                    school_name,
                    place,
                    school_code
                FROM schools
                WHERE school_name = ?
                AND place = ?
                AND school_code = ?
            `;

            db.query(
                schoolSql,
                [
                    school_name,
                    place,
                    school_code
                ],
                async (err, schools) => {

                    if (err) {

                        console.error(
                            "School verification error:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                "School verification failed",
                            error:
                                err.message
                        });

                    }

                    if (
                        schools.length === 0
                    ) {

                        return res.status(401).json({
                            message:
                                "Invalid school details"
                        });

                    }

                    const school =
                        schools[0];

                    // ====================================================
                    // CHECK PRINCIPAL
                    // ====================================================

                    const principalSql = `
                        SELECT *
                        FROM principals
                        WHERE username = ?
                        AND school_id = ?
                    `;

                    db.query(
                        principalSql,
                        [
                            username,
                            school.school_id
                        ],
                        async (
                            err,
                            principals
                        ) => {

                            if (err) {

                                console.error(
                                    "Principal login check error:",
                                    err
                                );

                                return res.status(500).json({
                                    message:
                                        "Login failed",
                                    error:
                                        err.message
                                });

                            }

                            if (
                                principals.length > 0
                            ) {

                                const principal =
                                    principals[0];

                                const passwordMatch =
                                    await bcrypt.compare(
                                        password,
                                        principal.password
                                    );

                                if (
                                    !passwordMatch
                                ) {

                                    return res.status(401).json({
                                        message:
                                            "Invalid username or password"
                                    });

                                }

                                return res.json({

                                    message:
                                        "Principal login successful!",

                                    role:
                                        "principal",

                                    principal: {

                                        principal_id:
                                            principal.principal_id,

                                        principal_name:
                                            principal.principal_name,

                                        username:
                                            principal.username,

                                        school_id:
                                            principal.school_id

                                    }

                                });

                            }

                            // ====================================================
                            // CHECK TEACHER
                            // ====================================================

                            const teacherSql = `
                                SELECT *
                                FROM teachers
                                WHERE username = ?
                                AND school_id = ?
                            `;

                            db.query(
                                teacherSql,
                                [
                                    username,
                                    school.school_id
                                ],
                                async (
                                    err,
                                    teachers
                                ) => {

                                    if (err) {

                                        console.error(
                                            "Teacher login check error:",
                                            err
                                        );

                                        return res.status(500).json({
                                            message:
                                                "Login failed",
                                            error:
                                                err.message
                                        });

                                    }

                                    if (
                                        teachers.length === 0
                                    ) {

                                        return res.status(401).json({
                                            message:
                                                "Invalid username or password"
                                        });

                                    }

                                    const teacher =
                                        teachers[0];

                                    if (
                                        teacher.account_status !==
                                        "Approved"
                                    ) {

                                        return res.status(403).json({
                                            message:
                                                "Your teacher account is not approved by the principal yet."
                                        });

                                    }

                                    const passwordMatch =
                                        await bcrypt.compare(
                                            password,
                                            teacher.password
                                        );

                                    if (
                                        !passwordMatch
                                    ) {

                                        return res.status(401).json({
                                            message:
                                                "Invalid username or password"
                                        });

                                    }

                                    return res.json({

                                        message:
                                            "Teacher login successful!",

                                        role:
                                            "teacher",

                                        teacher: {

                                            teacher_id:
                                                teacher.teacher_id,

                                            teacher_name:
                                                teacher.teacher_name,

                                            username:
                                                teacher.username,

                                            school_id:
                                                teacher.school_id

                                        }

                                    });

                                }
                            );

                        }
                    );

                }
            );

        } catch (error) {

            console.error(
                "Staff login error:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to process staff login",
                error:
                    error.message
            });

        }

    }
);

// ============================================================
// MULTER ERROR HANDLER
// ============================================================

app.use(
    (err, req, res, next) => {

        console.error(
            "SERVER ERROR:",
            err
        );

        if (
            err instanceof multer.MulterError
        ) {

            return res.status(400).json({

                message:
                    "File upload error: " +
                    err.message

            });

        }

        if (err) {

            return res.status(400).json({

                message:
                    err.message

            });

        }

        next();

    }
);

// ============================================================
// 404 ROUTE
// ============================================================

app.use(
    (req, res) => {

        console.log(
            "404 ROUTE:",
            req.method,
            req.originalUrl
        );

        res.status(404).json({

            message:
                "API route not found",

            method:
                req.method,

            route:
                req.originalUrl

        });

    }
);

// ============================================================
// START SERVER
// ============================================================

app.listen(
    PORT,
    () => {

        console.log(
            "========================================"
        );

        console.log(
            "School Admission Portal Backend"
        );

        console.log(
            `Server running on http://localhost:${PORT}`
        );

        console.log(
            "========================================"
        );

    }
);