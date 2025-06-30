exports.catchAsync = fn => {
    // console.log('fn :>> ', fn);
    return (req, res, next) => {
        fn(req, res, next)
        .catch(err => {
            console.log('Error :>> ', err); 
            if(process.env.NODE_ENV !== "development") err.message = "Something went wrong";
            next(err);
        });
    }
}