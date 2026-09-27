const { evaluate } = require("mathjs");

function calculate(expression) {
  if (!expression || typeof expression !== "string") {
    throw new Error("Expression is required.");
  }

  if (expression.length > 200) {
    throw new Error(
      "Expression is too long."
    );
  }

  const result = evaluate(expression);

  if (
    typeof result !== "number" ||
    !Number.isFinite(result)
  ) {
    throw new Error(
      "The expression did not produce a valid number."
    );
  }

  return {
    expression,
    result,
  };
}

module.exports = {
  calculate,
};