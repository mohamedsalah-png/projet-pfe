const axios = require('axios');

async function testLogin() {
  console.log('Sending request to http://localhost:5000/api/auth/login');
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@test.com',
      password: 'wrong'
    });
    console.log('Response:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('Error Response:', err.response.data);
    } else {
      console.log('Network Error:', err.message);
    }
  }
}

testLogin();
