/**
 * ============================================
 * Oasis Infobyte Internship 2026
 * Level 2 – Task 1: Calculator
 *
 * Custom Calculator Engine
 * - NO eval() used anywhere
 * - Recursive Descent Parser with BODMAS/PEMDAS
 * - Keyboard support
 * - Calculation history
 * - Division by zero protection
 * - Operator chaining
 * ============================================
 */

'use strict';


/* ==========================================
   1. DOM ELEMENT REFERENCES
   ========================================== */

/** @type {HTMLElement} Expression display (upper line) */
const displayExpression = document.getElementById('displayExpression');

/** @type {HTMLElement} Result display (lower line) */
const displayResult = document.getElementById('displayResult');

/** @type {HTMLElement} Keypad container */
const keypad = document.getElementById('keypad');

/** @type {HTMLElement} History list container */
const historyList = document.getElementById('historyList');

/** @type {HTMLElement} History panel */
const historyPanel = document.getElementById('historyPanel');

/** @type {HTMLElement} History toggle button */
const historyToggle = document.getElementById('historyToggle');

/** @type {HTMLElement} History clear button */
const historyClear = document.getElementById('historyClear');

/** @type {HTMLElement} History empty message */
const historyEmpty = document.getElementById('historyEmpty');

/** @type {HTMLElement} Display container (for shake animation) */
const displayContainer = document.querySelector('.display');


/* ==========================================
   2. CALCULATOR STATE
   ========================================== */

/**
 * The current expression string displayed to the user.
 * Example: "12 + 34 × 5"
 * @type {string}
 */
let expression = '';

/**
 * Flag indicating the calculator just evaluated an expression.
 * When true, the next number input will start a new expression.
 * @type {boolean}
 */
let justEvaluated = false;

/**
 * Flag indicating an error state (e.g., division by zero).
 * @type {boolean}
 */
let hasError = false;

/**
 * Stores the last calculated result for continued operations.
 * @type {string|null}
 */
let lastResult = null;

/**
 * Array storing calculation history objects.
 * Each object has { expression: string, result: string }.
 * @type {Array<{expression: string, result: string}>}
 */
let history = [];

/** Maximum number of history entries to keep */
const MAX_HISTORY = 5;

/** Operator characters used in the calculator */
const OPERATORS = ['+', '−', '×', '÷'];


/* ==========================================
   3. TOKENIZER
   Converts expression string into token array
   ========================================== */

/**
 * Token types used by the parser.
 * @readonly
 * @enum {string}
 */
const TokenType = {
  NUMBER: 'NUMBER',
  OPERATOR: 'OPERATOR',
};

/**
 * Tokenizes an expression string into an array of tokens.
 * Handles negative numbers (unary minus) at the start or after operators.
 *
 * @param {string} expr - The expression string (e.g., "5 + 3 × 2")
 * @returns {Array<{type: string, value: number|string}>} Array of tokens
 * @throws {Error} If the expression contains invalid characters
 *
 * @example
 *   tokenize("12 + 34 × 5")
 *   // => [
 *   //   { type: 'NUMBER', value: 12 },
 *   //   { type: 'OPERATOR', value: '+' },
 *   //   { type: 'NUMBER', value: 34 },
 *   //   { type: 'OPERATOR', value: '×' },
 *   //   { type: 'NUMBER', value: 5 }
 *   // ]
 */
function tokenize(expr) {
  const tokens = [];
  let i = 0;
  const len = expr.length;

  while (i < len) {
    const ch = expr[i];

    // Skip whitespace
    if (ch === ' ') {
      i++;
      continue;
    }

    // Check for number (digits or decimal point)
    if (isDigitChar(ch) || ch === '.') {
      let numStr = '';
      while (i < len && (isDigitChar(expr[i]) || expr[i] === '.')) {
        numStr += expr[i];
        i++;
      }
      tokens.push({ type: TokenType.NUMBER, value: parseFloat(numStr) });
      continue;
    }

    // Check for operator
    if (OPERATORS.includes(ch)) {
      /**
       * Handle unary minus (negation):
       * A minus sign is treated as negation (not subtraction) when:
       * 1. It's at the very beginning of the expression, OR
       * 2. The previous token is an operator
       */
      if (ch === '−' && (tokens.length === 0 || tokens[tokens.length - 1].type === TokenType.OPERATOR)) {
        // This is a unary minus — read the following number as negative
        i++;
        let numStr = '-';
        // Skip whitespace after the minus
        while (i < len && expr[i] === ' ') { i++; }
        // Read the number
        while (i < len && (isDigitChar(expr[i]) || expr[i] === '.')) {
          numStr += expr[i];
          i++;
        }
        if (numStr === '-') {
          // Lone minus with no number — treat as zero
          tokens.push({ type: TokenType.NUMBER, value: 0 });
        } else {
          tokens.push({ type: TokenType.NUMBER, value: parseFloat(numStr) });
        }
        continue;
      }

      tokens.push({ type: TokenType.OPERATOR, value: ch });
      i++;
      continue;
    }

    // Unknown character — skip
    i++;
  }

  return tokens;
}

