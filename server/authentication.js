import { QBREADER_EMAIL_ADDRESS } from '../constants.js';
import { getUserField, getUserId, updateUser, verifyEmail } from '../database/users.js';

import { createHash } from 'crypto';
import jsonwebtoken from 'jsonwebtoken';
const { sign, verify } = jsonwebtoken;
import { createTransport } from 'nodemailer';


const baseURL = process.env.BASE_URL ?? (process.env.NODE_ENV === 'production' ? 'https://www.qbreader.org' : 'http://localhost:3000');

const transporter = createTransport({
    host: 'smtp.sendgrid.net',
    port: 465,
    secure: true,
    auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
    },
});

transporter.verify((error, _success) => {
    if (error) {
        console.log(error);
        throw error;
    }
});


const salt = process.env.SALT ? process.env.SALT : 'salt';
const secret = process.env.SECRET ? process.env.SECRET : 'secret';



/**
 * Stores the timestamp of the most recent email sent to a user.
 * The timestamp is used to verify that the user clicked the link within 15 minutes.
 * The timestamp is the number of milliseconds since January 1, 1970.
 * @type {{String: Number}}
 */
const activeVerifyEmailTokens = {};
const activeResetPasswordTokens = {};

/**
 * Check whether or not the given username and password are valid.
 * @param {String} username - username of the user you are trying to retrieve.
 * @param {String} password - plaintext password to check.
 * @returns {Promise<Boolean>}
 */
async function checkPassword(username, password) {
    return await getUserField(username, 'password') === saltAndHashPassword(password);
}


/**
 * Checks that the token is valid and stores the corrent username.
 * `checkToken` guarantees that the username is in the database if the token is valid.
 * @param {String} username
 * @param {String} token
 * @returns {Boolean} True if the token is valid, and false otherwise.
 */
function checkToken(username, token, checkEmailVerification = false) {
    return verify(token, secret, (err, decoded) => {
        if (err) {
            return false;
        } else {
            return (decoded.username === username) && (!checkEmailVerification || decoded.verifiedEmail);
        }
    });
}


/**
 * Creates a new token for the given username.
 * This token may be used for authentication purposes.
 * @param {String} username
 * @returns A JWT token.
 */
function generateToken(username, verifiedEmail = false) {
    return sign({ username, verifiedEmail }, secret);
}


/**
 *
 * @param {String} password
 * @returns Base64 encoded hashed password.
 */
function saltAndHashPassword(password) {
    password = salt + password + salt;
    const hash = createHash('sha256').update(password).digest('base64');
    const hash2 = createHash('sha256').update(hash).digest('base64');
    const hash3 = createHash('sha256').update(hash2).digest('base64');
    return hash3;
}


async function sendResetPasswordEmail(username) {
    const email = await getUserField(username, 'email');
    const user_id = await getUserId(username);
    if (!user_id || !email) {
        return false;
    }

    const timestamp = Date.parse((new Date()).toString());
    const token = sign({ user_id, timestamp }, secret);
    const url = `${baseURL}/auth/verify-reset-password?user_id=${user_id}&token=${token}`;
    const message = {
        from: QBREADER_EMAIL_ADDRESS,
        to: email,
        subject: 'Reset your password',
        text: `Click this link to reset your password: ${url} This link will expire in 15 minutes. Only the most recent link will work. If you did not request this email, please ignore it. Do not reply to this email; this inbox is unmonitored.`,
        html: `<p>Click this link to reset your password: <a href="${url}">${url}</a></p> <p>This link will expire in 15 minutes. Only the most recent link will work. If you did not request this email, please ignore it.</p> <i>Do not reply to this email; this inbox is unmonitored.</i>`,
    };
    transporter.sendMail(message, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log(`Email sent: ${info.response}`);
            activeResetPasswordTokens[user_id] = timestamp;
        }
    });
    return true;
}


async function sendVerificationEmail(username) {
    const email = await getUserField(username, 'email');
    const user_id = await getUserId(username);
    if (!user_id || !email) {
        return false;
    }

    const timestamp = Date.parse((new Date()).toString());
    const token = sign({ user_id, timestamp }, secret);
    const url = `${baseURL}/auth/verify-email?user_id=${user_id}&token=${token}`;
    const message = {
        from: QBREADER_EMAIL_ADDRESS,
        to: email,
        subject: 'Verify your email address',
        text: `Click this link to verify your email address: ${url} This link will expire in 15 minutes. Only the most recent link will work. If you did not request this email, please ignore it. Do not reply to this email; this inbox is unmonitored.`,
        html: `<p>Click this link to verify your email address: <a href="${url}">${url}</a></p> <p>This link will expire in 15 minutes. Only the most recent link will work. If you did not request this email, please ignore it.</p> <i>Do not reply to this email; this inbox is unmonitored.</i>`,
    };
    transporter.sendMail(message, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log(`Email sent: ${info.response}`);
            activeVerifyEmailTokens[user_id] = timestamp;
        }
    });
    return true;
}


function updatePassword(username, newPassword) {
    return updateUser(username, { password: saltAndHashPassword(newPassword) });
}


function verifyEmailLink(user_id, token) {
    const expirationTime = 1000 * 60 * 15; // 15 minutes
    return verify(token, secret, (err, decoded) => {
        if (err) {
            return false;
        }

        const timestamp = parseInt(decoded.timestamp);
        if (isNaN(timestamp)) {
            return false;
        }

        if (decoded.user_id !== user_id) {
            return false;
        }

        if (activeVerifyEmailTokens[user_id] !== timestamp) {
            return false;
        }

        delete activeVerifyEmailTokens[user_id];

        if (new Date() - timestamp > expirationTime) {
            return false;
        }

        verifyEmail(user_id);
        return true;
    });
}


function verifyResetPasswordLink(user_id, token) {
    const expirationTime = 1000 * 60 * 15; // 15 minutes
    return verify(token, secret, (err, decoded) => {
        if (err) {
            return false;
        }

        const timestamp = parseInt(decoded.timestamp);
        if (isNaN(timestamp)) {
            return false;
        }

        if (decoded.user_id !== user_id) {
            return false;
        }

        if (activeResetPasswordTokens[user_id] !== timestamp) {
            return false;
        }

        delete activeResetPasswordTokens[user_id];

        if (new Date() - timestamp > expirationTime) {
            return false;
        }

        return true;
    });
}


export {
    checkPassword,
    checkToken,
    generateToken,
    saltAndHashPassword,
    sendResetPasswordEmail,
    sendVerificationEmail,
    updatePassword,
    verifyEmailLink,
    verifyResetPasswordLink,
};
