// ============================================================
// NODE.JS INTERVIEW - ALGORITHM & CONCEPT QUESTIONS
// ============================================================

// ============================================================
// 1. TWO SUM
// Q: Given an array of numbers and a target, return indices of
//    two numbers that add up to the target.
// Concept: Hash Map for O(n) lookup instead of O(n^2) brute force
// ============================================================
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) return [map.get(complement), i];
        map.set(nums[i], i);
    }
    return [];
}
console.log("1. Two Sum:", twoSum([2, 7, 11, 15], 9)); // [0, 1]

// ============================================================
// 2. REVERSE A STRING
// Q: Reverse a string without using .reverse()
// Concept: Two-pointer technique / iteration
// ============================================================
function reverseString(str) {
    let result = "";
    for (let i = str.length - 1; i >= 0; i--) {
        result += str[i];
    }
    return result;
}
console.log("2. Reverse String:", reverseString("hello")); // "olleh"

// ============================================================
// 3. PALINDROME CHECK
// Q: Check if a string reads the same forwards and backwards
// Concept: String comparison / two-pointer
// ============================================================
function isPalindrome(str) {
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, "");
    let left = 0, right = cleaned.length - 1;
    while (left < right) {
        if (cleaned[left] !== cleaned[right]) return false;
        left++;
        right--;
    }
    return true;
}
console.log("3. Palindrome:", isPalindrome("A man a plan a canal Panama")); // true

// ============================================================
// 4. FIZZBUZZ
// Q: Print 1-n, but multiples of 3="Fizz", 5="Buzz", both="FizzBuzz"
// Concept: Modulo operator, conditional logic
// ============================================================
function fizzBuzz(n) {
    const result = [];
    for (let i = 1; i <= n; i++) {
        if (i % 15 === 0) result.push("FizzBuzz");
        else if (i % 3 === 0) result.push("Fizz");
        else if (i % 5 === 0) result.push("Buzz");
        else result.push(i);
    }
    return result;
}
console.log("4. FizzBuzz:", fizzBuzz(15));

// ============================================================
// 5. FIND DUPLICATES IN ARRAY
// Q: Return all duplicate elements in an array
// Concept: Set / frequency counter
// ============================================================
function findDuplicates(arr) {
    const seen = new Set();
    const duplicates = new Set();
    for (const item of arr) {
        if (seen.has(item)) duplicates.add(item);
        else seen.add(item);
    }
    return [...duplicates];
}
console.log("5. Duplicates:", findDuplicates([1, 2, 3, 2, 4, 3, 5])); // [2, 3]

// ============================================================
// 6. FLATTEN NESTED ARRAY
// Q: Flatten a deeply nested array into a single level
// Concept: Recursion
// ============================================================
function flattenArray(arr) {
    const result = [];
    for (const item of arr) {
        if (Array.isArray(item)) {
            result.push(...flattenArray(item));
        } else {
            result.push(item);
        }
    }
    return result;
}
console.log("6. Flatten:", flattenArray([1, [2, [3, [4]], 5]])); // [1,2,3,4,5]

// ============================================================
// 7. ANAGRAM CHECK
// Q: Check if two strings are anagrams of each other
// Concept: Frequency counter pattern
// ============================================================
function isAnagram(str1, str2) {
    if (str1.length !== str2.length) return false;
    const freq = {};
    for (const char of str1) freq[char] = (freq[char] || 0) + 1;
    for (const char of str2) {
        if (!freq[char]) return false;
        freq[char]--;
    }
    return true;
}
console.log("7. Anagram:", isAnagram("listen", "silent")); // true

// ============================================================
// 8. FIBONACCI SEQUENCE
// Q: Return nth Fibonacci number
// Concept: Dynamic programming / memoization vs recursion
// ============================================================
// Iterative (O(n) time, O(1) space)
function fibonacci(n) {
    if (n <= 1) return n;
    let prev = 0, curr = 1;
    for (let i = 2; i <= n; i++) {
        [prev, curr] = [curr, prev + curr];
    }
    return curr;
}
console.log("8. Fibonacci(10):", fibonacci(10)); // 55

