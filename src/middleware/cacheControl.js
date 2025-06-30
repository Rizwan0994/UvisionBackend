const setCache = (req, res, next) => {
    try {
        // keep cache in memory for 5 minutes
        const period = 60 * 5;
        // only wants request for get request
        if(req.method === 'GET'){
            res.set("Cache-Control",`public, max-age=${period}`);
        }else{
            res.set("Cache-Control",`no-store`);
        }
        next()
    } catch (error) {
        throw error;
    }
}

module.exports = setCache;