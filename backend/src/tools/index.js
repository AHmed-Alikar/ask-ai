const {
  getWeather,
} = require("./weather");

const {
  calculate,
} = require("./calculator");

const {
  getTime,
} = require("./time");

const {
  convertCurrency,
} = require("./currency");

const {
  searchWikipedia,
} = require("./wikipedia");


/*
========================================
TOOL DEFINITIONS
========================================
*/

const toolDefinitions = [
  {
    type: "function",

    function: {
      name: "get_weather",

      description:
        "Get the current weather for a city or location.",

      parameters: {
        type: "object",

        properties: {
          location: {
            type: "string",
            description:
              "City or location name.",
          },
        },

        required: ["location"],
      },
    },
  },

  {
    type: "function",

    function: {
      name: "calculate",

      description:
        "Perform a mathematical calculation.",

      parameters: {
        type: "object",

        properties: {
          expression: {
            type: "string",
            description:
              "Mathematical expression such as 25 * 40 or (100 + 50) / 2.",
          },
        },

        required: ["expression"],
      },
    },
  },

  {
    type: "function",

    function: {
      name: "get_time",

      description:
        "Get the current local time for a city or location.",

      parameters: {
        type: "object",

        properties: {
          location: {
            type: "string",
            description:
              "City or location name.",
          },
        },

        required: ["location"],
      },
    },
  },

  {
    type: "function",

    function: {
      name: "convert_currency",

      description:
        "Convert an amount from one currency to another using the latest available exchange rate.",

      parameters: {
        type: "object",

        properties: {
          amount: {
            type: "number",
            description:
              "Amount of money to convert.",
          },

          from: {
            type: "string",
            description:
              "Source currency code such as USD, EUR, or GBP.",
          },

          to: {
            type: "string",
            description:
              "Target currency code such as USD, EUR, or GBP.",
          },
        },

        required: [
          "amount",
          "from",
          "to",
        ],
      },
    },
  },

  {
    type: "function",

    function: {
      name: "search_wikipedia",

      description:
        "Search Wikipedia for factual information about a person, place, organization, event, concept, or other topic.",

      parameters: {
        type: "object",

        properties: {
          query: {
            type: "string",
            description:
              "Topic to search for on Wikipedia.",
          },
        },

        required: ["query"],
      },
    },
  },
];


/*
========================================
TOOL EXECUTOR
========================================
*/

async function executeTool(
  toolName,
  argumentsObject
) {
  switch (toolName) {

    case "get_weather":
      return await getWeather(
        argumentsObject.location
      );


    case "calculate":
      return calculate(
        argumentsObject.expression
      );


    case "get_time":
      return await getTime(
        argumentsObject.location
      );


    case "convert_currency":
      return await convertCurrency(
        argumentsObject.amount,
        argumentsObject.from,
        argumentsObject.to
      );


    case "search_wikipedia":
      return await searchWikipedia(
        argumentsObject.query
      );


    default:
      throw new Error(
        `Unknown tool: ${toolName}`
      );
  }
}


module.exports = {
  toolDefinitions,
  executeTool,
};