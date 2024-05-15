import { checkSchema } from "express-validator";

// export default[body('email').notEmpty()]

export default checkSchema({
    email: {
        errorMessage: "Email is required!",
        notEmpty: true,
    },
});
