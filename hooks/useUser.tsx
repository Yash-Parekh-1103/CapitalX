import { useUser } from '@clerk/nextjs' // Clerk hook for auth state
import { useEffect, useState } from 'react' // React hooks for state & effects

// Hook: useCurrentUser — centralizes Clerk user info for the app
// Returns: { username, fullName, imageUrl, email, isLoaded }

interface User {
  username : string | null,
  fullName : string | null,
  imageUrl : string | null,
  email : string | null,
  isLoaded : boolean
}

export const useCurrentUser = () => {
  // State: consolidated user info object with defaults
  const [currentUser, setCurrentUser] = useState<User>({
    username: null, // Clerk username field
    fullName: null, // Clerk full name field  
    imageUrl: null, // Clerk profile image URL
    email: null,    // Primary email from Clerk
    isLoaded: false // Loading state indicator
  })
  
  // Clerk: get user object and loading state
  const { user, isLoaded } = useUser()

  // Effect: sync Clerk user data into local state when loaded
  useEffect(() => {
    if (isLoaded) { // Only process when Clerk has finished loading
      if (user) { // User is authenticated
        setCurrentUser({
          username: user.username, // Extract username
          fullName: user.fullName, // Extract full name
          imageUrl: user.imageUrl, // Extract profile image
          email: user.primaryEmailAddress?.emailAddress ||"", // Extract primary email (safe access)
          isLoaded: true // Mark as loaded
        })
      } else { // User is not authenticated
        setCurrentUser({
          username: null, // Clear username
          fullName: null, // Clear full name
          imageUrl: null, // Clear image
          email: null,    // Clear email
          isLoaded: true  // Still mark as loaded (no user)
        })
      }
    }
  }, [user, isLoaded]) // Re-run when user or loading state changes

  return currentUser // Return consolidated user object
}