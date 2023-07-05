// @ts-check
// This file only includes functions without uses of node modules.

import themes from "../themes/index.js";

// Script parameters.
const ERROR_CARD_LENGTH = 576.5;


/**
 * Renders error message on the card.
 *
 * @param {string} message Main error message.
 * @param {string} secondaryMessage The secondary error message.
 * @returns {string} The SVG markup.
*/
const renderError = (message, secondaryMessage = "") => {
  return `
    <svg width="${ERROR_CARD_LENGTH}" height="120" viewBox="0 0 ${ERROR_CARD_LENGTH} 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        .text { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: #2F80ED }
        .small { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #252525 }
        .gray { fill: #858585 }
      </style>

      <rect x="0.5" y="0.5" width="${
        ERROR_CARD_LENGTH - 1
      }" height="99%" rx="4.5" fill="#FFFEFE" stroke="#E4E2E2"/>

      <text x="25" y="45" class="text">ERROR</text>
      <text data-testid="message" x="25" y="55" class="text small">
        <tspan x="25" dy="18">${encodeHTML(message)}</tspan>
        <tspan x="25" dy="18" class="gray">${secondaryMessage}</tspan>
      </text>
    </svg>
  `;
};
  
/**
 * Encode string as HTML.
 *
 * @see https://stackoverflow.com/a/48073476/10629172
 *
 * @param {string} str String to encode.
 * @returns {string} Encoded string.
 */
const encodeHTML = (str) => {
  return str
  .replace(/[\u00A0-\u9999<>&](?!#)/gim, (i) => {
    return "&#" + i.charCodeAt(0) + ";";
  })
  .replace(/\u0008/gim, "");
};
    
const CONSTANTS = {
  THIRTY_MINUTES: 1800,
  TWO_HOURS: 7200,
  FOUR_HOURS: 14400,
  ONE_DAY: 86400,
};

const SECONDARY_ERROR_MESSAGES = {
  POEDITOR_ERROR: "Please try again later",
};

/**
 * Custom error class to handle custom GRS errors.
 */
class CustomError extends Error {
  /**
   * @param {string} message Error message.
   * @param {string} type Error type.
   */
  constructor(message, type) {
    super(message);
    this.type = type;
    this.secondaryMessage = SECONDARY_ERROR_MESSAGES[type] || type;
  }

  static POEDITOR_ERROR = "POEDITOR_ERROR";
}

/**
 * Missing query parameter class.
 */
class MissingParamError extends Error {
    /**
     * @param {string[]} missedParams
     * @param {string?=} secondaryMessage
     */
    constructor(missedParams, secondaryMessage) {
      const msg = `Missing params ${missedParams
        .map((p) => `"${p}"`)
        .join(", ")} make sure you pass the parameters in URL`;
      super(msg);
      this.missedParams = missedParams;
      this.secondaryMessage = secondaryMessage;
    }
}

/**
 * Retrieve text length.
 *
 * @see https://stackoverflow.com/a/48172630/10629172
 * @param {string} str String to measure.
 * @param {number} fontSize Font size.
 * @returns {number} Text length.
 */
const measureText = (str, fontSize = 10) => {
    // prettier-ignore
    const widths = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0.2796875, 0.2765625,
      0.3546875, 0.5546875, 0.5546875, 0.8890625, 0.665625, 0.190625,
      0.3328125, 0.3328125, 0.3890625, 0.5828125, 0.2765625, 0.3328125,
      0.2765625, 0.3015625, 0.5546875, 0.5546875, 0.5546875, 0.5546875,
      0.5546875, 0.5546875, 0.5546875, 0.5546875, 0.5546875, 0.5546875,
      0.2765625, 0.2765625, 0.584375, 0.5828125, 0.584375, 0.5546875,
      1.0140625, 0.665625, 0.665625, 0.721875, 0.721875, 0.665625,
      0.609375, 0.7765625, 0.721875, 0.2765625, 0.5, 0.665625,
      0.5546875, 0.8328125, 0.721875, 0.7765625, 0.665625, 0.7765625,
      0.721875, 0.665625, 0.609375, 0.721875, 0.665625, 0.94375,
      0.665625, 0.665625, 0.609375, 0.2765625, 0.3546875, 0.2765625,
      0.4765625, 0.5546875, 0.3328125, 0.5546875, 0.5546875, 0.5,
      0.5546875, 0.5546875, 0.2765625, 0.5546875, 0.5546875, 0.221875,
      0.240625, 0.5, 0.221875, 0.8328125, 0.5546875, 0.5546875,
      0.5546875, 0.5546875, 0.3328125, 0.5, 0.2765625, 0.5546875,
      0.5, 0.721875, 0.5, 0.5, 0.5, 0.3546875, 0.259375, 0.353125, 0.5890625,
    ];
  
    const avg = 0.5279276315789471;
    return (
      str
        .split("")
        .map((c) =>
          c.charCodeAt(0) < widths.length ? widths[c.charCodeAt(0)] : avg,
        )
        .reduce((cur, acc) => acc + cur) * fontSize
    );
};

/**
 * Auto layout utility, allows us to layout things vertically or horizontally with
 * proper gaping.
 *
 * @param {object} props Function properties.
 * @param {string[]} props.items Array of items to layout.
 * @param {number} props.gap Gap between items.
 * @param {number[]} [props.sizes=[]] Array of sizes for each item.
 * @param {"column" | "row"} [props.direction] Direction to layout items.
 * @returns {string[]} Array of items with proper layout.
 */
const flexLayout = ({ items, gap, direction, sizes = [] }) => {
  let lastSize = 0;
  // filter() for filtering out empty strings
  return items.filter(Boolean).map((item, i) => {
    const size = sizes[i] || 0;
    let transform = `translate(${lastSize}, 0)`;
    if (direction === "column") {
      transform = `translate(0, ${lastSize})`;
    }
    lastSize += size + gap;
    return `<g transform="${transform}">${item}</g>`;
  });
};