/**
 * Checks if a character is a digit (0-9).
 * @param {string} ch - Single character
 * @returns {boolean}
 */
function isDigitChar(ch) {
  return ch >= '0' && ch <= '9';
}


/* ==========================================
   4. RECURSIVE DESCENT PARSER
   Evaluates tokens with BODMAS/PEMDAS precedence:
   - Level 1 (lowest):  Addition (+) and Subtraction (−)
   - Level 2 (higher):  Multiplication (×) and Division (÷)
   - Level 3 (highest): Number literals
   ========================================== */

/**
 * Parses and evaluates a tokenized expression with full
 * BODMAS/PEMDAS operator precedence.
 *
 * @param {Array<{type: string, value: number|string}>} tokens - Token array
 * @returns {number} The evaluated result
 * @throws {Error} If the expression is invalid or division by zero occurs
 */
function parseAndEvaluate(tokens) {
  if (tokens.length === 0) {
    return 0;
  }

  /** Current position in the token array */
  let pos = 0;

  /**
   * Parses addition and subtraction (lowest precedence).
   * Grammar rule: expression → term (('+' | '−') term)*
   *
   * @returns {number} Evaluated result of the sub-expression
   */
  function parseExpression() {
    let left = parseTerm();

    while (pos < tokens.length && tokens[pos].type === TokenType.OPERATOR) {
      const op = tokens[pos].value;

      if (op === '+') {
        pos++;
        left = left + parseTerm();
      } else if (op === '−') {
        pos++;
        left = left - parseTerm();
      } else {
        // Not an addition/subtraction operator — stop
        break;
      }
    }

    return left;
  }

  /**
   * Parses multiplication and division (higher precedence).
   * Grammar rule: term → factor (('×' | '÷') factor)*
   *
   * @returns {number} Evaluated result of the sub-expression
   * @throws {Error} If division by zero is attempted
   */
  function parseTerm() {
    let left = parseFactor();

    while (pos < tokens.length && tokens[pos].type === TokenType.OPERATOR) {
      const op = tokens[pos].value;

      if (op === '×') {
        pos++;
        left = left * parseFactor();
      } else if (op === '÷') {
        pos++;
        const right = parseFactor();
        // Division by zero protection
        if (right === 0) {
          throw new Error('Cannot divide by zero');
        }
        left = left / right;
      } else {
        // Not a multiplication/division operator — stop
        break;
      }
    }

    return left;
  }

  /**
   * Parses a number literal (highest precedence / base case).
   * Grammar rule: factor → NUMBER
   *
   * @returns {number} The numeric value
   * @throws {Error} If no valid number is found
   */
  function parseFactor() {
    if (pos >= tokens.length) {
      throw new Error('Unexpected end of expression');
    }

    const token = tokens[pos];

    if (token.type === TokenType.NUMBER) {
      pos++;
      return token.value;
    }

    throw new Error('Expected a number');
  }

  // Start parsing from the lowest precedence level
  const result = parseExpression();

  // Ensure all tokens have been consumed
  if (pos < tokens.length) {
    throw new Error('Unexpected token in expression');
  }

  return result;
}


/* ==========================================
   5. CALCULATION ENGINE
   Orchestrates tokenization, parsing, and formatting
   ========================================== */

/**
 * Evaluates a full expression string and returns the formatted result.
 *
 * @param {string} expr - The expression string to evaluate
 * @returns {{success: boolean, result: string, error: string|null}}
 *
 * @example
 *   evaluate("5 + 3 × 2")
 *   // => { success: true, result: "11", error: null }
 */
