/**
 * @fileoverview Global configuration settings for K6 performance tests
 *
 * This file contains all global settings and thresholds used across the test suite,
 * including default headers, timeouts, and performance thresholds.
 *
 * @author Mohamed Riyad
 * @created 2024-01-21
 *
 * @module config
 * @requires none
 */

export const globalConfig = {
    baseURL: 'https://uat.openfinance.adcb.com',
    headers: {
        // 'Content-Type': 'application/json',
        Accept: 'application/json'
    },
    // Default test configuration
    defaultTestConfig: {
        vus: 1,
        duration: '30s',
        responseTime: 1000, // 1 second
        thresholds: {
            http_req_failed: ['rate<0.01'],
            http_req_duration: ['p(95)<1000']
        }
    },
    // Performance thresholds
    slowRequestThreshold: 1000, // ms
    // Supported content types
    contentTypes: {
        json: 'application/json',
        formData: 'multipart/form-data',
        urlEncoded: 'application/x-www-form-urlencoded',
        text: 'text/plain'
    }
}
