const asyncHandler = (RequestHandler) => {
    return (req, res, next) => {
        Promise.resolve(RequestHandler(req, res, next)).catch((err) => next(err));
    }
};

export { asyncHandler };

// Second Method :- 

// const asyncHandle = () => { }
// const asyncHandle = (func) => { async () => { } }; 


// const asyncHandle = (func) => async (req, res, next) => {
//     try {
//         await func(req, res, next);
//     } catch (error) {
//         res.status(error.code || 500).json(
//             {
//                 success: false,
//                 message: error.message,
//             }
//         )

//     }
// }; 