function evaluate(expr) {
  try {
    // Step 1: Validate the expression is not empty
    const trimmed = expr.trim();
    if (!trimmed) {
      return { success: false, result: '0', error: 'Empty expression' };
    }

    // Step 2: Tokenize the expression string
    const tokens = tokenize(trimmed);

    // Step 3: Validate we have tokens to evaluate
    if (tokens.length === 0) {
      return { success: false, result: '0', error: 'Invalid expression' };
    }

    // If expression ends with an operator, remove it before evaluation
    if (tokens[tokens.length - 1].type === TokenType.OPERATOR) {
      tokens.pop();
    }

    // Step 4: Parse and evaluate with BODMAS precedence
    const result = parseAndEvaluate(tokens);

    // Step 5: Format the result
    const formatted = formatResult(result);

    return { success: true, result: formatted, error: null };
  } catch (error) {
    // Return error information (division by zero, invalid expression, etc.)
    return {
      success: false,
      result: error.message,
      error: error.message,
    };
  }
}

/**
 * Formats a numeric result for display.
 * - Limits decimal places to prevent overflow
 * - Handles very large/small numbers with scientific notation
 * - Removes trailing zeros
 *
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
function formatResult(num) {
  // Handle special float values
  if (!isFinite(num)) {
    return 'Error';
  }

  // Check if the number is an integer
  if (Number.isInteger(num)) {
    return num.toString();
  }

  // For very large or very small numbers, use scientific notation
  if (Math.abs(num) > 1e12 || (Math.abs(num) < 1e-8 && num !== 0)) {
    return num.toExponential(6);
  }

  // Round to at most 10 decimal places and remove trailing zeros
  const rounded = parseFloat(num.toFixed(10));
  return rounded.toString();
}


/* ==========================================
   6. INPUT HANDLERS
   Process user interactions (button clicks, keyboard)
   ========================================== */

/**
 * Handles numeric digit input (0-9).
 * If the calculator just evaluated, starts a new expression.
 *
 * @param {string} digit - The digit character ('0' through '9')
 */
function handleNumber(digit) {
  // Clear error state if present
  if (hasError) {
    handleClear();
  }

  // After evaluation, start a new expression
  if (justEvaluated) {
    expression = '';
    justEvaluated = false;
  }

  // Prevent leading zeros (e.g., "007")
  const lastNumber = getLastNumber();
  if (lastNumber === '0' && digit === '0') {
    return;
  }
  if (lastNumber === '0' && digit !== '0') {
    // Replace the leading zero with the new digit
    expression = expression.slice(0, -1);
  }

  expression += digit;
  updateDisplay();
}

/**
 * Handles decimal point input.
 * Prevents multiple decimal points in the same number.
 */
function handleDecimal() {
  // Clear error state if present
  if (hasError) {
    handleClear();
  }

  // After evaluation, start a new decimal number
  if (justEvaluated) {
    expression = '0.';
    justEvaluated = false;
    updateDisplay();
    return;
  }

  // Get the last number being typed
  const lastNumber = getLastNumber();

  // Prevent multiple decimal points in the same number
  if (lastNumber.includes('.')) {
    return;
  }

  // If expression is empty or ends with an operator, start with "0."
  if (expression === '' || isLastCharOperator()) {
    expression += '0.';
  } else {
    expression += '.';
  }

  updateDisplay();
}

/**
 * Handles operator input (+, −, ×, ÷).
 * Supports operator chaining and operator replacement.
 *
 * @param {string} operator - The operator character
 */
