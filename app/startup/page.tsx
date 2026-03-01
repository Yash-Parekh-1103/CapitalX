'use client'

import { fetchAllStartup } from "@/Actions/startupAction"
import { Startup } from "@/db/schema"
import Link from "next/link"
import { useEffect, useState } from "react"

const page = () => {

  const [allstartup, setallstartup] = useState<Startup[] | null>(null)

  //this function will auto load when user will go to all startup page
 const fetchingallst = async () => {



  //fetched data from backend
    const allst = await fetchAllStartup();


    // console.log(allst);
    setallstartup(allst)

    
    

 }

  useEffect(() => {

    fetchingallst()


  }, [])
  



  return (
    <div>
      
      {

        allstartup && allstartup.map((s)=>(

           <Link key={s.id} href={`/startup/${s.id}`}>
          <div style={{ cursor: 'pointer', border: '1px solid #ccc', padding: '12px', marginBottom: '12px', borderRadius: '8px' }}>
            <img src={s.img} alt={s.name} style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '6px' }} />
            <p style={{ fontWeight: 'bold', marginTop: '8px' }}>{s.name}</p>
          </div>
        </Link>


        ))
      }


    </div>
  )
}

export default page
