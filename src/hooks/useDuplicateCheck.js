import { useState, useEffect } from 'react'

const useDuplicateCheck = (name, email, module, excludeId = null) => {
  const [duplicates, setDuplicates] = useState({ name: false, email: false })
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    if (!name && !email) {
      setDuplicates({ name: false, email: false })
      return
    }

    const timer = setTimeout(async () => {
      setIsChecking(true)
      try {
        const response = await fetch(`${window.ecareConfig.apiUrl}check-duplicates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': window.ecareConfig.nonce
          },
          body: JSON.stringify({ name, email, module, exclude_id: excludeId })
        })
        const data = await response.json()
        setDuplicates({ 
          name: data.name_exists || false, 
          email: data.email_exists || false 
        })
      } catch (e) {
        console.error('Duplicate check failed:', e)
      } finally {
        setIsChecking(false)
      }
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timer)
  }, [name, email, module, excludeId])

  return { ...duplicates, isChecking }
}

export default useDuplicateCheck
