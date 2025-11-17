/**
 * Dynamic Variables Utility
 *
 * Handles {{variable_name}} syntax parsing and replacement
 * Compatible with ElevenLabs dynamic variables format
 */

/**
 * Extract all variable names from text
 *
 * @param text - Text containing {{var_name}} placeholders
 * @returns Array of variable names
 *
 * @example
 * extractVariables("Hello {{user_name}}, your order {{order_id}} is ready")
 * // Returns: ["user_name", "order_id"]
 */
export function extractVariables(text: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Replace variables in text with provided values
 *
 * @param text - Text containing {{var_name}} placeholders
 * @param values - Object mapping variable names to values
 * @returns Text with variables replaced
 *
 * @example
 * replaceVariables(
 *   "Hello {{user_name}}, your order {{order_id}} is ready",
 *   { user_name: "Alice", order_id: "12345" }
 * )
 * // Returns: "Hello Alice, your order 12345 is ready"
 */
export function replaceVariables(
  text: string,
  values: Record<string, any>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = values[varName];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Validate that all required variables have values
 *
 * @param text - Text containing {{var_name}} placeholders
 * @param values - Object mapping variable names to values
 * @returns Object with validation result and missing variables
 *
 * @example
 * validateVariables("Hello {{user_name}}", { order_id: "123" })
 * // Returns: { valid: false, missing: ["user_name"] }
 */
export function validateVariables(
  text: string,
  values: Record<string, any>
): { valid: boolean; missing: string[] } {
  const required = extractVariables(text);
  const missing = required.filter(varName => values[varName] === undefined);

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Process text with pronunciation dictionary
 *
 * Replaces words with phonetic spellings for better TTS pronunciation
 *
 * @param text - Text to process
 * @param dictionary - Map of word -> phonetic spelling
 * @returns Text with pronunciations applied
 *
 * @example
 * applyPronunciation(
 *   "Call our API for SQL queries",
 *   { "API": "A P I", "SQL": "S Q L" }
 * )
 * // Returns: "Call our A P I for S Q L queries"
 */
export function applyPronunciation(
  text: string,
  dictionary: Record<string, string>
): string {
  let result = text;

  for (const [word, pronunciation] of Object.entries(dictionary)) {
    // Replace whole word only (case-insensitive, word boundaries)
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, pronunciation);
  }

  return result;
}
