// ============================================================
// NODE.JS INTERVIEW - FILES & REGULAR EXPRESSIONS
// ============================================================
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const readline = require("readline");

// ============================================================
// FILE SYSTEM OPERATIONS
// ============================================================

// ============================================================
// 1. READ/WRITE FILES (Sync vs Async)
// Q: What's the difference between sync and async file operations?
// Concept: Sync blocks the event loop, async uses callbacks/promises
// ============================================================
console.log("1. File Read/Write:");

// Sync - blocks event loop (use only at startup or scripts)
fs.writeFileSync("sample.txt", "Hello from Node.js\nLine 2\nLine 3\n");
const contentSync = fs.readFileSync("sample.txt", "utf8");
console.log("   Sync read:", contentSync.trim());

// Async with callback
fs.readFile("sample.txt", "utf8", (err, data) => {
    if (err) throw err;
    console.log("   Async callback read:", data.trim().split("\n")[0]);
});

// Async with promises (modern approach)
async function readFileAsync() {
    const data = await fs.promises.readFile("sample.txt", "utf8");
    console.log("   Async/await read:", data.trim().split("\n")[0]);
}
readFileAsync();

// ============================================================
// 2. APPEND TO FILE
// Q: How to add content to existing file without overwriting?
// Concept: fs.appendFile, flags ('a' for append)
// ============================================================
fs.appendFileSync("sample.txt", "Line 4 - appended\n");
console.log("\n2. Append to file: done");

// ============================================================
// 3. CHECK IF FILE/DIRECTORY EXISTS
// Q: How to check file existence before operations?
// Concept: fs.existsSync, fs.access, fs.stat
// ============================================================
console.log("\n3. File existence checks:");
console.log("   sample.txt exists:", fs.existsSync("sample.txt"));
console.log("   ghost.txt exists:", fs.existsSync("ghost.txt"));

// Using stat to get file info
const stats = fs.statSync("sample.txt");
console.log("   Is file:", stats.isFile());
console.log("   Size:", stats.size, "bytes");
console.log("   Modified:", stats.mtime.toISOString());

// ============================================================
// 4. DIRECTORY OPERATIONS
// Q: How to create, read, and remove directories?
// Concept: mkdir, readdir, rmdir/rm
// ============================================================
console.log("\n4. Directory operations:");

// Create directory (recursive: true creates nested dirs)
fs.mkdirSync("test-dir/nested", { recursive: true });
console.log("   Created test-dir/nested");

// Write files in directory
fs.writeFileSync("test-dir/file1.txt", "content1");
fs.writeFileSync("test-dir/file2.js", "// js file");
fs.writeFileSync("test-dir/nested/deep.json", '{"key":"value"}');

// Read directory contents
const files = fs.readdirSync("test-dir");
console.log("   Directory contents:", files);

// Read with file types
const entries = fs.readdirSync("test-dir", { withFileTypes: true });
entries.forEach(entry => {
    console.log(`   ${entry.name} - ${entry.isDirectory() ? "DIR" : "FILE"}`);
});

// ============================================================
// 5. RECURSIVE DIRECTORY TRAVERSAL
// Q: How to find all files in a directory tree?
// Concept: Recursion with fs, common interview question
// ============================================================
function getAllFiles(dirPath, fileList = []) {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        if (item.isDirectory()) {
            getAllFiles(fullPath, fileList);
        } else {
            fileList.push(fullPath);
        }
    }
    return fileList;
}
console.log("\n5. Recursive file list:", getAllFiles("test-dir"));

// ============================================================
// 6. READ FILE LINE BY LINE (Streams)
// Q: How to process a large file without loading into memory?
// Concept: Streams + readline interface
// ============================================================
console.log("\n6. Read file line by line (using streams):");

async function readLineByLine(filePath) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream });
    let lineNum = 0;
    for await (const line of rl) {
        lineNum++;
        console.log(`   Line ${lineNum}: ${line}`);
    }
    return lineNum;
}
// Will execute async
readLineByLine("sample.txt");

// ============================================================
// 7. COPY AND RENAME FILES
// Q: How to copy/move files in Node.js?
// Concept: fs.copyFile, fs.rename, streams for large files
// ============================================================
fs.copyFileSync("sample.txt", "sample-copy.txt");
fs.renameSync("sample-copy.txt", "sample-renamed.txt");
console.log("\n7. Copy & Rename: sample.txt → sample-renamed.txt");