function handleOperator(operator) {
  // Clear error state — can't chain on errors
  if (hasError) {
    handleClear();
    return;
  }

  // After evaluation, continue from the result
  if (justEvaluated) {
    expression = lastResult || '0';
    justEvaluated = false;
  }

  // If expression is empty, only allow minus (for negative numbers)
  if (expression.trim() === '') {
    if (operator === '−') {
      expression = '−';
      updateDisplay();
    }
    return;
  }

  // Remove trailing decimal point before adding operator
  if (expression.endsWith('.')) {
    expression = expression.slice(0, -1);
  }

  // If last character is an operator, replace it
  if (isLastCharOperator()) {
    // Remove the old operator and its surrounding spaces
    expression = expression.trimEnd();
    // Find and remove the last operator
    const lastSpaceIndex = expression.lastIndexOf(' ');
    if (lastSpaceIndex !== -1) {
      expression = expression.substring(0, lastSpaceIndex);
    } else {
      // Expression is just an operator (e.g., "−"), replace it
      expression = '';
      if (operator === '−') {
        expression = '−';
        updateDisplay();
        return;
      }
      return;
    }
  }

  // Add operator with spaces for readability
  expression += ` ${operator} `;
  updateDisplay();
}

/**
 * Handles the equals button — evaluates the current expression.
 * Adds the calculation to history if successful.
 */
function handleEquals() {
  // Don't evaluate if there's an error or empty expression
  if (hasError || expression.trim() === '') {
    return;
  }

  // Don't re-evaluate if already evaluated
  if (justEvaluated) {
    return;
  }

  // Clean trailing operators/spaces/decimals
  let cleanExpr = expression.trim();
  if (cleanExpr.endsWith('.')) {
    cleanExpr = cleanExpr.slice(0, -1);
  }

  // Remove trailing operator if present
  const lastChar = cleanExpr.trim().split('').pop();
  if (OPERATORS.includes(lastChar)) {
    cleanExpr = cleanExpr.trim();
    const lastSpace = cleanExpr.lastIndexOf(' ');
    if (lastSpace !== -1) {
      cleanExpr = cleanExpr.substring(0, lastSpace).trim();
    }
  }

  // Evaluate the expression
  const evalResult = evaluate(cleanExpr);

  if (evalResult.success) {
    // Store the expression for display in history
    const historyExpr = cleanExpr;

    // Update display
    displayExpression.textContent = `${cleanExpr} =`;
    displayResult.textContent = evalResult.result;
    displayResult.classList.remove('error');

    // Apply pulse animation to result
    displayResult.classList.remove('pulse');
    // Trigger reflow to restart animation
    void displayResult.offsetWidth;
    displayResult.classList.add('pulse');

    // Store result for continued operations
    lastResult = evalResult.result;
    expression = evalResult.result;
    justEvaluated = true;

    // Add to history
    addToHistory(historyExpr, evalResult.result);

    // Adjust font size for result
    adjustResultFontSize(evalResult.result);
  } else {
    // Display error message
    showError(evalResult.error);
  }
}

/**
 * Handles the Clear (C) button.
 * Completely resets all calculator state.
 */
function handleClear() {
  expression = '';
  justEvaluated = false;
  hasError = false;
  lastResult = null;

  // Reset display
  displayExpression.textContent = '';
  displayResult.textContent = '0';
  displayResult.className = 'display-result';

  // Remove any active operator highlights
  removeActiveOperator();
}

/**
 * Handles the Backspace (⌫) button.
 * Removes the last entered character, handling spaces around operators.
 */
function handleBackspace() {
  // Can't backspace if in error state
  if (hasError) {
    handleClear();
    return;
  }

  // After evaluation, clear to start fresh
  if (justEvaluated) {
    handleClear();
    return;
  }

  // If expression is empty, nothing to delete
  if (expression === '') {
    return;
  }

  // If the expression ends with a space (operator with spaces), remove the operator and spaces
  if (expression.endsWith(' ')) {
    // Remove " op " (operator with surrounding spaces)
    expression = expression.trimEnd();
    // Find the last space
    const lastSpaceIdx = expression.lastIndexOf(' ');
    if (lastSpaceIdx !== -1) {
      expression = expression.substring(0, lastSpaceIdx + 1);
    } else {
      // The remaining is just a standalone operator, remove it
      expression = '';
    }
  } else {
    // Remove the last character
    expression = expression.slice(0, -1);
  }

  updateDisplay();
}

/**
 * Handles the Percentage (%) button.
 * Converts the last number in the expression to its percentage (÷ 100).
 */
