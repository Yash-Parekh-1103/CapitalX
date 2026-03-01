'use client'
import { useCurrentUser } from '@/hooks/useUser'
import React, { useEffect } from 'react'

const page = () => {

    const {email,isLoaded} = useCurrentUser()


    
    useEffect(() => {
        
        if(!isLoaded) return 
        // console.log(email);
        


    }, [isLoaded,email])    
    

  return (
    <div>
      Profile Page
    </div>
  )
}

export default page
