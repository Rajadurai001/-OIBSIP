/* ============================================================
   Smart Temperature Converter — JavaScript
   Oasis Infobyte Internship 2026 · Task 3
   ============================================================ */

/**
 * Immediately-Invoked Function Expression (IIFE) to avoid
 * polluting the global scope with internal variables.
 */
(() => {
    'use strict';

    // ───────── DOM REFERENCES ─────────
    const tempInput   = document.querySelector('#tempInput');
    const unitSelect  = document.querySelector('#unitSelect');
    const convertBtn  = document.querySelector('#convertBtn');
    const resetBtn    = document.querySelector('#resetBtn');
    const errorMsg    = document.querySelector('#errorMsg');
    const resultsBox  = document.querySelector('#results');
    const valCelsius  = document.querySelector('#valCelsius');
    const valFahren   = document.querySelector('#valFahrenheit');
    const valKelvin   = document.querySelector('#valKelvin');

    // ───────── ABSOLUTE ZERO THRESHOLDS ─────────
    const ABSOLUTE_ZERO = Object.freeze({
        celsius:    -273.15,
        fahrenheit: -459.67,
        kelvin:     0,
    });

    // ───────── HELPER: Round to n decimal places ─────────
    /**
     * Rounds a number to the given number of decimal places.
     * @param {number} num   — value to round
     * @param {number} [dp=2] — decimal places
     * @returns {number}
     */
    const round = (num, dp = 2) => {
        const factor = 10 ** dp;
        return Math.round((num + Number.EPSILON) * factor) / factor;
    };

    // ───────── VALIDATION ─────────

    /**
     * Validates the user's input and returns either a numeric value
     * or `null` if the input is invalid (sets an error message in the UI).
     * @returns {number|null}
     */
    const validateInput = () => {
        const raw = tempInput.value.trim();

        // 1. Empty check
        if (raw === '') {
            showError('⚠️ Please enter a temperature value.');
            return null;
        }

        // 2. Number check (parseFloat accepts trailing text, so also regex-check)
        // Allow optional leading minus, digits, optional decimal point, digits
        if (!/^-?\d+(\.\d+)?$/.test(raw)) {
            showError('⚠️ Invalid input — only numeric values are accepted.');
            return null;
        }

        const value = parseFloat(raw);

        // 3. Finite check
        if (!Number.isFinite(value)) {
            showError('⚠️ Please enter a valid finite number.');
            return null;
        }

        // 4. Absolute zero check
        const unit = unitSelect.value;
        if (value < ABSOLUTE_ZERO[unit]) {
            showError(
                `🥶 Temperature cannot be below absolute zero (${ABSOLUTE_ZERO[unit]} ${unitLabel(unit)}).`
            );
            return null;
        }

        // All good — clear any previous error
        clearError();
        return value;
    };

    /**
     * Returns the display label for a given unit key.
     * @param {string} unit
     * @returns {string}
     */
    const unitLabel = (unit) => {
        const labels = { celsius: '°C', fahrenheit: '°F', kelvin: 'K' };
        return labels[unit] ?? '';
    };

    // ───────── ERROR DISPLAY ─────────

    /** Shows an error string and marks the input as invalid. */
    const showError = (msg) => {
        errorMsg.textContent = msg;
        tempInput.classList.add('input--error');
        tempInput.setAttribute('aria-invalid', 'true');
    };

    /** Clears the error string and resets input styling. */
    const clearError = () => {
        errorMsg.textContent = '';
        tempInput.classList.remove('input--error');
        tempInput.removeAttribute('aria-invalid');
    };

    // ───────── CONVERSION LOGIC ─────────

    /**
     * Converts the given temperature to all three units.
     * @param {number} value — numeric temperature
     * @param {string} from  — source unit key ('celsius' | 'fahrenheit' | 'kelvin')
     * @returns {{ celsius: number, fahrenheit: number, kelvin: number }}
     */
    const convertTemperature = (value, from) => {
        let celsius, fahrenheit, kelvin;

        switch (from) {
            case 'celsius':
                celsius    = value;
                fahrenheit = (value * 9 / 5) + 32;
                kelvin     = value + 273.15;
                break;

            case 'fahrenheit':
                celsius    = (value - 32) * 5 / 9;
                fahrenheit = value;
                kelvin     = celsius + 273.15;
                break;

            case 'kelvin':
                celsius    = value - 273.15;
                fahrenheit = (celsius * 9 / 5) + 32;
                kelvin     = value;
                break;

            default:
                celsius = fahrenheit = kelvin = 0;
        }

        return {
            celsius:    round(celsius),
            fahrenheit: round(fahrenheit),
            kelvin:     round(kelvin),
        };
    };

    // ───────── RESULT RENDERING ─────────

    /**
     * Renders the three result values in the UI and makes
     * the results section visible with a re-triggered animation.
     * @param {{ celsius: number, fahrenheit: number, kelvin: number }} results
     */
    const renderResults = ({ celsius, fahrenheit, kelvin }) => {
        valCelsius.textContent = celsius;
        valFahren.textContent  = fahrenheit;
        valKelvin.textContent  = kelvin;

        // Show the results section (remove `hidden` attribute)
        resultsBox.hidden = false;

        // Re-trigger the fade-up animation by briefly removing and re-adding the class
        resultsBox.classList.remove('results');
        void resultsBox.offsetWidth;           // force reflow
        resultsBox.classList.add('results');
    };

    // ───────── RESET ─────────

    /** Resets the entire form back to its default state. */
    const resetAll = () => {
        tempInput.value     = '';
        unitSelect.value    = 'celsius';
        valCelsius.textContent  = '—';
        valFahren.textContent   = '—';
        valKelvin.textContent   = '—';
        resultsBox.hidden   = true;
        clearError();
        tempInput.focus();
    };

    // ───────── EVENT: CONVERT ─────────

    const handleConvert = () => {
        const value = validateInput();
        if (value === null) return;                 // validation failed

        const results = convertTemperature(value, unitSelect.value);
        renderResults(results);
    };

    // ───────── EVENT LISTENERS ─────────

    convertBtn.addEventListener('click', handleConvert);
    resetBtn.addEventListener('click', resetAll);

    // Allow Enter key to trigger conversion from the input field
    tempInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleConvert();
        }
    });

    // Clear error styling as soon as the user begins typing again
    tempInput.addEventListener('input', () => {
        if (tempInput.classList.contains('input--error')) {
            clearError();
        }
    });
})();