function handlePercent() {
  // Can't use percent on error
  if (hasError) {
    handleClear();
    return;
  }

  // After evaluation, apply percentage to the result
  if (justEvaluated) {
    const num = parseFloat(lastResult);
    if (!isNaN(num)) {
      const percentValue = num / 100;
      const formatted = formatResult(percentValue);
      expression = formatted;
      lastResult = formatted;
      displayExpression.textContent = `${num} % =`;
      displayResult.textContent = formatted;
      adjustResultFontSize(formatted);
    }
    return;
  }

  // Get the last number in the expression
  const lastNum = getLastNumber();
  if (lastNum === '') {
    return;
  }

  const num = parseFloat(lastNum);
  if (isNaN(num)) {
    return;
  }

  const percentValue = num / 100;
  const formatted = formatResult(percentValue);

  // Replace the last number in the expression with its percentage
  const lastNumIndex = expression.lastIndexOf(lastNum);
  expression = expression.substring(0, lastNumIndex) + formatted;

  updateDisplay();
}

/**
 * Handles the Negate (±) button.
 * Toggles the sign of the last number in the expression.
 */
function handleNegate() {
  // Can't negate on error
  if (hasError) {
    handleClear();
    return;
  }

  // After evaluation, negate the result
  if (justEvaluated) {
    const num = parseFloat(lastResult);
    if (!isNaN(num)) {
      const negated = num * -1;
      const formatted = formatResult(negated);
      expression = formatted;
      lastResult = formatted;
      displayResult.textContent = formatted;
      adjustResultFontSize(formatted);
    }
    return;
  }

  // Get the last number and toggle its sign
  const lastNum = getLastNumber();
  if (lastNum === '' || lastNum === '0') {
    return;
  }

  // Find where the last number starts in the expression
  const lastNumIndex = expression.lastIndexOf(lastNum);

  if (lastNum.startsWith('−') || lastNum.startsWith('-')) {
    // Remove the negative sign
    const withoutMinus = lastNum.substring(1);
    expression = expression.substring(0, lastNumIndex) + withoutMinus;
  } else {
    // Add a negative sign
    expression = expression.substring(0, lastNumIndex) + '−' + lastNum;
  }

  updateDisplay();
}


/* ==========================================
   7. DISPLAY UPDATE FUNCTIONS
   ========================================== */

/**
 * Updates both display lines with the current expression.
 * Also calculates and shows a live preview of the result.
 */
function updateDisplay() {
  // Update expression display
  const displayText = expression || '';
  displayExpression.textContent = displayText;

  // Adjust expression font size
  if (displayText.length > 25) {
    displayExpression.classList.add('font-sm');
  } else {
    displayExpression.classList.remove('font-sm');
  }

  // Show live preview of result if expression is evaluable
  if (expression.trim() && !isLastCharOperator() && !expression.trim().endsWith('−')) {
    const preview = evaluate(expression.trim());
    if (preview.success) {
      displayResult.textContent = preview.result;
      displayResult.classList.remove('error');
      adjustResultFontSize(preview.result);
    } else if (preview.error === 'Cannot divide by zero') {
      displayResult.textContent = expression.trim();
      displayResult.classList.remove('error');
    } else {
      displayResult.textContent = expression.trim() || '0';
      displayResult.classList.remove('error');
    }
  } else if (expression.trim()) {
    // Expression ends with operator — show expression so far
    displayResult.textContent = expression.trim();
    displayResult.classList.remove('error');
  } else {
    displayResult.textContent = '0';
    displayResult.classList.remove('error');
    displayResult.className = 'display-result';
  }
}

/**
 * Adjusts the result display font size based on content length.
 * Prevents text overflow by scaling down for long numbers.
 *
 * @param {string} text - The result text to measure
 */
function adjustResultFontSize(text) {
  // Remove existing size classes
  displayResult.classList.remove('font-lg', 'font-md', 'font-sm');

  const len = text.length;
  if (len > 16) {
    displayResult.classList.add('font-sm');
  } else if (len > 12) {
    displayResult.classList.add('font-md');
  } else if (len > 8) {
    displayResult.classList.add('font-lg');
  }
}

/**
 * Displays an error message with visual feedback (shake + red text).
 *
 * @param {string} message - The error message to display
 */
function showError(message) {
  hasError = true;
  displayResult.textContent = message;
  displayResult.classList.add('error');

  // Trigger shake animation on the display container
  displayContainer.classList.remove('shake');
  void displayContainer.offsetWidth;
  displayContainer.classList.add('shake');

  // Remove shake class after animation completes
  setTimeout(() => {
    displayContainer.classList.remove('shake');
  }, 500);
}


