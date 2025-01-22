/**
 * @fileoverview Main K6 performance testing script
 *
 * This is the main test runner that executes performance tests against configured
 * endpoints. It handles test execution, validation, metric collection, and reporting.
 *
 * Features:
 * - Configurable endpoint testing
 * - Response validation
 * - Performance metrics collection
 * - Slow request tracking
 * - Detailed reporting
 *
 * @author Mohamed Riyad
 * @created 2024-01-21
 * @last-modified 2024-01-22
 *
 * @module main
 * @requires k6/http
 * @requires k6/metrics
 * @requires ./config.js
 * @requires ./endpoints.js
 * @requires ./validators.js
 *
 * @example
 * // Run all tests
 * k6 run main.js
 *
 * // Run specific endpoints
 * k6 run -e TARGET_ENDPOINTS=endpoint1,endpoint2 main.js
 *
 * @example
 * // With environment variables
 * k6 run -e AUTH_TOKEN=xxx main.js
 */

import { check, sleep } from 'k6'
import http from 'k6/http'
import { Rate, Trend } from 'k6/metrics'
import { SharedArray } from 'k6/data'
import { FormData } from 'k6/http'
import { globalConfig } from './config.js'
import { endpoints } from './endpoints.js'
import { validators } from './validators.js'

// Custom metrics for tracking test performance
const metrics = {
    failureRate: new Rate('failed_requests'),
    slowRequests: new Rate('slow_requests'),
    responseTime: new Trend('response_time'),
    slowRequestDetails: new Trend('slow_request_details'),
    validationFailures: new Rate('validation_failures')
}

// Stored data for use across requests
let storedData = {}
let slowRequests = []

// Build k6 options including scenarios and thresholds
function buildOptions(targetEndpoints) {
    const scenarios = {}
    const thresholds = {
        ...globalConfig.defaultTestConfig.thresholds
    }

    const endpointsToRun = targetEndpoints ? Object.entries(endpoints).filter(([key]) => targetEndpoints.includes(key)) : Object.entries(endpoints)

    endpointsToRun.forEach(([endpoint, config]) => {
        scenarios[endpoint] = {
            executor: 'constant-vus',
            vus: config.config?.vus || globalConfig.defaultTestConfig.vus,
            duration: config.config?.duration || globalConfig.defaultTestConfig.duration,
            exec: 'default',
            env: { SCENARIO: endpoint }
        }

        if (config.config?.responseTime) {
            thresholds[`http_req_duration{endpoint:${endpoint}}`] = [`p(95)<${config.config.responseTime}`]
        }

        if (config.config?.thresholds) {
            Object.entries(config.config.thresholds).forEach(([metric, conditions]) => {
                thresholds[`${metric}{endpoint:${endpoint}}`] = conditions
            })
        }
    })

    return { scenarios, thresholds }
}

// Prepare request body based on type and content
function prepareRequestBody(bodyConfig, storedData) {
    if (!bodyConfig) return null

    try {
        const { type, content, contentType } = bodyConfig

        let processedContent = JSON.parse(
            JSON.stringify(content).replace(/\${stored\.(.*?)}/g, (match, key) => {
                if (!storedData.hasOwnProperty(key)) {
                    throw new Error(`Stored value '${key}' not found`)
                }
                return storedData[key]
            })
        )

        switch (type) {
            case 'form-data': {
                const fd = new FormData()
                for (const [key, value] of Object.entries(processedContent)) {
                    if (value?.type === 'file') {
                        fd.append(key, open(value.path))
                    } else {
                        fd.append(key, value)
                    }
                }
                return fd
            }

            case 'x-www-form-urlencoded':
                return Object.entries(processedContent)
                    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                    .join('&')

            case 'raw':
                return JSON.stringify(processedContent)

            default:
                throw new Error(`Unsupported body type: ${type}`)
        }
    } catch (error) {
        console.error(`Error preparing request body: ${error.message}`)
        throw error
    }
}

// Parse response body safely
function parseResponse(response, endpointConfig) {
    if (!response.body) return null

    try {
        return response.json()
    } catch (error) {
        console.warn(`Failed to parse response as JSON for endpoint ${endpointConfig.path}: ${error.message}`)
        return null
    }
}

