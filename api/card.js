// @ts-check
import {
    CustomError,
    MissingParamError,
    renderError
} from "../src/utils.js";
import fetch from "node-fetch";

/**
 * @param {import("@vercel/node").VercelRequest} req
 * @param {import("@vercel/node").VercelResponse} res
 */
export default async (req, res) => {
    res.setHeader("Content-Type", "image/svg+xml");
    try {
        if (!req.headers.host) {
            // res.setHeader("Content-Type", "application/json").status(400).send("{\"error\":\"A host header is missing.\"}");
            throw new CustomError("A host header is missing in request.", "400: Bad request");
        }
    
        const apiResponse = await fetch(new URL(`/api?api_token=${process.env.POEDITOR_API_TOKEN}&id=${process.env.POEDITOR_PROJECT_ID}`, 
            (req.headers['x-forwarded-proto'] || "http") + "://" + req.headers.host));
        apiResponse.headers.forEach((value, name) => {
            if (name == "Cache-Control" || name == "max-age" || name == "s-maxage" || name == "stale-while-revalidate")
                res.setHeader(name, value);
        }); // Redirect headers
        apiResponse.text().then(t => res.send(t)); // Redirect body
    } catch (e) {
        res.setHeader("Cache-Control", `no-cache, no-store, must-revalidate`); // Do not cache error responses.
        res.send(renderError(e.message, e.secondaryMessage));
    }
}
