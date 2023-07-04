// @ts-check
import {
    CustomError
} from "../src/utils.js";
import fetch from "node-fetch";

/**
 * @param {import("@vercel/node").VercelRequest} req
 * @param {import("@vercel/node").VercelResponse} res
 */
export default async (req, res) => {
    res.setHeader("Content-Type", "application/json")
    try {
        // Documentation: https://poeditor.com/docs/api#languages_list
        await fetch("https://api.poeditor.com/v2/languages/list",
            {method: "POST", body: `api_token=${process.env.POEDITOR_API_TOKEN}&id=${process.env.POEDITOR_PROJECT_ID}`, headers: {"Content-Type": "application/x-www-form-urlencoded"}
        }).then(a => a.json()).then(t => res.send(t)) // Redirect body
        .catch(e => {throw new CustomError(e.message, e.secondaryMessage || CustomError.POEDITOR_ERROR);});
    } catch (e) {
        res.status(500).send(`{\"error\":\"${e.message}\",\"message\":\"${e.secondaryMessage}\"}`);
    }
}
