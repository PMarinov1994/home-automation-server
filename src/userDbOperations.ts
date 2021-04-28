import { User } from "./types/user";
import Nedb, { FilterQuery, Cursor } from "nedb";

const usersDb: Nedb<User> = new Nedb<User>({
    filename: "dbUsers",
    autoload: true,
});

export function addUser(user: User) {
    usersDb.insert(user, (err, doc) => {
        if (err)
            return;

        usersDb.persistence.compactDatafile();
    });
}

export function validateClient(psk: string): boolean {
    const allUsers = usersDb.getAllData();
    allUsers.forEach(usr => {
        if (usr.psk === psk)
            return true;
    });

    return false;
}