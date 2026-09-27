async function convertCurrency(
  amount,
  from,
  to
) {
  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount)
  ) {
    throw new Error("Amount must be a valid number.");
  }

  if (!from || !to) {
    throw new Error(
      "Both source and target currencies are required."
    );
  }

  const base = from.toUpperCase();
  const quote = to.toUpperCase();

  if (base === quote) {
    return {
      amount,
      from: base,
      to: quote,
      rate: 1,
      converted_amount: amount,
    };
  }

  const url =
    `https://api.frankfurter.dev/v2/rate/` +
    `${encodeURIComponent(base)}/` +
    `${encodeURIComponent(quote)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Could not get exchange rate for ${base}/${quote}.`
    );
  }

  const data = await response.json();

  const convertedAmount =
    amount * data.rate;

  return {
    amount,
    from: base,
    to: quote,
    rate: data.rate,
    converted_amount:
      Number(convertedAmount.toFixed(2)),
    date: data.date,
  };
}

module.exports = {
  convertCurrency,
};