// For large files, use streams:
function copyLargeFile(src, dest) {
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(src);
        const writeStream = fs.createWriteStream(dest);
        readStream.pipe(writeStream);
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
    });
}

// ============================================================
// 8. WATCH FILE CHANGES
// Q: How to monitor file changes?
// Concept: fs.watch, fs.watchFile, used in dev tools/hot reload
// ============================================================
console.log("\n8. File watcher (concept):");
console.log("   fs.watch('file.txt', (event, filename) => { ... })");
console.log("   Events: 'rename' or 'change'");
console.log("   Used by: nodemon, webpack, vite for hot reload");

// ============================================================
// 9. PATH MODULE
// Q: How to handle file paths cross-platform?
// Concept: path.join, resolve, basename, extname, dirname
// ============================================================
console.log("\n9. Path module:");
console.log("   join:", path.join("users", "docs", "file.txt"));
console.log("   resolve:", path.resolve("file.txt"));
console.log("   basename:", path.basename("/home/user/file.txt"));
console.log("   extname:", path.extname("script.min.js"));
console.log("   dirname:", path.dirname("/home/user/file.txt"));
console.log("   parse:", path.parse("/home/user/file.txt"));

// ============================================================
// 10. JSON FILE OPERATIONS
// Q: How to read/write JSON files?
// Concept: JSON.parse, JSON.stringify, common config pattern
// ============================================================
const config = { host: "localhost", port: 3000, debug: true };
fs.writeFileSync("config.json", JSON.stringify(config, null, 2));
const loaded = JSON.parse(fs.readFileSync("config.json", "utf8"));
console.log("\n10. JSON file:", loaded);


// ============================================================
// REGULAR EXPRESSIONS
// ============================================================
console.log("\n============================================");
console.log("REGULAR EXPRESSIONS");
console.log("============================================");

// ============================================================
// 11. BASICS - Test, Match, Replace
// Q: What are the main RegExp methods?
// Concept: test(), match(), replace(), exec(), search()
// ============================================================
console.log("\n11. RegExp Methods:");
const str = "Hello World 123";

console.log("   test (has number?):", /\d+/.test(str));           // true
console.log("   match (find numbers):", str.match(/\d+/g));       // ['123']
console.log("   search (index of digit):", str.search(/\d/));     // 12
console.log("   replace:", str.replace(/World/, "Node"));          // Hello Node 123

// exec() - returns detailed match info
const regex = /(\d+)/g;
let result;
while ((result = regex.exec(str)) !== null) {
    console.log(`   exec: found "${result[0]}" at index ${result.index}`);
}

// ============================================================
// 12. EMAIL VALIDATION
// Q: Write a regex to validate email addresses
// Concept: Character classes, quantifiers, anchors
// ============================================================
function isValidEmail(email) {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email);
}
console.log("\n12. Email Validation:");
console.log("   user@example.com:", isValidEmail("user@example.com"));     // true
console.log("   invalid@:", isValidEmail("invalid@"));                      // false
console.log("   test.name+tag@domain.co:", isValidEmail("test.name+tag@domain.co")); // true