// ============================================================
// 9. DEBOUNCE FUNCTION
// Q: Implement debounce - delays function execution until after
//    a specified wait time has elapsed since the last call
// Concept: Closures, setTimeout, higher-order functions
// ============================================================
function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}
const debouncedLog = debounce((msg) => console.log("   Debounced:", msg), 500);
debouncedLog("first");  // cancelled
debouncedLog("second"); // cancelled
debouncedLog("third");  // this one fires after 500ms
console.log("9. Debounce: (fires after 500ms delay)");

// ============================================================
// 10. THROTTLE FUNCTION
// Q: Implement throttle - ensures function runs at most once
//    per specified time period
// Concept: Closures, time-based rate limiting
// ============================================================
function throttle(fn, limit) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            return fn.apply(this, args);
        }
    };
}
console.log("10. Throttle: implemented (rate-limits function calls)");

// ============================================================
// 11. DEEP CLONE AN OBJECT
// Q: Create a deep copy of an object (no shared references)
// Concept: Recursion, typeof checks, handling edge cases
// ============================================================
function deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(item => deepClone(item));
    const clone = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            clone[key] = deepClone(obj[key]);
        }
    }
    return clone;
}
const original = { a: 1, b: { c: 2, d: [3, 4] } };
const cloned = deepClone(original);
cloned.b.c = 99;
console.log("11. Deep Clone - original.b.c:", original.b.c); // 2 (unchanged)

// ============================================================
// 12. BINARY SEARCH
// Q: Find target in sorted array in O(log n)
// Concept: Divide and conquer, sorted array optimization
// ============================================================
function binarySearch(arr, target) {
    let left = 0, right = arr.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
console.log("12. Binary Search:", binarySearch([1, 3, 5, 7, 9, 11], 7)); // 3

// ============================================================
// 13. MERGE TWO SORTED ARRAYS
// Q: Merge two sorted arrays into one sorted array
// Concept: Two-pointer technique
// ============================================================
function mergeSorted(arr1, arr2) {
    const result = [];
    let i = 0, j = 0;
    while (i < arr1.length && j < arr2.length) {
        if (arr1[i] <= arr2[j]) result.push(arr1[i++]);
        else result.push(arr2[j++]);
    }
    return result.concat(arr1.slice(i)).concat(arr2.slice(j));
}
console.log("13. Merge Sorted:", mergeSorted([1, 3, 5], [2, 4, 6])); // [1,2,3,4,5,6]

// ============================================================
// 14. PROMISE.ALL IMPLEMENTATION
// Q: Implement your own Promise.all
// Concept: Promises, async patterns, error handling
// ============================================================
function promiseAll(promises) {
    return new Promise((resolve, reject) => {
        const results = [];
        let completed = 0;
        if (promises.length === 0) return resolve([]);
        promises.forEach((p, index) => {
            Promise.resolve(p).then(value => {
                results[index] = value;
                completed++;
                if (completed === promises.length) resolve(results);
            }).catch(reject);
        });
    });
}
promiseAll([
    Promise.resolve(1),
    Promise.resolve(2),
    Promise.resolve(3)
]).then(res => console.log("14. Promise.all:", res)); // [1, 2, 3]

// ============================================================
// 15. EVENT EMITTER (Node.js Core Concept)
// Q: Implement a simple EventEmitter
// Concept: Observer/Pub-Sub pattern - core to Node.js architecture
// ============================================================
class MyEventEmitter {
    constructor() {
        this.events = {};
    }
    on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
        return this;
    }
    emit(event, ...args) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(...args));
        }
        return this;
    }
    off(event, listener) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(l => l !== listener);
        }
        return this;
    }
}
const emitter = new MyEventEmitter();
emitter.on("greet", (name) => console.log("   Hello,", name));
console.log("15. EventEmitter:");
emitter.emit("greet", "Node.js"); // Hello, Node.js

