import { solve } from "../../src/index.js"
import { validSolution } from "../helpers/validate.js"
import { TestCase, convertBenchmarks } from "../helpers/read.js"
import { readBenchmarks } from "../../benchmarks/netlib/read.js"
import { test, expect } from "vitest"

const testData: readonly TestCase[] = convertBenchmarks(readBenchmarks())

test("Validate netlib solutions", () => {
  for (const data of testData) {
    const solution = solve(data.model, data.options)
    expect(validSolution(solution, data.expected.result, data.model, data.options))
  }
})
