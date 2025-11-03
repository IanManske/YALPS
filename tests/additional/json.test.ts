import { solve } from "../../src/index.js"
import { validSolution } from "../helpers/validate.js"
import { readCases, largeCases, TestCase } from "../helpers/read.js"
import { test, expect } from "vitest"

const testData: readonly TestCase[] = readCases(largeCases)

test("Validate additional test case solutions", () => {
  for (const data of testData) {
    const solution = solve(data.model, data.options)
    expect(validSolution(solution, data.expected.result, data.model, data.options))
  }
})
