import React from 'react'
import Button from './Button'

const Header = () => {
  return (
    <>
    <nav className='navbar container pt-3 pb-3 align-items-start'>
      <a className='navbar-brand text-light ' href=''>Stock prediction portal</a>
      <div>
        <Button text='Login' className="btn-outline-info"/>
        &nbsp;
        <Button text='Register' className="btn-info"/>
      </div>

    </nav>
    </>
  )
}

export default Header
