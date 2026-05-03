const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const RULESET_DIR = path.join(ROOT, ".github", "rulesets");
const REQUIRED_RULES = [
  "deletion",
  "non_fast_forward",
  "required_linear_history",
  "pull_request",
  "required_status_checks",
];

const errors = [];

if (!fs.existsSync(RULESET_DIR)) {
  errors.push(".github/rulesets does not exist.");
} else {
  const files = fs.readdirSync(RULESET_DIR).filter(file => file.endsWith(".json"));
  if (!files.length) errors.push(".github/rulesets has no JSON rulesets.");

  for (const file of files) {
    validateRuleset(file, path.join(RULESET_DIR, file));
  }
}

if (errors.length) {
  console.error("Ruleset check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Ruleset check passed.");

function validateRuleset(file, filePath) {
  let ruleset;
  try {
    ruleset = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`${file} is not valid JSON: ${error.message}`);
    return;
  }

  if (!ruleset.name) errors.push(`${file} is missing name.`);
  if (ruleset.target !== "branch") errors.push(`${file} must target branch.`);
  if (!["active", "evaluate", "disabled"].includes(ruleset.enforcement)) {
    errors.push(`${file} has invalid enforcement: ${ruleset.enforcement}`);
  }

  const include = ruleset.conditions?.ref_name?.include || [];
  if (!include.includes("~DEFAULT_BRANCH")) {
    errors.push(`${file} must include ~DEFAULT_BRANCH.`);
  }

  const ruleTypes = new Set((ruleset.rules || []).map(rule => rule.type));
  for (const rule of REQUIRED_RULES) {
    if (!ruleTypes.has(rule)) errors.push(`${file} is missing ${rule} rule.`);
  }

  const statusRule = (ruleset.rules || []).find(rule => rule.type === "required_status_checks");
  const checks = statusRule?.parameters?.required_status_checks || [];
  if (!checks.some(check => check.context === "e2e")) {
    errors.push(`${file} must require the e2e status check.`);
  }
}