// ============================================================
// 13. URL PARSING WITH REGEX
// Q: Extract parts of a URL using regex
// Concept: Capturing groups, named groups
// ============================================================
function parseURL(url) {
    const pattern = /^(?<protocol>https?):\/\/(?<host>[^/:]+)(?::(?<port>\d+))?(?<path>\/[^?#]*)?(?:\?(?<query>[^#]*))?(?:#(?<hash>.*))?$/;
    const match = url.match(pattern);
    return match ? match.groups : null;
}
console.log("\n13. URL Parsing:");
console.log("  ", parseURL("https://example.com:8080/path/page?name=test#section"));

// ============================================================
// 14. PASSWORD STRENGTH VALIDATOR
// Q: Check if password meets complexity requirements
// Concept: Lookaheads (?=...), multiple conditions
// ============================================================
function checkPasswordStrength(password) {
    const checks = {
        minLength: password.length >= 8,
        hasUpper: /[A-Z]/.test(password),
        hasLower: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;':",.<>?/\\`~]/.test(password)
    };
    const score = Object.values(checks).filter(Boolean).length;
    return { ...checks, score, strength: score <= 2 ? "weak" : score <= 4 ? "medium" : "strong" };
}
console.log("\n14. Password Strength:");
console.log("   'abc':", checkPasswordStrength("abc"));
console.log("   'MyP@ss1':", checkPasswordStrength("MyP@ss1"));
console.log("   'Str0ng!Pass':", checkPasswordStrength("Str0ng!Pass"));

// ============================================================
// 15. EXTRACT DATA FROM TEXT (Log Parsing)
// Q: Parse log file entries using regex
// Concept: Named groups, real-world text processing
// ============================================================
const logLines = [
    '2024-01-15 10:30:45 [ERROR] Connection timeout on port 5432',
    '2024-01-15 10:31:02 [INFO] Retry attempt 1 successful',
    '2024-01-15 10:31:15 [WARN] Memory usage at 85%',
];

function parseLogLine(line) {
    const pattern = /^(?<date>\d{4}-\d{2}-\d{2}) (?<time>\d{2}:\d{2}:\d{2}) \[(?<level>\w+)\] (?<message>.+)$/;
    const match = line.match(pattern);
    return match ? match.groups : null;
}
console.log("\n15. Log Parsing:");
logLines.forEach(line => console.log("  ", parseLogLine(line)));

// ============================================================
// 16. FIND AND REPLACE ALL OCCURRENCES
// Q: Replace all matches with transformation
// Concept: replaceAll, replace with callback function
// ============================================================
console.log("\n16. Replace with callback:");

// Capitalize first letter of each word
const sentence = "the quick brown fox jumps";
const capitalized = sentence.replace(/\b\w/g, char => char.toUpperCase());
console.log("   Capitalize words:", capitalized);

// Mask credit card number
const card = "4111-2222-3333-4444";
const masked = card.replace(/\d{4}(?=-)/g, "****");
console.log("   Mask card:", masked); // ****-****-****-4444

// Convert camelCase to snake_case
function camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
console.log("   camelToSnake:", camelToSnake("myVariableName")); // my_variable_name

// ============================================================
// 17. REGEX - MATCH HTML TAGS
// Q: Extract content between HTML tags
// Concept: Non-greedy matching (.*?), capturing groups
// ============================================================
const html = '<div class="main"><p>Hello</p><p>World</p></div>';

// Extract all <p> contents
const pTags = [...html.matchAll(/<p>(.*?)<\/p>/g)];
console.log("\n17. HTML tag extraction:");
pTags.forEach(m => console.log("   <p> content:", m[1]));

// Extract attributes
const attrMatch = html.match(/class="([^"]+)"/);
console.log("   class attr:", attrMatch ? attrMatch[1] : null);

// ============================================================
// 18. PHONE NUMBER FORMATTING
// Q: Validate and format phone numbers
// Concept: Optional groups, alternation |
// ============================================================
function formatPhone(phone) {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, "");
    // Format as (XXX) XXX-XXXX
    const match = digits.match(/^1?(\d{3})(\d{3})(\d{4})$/);
    return match ? `(${match[1]}) ${match[2]}-${match[3]}` : null;
}
console.log("\n18. Phone formatting:");
console.log("   1234567890:", formatPhone("1234567890"));
console.log("   +1-234-567-8900:", formatPhone("+1-234-567-8900"));
console.log("   (123) 456 7890:", formatPhone("(123) 456 7890"));

// ============================================================
// 19. CSV PARSING WITH REGEX
// Q: Parse a CSV line handling quoted fields
// Concept: Complex regex, handling edge cases
// ============================================================
function parseCSVLine(line) {
    const fields = [];
    const pattern = /(?:^|,)("(?:[^"]|"")*"|[^,]*)/g;
    let match;
    while ((match = pattern.exec(line)) !== null) {
        let field = match[1];
        // Remove surrounding quotes and unescape
        if (field.startsWith('"') && field.endsWith('"')) {
            field = field.slice(1, -1).replace(/""/g, '"');
        }
        fields.push(field);
    }
    return fields;
}
console.log("\n19. CSV Parsing:");
console.log("  ", parseCSVLine('name,age,"city, state",email'));
console.log("  ", parseCSVLine('"John ""JD"" Doe",30,NYC'));

// ============================================================
// 20. IP ADDRESS VALIDATION
// Q: Validate IPv4 addresses
// Concept: Bounded number matching with regex
// ============================================================
function isValidIPv4(ip) {
    const octet = /(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)/;
    const pattern = new RegExp(`^${octet.source}\\.${octet.source}\\.${octet.source}\\.${octet.source}$`);
    return pattern.test(ip);
}
console.log("\n20. IPv4 Validation:");
console.log("   192.168.1.1:", isValidIPv4("192.168.1.1"));       // true
console.log("   255.255.255.255:", isValidIPv4("255.255.255.255")); // true
console.log("   256.1.1.1:", isValidIPv4("256.1.1.1"));           // false
console.log("   1.2.3:", isValidIPv4("1.2.3"));                    // false

