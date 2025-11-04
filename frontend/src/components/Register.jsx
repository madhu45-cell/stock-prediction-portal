import React, {useState} from 'react'
// we need a state, we want to store the user data in the state, import state from react{import {useState} from react}
import axios from 'axios'

const Register = () => {
  // take user input using state 
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleRegisteration = async (e) =>{
    e.preventDefault();
    // create user data object and its send to backend using fetch api
    const userData = {
      username, email, password
    }
    
    // send user data to backend using axios post request
    try{
      const response = await axios.post('http://127.0.0.1:8000/api/v1/register/', userData)
      console.log('response.data==>',response.data)
      console.log('registration successful')
    }catch(error){
      console.error('registration failed', error.response?.data ?? error.message)

    }
  }
  
  return (
    <>
    <div className='container'>
      <div className='row justify-content-center'>
        <div className='col-md-6 bg-light-dark p-5 rounded'>
          <h3 className='text-light text-center'>Create an Account</h3>
          <form onSubmit={handleRegisteration}>
            <input type='text' className='form-control mb-3 mt-3' placeholder='Username' value={username} onChange={e => (setUsername(e.target.value))} />
            <input type='email' className='form-control mb-3' placeholder='Email' value={email} onChange={e => (setEmail(e.target.value))}/> 
            <input type='password' className='form-control mb-5' placeholder='Password' value={password} onChange={e => (setPassword(e.target.value))}/>
            <button type='submit' className='btn btn-info d-block mx-auto'>Register</button>
          </form>

        </div>

      </div>

    </div>
    </>
  )
}

export default Register
