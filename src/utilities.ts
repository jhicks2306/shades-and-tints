import {framer, CanvasNode, AnyNode } from "framer-plugin";

/**
 * Converts an RGB color value to HSL (Hue, Saturation, Lightness) with an optional alpha channel.
 * 
 * The input values for red, green, and blue are expected to be in the range of 0 to 255. 
 * The resulting hue will be in the range [0, 360], while saturation and lightness will be in the range [0, 100].
 * The alpha value is optional and defaults to 1 (opaque).
 *
 * @param {number} r - The red color value (0-255).
 * @param {number} g - The green color value (0-255).
 * @param {number} b - The blue color value (0-255).
 * @param {number} [a=1] - The alpha (opacity) value, defaults to 1 if not provided.
 * @returns {[number, number, number, number]} - An array containing the HSL representation: 
 *   - `hue` in degrees (0-360)
 *   - `saturation` as a percentage (0-100)
 *   - `lightness` as a percentage (0-100)
 *   - `alpha` as a float (0-1)
 *
 * @example
 * rgbToHsl(255, 0, 0); // [0, 100, 50, 1]
 * rgbToHsl(0, 255, 0, 0.5); // [120, 100, 50, 0.5]
 */
function rgbToHsl(r: number, g: number, b: number, a: number = 1): [number, number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  // Calculate lightness
  const l = (max + min) / 2;

  // Initialize hue and saturation
  let h = 0, s = 0;

  // Calculate saturation
  if (delta !== 0) {
      s = (l > 0.5) ? (delta / (2 - max - min)) : (delta / (max + min));

      // Calculate hue
      switch (max) {
          case r:
              h = (g - b) / delta + (g < b ? 6 : 0);
              break;
          case g:
              h = (b - r) / delta + 2;
              break;
          case b:
              h = (r - g) / delta + 4;
              break;
      }
      h /= 6; // Normalize hue to [0, 1]
  }

  return [h * 360, s * 100, l * 100, a]; // Return HSL as [hue, saturation, lightness, alpha]
}

/**
 * Converts an HSL (Hue, Saturation, Lightness) color value to an RGB (Red, Green, Blue) string with an optional alpha channel.
 * 
 * The hue is expected to be in degrees [0, 360], while saturation and lightness are percentages [0, 100]. 
 * The alpha value is optional and defaults to 1 (fully opaque).
 *
 * @param {number} h - The hue of the color (0-360).
 * @param {number} s - The saturation of the color (0-100).
 * @param {number} l - The lightness of the color (0-100).
 * @param {number} [a=1] - The alpha (opacity) value, defaults to 1 if not provided.
 * @returns {string} - An RGBA string representation of the color, formatted as `rgba(r, g, b, a)`.
 *
 * @example
 * hslToRgb(0, 100, 50); // "rgba(255, 0, 0, 1)"
 * hslToRgb(120, 100, 50, 0.5); // "rgba(0, 255, 0, 0.5)"
 */
