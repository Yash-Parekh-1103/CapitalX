'use server'


// insert new Startup

import { NewStartup, startupTable } from "@/db/schema";
import { db } from "..";

export const addNewStartup = async (data:NewStartup) => {
    
    // console.log(data);

    await db.insert(startupTable).values(data)

    return {msg: "newStartup Added Successfully"}

    
}