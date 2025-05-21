// Utility for fetching images as base64 data URLs with simple in-memory caching
// This avoids refetching the same assets on each component mount.

const dataUrlCache = new Map();

/**
 * Fetches an image and converts it to a base64 data URL.
 * Caches results by URL.
 * @param {string} url - Image URL to fetch.
 * @returns {Promise<string|null>} Base64 data URL or null on failure.
 */
export async function fetchImageAsDataURL(url) {
    if (dataUrlCache.has(url)) {
        return dataUrlCache.get(url);
    }
    try {
        const headResponse = await fetch(url, { method: 'HEAD' });
        if (!headResponse.ok) {
            console.error(`HEAD request failed with status ${headResponse.status} for URL: ${url}`);
            return null;
        }

        const getResponse = await fetch(url);
        if (!getResponse.ok) {
            console.error(`GET request failed with status ${getResponse.status} for URL: ${url}`);
            return null;
        }

        const blob = await getResponse.blob();
        const dataURL = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = (error) => {
                console.error(`Error converting ${url} to base64:`, error);
                resolve(null);
            };
            reader.readAsDataURL(blob);
        });

        if (dataURL) {
            dataUrlCache.set(url, dataURL);
        }
        return dataURL;
    } catch (error) {
        console.error(`Network error loading image from ${url}:`, error);
        return null;
    }
}
