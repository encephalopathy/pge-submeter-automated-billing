/**
 * Utility functions for extracting gas bill information from raw text.
 */

/**
 * 1. Extracts the total gas bill amount.
 * Looks for common patterns like "Total Amount Due" or "Amount Due" followed by a currency value.
 */
export function extractGasTotalBill(billText: string): number {
    // 1. Locate the start of the specific section
  const sectionHeader = "Total Gas Charges";
  const startIndex = billText.indexOf(sectionHeader);

  if (startIndex === -1) {
    console.error("Could not find 'Total Gas Charges' header");
    return 0;
  }

  // 2. Extract the block of text immediately following that header
  // We take a slice of 100 characters to ensure we capture the number that follows
  const textAfterHeader = billText.substring(startIndex + sectionHeader.length, startIndex + sectionHeader.length + 100);

  // 3. Regex to find the first dollar amount in that specific slice
  // It looks for optional symbols like ':' or '$' followed by digits
  const amountRegex = /(?:[:$]*\s*)([\d,]+\.\d{2})/;
  const match = textAfterHeader.match(amountRegex);

  if (match && match[1]) {
    // Remove commas and convert to float
    return parseFloat(match[1].replace(/,/g, ''));
  }

  return 0;
}
  
  /**
   * 2. Extracts therms usage.
   * Identifies the number of therms used by looking for numeric values preceding "therms" or "th".
   */
  export function extractThermsUsage(billText: string): number {
    // Matches "Difference" (case-insensitive), optional colon/spaces, 
    // and captures a number that may include commas or a decimal point.
    const differenceRegex = /Difference\s*[:\s]*\s*([\d,]+\.?\d*)/i;
    const match = billText.match(differenceRegex);
    
    if (match && match[1]) {
      // Remove commas before parsing to ensure it's a valid float
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return 0;
  }
  
  /**
   * 3. Extracts usage dates.
   * Searches for billing period dates typically formatted as "MM/DD/YYYY - MM/DD/YYYY" or similar.
   */
  export function extractUsageDates(billText: string): { start: string; end: string } | null {
    const searchSection = "Details of Gas Charges";
    const sectionIndex = billText.indexOf(searchSection);

    if (sectionIndex === -1) {
        throw new Error(`Could not find section: ${searchSection}`);
    }

    // 2. Slice the text to only search AFTER that section header
    const textAfterHeader = billText.substring(sectionIndex + searchSection.length);

    // 3. Regex to find dates (MM/DD/YYYY) within that specific text block
    // This matches standard date formats like 11/25/2025 or 12/16/2025
    const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}/g;
    const foundDates = textAfterHeader.match(datePattern);
  
    if (foundDates && foundDates.length >= 2) {
      return {
        start: foundDates[0],
        end: foundDates[1]
      };
    }
    return null;
  }
  
  /**
   * 4. Extracts the bill page number.
   * Identifies the current page and total pages if available (e.g., "Page 1 of 4").
   */
  export function extractGasBillPage(pages: Array<string>): string | null {
    for (const page of pages) {
        if (page.includes("Details of Gas Charges")) {
            return page;
        }
    }
    return null;
}