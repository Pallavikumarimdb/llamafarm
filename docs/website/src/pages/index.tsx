import { useEffect } from 'react'
import { useHistory } from '@docusaurus/router'

export default function RootRedirect() {
  const history = useHistory()
  useEffect(() => {
    history.replace('/docs/intro')
  }, [history])
  return null
}