function hslToRgb(h: number, s: number, l: number, a: number = 1): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lNorm - c / 2;

  let r = 0, g = 0, b = 0;

  if (h < 60) {
      [r, g, b] = [c, x, 0];
  } else if (h < 120) {
      [r, g, b] = [x, c, 0];
  } else if (h < 180) {
      [r, g, b] = [0, c, x];
  } else if (h < 240) {
      [r, g, b] = [0, x, c];
  } else if (h < 300) {
      [r, g, b] = [x, 0, c];
  } else {
      [r, g, b] = [c, 0, x];
  }

  // Adjust RGB values based on the lightness calculation
  const rgb = [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];

  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`; // Return as RGBA
}


/**
 * Extracts the RGBA values from a color string or returns a default value if the string is null or not in a valid format.
 * 
 * If the color string is 'white', it returns the RGBA values for white (255, 255, 255, 1).
 * For other valid RGBA or RGB strings, it parses the string and returns the corresponding RGBA values.
 * If parsing fails or the input is null, it defaults to returning black (0, 0, 0, 1).
 *
 * @param {string | null} color - The color string in RGBA or RGB format, or null.
 * @returns {[number, number, number, number]} - An array containing the RGBA values:
 *   - Red (0-255)
 *   - Green (0-255)
 *   - Blue (0-255)
 *   - Alpha (0-1)
 *
 * @example
 * extractRGBA('rgba(255, 0, 0, 0.5)'); // [255, 0, 0, 0.5]
 * extractRGBA('rgb(0, 255, 0)'); // [0, 255, 0, 1]
 * extractRGBA('white'); // [255, 255, 255, 1]
 * extractRGBA(null); // [0, 0, 0, 1]
 */
function extractRGBA(color: string | null ): [number, number, number, number] {
  
  if (color == 'white') {
    return [255, 255, 255, 1]
  }
  
  const rgbaMatch = color?.match(/rgba?\s*\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\s*\)/);

  if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1], 10);
      const g = parseInt(rgbaMatch[2], 10);
      const b = parseInt(rgbaMatch[3], 10);
      const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1; // Default alpha to 1 if not provided
      return [r, g, b, a];
  }
  console.error('Failed to parse the selected color correctly.')
  return [0, 0, 0, 1]; // Default to black with full opacity if parsing fails
}

/**
 * Generates an array of shades for a given color by darkening its lightness in HSL space.
 * 
 * The function extracts the RGBA values from the input color string, converts them to HSL, 
 * and then calculates the specified number of shades by reducing the lightness while keeping the 
 * hue and saturation constant. The alpha value is preserved in the resulting shades.
 *
 * @param {string} selectedColor - The color string in RGBA or RGB format from which to generate shades.
 * @param {number} numberOfShades - The number of shades to generate.
 * @returns {string[]} - An array of RGB color strings representing the generated shades.
 *
 * @example
 * calculateShades('rgba(255, 0, 0, 1)', 5); // Generates 5 shades of red.
 * calculateShades('rgb(0, 255, 0)', 3); // Generates 3 shades of green.
 */
function calculateShades(selectedColor: string, numberOfShades: number): string[] {
    // Extract RGBA values from the input string
    const rgba = extractRGBA(selectedColor)

    // Convert RGB to HSL and extract the alpha value
    const [h, s, l, a] = rgbToHsl(rgba[0], rgba[1], rgba[2], rgba[3]);

    const shades: string[] = [];

      // Default to darkening steps of 10%
      let lightnessStep: number = 10

      if (l === 0) {
        // Already black so no step.
        lightnessStep = 0
      } else if (numberOfShades*lightnessStep > l) {
        // Divide remaining lightness range between the shades.
        lightnessStep = l / numberOfShades
      }


    // Calculate shades by decreasing lightness
    for (let i = 0; i < numberOfShades; i++) {
        const newLightness = Math.max(0, l - ((i + 1) * lightnessStep)); // Decrease lightness
        shades.push(hslToRgb(h, s, newLightness, a)); // Maintain alpha
    }

    return shades.reverse(); // Reverse the order of shades
}


/**
 * Generates an array of tints for a given color by lightening its lightness in HSL space.
 * 
 * The function extracts the RGBA values from the input color string, converts them to HSL, 
 * and then calculates the specified number of tints by increasing the lightness while keeping 
 * the hue and saturation constant. The alpha value is preserved in the resulting tints.
 *
 * @param {string} selectedColor - The color string in RGBA or RGB format from which to generate tints.
 * @param {number} numberOfTints - The number of tints to generate.
 * @returns {string[]} - An array of RGB color strings representing the generated tints.
 *
 * @example
 * calculateTints('rgba(0, 0, 255, 1)', 5); // Generates 5 tints of blue.
 * calculateTints('rgb(255, 0, 0)', 3); // Generates 3 tints of red.
 */
function calculateTints(selectedColor: string, numberOfTints: number): string[] {
  // Extract RGBA values from the input string
  const rgba = extractRGBA(selectedColor)
  
  // Convert RGB to HSL and extract the alpha value.
  const [h, s, l, a] = rgbToHsl(rgba[0], rgba[1], rgba[2], rgba[3]);
  
  // Take lightening steps of 10%
  let lightnessStep: number = 10

  if (l === 100) {
    // Already white so no step.
    lightnessStep = 0
  } else if (numberOfTints*lightnessStep > (100-l)) {
    // Divide remaining lightness range between the tints.
    lightnessStep = (100 - l) / numberOfTints
  }
    
  const tints: string[] = [];

  // Calculate tints by increasing lightness.
  for (let i = 0; i < numberOfTints; i++) {
      const newLightness = Math.min(100, l + ((i + 1) * lightnessStep)); // Increase lightness
      tints.push(hslToRgb(h, s, newLightness, a)); // Maintain alpha
  }

  return tints;
}

/**
 * Calculates the absolute position (X and Y coordinates) of a given node within the canvas.
 * 
 * This function traverses up the node tree from the first node to the root node, accumulating
 * the X and Y position of each node along the way. If the parent node is not found or the
 * rectangle for a node cannot be retrieved, it logs an error and returns the current position.
 *
 * @param {CanvasNode} node - The node for which to calculate the absolute position.
 * @returns {Promise<{ x: number, y: number }>} - A promise that resolves to an object containing:
 *   - x {number} - The absolute X coordinate of the node.
 *   - y {number} - The absolute Y coordinate of the node.
 *
 * @example
 * const position = await getAbsolutePosition(myNode);
 * console.log(`Absolute position: x=${position.x}, y=${position.y}`);
 */
async function getAbsolutePosition(node: CanvasNode) {
  const rootNode = await framer.getCanvasRoot()
  let currentNode: AnyNode = node;
  let absoluteX = 0;
  let absoluteY = 0;

  // Traverse up the Node tree and accumulate X and Y position.
  while(currentNode.id != rootNode.id) {
    const rect = await framer.getRect(currentNode.id)

    if (!rect) {
      console.error(`Failed to get rect for node ${currentNode.id}`)
      return { x: absoluteX, y: absoluteY };
    }

    if(currentNode.id === node.id) { absoluteY += rect.height}

    absoluteX += rect.x
    absoluteY += rect.y
  
    const parentNode = await framer.getParent(currentNode.id)

    if (!parentNode) {
      console.error(`Parent not found for node ${currentNode.id}`);
      return { x: absoluteX, y: absoluteY }; // Exit if parent is null
    }
    currentNode = parentNode
  }

  return { x: absoluteX, y: absoluteY };
}

/**
 * Determines whether the provided value is a finite number.
 */
function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

export {calculateShades, calculateTints, getAbsolutePosition, isNumber}