import session from "express-session";

const secret = 'alibubalay';
// create a unique sessions per visitor stored as a cookie.
const sessionParser = session({
    secret,
    name: "my-session",
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 172800000,
      secure: false
    }
});

export default sessionParser;