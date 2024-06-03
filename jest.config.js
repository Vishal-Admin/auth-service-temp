/** @type {import('ts-jest').JestConfigWithTsJest} */
// eslint-disable-next-line no-undef
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    varbose: true,
    collectCoverage: true,
    coverageProvider: "v8",
    collectCoverageFrom: ["src/**/*.ts", "!tests/**", "!**/node_modules/**"],
};
