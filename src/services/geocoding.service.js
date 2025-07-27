const fetch = require('node-fetch');

/**
 * Geocode a location string to latitude and longitude using OpenStreetMap Nominatim
 * @param {string} locationString - The location to geocode (e.g., "New York, NY")
 * @returns {Object|null} - {lat, lng} or null if not found
 */
const geocodeLocation = async (locationString) => {
    if (!locationString || typeof locationString !== 'string') {
        return null;
    }

    try {
        const encodedLocation = encodeURIComponent(locationString.trim());
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=1`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'uVision-App/1.0'
            }
        });

        if (!response.ok) {
            console.error('Geocoding API error:', response.status, response.statusText);
            return null;
        }

        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error geocoding location:', locationString, error.message);
        return null;
    }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Batch geocode multiple locations with rate limiting
 * @param {Array} locations - Array of location strings
 * @returns {Array} - Array of {location, coordinates} objects
 */
const batchGeocode = async (locations) => {
    const results = [];
    
    for (let i = 0; i < locations.length; i++) {
        const location = locations[i];
        const coordinates = await geocodeLocation(location);
        
        results.push({
            location,
            coordinates
        });
        
        // Rate limiting: 1 request per second for Nominatim
        if (i < locations.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    return results;
};

module.exports = {
    geocodeLocation,
    calculateDistance,
    batchGeocode
};
