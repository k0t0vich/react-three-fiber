import React, { Suspense }from 'react'
import Demo from './demo/Demo' 
import { Global } from './styles'
import { Page } from './styles'

export default function App() {
  return (
    <div>
      <Global />
      <Page>
        <Suspense fallback={null}>
          <Demo/>
        </Suspense>
      </Page>
    </div>
  )
}