// ============================================================
// 16. CURRYING
// Q: Transform a function that takes multiple args into a
//    sequence of functions each taking one arg
// Concept: Closures, functional programming, partial application
// ============================================================
function curry(fn) {
    return function curried(...args) {
        if (args.length >= fn.length) {
            return fn.apply(this, args);
        }
        return function (...args2) {
            return curried.apply(this, args.concat(args2));
        };
    };
}
const add = curry((a, b, c) => a + b + c);
console.log("16. Currying:", add(1)(2)(3)); // 6

// ============================================================
// 17. LINKED LIST REVERSAL
// Q: Reverse a singly linked list
// Concept: Pointer manipulation, iterative vs recursive
// ============================================================
class ListNode {
    constructor(val, next = null) {
        this.val = val;
        this.next = next;
    }
}

function reverseLinkedList(head) {
    let prev = null, curr = head;
    while (curr) {
        const next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}

function listToArray(head) {
    const arr = [];
    while (head) { arr.push(head.val); head = head.next; }
    return arr;
}
const list = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4))));
console.log("17. Reverse LinkedList:", listToArray(reverseLinkedList(list))); // [4,3,2,1]

// ============================================================
// 18. MEMOIZATION
// Q: Implement a memoize function that caches results
// Concept: Caching, closures, performance optimization
// ============================================================
function memoize(fn) {
    const cache = new Map();
    return function (...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) return cache.get(key);
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
}
const expensiveAdd = memoize((a, b) => { console.log("   Computing..."); return a + b; });
console.log("18. Memoize:", expensiveAdd(1, 2)); // Computing... 3
console.log("   Cached:", expensiveAdd(1, 2));   // 3 (no "Computing...")

// ============================================================
// 19. ASYNC/AWAIT ERROR HANDLING PATTERNS
// Q: How do you handle errors in async/await?
// Concept: try/catch, Promise rejection, error propagation
// ============================================================
async function fetchWithRetry(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === retries - 1) throw err;
            console.log(`   Retry ${i + 1}/${retries}...`);
        }
    }
}
console.log("19. Async Retry Pattern: implemented");

// ============================================================
// 20. EVENT LOOP QUESTION
// Q: What is the output order?
// Concept: Event loop, microtasks vs macrotasks
// ============================================================
console.log("\n20. Event Loop Order:");
console.log("   a) sync");
setTimeout(() => console.log("   d) setTimeout (macrotask)"), 0);
Promise.resolve().then(() => console.log("   b) Promise.then (microtask)"));
process.nextTick(() => console.log("   c) nextTick (before microtask in Node)"));
// Output order: a) sync → c) nextTick → b) Promise → d) setTimeout

// ============================================================
// 21. STREAMS CONCEPT (Node.js Specific)
// Q: What are streams and when to use them?
// Concept: Processing data in chunks without loading all into memory
// ============================================================
const { Readable } = require("stream");

function createCountStream(max) {
    let count = 0;
    return new Readable({
        read() {
            count++;
            if (count <= max) this.push(count.toString() + " ");
            else this.push(null); // signal end
        }
    });
}
console.log("\n21. Streams (reading 5 numbers):");
const countStream = createCountStream(5);
countStream.on("data", chunk => process.stdout.write("   " + chunk));
countStream.on("end", () => console.log("\n   Stream ended"));

// ============================================================
// 22. CLOSURE QUESTION
// Q: What will this print and why?
// Concept: Closures capture variables by reference, not value
// ============================================================
console.log("\n22. Closure (var vs let):");
// Problem with var:
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log("   var:", i), 100); // prints 3,3,3
}
// Fix with let:
for (let j = 0; j < 3; j++) {
    setTimeout(() => console.log("   let:", j), 200); // prints 0,1,2
}

