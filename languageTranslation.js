require("dotenv").config({
    path: "./.env"
})

const { GoogleGenAI } = require("@google/genai");

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

function extractJsonFromMarkdown(markdownString) {
    const cleaned = markdownString
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    try {
        return JSON.parse(cleaned);
    } catch (err) {
        console.error("Failed to parse JSON:", err.message);
        return null;
    }
}

async function languageTranslation(userInput) {
    const prompt = `
        You're a translation and language understanding assistant.
        Input: "${userInput}"
        Translate the sentence to English and return the output as object of original-language and english_translation.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        const translation = extractJsonFromMarkdown(response.text);
        return translation
    } catch (error) {
        console.log("Gemini error:", error)
    }
}

async function mapToInputLanguage(words, original_language) {
    const splitWords = words.join(", ")

    const prompt = `
        You're a translation and language understanding assistant.
        Input: "${splitWords}"
        1. Translate the "${splitWords}" taking them one by one as comma separated to the "${original_language}" with their mapping as array of objects of english and their translation in the "${original_language}" with key as translation.
        2. Return the output as object with first key as original_language: "${original_language}" key and next key as array of word_mappings and with english and the ${original_language} as key translation.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        const translation = extractJsonFromMarkdown(response.text);
        return translation
    } catch (error) {
        console.log("Gemini error:", error)
    }
}

module.exports = {
    languageTranslation,
    mapToInputLanguage
}


/*

1. Detect if the language is English, Hindi, or Hinglish.
2. Translate it to English in a way that's most accurate for sign-language matching.
3. Return the word translated to English as user_sentence.
4. Break it down word-by-word or phrase-by-phrase for mapping.
5. Return a list with original word, detected language, and its matching English word.

Give the output as a array of objects of original-word key and english-translation value.

 */