// ============================================================
// 21. FILE CONTENT SEARCH (grep-like)
// Q: Implement a simple grep - search file for pattern
// Concept: Combining file I/O with regex
// ============================================================
function grepFile(filePath, pattern) {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    const regex = new RegExp(pattern, "gi");
    const matches = [];
    lines.forEach((line, index) => {
        if (regex.test(line)) {
            matches.push({ line: index + 1, text: line.trim() });
            regex.lastIndex = 0; // reset for global regex
        }
    });
    return matches;
}
// Create a test file
fs.writeFileSync("search-test.txt", `Error: connection refused
Info: server started on port 3000
Warning: deprecated API used
Error: timeout after 30s
Info: request handled successfully
`);
console.log("\n21. Grep file for 'error':", grepFile("search-test.txt", "error"));

// ============================================================
// 22. TEMPLATE STRING PROCESSOR
// Q: Replace {{placeholders}} in a template file
// Concept: Regex replace with dynamic values, template engines
// ============================================================
function processTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : match;
    });
}
const template = "Hello {{name}}, welcome to {{city}}! Your ID is {{id}}.";
const data = { name: "Alice", city: "Tokyo", id: 42 };
console.log("\n22. Template processor:");
console.log("  ", processTemplate(template, data));

// ============================================================
// 23. FILE EXTENSION FILTER
// Q: List files by extension pattern
// Concept: Combining path operations with regex/glob-like matching
// ============================================================
function filterFilesByExt(dir, extensions) {
    const pattern = new RegExp(`\\.(${extensions.join("|")})$`, "i");
    const allFiles = getAllFilesFlat(dir);
    return allFiles.filter(f => pattern.test(f));
}

function getAllFilesFlat(dir) {
    let results = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) results = results.concat(getAllFilesFlat(full));
        else results.push(full);
    }
    return results;
}
console.log("\n23. Filter by extension (.js, .json):");
console.log("  ", filterFilesByExt("test-dir", ["js", "json"]));

// ============================================================
// 24. SANITIZE USER INPUT
// Q: Remove/escape dangerous characters from user input
// Concept: Security, XSS prevention, regex for sanitization
// ============================================================
function sanitizeHTML(input) {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
}

function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}
console.log("\n24. Input Sanitization:");
console.log("   HTML:", sanitizeHTML('<script>alert("xss")</script>'));
console.log("   Filename:", sanitizeFilename("my file (copy).txt"));

// ============================================================
// 25. WRITE A SIMPLE LOG FILE WITH ROTATION
// Q: Implement basic file logging with size check
// Concept: File stats, append, practical Node.js pattern
// ============================================================
class SimpleLogger {
    constructor(logFile, maxSize = 1024) {
        this.logFile = logFile;
        this.maxSize = maxSize;
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        const entry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

        // Rotate if file too large
        if (fs.existsSync(this.logFile)) {
            const stats = fs.statSync(this.logFile);
            if (stats.size >= this.maxSize) {
                fs.renameSync(this.logFile, `${this.logFile}.old`);
            }
        }
        fs.appendFileSync(this.logFile, entry);
    }

    info(msg) { this.log("info", msg); }
    error(msg) { this.log("error", msg); }
    warn(msg) { this.log("warn", msg); }
}

const logger = new SimpleLogger("app.log");
logger.info("Application started");
logger.warn("Low memory");
logger.error("Connection failed");
console.log("\n25. Logger output:");
console.log(fs.readFileSync("app.log", "utf8"));

// ============================================================
// CLEANUP - Remove test files
// ============================================================
function cleanupFiles() {
    const toRemove = ["sample.txt", "sample-renamed.txt", "config.json", "search-test.txt", "app.log"];
    toRemove.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
    if (fs.existsSync("app.log.old")) fs.unlinkSync("app.log.old");
    // Remove test-dir recursively
    if (fs.existsSync("test-dir")) fs.rmSync("test-dir", { recursive: true });
    console.log("Cleanup: test files removed");
}

// Delay cleanup to let async operations finish
setTimeout(() => {
    cleanupFiles();
    console.log("\n============================================");
    console.log("DONE - All file & regex examples executed!");
    console.log("============================================");
}, 500);
