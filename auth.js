import { v4 as uuidv4 } from "uuid"; //importing v4 function from uuid and renaming it to uuidv4
import { dbPromise } from "./index" //importing dbPromise from index.js

//generate an auth token, store it in the database, return it and set it as a cookie
export const grantAuthToken = async (userId) => { //takes a userId and returns the access token so it can be set as a cookie
    const db = await dbPromise;
    const tokenString = uuidv4(); //token string made up of random characters
    await db.run("INSERT INTO AuthTokens (token, userId) VALUES (?, ?);", tokenString, userId); //stores the authToken into the AuthTokens table

    return tokenString;
}

export const lookupUserFromAuthToken = async (authToken) => { //looks for the user based on the specific authToken
    const db = await dbPromise
    const token = await db.get("SELECT * FROM AuthTokens WHERE token=?;", authToken);
    
    if(!token) //checks if the user is submitting using old authTokens (if the user logs out, then their authToken needs to be deleted from the database)
    {
        return null; //if there is no token, returns null
    }
    const user = await db.get("SELECT id, email, username FROM Users WHERE id=?;", token.userId);
    
    return user;
}
// test comment