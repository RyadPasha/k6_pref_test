/**
 * @fileoverview API endpoint configurations for K6 performance tests
 *
 * This file contains the configuration for all API endpoints to be tested,
 * including their paths, methods, expected responses, and validation rules.
 * Add new endpoints here following the existing pattern.
 *
 * @author Mohamed Riyad
 * @created 2024-01-21
 * @last-modified 2024-01-22
 *
 * @module endpoints
 * @requires none
 *
 * Available Types for expectedContent:
 *
 * 1. text
 *    Basic text validation
 *    @example
 *    field: {
 *      type: 'text',
 *      minLength: 2,    // optional
 *      maxLength: 50    // optional
 *    }
 *
 * 2. email
 *    Email format validation
 *    @example
 *    field: { type: 'email' }
 *
 * 3. number
 *    Numeric value validation
 *    @example
 *    field: {
 *      type: 'number',
 *      min: 0,         // optional
 *      max: 100        // optional
 *    }
 *
 * 4. boolean
 *    Boolean value validation
 *    @example
 *    field: { type: 'boolean' }
 *
 * 5. date
 *    Date format validation
 *    @example
 *    field: { type: 'date' }
 *
 * 6. url
 *    URL format validation
 *    @example
 *    field: { type: 'url' }
 *
 * 7. array
 *    Array type validation
 *    @example
 *    field: { type: 'array' }
 *
 * 8. object
 *    Object type validation
 *    @example
 *    field: { type: 'object' }
 *
 * 9. phone
 *    Phone number format validation
 *    @example
 *    field: { type: 'phone' }
 *
 * 10. uuid
 *     UUID format validation
 *     @example
 *     field: { type: 'uuid' }
 *
 * 11. enum
 *     Enumerated values validation
 *     @example
 *     field: {
 *       type: 'enum',
 *       values: ['active', 'inactive', 'pending']
 *     }
 *
 * 12. regex
 *     Custom regex pattern validation
 *     @example
 *     field: {
 *       type: 'regex',
 *       pattern: '^PREFIX_.*$'
 *     }
 *
 * 13. custom
 *     Custom validation function
 *     @example
 *     field: {
 *       type: 'custom',
 *       validator: (value) => value.startsWith('PREFIX_')
 *     }
 *
 * Complete Example:
 * @example
 * {
 *   getUserProfile: {
 *     path: '/api/users/profile',
 *     method: 'GET',
 *     expectedContent: {
 *       id: { type: 'uuid' },
 *       name: { type: 'text', minLength: 2, maxLength: 50 },
 *       email: { type: 'email' },
 *       age: { type: 'number', min: 18, max: 120 },
 *       isActive: { type: 'boolean' },
 *       createdAt: { type: 'date' },
 *       website: { type: 'url' },
 *       phones: { type: 'array' },
 *       settings: { type: 'object' },
 *       phone: { type: 'phone' },
 *       status: { type: 'enum', values: ['active', 'inactive'] },
 *       code: { type: 'regex', pattern: '^CODE_\\d{6}$' },
 *       customField: {
 *         type: 'custom',
 *         validator: (value) => value.startsWith('PREFIX_')
 *       }
 *     }
 *   }
 * }
 */

export const endpoints = {
    getToken: {
        baseURL: 'https://test.api.auth.adcb.com', //
        path: '/oauth2/token',
        method: 'POST',
        tags: ['token', 'auth'],
        config: {
            vus: 2,
            duration: '1m',
            target: 50
        },
        headers: {
            Authorization: `Basic ${__ENV.AUTH_TOKEN}`
        },
        body: {
            type: 'x-www-form-urlencoded',
            content: {
                grant_type: 'client_credentials'
                // scope: 'read/GetConsent'
            }
        },
        expectedStatus: 200,
        expectedContent: {
            access_token: { type: 'text' },
            // access_token: { type: 'number' },
            expires_in: { type: 'number' },
            token_type: { type: 'enum', values: ['Basic', 'Bearer', 'JWT'] }
        },
        storeResponse: {
            accessToken: 'access_token'
        }
    }
    // getAccountConsents: {
    //     path: '/accounts/d0ad73f0-1454-4916-8904-7ca824b5a4be/consents',
    //     method: 'GET',
    //     tags: ['accounts', 'consents'],
    //     config: {
    //         vus: 10,
    //         duration: '30s',
    //         target: 100
    //     },
    //     headers: {
    //         Authorization: '${stored.accessToken}',
    //         'o3-consent-id': 'MQ==',
    //         'o3-psu-identifier': 'eyJ1c2VySWQiOiIxMDAwOTYwOCJ9',
    //         'o3-api-uri': 'MQ==',
    //         'o3-caller-interaction-id': 'MQ==',
    //         'o3-api-operation': 'MQ==',
    //         'o3-caller-software-statement-id': 'MQ==',
    //         'o3-caller-client-id': 'MQ==',
    //         'o3-aspsp-id': 'MQ==',
    //         'o3-caller-org-id': 'MQ==',
    //         'o3-provider-id': 'MQ==',
    //         'o3-ozone-interaction-id': 'MQ=='
    //     },
    //     expectedStatus: 200,
    //     expectedResponseTime: 500,
    //     expectedContent: {
    //         id: { type: 'uuid' }
    //     }
    // }
}