// Validate response content against expected schema
function validateResponseContent(response, expectedContent) {
    const responseBody = parseResponse(response)
    const validationResults = {}

    if (!responseBody) {
        return { 'response parsing': false }
    }

    for (const [field, validation] of Object.entries(expectedContent)) {
        const value = responseBody[field]
        const validator = validators[validation.type]

        if (!validator) {
            console.error(`Unknown validator type: ${validation.type}`)
            validationResults[`${field} validation`] = false
            continue
        }

        const isValid = validator(value, validation.values)
        validationResults[`${field} is valid`] = isValid

        if (!isValid) {
            metrics.validationFailures.add(1, { field, type: validation.type })
        }
    }

    return validationResults
}

// Handle individual HTTP requests
function handleRequest(endpoint, endpointConfig) {
    const baseURL = endpointConfig.baseURL || globalConfig.baseURL
    const url = `${baseURL}${endpointConfig.path}`

    let headers = { ...globalConfig.headers, ...endpointConfig.headers }

    if (endpointConfig.body) {
        switch (endpointConfig.body.type) {
            case 'raw':
                headers['Content-Type'] = endpointConfig.body.contentType || globalConfig.contentTypes.json
                break
            case 'x-www-form-urlencoded':
                headers['Content-Type'] = globalConfig.contentTypes.urlEncoded
                break
        }
    }

    let params = {
        headers,
        tags: { endpoint, ...endpointConfig.tags }
    }

    let body = null
    try {
        if (endpointConfig.body) {
            body = prepareRequestBody(endpointConfig.body, storedData)
        }
    } catch (error) {
        console.error(`Failed to prepare request body for ${endpoint}: ${error.message}`)
        metrics.failureRate.add(1)
        return
    }

    const startTime = new Date()
    const response = endpointConfig.method === 'GET' ? http.get(url, params) : http.request(endpointConfig.method, url, body, params)
    const endTime = new Date()
    const duration = endTime - startTime

    metrics.responseTime.add(duration, { endpoint })

    const isSlowRequest = duration > (endpointConfig.config?.responseTime || globalConfig.slowRequestThreshold)
    metrics.slowRequests.add(isSlowRequest)

    if (isSlowRequest) {
        metrics.slowRequestDetails.add(duration, {
            endpoint,
            method: endpointConfig.method,
            url,
            statusCode: response.status,
            timestamp: startTime.toISOString()
        })

        slowRequests.push({
            endpoint,
            duration,
            timestamp: startTime.toISOString(),
            method: endpointConfig.method,
            url,
            status: response.status,
            threshold: endpointConfig.config?.responseTime || globalConfig.slowRequestThreshold
        })
    }

    if (endpointConfig.storeResponse) {
        try {
            const responseBody = parseResponse(response, endpointConfig)
            if (responseBody) {
                Object.entries(endpointConfig.storeResponse).forEach(([key, path]) => {
                    storedData[key] = responseBody[path]
                })
            }
        } catch (error) {
            console.error(`Failed to store response data for ${endpoint}: ${error.message}`)
        }
    }

    const checks = {
        'status is as expected': response.status === (endpointConfig.expectedStatus || 200),
        'response time is within limits': !isSlowRequest
    }

    if (endpointConfig.expectedContent) {
        Object.assign(checks, validateResponseContent(response, endpointConfig.expectedContent))
    }

    check(response, checks)
    metrics.failureRate.add(!Object.values(checks).every(Boolean))

    sleep(1)
}

// Configure test options based on target endpoints
const targetEndpoints = __ENV.TARGET_ENDPOINTS ? __ENV.TARGET_ENDPOINTS.split(',') : null

const { scenarios, thresholds } = buildOptions(targetEndpoints)

export const options = {
    scenarios,
    thresholds,
    // Global test options
    userAgent: 'k6-performance-test/1.0',
    noConnectionReuse: false,
    insecureSkipTLSVerify: true
}

// Main test function
export default function () {
    const scenarioEndpoint = __ENV.SCENARIO

    if (!scenarioEndpoint || !endpoints[scenarioEndpoint]) {
        console.error(`Invalid endpoint: ${scenarioEndpoint}`)
        return
    }

    handleRequest(scenarioEndpoint, endpoints[scenarioEndpoint])
}
