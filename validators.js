/**
 * @fileoverview Field validation functions for API response validation
 *
 * This file contains all validator functions used to verify response data types
 * and formats. It provides a comprehensive set of validators for common data types
 * as well as custom validation capabilities.
 *
 * @author Mohamed Riyad
 * @created 2024-01-21
 * @last-modified 2024-01-22
 *
 * @module validators
 * @requires none
 *
 * @typedef {Function} ValidatorFunction
 * @param {*} value - The value to validate
 * @param {*} [options] - Optional validation parameters
 * @returns {boolean} - Whether the value passes validation
 */

export const validators = {
    text: (value) => typeof value === 'string',
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    number: (value) => typeof value === 'number' && !isNaN(value),
    boolean: (value) => typeof value === 'boolean',
    date: (value) => !isNaN(Date.parse(value)),
    url: (value) => {
        try {
            new URL(value)
            return true
        } catch {
            return false
        }
    },
    array: (value) => Array.isArray(value),
    object: (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
    phone: (value) => /^\+?[\d\s\(\)\-]{8,}$/.test(value),
    uuid: (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
    enum: (value, allowedValues) => allowedValues.includes(value),
    regex: (value, pattern) => new RegExp(pattern).test(value),
    custom: (value, validatorFn) => validatorFn(value)
}
