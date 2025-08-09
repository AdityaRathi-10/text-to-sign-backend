require("dotenv").config({
    path: "./.env"
})

const express = require("express");
const cors = require("cors");
const natural = require("natural");

const { getVideosFromCloudinary } = require("./getVideos");
const { languageTranslation, mapToInputLanguage } = require("./languageTranslation")

const app = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const lexicon = new natural.Lexicon("EN", "N");
const ruleSet = new natural.RuleSet("EN");
const tagger = new natural.BrillPOSTagger(lexicon, ruleSet);

async function processText(sentence) {
    sentence = sentence.toLowerCase()
    const { original_language, english_translation } = await languageTranslation(sentence)

    const tokenizer = new natural.WordTokenizer();
    let words = tokenizer.tokenize(english_translation);

    const taggedWords = tagger.tag(words).taggedWords;
    
    let tense = {
        future: taggedWords.filter(({ tag }) => tag === 'MD').length,
        present: taggedWords.filter(({ tag }) => ['VBP', 'VBZ', 'VBG'].includes(tag)).length,
        past: taggedWords.filter(({ tag }) => ['VBD', 'VBN'].includes(tag)).length,
        present_continuous: taggedWords.filter(({ tag }) => tag === 'VBG').length,
    };

    const stopWords = new Set(["mightn't", 're', 'wasn', 'wouldn', 'be', 'has', 'that', 'does', 'shouldn', 'do', "you've", 'off', 'for', "didn't", 'm', 'ain', 'haven', "weren't", 'are', "she's", "wasn't", 'its', "haven't", "wouldn't", 'don', 'weren', 's', "you'd", "don't", 'doesn', "hadn't", 'is', 'was', "that'll", "should've", 'a', 'then', 'the', 'mustn', 'i', 'nor', 'as', "it's", "needn't", 'd', 'am', 'have', 'hasn', 'o', "aren't", "you'll", "couldn't", "you're", "mustn't", 'didn', "doesn't", 'll', 'an', 'hadn', 'whom', 'y', "hasn't", 'itself', 'couldn', 'needn', "shan't", 'isn', 'been', 'such', 'shan', "shouldn't", 'aren', 'being', 'were', 'did', 'ma', 't', 'having', 'mightn', 've', "isn't", "won't"]);

    words = words.filter(word => !stopWords.has(word)); 

    words = words.map(w => w === 'i' ? 'Me' : w);

    const probableTense = Object.keys(tense).reduce((a, b) => tense[a] > tense[b] ? a : b);
    if (probableTense === "past" && tense.past >= 1) {
        words.unshift("Before");
    } else if (probableTense === "future" && tense.future >= 1) {
        if (!words.includes("Will")) {
            words.unshift("Will");
        }
    } else if (probableTense === "present" && tense.present_continuous >= 1) {
        words.unshift("Now");
    }

    const processedData = await getVideosFromCloudinary(words)

    if(original_language != "English") {
        const output = await mapToInputLanguage(words, original_language)
        for (const item of processedData) {
            for (const conversion of output.word_mappings) {
                if(item.word?.toLowerCase() === conversion.english?.toLowerCase()) {
                    item.word = conversion.translation
                }
            }
        }
    }

    const processedText = processedData.map((url) => url.word)

    return { 
        videos: processedData,
        text: processedText,
    }
}

app.post("/get-videos", async (req, res) => {
    const { signs } = req.body;
    if (!signs) {
        return res.status(400).json({ error: "Sign is required" });
    }
    const result = await processText(signs);
    res.status(200).json(result);
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));