/* ==========================================
   8. UTILITY / HELPER FUNCTIONS
   ========================================== */

/**
 * Extracts the last number from the expression string.
 * Used for decimal point validation, percentage, and negate operations.
 *
 * @returns {string} The last number in the expression, or empty string
 *
 * @example
 *   // expression = "12 + 34.5"
 *   getLastNumber() // => "34.5"
 */
function getLastNumber() {
  const trimmed = expression.trimEnd();
  if (!trimmed) return '';

  // Find the last operator position
  let lastOpIndex = -1;
  for (let i = trimmed.length - 1; i >= 0; i--) {
    if (trimmed[i] === ' ' && i > 0 && OPERATORS.includes(trimmed[i - 1])) {
      lastOpIndex = i;
      break;
    }
  }

  if (lastOpIndex === -1) {
    // No operator found — the entire expression is one number
    return trimmed;
  }

  // Return everything after the last operator space
  return trimmed.substring(lastOpIndex + 1);
}

/**
 * Checks if the last meaningful character in the expression is an operator.
 *
 * @returns {boolean} True if expression ends with an operator
 */
function isLastCharOperator() {
  const trimmed = expression.trimEnd();
  if (!trimmed) return false;
  const lastChar = trimmed[trimmed.length - 1];
  return OPERATORS.includes(lastChar);
}

/**
 * Removes the 'active' class from all operator buttons.
 */
function removeActiveOperator() {
  const operatorBtns = document.querySelectorAll('.btn-operator');
  operatorBtns.forEach(btn => btn.classList.remove('active'));
}


/* ==========================================
   9. CALCULATION HISTORY
   Stores and displays the last N calculations
   ========================================== */

/**
 * Adds a calculation to the history.
 * Limits history to MAX_HISTORY entries (FIFO).
 *
 * @param {string} expr - The expression string
 * @param {string} result - The calculated result
 */
function addToHistory(expr, result) {
  // Add to the beginning of the array (newest first)
  history.unshift({ expression: expr, result: result });

  // Limit history size
  if (history.length > MAX_HISTORY) {
    history.pop();
  }

  // Re-render the history panel
  renderHistory();
}

/**
 * Renders the history list in the history panel.
 * Creates clickable items that load past results.
 */
function renderHistory() {
  // Clear existing history items (keep the empty message element)
  const items = historyList.querySelectorAll('.history-item');
  items.forEach(item => item.remove());

  if (history.length === 0) {
    historyEmpty.style.display = 'block';
    return;
  }

  historyEmpty.style.display = 'none';

  history.forEach((entry, index) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-label', `${entry.expression} equals ${entry.result}. Click to use result.`);
    li.style.animationDelay = `${index * 50}ms`;

    // Expression line
    const exprDiv = document.createElement('div');
    exprDiv.className = 'history-item-expression';
    exprDiv.textContent = `${entry.expression} =`;

    // Result line
    const resultDiv = document.createElement('div');
    resultDiv.className = 'history-item-result';
    resultDiv.textContent = entry.result;

    li.appendChild(exprDiv);
    li.appendChild(resultDiv);

    // Click to load result into calculator
    li.addEventListener('click', () => {
      loadFromHistory(entry.result);
    });

    // Keyboard activation (Enter/Space)
    li.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        loadFromHistory(entry.result);
      }
    });

    historyList.appendChild(li);
  });
}

/**
 * Loads a result from history into the calculator for continued calculation.
 *
 * @param {string} result - The result value to load
 */
function loadFromHistory(result) {
  expression = result;
  lastResult = result;
  justEvaluated = true;
  hasError = false;

  displayExpression.textContent = '';
  displayResult.textContent = result;
  displayResult.classList.remove('error');
  adjustResultFontSize(result);
}

/**
 * Clears all calculation history.
 */
function clearHistory() {
  history = [];
  renderHistory();
}

/**
 * Toggles the visibility of the history panel.
 */
function toggleHistory() {
  const isVisible = historyPanel.classList.contains('visible');

  if (isVisible) {
    historyPanel.classList.remove('visible');
    historyToggle.classList.remove('active');
    historyToggle.setAttribute('aria-expanded', 'false');
  } else {
    historyPanel.classList.add('visible');
    historyToggle.classList.add('active');
    historyToggle.setAttribute('aria-expanded', 'true');
  }
}


