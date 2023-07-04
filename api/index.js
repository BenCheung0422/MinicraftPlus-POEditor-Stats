// @ts-check
import {
    CustomError,
    MissingParamError,
    renderError,
    CONSTANTS,
    checkResponse
} from "../src/utils.js";
import {Project, Language, renderStatsCard } from "../src/metadata.js";
import fetch from "node-fetch";

/**
 * @param {import("@vercel/node").VercelRequest} req
 * @param {import("@vercel/node").VercelResponse} res
 */
export default async (req, res) => {
    const {api_token, id} = req.query;
    res.setHeader("Content-Type", "image/svg+xml");
    try {
        if (!api_token) throw new MissingParamError(["api_token"]);
        if (!id) throw new MissingParamError(["id"]);
        res.setHeader(
            "Cache-Control",
            `max-age=${
                CONSTANTS.FOUR_HOURS / 2
            }, s-maxage=${CONSTANTS.FOUR_HOURS}, stale-while-revalidate=${CONSTANTS.ONE_DAY}`,
        );

        // Documentation: https://poeditor.com/docs/api#projects_view
        /** @type any */
        const apiResponse = await fetch("https://api.poeditor.com/v2/projects/view",
            {method: "POST", body: `api_token=${api_token}&id=${id}`, headers: {"Content-Type": "application/x-www-form-urlencoded"}
        }).then(a => a.json()).catch(e => {throw new CustomError(e.message, e.secondaryMessage || CustomError.POEDITOR_ERROR);});
        checkResponse(apiResponse.response)
        const project = new Project(apiResponse.result.project);

        // Documentation: https://poeditor.com/docs/api#languages_list
        /** @type any */
        const langResponse = await fetch("https://api.poeditor.com/v2/languages/list",
            {method: "POST", body: `api_token=${api_token}&id=${id}`, headers: {"Content-Type": "application/x-www-form-urlencoded"}
        }).then(a => a.json()).catch(e => {throw new CustomError(e.message, e.secondaryMessage || CustomError.POEDITOR_ERROR);});
        checkResponse(langResponse.response)
        /** @type {Language[]} */
        const languages = [];
        for (let i = 0; i < langResponse.result.languages.length; i++) {
            languages.push(new Language(langResponse.result.languages[i]));
        }
        
        return res.send(renderStatsCard(project, languages));
    } catch (e) {
        res.setHeader("Cache-Control", `no-cache, no-store, must-revalidate`); // Don't cache error responses.
        return res.send(renderError(e.message, e.secondaryMessage));
    }
}
