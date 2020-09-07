import session from "express-session";

const secret = 'alibubalay';
// create a unique sessions per visitor stored as a cookie.
const sessionParser = session({
    secret,
    unset: 'destroy',
    resave: true,
    saveUninitialized: false,
    name: "liars-dice",
    cookie: {
      maxAge: 172800000,
      secure: false
    }
});

export default sessionParser;