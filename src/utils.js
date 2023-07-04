// @ts-check

import wordwrap from "wordwrapjs";

import { ERROR_CARD_LENGTH,
  renderError,
  encodeHTML,
  isValidHexColor,
  isValidGradient,
  fallbackColor,
  flexLayout,
  getCardColors,
  CONSTANTS,
  CustomError,
  MissingParamError,
  measureText,
  checkResponse
} from "./utils-base.js";

/**
 * Split text over multiple lines based on the card width.
 *
 * @param {string} text Text to split.
 * @param {number} width Line width in number of characters.
 * @param {number} maxLines Maximum number of lines.
 * @returns {string[]} Array of lines.
 */
const wrapTextMultiline = (text, width = 59, maxLines = 3) => {
  const fullWidthComma = "，";
  const encoded = encodeHTML(text);
  const isChinese = encoded.includes(fullWidthComma);

  let wrapped = [];

  if (isChinese) {
    wrapped = encoded.split(fullWidthComma); // Chinese full punctuation
  } else {
    wrapped = wordwrap.wrap(encoded, {
      width,
    }).split("\n"); // Split wrapped lines to get an array of lines
  }

  const lines = wrapped.map((line) => line.trim()).slice(0, maxLines); // Only consider maxLines lines

  // Add "..." to the last line if the text exceeds maxLines
  if (wrapped.length > maxLines) {
    lines[maxLines - 1] += "...";
  }

  // Remove empty lines if text fits in less than maxLines lines
  const multiLineText = lines.filter(Boolean);
  return multiLineText;
};

export {
  ERROR_CARD_LENGTH,
  renderError,
  encodeHTML,
  isValidHexColor,
  isValidGradient,
  fallbackColor,
  flexLayout,
  getCardColors,
  wrapTextMultiline,
  CONSTANTS,
  CustomError,
  MissingParamError,
  measureText,
  checkResponse
}