/**
 * Checks if a string is a valid hex color.
 *
 * @param {string} hexColor String to check.
 * @returns {boolean} True if the given string is a valid hex color.
 */
const isValidHexColor = (hexColor) => {
  return new RegExp(
    /^([A-Fa-f0-9]{8}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{4})$/,
  ).test(hexColor);
};

/**
 * Check if the given string is a valid gradient.
 *
 * @param {string[]} colors Array of colors.
 * @returns {boolean} True if the given string is a valid gradient.
 */
const isValidGradient = (colors) => {
  return isValidHexColor(colors[1]) && isValidHexColor(colors[2]);
};

/**
 * Retrieves a gradient if color has more than one valid hex codes else a single color.
 *
 * @param {string} color The color to parse.
 * @param {string} fallbackColor The fallback color.
 * @returns {string} The gradient or color.
 */
const fallbackColor = (color, fallbackColor) => {
  let gradient = null;

  let colors = color ? color.split(",") : [];
  if (colors.length > 1 && isValidGradient(colors)) {
    gradient = colors;
  }

  // return ( Unused feature
  //   (gradient ? gradient : isValidHexColor(color) && `#${color}`) ||
  //   fallbackColor
  // );
  return fallbackColor
};

/**
 * Returns theme based colors with proper overrides and defaults.
 *
 * @param {Object} args Function arguments.
 * @param {string} args.title_color Card title color.
 * @param {string} args.text_color Card text color.
 * @param {string} args.bg_color Card background color.
 * @param {string} args.border_color Card border color.
 * @param {string} args.ring_color Card ring color.
 * @param {string} args.theme Card theme.
 * @param {string} [args.fallbackTheme="default"] Fallback theme.
 */
const getCardColors = ({
  title_color,
  text_color,
  bg_color,
  border_color,
  ring_color,
  theme,
  fallbackTheme = "default",
}) => {
  /** @type {typeof themes[keyof themes]} */
  const defaultTheme = themes[fallbackTheme];
  /** @type {typeof defaultTheme} */
  const selectedTheme = themes[theme] || defaultTheme;
  const defaultBorderColor =
    selectedTheme.border_color || defaultTheme.border_color;

  // get the color provided by the user else the theme color
  // finally if both colors are invalid fallback to default theme
  /** @type {string} */
  const titleColor = fallbackColor(
    title_color || selectedTheme.title_color,
    "#" + defaultTheme.title_color,
  );

  // get the color provided by the user else the theme color
  // finally if both colors are invalid we use the titleColor
  /** @type {string} */
  const ringColor = fallbackColor(
    ring_color || selectedTheme.ring_color,
    titleColor,
  );
  /** @type {string} */
  const textColor = fallbackColor(
    text_color || selectedTheme.text_color,
    "#" + defaultTheme.text_color,
  );
  /** @type {string} */
  const bgColor = fallbackColor(
    bg_color || selectedTheme.bg_color,
    "#" + defaultTheme.bg_color,
  );

  /** @type {string} */
  const borderColor = fallbackColor(
    border_color || defaultBorderColor,
    "#" + defaultBorderColor,
  );

  return { titleColor, textColor, bgColor, borderColor, ringColor };
};

/**
 * Checking if the response success, an error is thrown if the response does not success.
 * @param {{[k in "status"|"code"|"message"]: string}?=} response The response object from the POEditor API.
 */
const checkResponse = response => {
  // Success
  // "response": {
  //  "status": "success",
  //  "code": "200",
  //  "message": "OK"
  // }
  
  // Fail (Details: https://poeditor.com/docs/error_codes)
  // "response": {
  //  "status": "fail",
  //  "code": "<error code>",
  //  "message": "<error message>"
  // }

  if (response == null || response == undefined)
    throw new CustomError("Unable to access POEditor API", CustomError.POEDITOR_ERROR);
  if (response.status !== "success")
    throw new CustomError("POEditor API Request Failure: " + response.code, response.message);
}

/**
 * Checking if the response success, an error is thrown if the response does not success.
 * @param {{response?: Parameters<typeof checkResponse>[0], error?: string, message?: string}?=} response The response object from the internal server API bridge to the POEditor API.
 */
const checkInternalResponse = response => {
  if (response == null || response == undefined)
    throw new CustomError("Internal Server Error", "Bad response");
  else if (response.error !== undefined)
    throw new CustomError(response.error || "Error", response.message || "Error");
  // Assume the remaining responses are reponses from the POEditor API.
  checkResponse(response.response);
}

/**
 * Source: https://stackoverflow.com/a/69122877
 * @param {string | number | Date} input
 */
function timeAgo(input) {
  const date = (input instanceof Date) ? input : new Date(input);
  const formatter = new Intl.RelativeTimeFormat('en');
  /** @type {Partial<Record<Intl.RelativeTimeFormatUnit, number>>} */
  const ranges = {
    years: 3600 * 24 * 365,
    months: 3600 * 24 * 30,
    weeks: 3600 * 24 * 7,
    days: 3600 * 24,
    hours: 3600,
    minutes: 60,
    seconds: 1
  };
  const secondsElapsed = (date.getTime() - Date.now()) / 1000;
  for (const /** @type {Intl.RelativeTimeFormatUnit} */ key in ranges) {
    if (ranges[key] < Math.abs(secondsElapsed)) {
      const delta = secondsElapsed / ranges[key];
      // @ts-expect-error
      return formatter.format(Math.round(delta), key);
    }
  }
}

export {
  ERROR_CARD_LENGTH,
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
  checkResponse,
  checkInternalResponse,
  timeAgo
}