/* ==========================================
   10. KEYBOARD INPUT HANDLER
   Maps keyboard keys to calculator actions
   ========================================== */

/**
 * Handles keyboard events and maps them to calculator functions.
 * Supports number keys, operators, Enter, Backspace, Delete, Escape.
 *
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyboard(event) {
  const key = event.key;

  // Prevent default for calculator keys to avoid browser conflicts
  const calcKeys = ['0','1','2','3','4','5','6','7','8','9','.','/',
                     '*','-','+','%','Enter','Backspace','Delete','Escape'];
  if (calcKeys.includes(key)) {
    event.preventDefault();
  }

  switch (key) {
    // Number keys
    case '0': case '1': case '2': case '3': case '4':
    case '5': case '6': case '7': case '8': case '9':
      handleNumber(key);
      highlightButton(`[data-value="${key}"]`);
      break;

    // Decimal point
    case '.':
      handleDecimal();
      highlightButton('[data-action="decimal"]');
      break;

    // Operators (map keyboard symbols to Unicode operators)
    case '+':
      handleOperator('+');
      highlightButton('[data-value="+"]');
      break;
    case '-':
      handleOperator('−');
      highlightButton('[data-value="−"]');
      break;
    case '*':
      handleOperator('×');
      highlightButton('[data-value="×"]');
      break;
    case '/':
      handleOperator('÷');
      highlightButton('[data-value="÷"]');
      break;
    case '%':
      handlePercent();
      highlightButton('[data-action="percent"]');
      break;

    // Equals / Enter
    case 'Enter':
    case '=':
      handleEquals();
      highlightButton('[data-action="equals"]');
      break;

    // Backspace
    case 'Backspace':
      handleBackspace();
      highlightButton('[data-action="backspace"]');
      break;

    // Delete / Escape — Clear
    case 'Delete':
    case 'Escape':
      handleClear();
      highlightButton('[data-action="clear"]');
      break;

    default:
      break;
  }
}

/**
 * Briefly highlights a button to provide visual feedback for keyboard input.
 *
 * @param {string} selector - CSS selector for the button to highlight
 */
function highlightButton(selector) {
  const btn = keypad.querySelector(selector);
  if (!btn) return;

  btn.classList.add('pressed');
  setTimeout(() => {
    btn.classList.remove('pressed');
  }, 200);
}


/* ==========================================
   11. EVENT LISTENERS SETUP
   ========================================== */

/**
 * Initializes all event listeners for the calculator.
 * Uses event delegation on the keypad for efficiency.
 */
function initEventListeners() {
  /**
   * Keypad click handler (event delegation).
   * Reads data attributes from the clicked button to determine the action.
   */
  keypad.addEventListener('click', (event) => {
    const btn = event.target.closest('.btn');
    if (!btn) return;

    const action = btn.dataset.action;
    const value = btn.dataset.value;

    switch (action) {
      case 'number':
        handleNumber(value);
        break;
      case 'decimal':
        handleDecimal();
        break;
      case 'operator':
        handleOperator(value);
        break;
      case 'equals':
        handleEquals();
        break;
      case 'clear':
        handleClear();
        break;
      case 'backspace':
        handleBackspace();
        break;
      case 'percent':
        handlePercent();
        break;
      case 'negate':
        handleNegate();
        break;
      default:
        break;
    }
  });

  /**
   * Keyboard event listener for keyboard-driven input.
   */
  document.addEventListener('keydown', handleKeyboard);

  /**
   * History toggle button click handler.
   */
  historyToggle.addEventListener('click', toggleHistory);

  /**
   * History clear button click handler.
   */
  historyClear.addEventListener('click', clearHistory);
}


/* ==========================================
   12. INITIALIZATION
   ========================================== */

/**
 * Initializes the calculator application.
 * Sets up event listeners and ensures a clean initial state.
 */
function init() {
  // Set up all event listeners
  initEventListeners();

  // Ensure clean initial state
  handleClear();

  // Set initial ARIA state for history toggle
  historyToggle.setAttribute('aria-expanded', 'false');

  // Render empty history
  renderHistory();
}

// Start the calculator when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