// ============================================================
// 23. ARRAY METHODS - map, filter, reduce
// Q: Group items by property using reduce
// Concept: Functional programming, data transformation
// ============================================================
const pokemon = [
    { name: "Pikachu", type: "electric" },
    { name: "Raichu", type: "electric" },
    { name: "Charizard", type: "fire" },
    { name: "Vulpix", type: "fire" },
    { name: "Squirtle", type: "water" }
];

const grouped = pokemon.reduce((acc, curr) => {
    if (!acc[curr.type]) acc[curr.type] = [];
    acc[curr.type].push(curr.name);
    return acc;
}, {});
console.log("\n23. Reduce (Group Pokemon):", grouped);

// ============================================================
// 24. CALL, APPLY, BIND
// Q: Explain and implement Function.prototype.bind
// Concept: this binding, context manipulation
// ============================================================
Function.prototype.myBind = function (context, ...args) {
    const fn = this;
    return function (...newArgs) {
        return fn.apply(context, [...args, ...newArgs]);
    };
};
const obj = { name: "Node" };
function greet(greeting) { return `${greeting}, ${this.name}!`; }
const boundGreet = greet.myBind(obj, "Hello");
console.log("24. Custom Bind:", boundGreet()); // Hello, Node!

// ============================================================
// 25. WORKER THREADS (Node.js Specific)
// Q: How to handle CPU-intensive tasks in Node.js?
// Concept: Single-threaded event loop, offloading to workers
// ============================================================
console.log("\n25. Worker Threads Concept:");
console.log("   - Node.js is single-threaded (event loop)");
console.log("   - CPU-heavy tasks block the event loop");
console.log("   - Use worker_threads module for parallel computation");
console.log("   - Use cluster module to utilize multiple CPU cores");

// ============================================================
// COMMON NODE.JS INTERVIEW Q&A (Conceptual)
// ============================================================
console.log("\n============================================");
console.log("NODE.JS CONCEPTUAL INTERVIEW Q&A");
console.log("============================================");

const conceptQA = [
    {
        q: "What is the Event Loop?",
        a: "Single-threaded mechanism that handles async operations via callback queue. Phases: timers → pending callbacks → idle → poll → check → close callbacks"
    },
    {
        q: "Difference between process.nextTick() and setImmediate()?",
        a: "nextTick fires before any I/O events (microtask), setImmediate fires in the check phase after I/O (macrotask)"
    },
    {
        q: "What is the difference between require() and import?",
        a: "require() is CommonJS (sync, runtime), import is ES Modules (async, static analysis, tree-shakeable)"
    },
    {
        q: "How does Node.js handle concurrency if it's single-threaded?",
        a: "Event loop + libuv thread pool (for I/O). Non-blocking I/O delegates to OS kernel. Only JS execution is single-threaded."
    },
    {
        q: "What are Streams and their types?",
        a: "Readable, Writable, Duplex, Transform. Process data in chunks without loading entire content into memory."
    },
    {
        q: "What is middleware in Express?",
        a: "Functions that execute during request-response cycle. Has access to req, res, next(). Used for auth, logging, parsing, error handling."
    },
    {
        q: "How to prevent callback hell?",
        a: "Use Promises, async/await, or libraries like async.js. Structure code with named functions and proper error handling."
    },
    {
        q: "What is the Buffer class?",
        a: "Used to handle binary data directly. Allocated outside V8 heap. Essential for streams, file I/O, and network protocols."
    },
    {
        q: "Explain clustering in Node.js",
        a: "cluster module forks multiple worker processes sharing the same port. Master distributes connections. Utilizes multi-core CPUs."
    },
    {
        q: "What is libuv?",
        a: "C library that provides the event loop, async I/O, thread pool (4 threads default), and cross-platform abstraction for Node.js."
    }
];

conceptQA.forEach((item, i) => {
    console.log(`\nQ${i + 1}: ${item.q}`);
    console.log(`A: ${item.a}`);
});

console.log("\n============================================");
console.log("DONE - All examples executed!");
console.log("============================================");
