module.exports = function compression(req, res, next) {
    const FileExtentionEncodedArr = [
        { extension: 'css', type: 'text/css' },
        { extension: 'js', type: 'text/javascript' },
        { extension: 'woff', type: 'application/font-woff' }
    ]
    FileExtentionEncodedArr.map((item) => {
        app.get(`*.${item.extension}`, function (req, res, next) {
            // console.log("Accept-Encoding ", req.get('Accept-Encoding'))
            if (req.acceptsEncodings('gzip')) {
            req.url = req.url + '.gz';
            res.set('Content-Encoding', 'gzip');
            res.set('Content-Type', item.type);
            }
            else if (req.acceptsEncodings('br')) {
            req.url = req.url + '.br';
            res.set('Content-Encoding', 'br');
            res.set('Content-Type', item.type);
            }
            next();
        })
    })
}