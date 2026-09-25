# 🧮 Modern Glassmorphism Calculator

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Responsive](https://img.shields.io/badge/Responsive-4CAF50?style=for-the-badge&logo=google-chrome&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![Open Source](https://img.shields.io/badge/Open_Source-3DA639?style=for-the-badge&logo=open-source-initiative&logoColor=white)

> A premium, production-ready calculator web application featuring glassmorphism design, custom BODMAS/PEMDAS expression parsing (no `eval()`), full keyboard support, and calculation history.

**Oasis Infobyte Web Development Internship 2026 — Level 2, Task 1**

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Technologies Used](#-technologies-used)
- [Calculator Logic](#-calculator-logic-explanation)
- [Folder Structure](#-folder-structure)
- [Screenshots](#-screenshots)
- [Installation](#-installation)
- [Live Demo](#-live-demo)
- [Git Commit History](#-git-commit-history)
- [Author](#-author)
- [License](#-license)

---

## 🔭 Project Overview

This project is a **Modern Glassmorphism Calculator** built entirely with vanilla HTML5, CSS3, and JavaScript (ES6+). It was created as part of the **Oasis Infobyte Web Development Internship 2026 – Level 2 Task 1**.

The calculator features a premium UI with glassmorphism effects, animated gradient backgrounds, and smooth micro-animations. Under the hood, it implements a **custom recursive descent parser** that respects BODMAS/PEMDAS operator precedence — without using JavaScript's `eval()` function.

### Key Highlights

- 🚫 **Zero `eval()`** — Custom tokenizer + recursive descent parser
- 🎯 **BODMAS/PEMDAS** — Proper operator precedence (×/÷ before +/−)
- ⌨️ **Full keyboard support** — Numbers, operators, Enter, Backspace, Escape
- 📱 **Fully responsive** — Desktop, tablet, and mobile optimized
- ♿ **Accessible** — Semantic HTML, ARIA labels, focus indicators, keyboard navigation
- 🎨 **Premium design** — Glassmorphism, animated orbs, gradient accents, neon highlights

---

## ✨ Features

| Feature | Description |
|---|---|
| **Display Screen** | Dual-line display with expression history and auto-adjusting font size |
| **Numeric Input** | Digits 0–9 and decimal point with leading zero prevention |
| **Arithmetic Operators** | Addition (+), Subtraction (−), Multiplication (×), Division (÷) |
| **Percentage** | Convert numbers to percentage (÷ 100) |
| **Negate (±)** | Toggle positive/negative sign |
| **Equals** | Evaluate expression with BODMAS precedence |
| **Clear (C)** | Full reset of calculator state |
| **Backspace (⌫)** | Delete last character with smart operator handling |
| **Operator Chaining** | Chain multiple operations without resetting |
| **Division by Zero** | Friendly error message with recovery |
| **Keyboard Support** | Full keyboard input mapping |
| **Calculation History** | Last 5 calculations with click-to-reuse |
| **Live Preview** | Real-time result preview as you type |
| **Responsive Design** | Optimized for 360px to 1200px+ screens |
| **Glassmorphism UI** | Frosted glass effects with animated background |
| **Accessibility** | ARIA labels, focus indicators, reduced motion support |

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| **HTML5** | Semantic document structure, ARIA attributes |
| **CSS3** | CSS Variables, CSS Grid, Flexbox, Glassmorphism, Media Queries, Animations |
| **JavaScript (ES6+)** | Custom calculator engine, event handling, DOM manipulation |
| **Google Fonts** | Poppins (headings), Inter (body), JetBrains Mono (numbers) |

### No External Dependencies

- ❌ No frameworks (React, Vue, Angular, etc.)
- ❌ No CSS libraries (Bootstrap, Tailwind, etc.)
- ❌ No `eval()` or `Function()` constructor
- ❌ No inline JavaScript (`onclick`, etc.)
- ❌ No build tools required

---

## 🧠 Calculator Logic Explanation

The calculator implements a **custom expression parser** using the **Recursive Descent Parsing** technique. This ensures proper BODMAS/PEMDAS operator precedence without relying on `eval()`.

### Architecture

```
User Input → Expression String → Tokenizer → Parser → Result
```

### 1. Tokenizer (`tokenize()`)

Converts the expression string into an array of tokens:

```
Input:  "12 + 34 × 5"
Output: [
  { type: 'NUMBER',   value: 12 },
  { type: 'OPERATOR', value: '+' },
  { type: 'NUMBER',   value: 34 },
  { type: 'OPERATOR', value: '×' },
  { type: 'NUMBER',   value: 5 }
]
```

The tokenizer also handles:
- Unary minus (negative numbers at expression start or after operators)
- Decimal numbers
- Whitespace normalization

### 2. Recursive Descent Parser (`parseAndEvaluate()`)

Implements a formal grammar with two precedence levels:

```
expression → term (('+' | '−') term)*     ← Lower precedence
term       → factor (('×' | '÷') factor)* ← Higher precedence
factor     → NUMBER                        ← Base case
```

**Example evaluation of `5 + 3 × 2`:**

1. `parseExpression()` calls `parseTerm()`
2. `parseTerm()` reads `5`, no `×/÷` follows → returns `5`
3. `parseExpression()` sees `+`, calls `parseTerm()` again
4. `parseTerm()` reads `3`, sees `×`, reads `2` → returns `3 × 2 = 6`
5. `parseExpression()` computes `5 + 6 = 11` ✅

### 3. Error Handling

- **Division by zero**: Caught during parsing, displays friendly message
- **Invalid expressions**: Gracefully handled with error state
- **Recovery**: User can continue calculating after any error via Clear or new input

---

## 📁 Folder Structure

```
OIBSIP/
└── WebDevelopment-Level2-Calculator/
    ├── index.html          # Main HTML document (semantic, accessible)
    ├── style.css           # Complete stylesheet (CSS Grid, glassmorphism)
    ├── script.js           # Calculator engine (custom parser, no eval)
    ├── README.md           # Project documentation (this file)
    └── assets/
        ├── icons/          # Favicon and app icons
        └── screenshots/    # Project screenshots
```

---

## 📸 Screenshots

> Screenshots will be added after deployment.

| Desktop View | Mobile View |
|---|---|
| *Desktop screenshot placeholder* | *Mobile screenshot placeholder* |

| History Panel | Error Handling |
|---|---|
| *History panel placeholder* | *Division by zero placeholder* |

---

## 🚀 Installation

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server, build tools, or dependencies required

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/OIBSIP.git
   ```

2. **Navigate to the project**
   ```bash
   cd OIBSIP/WebDevelopment-Level2-Calculator
   ```

3. **Open in browser**
   ```bash
   # Simply open index.html in your browser
   # Or use a local server:
   npx serve .
   ```

4. **Start calculating!** 🧮

---

## 🌐 Live Demo

> 🔗 **[Live Demo](#)** — *Link will be added after deployment*

---

## 📝 Git Commit History

Recommended commit sequence for building this project:

| # | Commit Message | Description |
|---|---|---|
| 1 | `feat: initial project setup` | Create folder structure, HTML boilerplate |
| 2 | `feat: build calculator UI` | Add display, keypad buttons, history panel |
| 3 | `style: add CSS Grid layout` | Implement responsive grid for keypad |
| 4 | `feat: implement calculator engine` | Custom tokenizer + recursive descent parser |
| 5 | `feat: add operator chaining` | Support multi-operator expressions |
| 6 | `feat: add keyboard support` | Map keyboard keys to calculator actions |
| 7 | `fix: handle divide-by-zero` | Friendly error message with recovery |
| 8 | `style: improve responsiveness` | Media queries for all breakpoints |
| 9 | `docs: update README` | Add documentation, badges, and screenshots |
| 10 | `chore: final internship submission` | Polish, cleanup, and final review |

---

## 👨‍💻 Author

**Rajad**

- **Internship**: Oasis Infobyte Web Development Internship 2026
- **Task**: Level 2 – Task 1: Calculator
- **GitHub**: [github.com/your-username](https://github.com/your-username)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

```
MIT License

Copyright (c) 2026 Rajad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<p align="center">
  Made with ❤️ for the Oasis Infobyte Internship 2026
</p>
