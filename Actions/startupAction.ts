'use server'

import { NewStartup, Startup, startupTable } from "@/db/schema";
import { db } from "..";


// insert new Startup

export const addNewStartup = async (data:NewStartup) => {
    
    // console.log(data);

    await db.insert(startupTable).values(data)

    return {msg: "newStartup Added Successfully"}

    
}

// fetch all startup from db

export const fetchAllStartup = async () => {
    
    const allstartup = await db.select().from(startupTable)
     
    console.log(allstartup);

    return allstartup
    
}