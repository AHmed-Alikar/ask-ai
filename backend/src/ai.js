const {
  InferenceClient,
} = require("@huggingface/inference");

const {
  toolDefinitions,
  executeTool,
} = require("./tools");


if (!process.env.HF_TOKEN) {
  throw new Error(
    "HF_TOKEN is missing from .env"
  );
}


const hf = new InferenceClient(
  process.env.HF_TOKEN
);


const MODEL =
  "openai/gpt-oss-120b:cheapest";


const SYSTEM_PROMPT = `
You are Ask AI, a helpful and intelligent AI assistant.

Answer users clearly, naturally, and accurately.

You have access to tools.

Use a tool when the user's question requires:
- current weather
- mathematical calculations
- current local time
- currency conversion
- factual information that can be searched on Wikipedia

Do not use a tool when it is unnecessary.

For normal knowledge questions, answer directly.

Do not pretend that tool data is current if a tool failed.

If a tool fails, clearly explain that the requested information could not be retrieved.

Formatting rules:
- Use normal paragraphs for normal questions.
- Use bullet points for lists.
- Use numbered lists for procedures.
- Use tables only when they genuinely improve understanding.
- Do not use HTML tags.
- Use Markdown.
- Do not create a table for every answer.
`;


/*
========================================
FIRST PASS
========================================

Ask the LLM:

"Do you need a tool?"
*/

async function decideTool(messages) {

  const response =
    await hf.chatCompletion({

      model: MODEL,

      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },

        ...messages,
      ],

      tools: toolDefinitions,

      tool_choice: "auto",
    });


  return response.choices[0].message;
}


/*
========================================
FINAL STREAM
========================================
*/

function streamFinalAnswer(messages) {

  return hf.chatCompletionStream({

    model: MODEL,

    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },

      ...messages,
    ],

  });
}


/*
========================================
MAIN AI FUNCTION
========================================
*/

async function streamAI(messages) {

  /*
    STEP 1:
    Ask LLM whether a tool is needed.
  */

  const assistantMessage =
    await decideTool(messages);


  /*
    STEP 2:
    No tool needed.
  */

  if (
    !assistantMessage.tool_calls ||
    assistantMessage.tool_calls.length === 0
  ) {

    /*
      We make a second streaming request
      so the frontend keeps its streaming UX.
    */

    return streamFinalAnswer(messages);
  }


  /*
    STEP 3:
    Add the assistant tool-call message.
  */

  const toolMessages = [
    ...messages,
    assistantMessage,
  ];


  /*
    STEP 4:
    Execute every requested tool.
  */

  for (
    const toolCall
    of assistantMessage.tool_calls
  ) {

    const toolName =
      toolCall.function.name;


    let argumentsObject;


    try {

      argumentsObject =
        JSON.parse(
          toolCall.function.arguments
        );

    } catch (error) {

      toolMessages.push({

        role: "tool",

        tool_call_id:
          toolCall.id,

        name: toolName,

        content: JSON.stringify({
          error:
            "Invalid tool arguments.",
        }),
      });

      continue;
    }


    try {

      const result =
        await executeTool(
          toolName,
          argumentsObject
        );


      toolMessages.push({

        role: "tool",

        tool_call_id:
          toolCall.id,

        name: toolName,

        content:
          JSON.stringify(result),
      });


    } catch (error) {

      console.error(
        `Tool ${toolName} failed:`,
        error
      );


      toolMessages.push({

        role: "tool",

        tool_call_id:
          toolCall.id,

        name: toolName,

        content: JSON.stringify({
          error:
            error.message ||
            "Tool execution failed.",
        }),
      });
    }
  }


  /*
    STEP 5:
    Give tool results back to LLM.

    The LLM now writes the final answer.
  */

  return streamFinalAnswer(
    toolMessages
  );
}


module.exports = {
  streamAI,
};