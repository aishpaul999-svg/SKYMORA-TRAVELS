// ===============================
// SKYmora Photos Engine
// File: skymora-photos.js
// Fetches stunning destination photos from Unsplash
// ===============================

import fetch from "node-fetch";

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const photoCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getDestinationPhoto(destination, day = 1) {
  if (!destination) return null;

  // Different search terms for different days to get variety
  const searchTerms = [
    `${destination} city landmark`,
    `${destination} travel`,
    `${destination} tourism`,
    `${destination} culture`,
    `${destination} street`,
    `${destination} food`,
    `${destination} night`
  ];

  const query = searchTerms[(day - 1) % searchTerms.length];
  const cacheKey = query;

  // Check cache first
  if (photoCache.has(cacheKey)) {
    const cached = photoCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.photo;
    }
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.warn(`Unsplash API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    // Pick a random photo from top 5 results
    const randomIndex = Math.floor(Math.random() * Math.min(5, data.results.length));
    const photo = data.results[randomIndex];

    const photoData = {
      url: photo.urls.regular,
      thumb: photo.urls.small,
      credit: {
        name: photo.user.name,
        username: photo.user.username,
        link: `https://unsplash.com/@${photo.user.username}?utm_source=SKYmora&utm_medium=referral`
      },
      unsplashLink: `https://unsplash.com/?utm_source=SKYmora&utm_medium=referral`,
      downloadLocation: photo.links.download_location
    };

    // Cache it
    photoCache.set(cacheKey, {
      photo: photoData,
      timestamp: Date.now()
    });

    // Trigger download event as required by Unsplash API guidelines
    triggerDownload(photo.links.download_location);

    return photoData;

  } catch (err) {
    console.error("Photo fetch error:", err.message);
    return null;
  }
}

// Required by Unsplash API guidelines
async function triggerDownload(downloadLocation) {
  try {
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });
  } catch (err) {
    // Silent fail - not critical
  }
}

// Get multiple photos for all days at once
export async function getAllDayPhotos(destination, totalDays) {
  const photos = [];
  for (let day = 1; day <= totalDays; day++) {
    const photo = await getDestinationPhoto(destination, day);
    photos.push(photo);
    // Small delay to respect rate limits
    await new Promise(r => setTimeout(r, 200));
  }
  return photos;
}